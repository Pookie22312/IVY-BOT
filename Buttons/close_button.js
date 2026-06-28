const db = require("../database/db");
const { log } = require("../utils/logger");

module.exports = {
    customId: "close_button",

    async execute(interaction, client) {
        const config = require("../config.json");
        const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'").get(interaction.channelId);
        if (!ticket) return interaction.reply({ content: "❌ No open ticket found here.", ephemeral: true });

        const staffRole = interaction.guild.roles.cache.find(r => r.name === config.staffRole);
        const ownerRole = interaction.guild.roles.cache.find(r => r.name === config.ownerRole);
        const hasPermission = (staffRole && interaction.member.roles.cache.has(staffRole.id)) ||
                              (ownerRole && interaction.member.roles.cache.has(ownerRole.id)) ||
                              interaction.member.permissions.has("Administrator");

        if (!hasPermission) return interaction.reply({ content: "❌ You don't have permission.", ephemeral: true });

        db.prepare("UPDATE tickets SET status = 'closed' WHERE channel_id = ?").run(interaction.channelId);
        await log(client, "Ticket Closed", `Ticket for <@${ticket.applicant_id}> was closed by ${interaction.user.username}.`, 0xE67E22);
        await interaction.reply({ content: "🔒 Closing ticket in 5 seconds..." });

        setTimeout(async () => { await interaction.channel.delete().catch(() => {}); }, 5000);
    }
};