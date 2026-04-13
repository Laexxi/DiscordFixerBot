const { ChannelType, PermissionFlagsBits } = require('discord.js');
const rulesets = require('./rulesets');

async function createTeamInfrastructure(interaction, { teamName, fixer, runnerIds, rulesetKey }) {
    const guild = interaction.guild;
    const config = rulesets[rulesetKey];

    // 1. Rolle erstellen
    const teamRole = await guild.roles.create({
        name: `Team ${teamName}`,
        color: config.color,
        reason: `Neues ${config.name} Team erstellt durch ${interaction.user.tag}`
    });

    // 2. Kategorie erstellen
    const category = await guild.channels.create({
        name: `📂 TEAM: ${teamName}`,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: teamRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect] },
            { id: fixer.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] }
        ]
    });

    // 3. Rollen an Fixer und Runner vergeben
    const allMembers = [...new Set([fixer.id, ...runnerIds])];
    for (const id of allMembers) {
        try {
            const member = await guild.members.fetch(id);
            await member.roles.add(teamRole);
        } catch (e) { console.error(`Konnte Rolle nicht an ${id} vergeben.`); }
    }

    // 4. Kanäle erstellen
    for (const channelName of config.defaultChannels) {
        const isVoice = channelName === "Mission-Control"; // Beispiel für Voice-Logik
        
        const channel = await guild.channels.create({
            name: channelName,
            type: isVoice ? ChannelType.GuildVoice : ChannelType.GuildText,
            parent: category.id,
        });

        // Spezial-Berechtigungen für bestimmte Kanäle
        if (channelName === "notizen") {
            await channel.permissionOverwrites.edit(teamRole.id, { ViewChannel: false });
        }
        if (channelName === "wichtige-kontakte") {
            await channel.permissionOverwrites.edit(teamRole.id, { SendMessages: false });
        }
    }

    // 5. Private Kanäle für jeden Runner
    for (const id of runnerIds) {
        const member = await guild.members.fetch(id);
        const pChan = await guild.channels.create({
            name: `privat-${member.user.username}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                { id: teamRole.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });
    }

    return teamRole;
}

module.exports = { createTeamInfrastructure };