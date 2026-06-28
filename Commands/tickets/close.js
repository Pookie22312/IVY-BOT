const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../../database/db");
const { log } = require("../../utils/logger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("close")
        .setDescription("Close a ticket without accepting or denying.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, client) {
        const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'").get(interaction.channelId);

        if (!ticket) {
            return interaction.reply({ content: "❌ This is not an open ticket channel.", ephemeral: true });
        }

        db.prepare("UPDATE tickets SET status = 'closed' WHERE channel_id = ?").run(interaction.channelId);
        await log(client, "Ticket Closed", `Ticket for applicant <@${ticket.applicant_id}> was closed by ${interaction.user.username}.`, 0xE67E22);
        await interaction.reply({ content: "🔒 Ticket closed. Deleting in 5 seconds..." });

        setTimeout(async () => {
            await interaction.channel.delete().catch(() => {});
        }, 5000);
    }
};