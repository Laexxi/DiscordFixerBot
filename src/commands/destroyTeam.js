const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    PermissionFlagsBits, 
    ComponentType, 
    MessageFlags,
    ChannelType
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('destroy-team')
        .setDescription('Terminiert einen Host-Bereich (Kanäle & Rollen)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        // 1. Berechtigungs-Check (Admin oder Mr. Johnson)
        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const hasJohnsonRole = interaction.member.roles.cache.some(role => role.name === 'Mr. Johnson');

        if (!isAdmin && !hasJohnsonRole) {
            return interaction.reply({ 
                content: '❌ **Zugriff verweigert.** Nur ein Administrator oder ein User mit der Rolle **Mr. Johnson** kann Hosts terminieren.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // 2. Alle Team-Kategorien im Server finden
        const categories = interaction.guild.channels.cache.filter(c => 
            c.type === ChannelType.GuildCategory && c.name.startsWith('📂 TEAM:')
        );

        if (categories.size === 0) {
            return interaction.reply({ 
                content: 'Keine aktiven Team-Sektoren im Grid gefunden.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // 3. Auswahlmenü erstellen
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('delete-team-select')
            .setPlaceholder('Welchen Host möchtest du offline nehmen?')
            .addOptions(categories.map(cat => ({
                label: cat.name.replace('📂 TEAM: ', ''),
                description: `ID: ${cat.id}`,
                value: cat.id
            })));

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.reply({ 
            content: '⚠️ **Bestätigung erforderlich:** Welcher Sektor soll permanent gelöscht werden?', 
            components: [row], 
            flags: [MessageFlags.Ephemeral] 
        });

        // 4. Collector für die Auswahl
        const collector = response.createMessageComponentCollector({ 
            componentType: ComponentType.StringSelect, 
            time: 60000 
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) return;

            const categoryId = i.values[0];
            const category = interaction.guild.channels.cache.get(categoryId);
            
            if (!category) {
                return i.update({ content: '❌ Sektor nicht mehr gefunden.', components: [] });
            }

            const teamName = category.name.replace('📂 TEAM: ', '');
            
            await i.update({ 
                content: `💣 **Terminiere Host: ${teamName}...** Bitte warten, die Daten werden geschreddert.`, 
                components: [] 
            });

            try {
                // A. Alle Kanäle unter der Kategorie löschen
                const subChannels = interaction.guild.channels.cache.filter(c => c.parentId === categoryId);
                for (const [id, chan] of subChannels) {
                    await chan.delete(`Team-Zerstörung durch ${i.user.tag}`);
                }

                // B. Kategorie selbst löschen
                await category.delete();

                // C. Die zugehörige Rolle finden und löschen
                const roleName = `Team ${teamName}`;
                const teamRole = interaction.guild.roles.cache.find(r => r.name === roleName);
                if (teamRole) {
                    await teamRole.delete(`Team-Zerstörung durch ${i.user.tag}`);
                }

                await i.editReply({ 
                    content: `✅ **Host terminiert.** Alle Kanäle und die Rolle **${roleName}** wurden erfolgreich aus der Matrix entfernt.` 
                });

            } catch (error) {
                console.error('Fehler beim Löschen:', error);
                await i.editReply({ 
                    content: '❌ **Systemfehler:** Einige Fragmente konnten nicht gelöscht werden. Prüfe die Berechtigungen des Bots.' 
                });
            }

            // Cleanup: Meldung nach 10 Sekunden entfernen
            setTimeout(() => interaction.deleteReply().catch(() => {}), 10000);
            collector.stop();
        });
    },
};