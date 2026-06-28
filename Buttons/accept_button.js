const db = require("../database/db");
const { updateRosterEmbed } = require("../utils/roster");
const { log } = require("../utils/logger");

module.exports = {
    customId: "accept_button",

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

        const member = await interaction.guild.members.fetch(ticket.applicant_id).catch(() => null);
        if (!member) return interaction.reply({ content: "❌ Applicant not found.", ephemeral: true });

        const existing = db.prepare("SELECT * FROM roster WHERE discord_id = ?").get(ticket.applicant_id);
        if (!existing) {
            db.prepare("INSERT INTO roster (discord_id, username, rank) VALUES (?, ?, 'Member')").run(member.id, member.user.username);
        }

        const memberRole = interaction.guild.roles.cache.find(r => r.name === config.memberRole);
        if (memberRole) await member.roles.add(memberRole).catch(() => {});

        db.prepare("UPDATE tickets SET status = 'accepted' WHERE channel_id = ?").run(interaction.channelId);

        try {
            await member.send("✅ **Congratulations!**\n\nYou have been accepted into **IVY**!\n\nWelcome to the guild 🌿");
        } catch {}

        await interaction.reply({ content: `✅ **${member.user.username}** has been accepted! Deleting ticket in 10 seconds...` });
        await updateRosterEmbed(client);
        await log(client, "Application Accepted", `${member.user.username} was accepted by ${interaction.user.username}.`, 0x57F287);

        setTimeout(async () => { await interaction.channel.delete().catch(() => {}); }, 10000);
    }
};