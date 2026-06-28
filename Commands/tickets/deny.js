const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../../database/db");
const { log } = require("../../utils/logger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deny")
        .setDescription("Deny an applicant.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addStringOption(opt => opt.setName("reason").setDescription("Reason for denial.").setRequired(true)),

    async execute(interaction, client) {
        const reason = interaction.options.getString("reason");
        const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'").get(interaction.channelId);

        if (!ticket) {
            return interaction.reply({ content: "❌ This command can only be used inside an open ticket channel.", ephemeral: true });
        }

        const guild = interaction.guild;
        const member = await guild.members.fetch(ticket.applicant_id).catch(() => null);

        db.prepare("UPDATE tickets SET status = 'denied' WHERE channel_id = ?").run(interaction.channelId);

        if (member) {
            try {
                await member.send({
                    content: `❌ **Unfortunately your application has been denied.**\n\n**Denied by:**\n${interaction.user.username}\n\n**Reason:**\n${reason}`
                });
            } catch {
                // DMs closed
            }
        }

        await interaction.reply({ content: `❌ **${member?.user.username ?? "Applicant"}** has been denied. Deleting ticket...` });
        await log(client, "Application Denied", `${member?.user.username ?? "Unknown"} was denied by ${interaction.user.username}.\n**Reason:** ${reason}`, 0xE74C3C);

        setTimeout(async () => {
            await interaction.channel.delete().catch(() => {});
        }, 5000);
    }
};