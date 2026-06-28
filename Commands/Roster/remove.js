const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../../database/db");
const { updateRosterEmbed } = require("../../utils/roster");
const { log } = require("../../utils/logger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("remove")
        .setDescription("Remove a member from the roster.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(opt => opt.setName("user").setDescription("The user to remove.").setRequired(true)),

    async execute(interaction, client) {
        const user = interaction.options.getUser("user");
        const config = require("../../config.json");

        const existing = db.prepare("SELECT * FROM roster WHERE discord_id = ?").get(user.id);
        if (!existing) {
            return interaction.reply({ content: `❌ ${user.username} is not on the roster.`, ephemeral: true });
        }

        db.prepare("DELETE FROM roster WHERE discord_id = ?").run(user.id);

        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (member) {
            const memberRole = interaction.guild.roles.cache.find(r => r.name === config.memberRole);
            if (memberRole) await member.roles.remove(memberRole).catch(() => {});
        }

        await updateRosterEmbed(client);
        await log(client, "Member Removed", `${user.username} was removed from the roster by ${interaction.user.username}.`, 0xE74C3C);
        await interaction.reply({ content: `✅ Removed **${user.username}** from the roster.`, ephemeral: true });
    }
};