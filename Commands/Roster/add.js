const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const db = require("../../database/db");
const { updateRosterEmbed } = require("../../utils/roster");
const { log } = require("../../utils/logger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("add")
        .setDescription("Manually add a member to the roster.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(opt => opt.setName("user").setDescription("The user to add.").setRequired(true))
        .addStringOption(opt => opt.setName("rank").setDescription("Their rank.").setRequired(false)
            .addChoices(
                { name: "Owner", value: "Owner" },
                { name: "Co Owner", value: "Co Owner" },
                { name: "Officer", value: "Officer" },
                { name: "Member", value: "Member" },
                { name: "Trial", value: "Trial" }
            )),

    async execute(interaction, client) {
        const config = require("../../config.json");
        const user = interaction.options.getUser("user");
        const rank = interaction.options.getString("rank") || "Member";
        const member = await interaction.guild.members.fetch(user.id);

        const ownerRole = interaction.guild.roles.cache.find(r => r.name === config.ownerRole);
        const staffRole = interaction.guild.roles.cache.find(r => r.name === config.staffRole);
        const hasPermission = (ownerRole && member.roles.cache.has(ownerRole.id)) ||
                              (staffRole && member.roles.cache.has(staffRole.id)) ||
                              interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasPermission) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const existing = db.prepare("SELECT * FROM roster WHERE discord_id = ?").get(user.id);
        if (existing) {
            return interaction.reply({ content: `❌ ${user.username} is already on the roster.`, ephemeral: true });
        }

        db.prepare("INSERT INTO roster (discord_id, username, rank) VALUES (?, ?, ?)").run(user.id, user.username, rank);

        const memberRole = interaction.guild.roles.cache.find(r => r.name === config.memberRole);
        if (memberRole) await member.roles.add(memberRole).catch(() => {});

        await updateRosterEmbed(client);
        await log(client, "Member Added", `${user.username} was manually added to the roster as **${rank}** by ${interaction.user.username}.`, 0x57F287);
        await interaction.reply({ content: `✅ Added **${user.username}** to the roster as **${rank}**.`, ephemeral: true });
    }
};