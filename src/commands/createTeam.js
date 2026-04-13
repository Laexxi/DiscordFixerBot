const { 
    SlashCommandBuilder, ActionRowBuilder, UserSelectMenuBuilder, 
    ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType, MessageFlags 
} = require('discord.js');
const rulesets = require('../utils/rulesets');
const { createTeamInfrastructure } = require('../utils/infrastructure');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-team')
        .setDescription('Initialisiert ein neues Runner-Team')
        .addStringOption(option => 
            option.setName('ruleset').setDescription('Regelwerk').setRequired(true)
            .addChoices({ name: 'Shadowrun 6', value: 'SR6' }, { name: 'Cyberpunk RED', value: 'CRR' }))
        .addStringOption(option => option.setName('name').setDescription('Name des Teams').setRequired(true))
        .addUserOption(option => option.setName('fixer').setDescription('Fixer').setRequired(true)),

    async execute(interaction) {
        const rulesetKey = interaction.options.getString('ruleset');
        const teamName = interaction.options.getString('name');
        const fixer = interaction.options.getUser('fixer');
        const config = rulesets[rulesetKey];

        let selectedRunnerIds = [];

        const embed = new EmbedBuilder()
            .setTitle(`Team-Setup: ${teamName}`)
            .setDescription(`**System:** ${config.name}\n**Fixer:** ${fixer}\n\nWähle die Runner aus.`)
            .setColor(config.color);

        const row1 = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
                .setCustomId('select-runners')
                .setPlaceholder('Runner wählen...')
                .setMinValues(1)
                .setMaxValues(10)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('Matrix-Host hochfahren')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true)
        );

        const response = await interaction.reply({ 
            embeds: [embed], 
            components: [row1, row2], 
            flags: [MessageFlags.Ephemeral] 
        });

        // WICHTIG: Filter für den Collector (Nur der User, der den Befehl gestartet hat)
        const collector = response.createMessageComponentCollector({ 
            time: 120000 // 2 Minuten Zeit
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'Nicht dein Terminal, Chummer!', flags: [MessageFlags.Ephemeral] });
            }

            if (i.customId === 'select-runners') {
                selectedRunnerIds = i.values;
                row2.components[0].setDisabled(false);
                // Sofortiges Update der UI
                await i.update({ components: [row1, row2] });
            }

            if (i.customId === 'confirm') {
                // Wir sagen Discord sofort: "Ich arbeite dran!", um den Interaction-Timeout zu verhindern
                await i.update({ content: '📡 **Befehl wird gesendet...** Kanäle werden erstellt.', embeds: [], components: [] });
                try {
                    // Hier passiert die schwere Arbeit
                    await createTeamInfrastructure(interaction, { 
                        teamName, 
                        fixer, 
                        runnerIds: selectedRunnerIds, 
                        rulesetKey 
                    });
                    await i.editReply({ content: `✅ **Host-Konfiguration abgeschlossen.** Team **${teamName}** ist einsatzbereit.` });
                } catch (err) {
                    console.error("FEHLER BEI DER ERSTELLUNG:", err);
                    await i.editReply({ content: '❌ Kritischer Systemfehler im Infrastruktur-Modul.' });
                }

                // Cleanup
                setTimeout(() => interaction.deleteReply().catch(() => {}), 10000);
                collector.stop();
            }
        });
    },
};