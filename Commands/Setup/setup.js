const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Post the application button in the apply channel.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const config = require("../../config.json");
        const guild = interaction.guild;

        const applyChannel = guild.channels.cache.find(c => c.name === config.applicationChannel);
        if (!applyChannel) {
            return interaction.reply({ content: `❌ Could not find a channel named **${config.applicationChannel}**.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle("🌿 Apply to IVY")
            .setDescription("Want to join IVY Guild? Click the button below to submit your application.\n\nA staff member will review it shortly.")
            .setColor(0x2ECC71)
            .setFooter({ text: "IVY Guild Applications" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("open_application")
                .setLabel("📝 Apply Now")
                .setStyle(ButtonStyle.Success)
        );

        await applyChannel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: `✅ Application panel posted in ${applyChannel}.`, ephemeral: true });
    }
};