module.exports = {
    SR6: {
        name: "Shadowrun 6. Edition",
        color: "#9d36b5",
        defaultChannels: [
            { name: "fixer-notes", type: "text", topic: "Fixer only." },
            { name: "wichtige-kontakte", type: "forum" },
            { name: "runner-hub", type: "forum" },
            { name: "würfel-bot", type: "text" },
            { name: "planung", type: "text" },
            { name: "loot-und-karma", type: "text" },
            { name: "spieltagebuch", type: "text" },
            { name: "ooc-chat", type: "text" },
            { name: "Mission-Control", type: "voice" }
        ],
        diceLogic: "exploding-six"
    },
    CRR: {
        name: "Cyberpunk RED",
        color: "#e30613",
        defaultChannels: [
            { name: "fixer-notes", type: "text", topic: "Fixer only." },
            { name: "wichtige-kontakte", type: "forum" },
            { name: "runner-hub", type: "forum" },
            { name: "würfel-bot", type: "text" },
            { name: "planung", type: "text" },
            { name: "inventory-ledger", type: "text" },
            { name: "spieltagebuch", type: "text" },
            { name: "ooc-chat", type: "text" },
            { name: "Mission-Control", type: "voice" }
        ],
        diceLogic: "cp-red-d10"
    }
};