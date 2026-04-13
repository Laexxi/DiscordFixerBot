const { InteractionType, ComponentType } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // 1. Slash Commands verarbeiten
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Fehler beim Ausführen!', ephemeral: true });
            }
        }

        // 2. Menü-Auswahl & Buttons verarbeiten
        if (interaction.isUserSelectMenu() || interaction.isButton()) {
            // Wir speichern die Auswahl temporär (in einer echten DB oder Map wäre besser)
            // Für diesen Test loggen wir es einfach.
            
            if (interaction.customId === 'confirm-team') {
                // Feedback geben
                await interaction.update({ 
                    content: '📡 **Befehl wird gesendet...** Kanäle werden vorbereitet.', 
                    embeds: [], 
                    components: [] 
                });

                // Hier rufen wir später das Erstellungs-Modul auf
                console.log("Team-Erstellung wurde bestätigt!");

                // Kurze Verzögerung simulieren und dann aufräumen
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply();
                    } catch (e) { console.log("Nachricht bereits weg."); }
                }, 3000);
            }
        }
    },
};