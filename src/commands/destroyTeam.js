const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits, EmbedBuilder, ComponentType, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('destroy-team')
        .setDescription('Löscht einen Team-Bereich inklusive Rollen und Kanälen')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels), // Nur für Leute mit Rechten sichtbar

    async execute(interaction) {
        // Berechtigungscheck (Zusätzlich zur Mr. Johnson Rolle)
        const hasJohnsonRole = interaction.member.roles.cache.some(r => r.name === "Mr. Johnson");
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasJohnsonRole && !isAdmin) {
            return interaction.reply({ content: "❌ Zugriff verweigert. Nur ein Mr. Johnson oder Admin kann Hosts terminieren.", flags: [MessageFlags.Ephemeral] });
        }

        // Alle Team-Kategorien finden
        const categories = interaction.guild.channels.cache.filter(c => 
            c.type === 4 && c.name.startsWith('📂 TEAM:')
        );

        if (categories.size === 0) {
            return interaction.reply({ content: "Keine aktiven Team-Hosts im Grid gefunden.", flags: [MessageFlags.Ephemeral] });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('delete-team-select')
            .setPlaceholder('Welches Team soll gelöscht werden?')
            .addOptions(categories.map(c => ({
                label: c.name.replace('📂 TEAM: ', ''),
                value: c.id
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.reply({ 
            content: "⚠️ **ACHTUNG:** Das Löschen eines Teams ist permanent.", 
            components: [row], 
            flags: [MessageFlags.Ephemeral] 
        });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 30000 });

        collector.on('collect', async i => {
            await i.update({ content: "💣 **Terminiere Sektor...** Bitte warten.", components: [] });
            
            const categoryId = i.values[0];
            const category = interaction.guild.channels.cache.get(categoryId);
            const teamName = category.name.replace('📂 TEAM: ', '');

            // 1. Kanäle löschen
            const subChannels = interaction.guild.channels.cache.filter(c => c.parentId === categoryId);
            for (const [id, chan] of subChannels) { await chan.delete(); }

            // 2. Kategorie löschen
            await category.delete();

            // 3. Rolle löschen
            const roleToDelete = interaction.guild.roles.cache.find(r => r.name === `Team ${teamName}`);
            if (roleToDelete) await roleToDelete.delete();

            await i.editReply({ content: `✅ Der Host für **${teamName}** wurde erfolgreich aus der Matrix gelöscht.` });
        });
    },
};