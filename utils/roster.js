const { EmbedBuilder } = require("discord.js");
const db = require("../database/db");

async function updateRosterEmbed(client) {
    try {
        const config = require("../config.json");
        const guild = client.guilds.cache.first();
        if (!guild) return;

        const rosterChannel = guild.channels.cache.find(c => c.name === config.rosterChannel);
        if (!rosterChannel) return;

        const members = db.prepare("SELECT * FROM roster ORDER BY joined_at ASC").all();
        const max = config.maxRoster;

        const rankOrder = ["👑 Owner", "🛡 Staff", "🌿 Guild Member"];

        const rankLabel = {
            "👑 Owner": "👑 Owner",
            "🛡 Staff": "🛡 Staff",
            "🌿 Guild Member": "🌿 Guild Member"
        };

        const sorted = members.sort((a, b) => {
            const ai = rankOrder.indexOf(a.rank);
            const bi = rankOrder.indexOf(b.rank);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });

        let list = "";
        for (let i = 0; i < sorted.length; i++) {
            const guildMember = await guild.members.fetch(sorted[i].discord_id).catch(() => null);
            const displayName = guildMember ? guildMember.displayName : sorted[i].username;
            const rank = rankLabel[sorted[i].rank] || sorted[i].rank;
            list += `\`${i + 1}.\` <@${sorted[i].discord_id}> — **${displayName}** — ${rank}\n`;
        }
        if (!list) list = "*No members yet.*";

        const embed = new EmbedBuilder()
            .setTitle("🌿 IVY Guild Roster")
            .setDescription(`**Members: ${members.length} / ${max}**\n\n${list}`)
            .setColor(0x2ECC71)
            .setTimestamp()
            .setFooter({ text: "IVY Guild" });

        const setting = db.prepare("SELECT value FROM settings WHERE key = 'roster_message_id'").get();

        if (setting) {
            try {
                const msg = await rosterChannel.messages.fetch(setting.value);
                await msg.edit({ embeds: [embed] });
                return;
            } catch {
                // Message deleted, post a new one
            }
        }

        const newMsg = await rosterChannel.send({ embeds: [embed] });
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('roster_message_id', ?)").run(newMsg.id);

    } catch (err) {
        console.error("Roster update error:", err);
    }
}

module.exports = { updateRosterEmbed };