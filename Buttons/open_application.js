const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
    customId: "open_application",

    async execute(interaction, client) {
        const db = require("../database/db");

        // Check ticket limit (max 2 open tickets per user)
        const openTickets = db.prepare("SELECT COUNT(*) as count FROM tickets WHERE applicant_id = ? AND status = 'open'").get(interaction.user.id);
        if (openTickets.count >= 2) {
            return interaction.reply({
                content: "❌ You already have **2 open applications**. Please wait for them to be reviewed before applying again.",
                ephemeral: true
            });
        }

        const modal = new ModalBuilder()
            .setCustomId("application_modal")
            .setTitle("🌿 IVY Guild Application");

        const fields = [
            new TextInputBuilder().setCustomId("roblox_username").setLabel("Roblox Username").setStyle(TextInputStyle.Short).setRequired(true),
            new TextInputBuilder().setCustomId("sell_value").setLabel("Current Sell Value?").setStyle(TextInputStyle.Short).setRequired(true),
            new TextInputBuilder().setCustomId("best_pet").setLabel("Best Pet?").setStyle(TextInputStyle.Short).setRequired(true),
            new TextInputBuilder().setCustomId("active").setLabel("Will you be active?").setStyle(TextInputStyle.Short).setRequired(true),
            new TextInputBuilder().setCustomId("why_ivy").setLabel("Why do you want to join IVY?").setStyle(TextInputStyle.Paragraph).setRequired(true),
        ];

        modal.addComponents(fields.map(f => new ActionRowBuilder().addComponents(f)));
        await interaction.showModal(modal);
    }
};