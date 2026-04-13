const { ChannelType, PermissionFlagsBits } = require('discord.js');
const rulesets = require('./rulesets');

async function createTeamInfrastructure(interaction, { teamName, fixer, runnerIds, rulesetKey }) {
    const guild = interaction.guild;
    const config = rulesets[rulesetKey];

    // 1. Rolle erstellen (Farbe ohne # konvertieren, um Warnung zu vermeiden)
    const teamRole = await guild.roles.create({
        name: `Team ${teamName}`,
        color: config.color.replace('#', ''), 
        reason: `Runner-Team Setup`
    });

    // 2. Kategorie erstellen
    const category = await guild.channels.create({
        name: `📂 TEAM: ${teamName}`,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
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

    // 4. Kanäle erstellen (FIX: Nutze config.defaultChannels statt config.channels)
    for (const chanConfig of config.defaultChannels) {
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
            await channel.permissionOverwrites.edit(teamRole.id, { ViewChannel: false });
            await channel.permissionOverwrites.edit(fixer.id, { ViewChannel: true });
        }
    }

    // 5. Private Kanäle (NUR Fixer + der jeweilige Spieler)
    for (const id of runnerIds) {
        const member = await guild.members.fetch(id);
        await guild.channels.create({
            name: `privat-${member.user.username}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, 
                { id: teamRole.id, deny: [PermissionFlagsBits.ViewChannel] }, // Ganze Team-Rolle raus
                { id: fixer.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }, // Fixer rein
                { id: id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] } // Spieler rein
            ]
        });
    }

    return teamRole;
}

module.exports = { createTeamInfrastructure };