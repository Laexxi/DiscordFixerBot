const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    UserSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');
const rulesets = require('../utils/rulesets');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-team')
        .setDescription('Initialisiert ein neues Runner-Team')
        .addStringOption(option => 
            option.setName('ruleset')
                .setDescription('Wähle das Regelwerk')
                .setRequired(true)
                .addChoices(
                    { name: 'Shadowrun 6', value: 'SR6' },
                    { name: 'Cyberpunk RED', value: 'CRR' }
                ))
        .addStringOption(option => 
            option.setName('name')
                .setDescription('Name des Teams')
                .setRequired(true))
        .addUserOption(option => 
            option.setName('fixer')
                .setDescription('Wer ist der zuständige Fixer?')
                .setRequired(true)),

    async execute(interaction) {
        const rulesetKey = interaction.options.getString('ruleset');
        const teamName = interaction.options.getString('name');
        const fixer = interaction.options.getUser('fixer');
        const config = rulesets[rulesetKey];

        const embed = new EmbedBuilder()
            .setTitle(`Team-Setup: ${teamName}`)
            .setDescription(`**System:** ${config.name}\n**Fixer:** ${fixer}\n\nBitte wähle unten die Runner aus, die dem Team beitreten sollen.`)
            .setColor(config.color);

        // Das User-Select-Menü (Multi-Select)
        const userSelect = new UserSelectMenuBuilder()
            .setCustomId('select-runners')
            .setPlaceholder('Wähle die Runner aus...')
            .setMinValues(1)
            .setMaxValues(15); // Flexibel bis zu 15 Runner

        const row1 = new ActionRowBuilder().addComponents(userSelect);

        // Bestätigungs-Button
        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm-team')
            .setLabel('Team-Erstellung starten')
            .setStyle(ButtonStyle.Success);

        const row2 = new ActionRowBuilder().addComponents(confirmButton);

        // Antwort senden (Ephemeral, damit nur der Ersteller es sieht)
        await interaction.reply({
            embeds: [embed],
            components: [row1, row2],
            ephemeral: true
        });
    },
};