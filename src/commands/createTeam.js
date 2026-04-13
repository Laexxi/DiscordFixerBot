const { SlashCommandBuilder, ActionRowBuilder, UserSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType } = require('discord.js');
const rulesets = require('../utils/rulesets');
const { createTeamInfrastructure } = require('../utils/infrastructure');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-team')
        .setDescription('Initialisiert ein neues Runner-Team')
        .addStringOption(option =>
            option.setName('ruleset').setDescription('Wähle das Regelwerk').setRequired(true)
            .addChoices({ name: 'Shadowrun 6', value: 'SR6' }, { name: 'Cyberpunk RED', value: 'CRR' }))
        .addStringOption(option => option.setName('name').setDescription('Name des Teams').setRequired(true))
        .addUserOption(option => option.setName('fixer').setDescription('Der zuständige Fixer').setRequired(true)),

    async execute(interaction) {
        const rulesetKey = interaction.options.getString('ruleset');
        const teamName = interaction.options.getString('name');
        const fixer = interaction.options.getUser('fixer');
        const config = rulesets[rulesetKey];

        let selectedRunnerIds = [];

        const embed = new EmbedBuilder()
            .setTitle(`Team-Setup: ${teamName}`)
            .setDescription(`**System:** ${config.name}\n**Fixer:** ${fixer}\n\nWähle die Runner aus dem Dropdown aus.`)
            .setColor(config.color);

        const row1 = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder().setCustomId('select-runners').setPlaceholder('Runner wählen...').setMinValues(1).setMaxValues(10)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('confirm').setLabel('Matrix-Host hochfahren').setStyle(ButtonStyle.Success).setDisabled(true)
        );

        const response = await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });

        // Collector für die Interaktion
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.UserSelect || ComponentType.Button, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'select-runners') {
                selectedRunnerIds = i.values;
                // Button aktivieren, sobald Runner gewählt wurden
                row2.components[0].setDisabled(false);
                await i.update({ components: [row1, row2] });
            }

            if (i.customId === 'confirm') {
                await i.update({ content: '📡 **Befehl wird gesendet...** Kanäle werden erstellt.', embeds: [], components: [] });
                try {
                    await createTeamInfrastructure(interaction, { teamName, fixer, runnerIds: selectedRunnerIds, rulesetKey });
                    await i.editReply({ content: `✅ **Host-Konfiguration abgeschlossen.** Team **${teamName}** ist einsatzbereit.` });
                } catch (err) {
                    console.error(err);
                    await i.editReply({ content: '❌ Kritischer Systemfehler beim Erstellen der Kanäle.' });
                }

                // Nach 5 Sekunden die Erfolgsmeldung löschen (Channel sauber halten)
                setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
                collector.stop();
            }
        });
    },
};