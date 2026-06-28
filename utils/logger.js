const { EmbedBuilder } = require("discord.js");

async function log(client, action, details, color = 0x57F287) {
    try {
        const config = require("../config.json");
        const guild = client.guilds.cache.first();
        if (!guild) return;

        const logChannel = guild.channels.cache.find(c => c.name === config.logsChannel);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setTitle(`📋 ${action}`)
            .setDescription(details)
            .setColor(color)
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });
    } catch (err) {
        console.error("Logger error:", err);
    }
}

module.exports = { log };