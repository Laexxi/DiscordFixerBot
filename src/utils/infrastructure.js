const { ChannelType, PermissionFlagsBits } = require('discord.js');
const rulesets = require('./rulesets');

async function createTeamInfrastructure(interaction, { teamName, fixer, runnerIds, rulesetKey }) {
    const guild = interaction.guild;
    const config = rulesets[rulesetKey];

    // 1. Rolle erstellen (Warning Fix: Nutze Hex-Zahl oder String ohne # falls nötig)
    const teamRole = await guild.roles.create({
        name: `Team ${teamName}`,
        color: config.color, // Falls die Warnung bleibt, versuche es ohne das '#' davor
        reason: `Runner-Team Setup`
    });

    // 2. Kategorie erstellen (Privat für alle außer Fixer & Team)
    const category = await guild.channels.create({
        name: `📂 TEAM: ${teamName}`,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, // @everyone sieht nichts
            { id: teamRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: fixer.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] }
        ]
    });

    // 3. Rollen vergeben
    const allMembers = [...new Set([fixer.id, ...runnerIds])];
    for (const id of allMembers) {
        try {
            const member = await guild.members.fetch(id);
            await member.roles.add(teamRole);
        } catch (e) { console.error(`Rollen-Error für ${id}`); }
    }

    // 4. Kanäle aus dem Ruleset erstellen
    for (const chanConfig of config.channels) {
        let type = ChannelType.GuildText;
        if (chanConfig.type === "voice") type = ChannelType.GuildVoice;
        if (chanConfig.type === "forum") type = ChannelType.GuildForum;

        const channel = await guild.channels.create({
            name: chanConfig.name,
            type: type,
            parent: category.id,
            topic: chanConfig.topic || ""
        });

        // SPEZIAL-RECHTE: fixer-notes / notizen
        if (chanConfig.name === "notizen" || chanConfig.name === "fixer-notes") {
            // Team-Rolle explizit aussperren (auch wenn sie in der Kategorie erlaubt ist)
            await channel.permissionOverwrites.edit(teamRole.id, { ViewChannel: false });
            // Fixer explizit erlauben
            await channel.permissionOverwrites.edit(fixer.id, { ViewChannel: true });
        }
    }

    // 5. Private Kanäle (Nur Fixer + der jeweilige Spieler)
    for (const id of runnerIds) {
        const member = await guild.members.fetch(id);
        await guild.channels.create({
            name: `privat-${member.user.username}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, // @everyone weg
                { id: teamRole.id, deny: [PermissionFlagsBits.ViewChannel] }, // Restliches Team weg
                { id: fixer.id, allow: [PermissionFlagsBits.ViewChannel] }, // Fixer darf rein
                { id: id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] } // Spieler darf rein
            ]
        });
    }

    return teamRole;
}

module.exports = { createTeamInfrastructure };