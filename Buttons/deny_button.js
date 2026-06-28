const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
    customId: "deny_button",

    async execute(interaction, client) {
        const config = require("../config.json");
        const staffRole = interaction.guild.roles.cache.find(r => r.name === config.staffRole);
        const ownerRole = interaction.guild.roles.cache.find(r => r.name === config.ownerRole);
        const hasPermission = (staffRole && interaction.member.roles.cache.has(staffRole.id)) ||
                              (ownerRole && interaction.member.roles.cache.has(ownerRole.id)) ||
                              interaction.member.permissions.has("Administrator");

        if (!hasPermission) return interaction.reply({ content: "❌ You don't have permission.", ephemeral: true });

        const modal = new ModalBuilder()
            .setCustomId("deny_modal")
            .setTitle("Deny Application");

        const reasonInput = new TextInputBuilder()
            .setCustomId("deny_reason")
            .setLabel("Reason for denial")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
        await interaction.showModal(modal);
    }
};