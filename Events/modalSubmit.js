const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const db = require("../database/db");
const { log } = require("../utils/logger");

module.exports = {
    name: "interactionCreate",

    async execute(interaction, client) {
        if (!interaction.isModalSubmit()) return;
        if (interaction.customId !== "application_modal") return;

        const config = require("../config.json");
        const guild = interaction.guild;
        const applicant = interaction.user;

        const roblox = interaction.fields.getTextInputValue("roblox_username");
        const sellValue = interaction.fields.getTextInputValue("sell_value");
        const bestPet = interaction.fields.getTextInputValue("best_pet");
        const active = interaction.fields.getTextInputValue("active");
        const whyIvy = interaction.fields.getTextInputValue("why_ivy");

        // Find or create ticket category
        let category = guild.channels.cache.find(c => c.name === config.ticketCategory && c.type === 4);
        if (!category) {
            category = await guild.channels.create({
                name: config.ticketCategory,
                type: 4
            });
        }

        const staffRole = guild.roles.cache.find(r => r.name === config.staffRole);
        const ownerRole = guild.roles.cache.find(r => r.name === config.ownerRole);

        const ticketChannel = await guild.channels.create({
            name: `app-${applicant.username}`,
            type: 0,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: applicant.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                },
                ...(staffRole ? [{
                    id: staffRole.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                }] : []),
                ...(ownerRole ? [{
                    id: ownerRole.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                }] : [])
            ]
        });

        db.prepare("INSERT INTO tickets (channel_id, applicant_id, status) VALUES (?, ?, 'open')").run(ticketChannel.id, applicant.id);

        const embed = new EmbedBuilder()
            .setTitle("🌿 New Application")
            .setThumbnail(applicant.displayAvatarURL())
            .addFields(
                { name: "Applicant", value: `<@${applicant.id}>`, inline: true },
                { name: "Roblox Username", value: roblox, inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: "Sell Value", value: sellValue, inline: true },
                { name: "Best Pet", value: bestPet, inline: true },
                { name: "Active?", value: active, inline: true },
                { name: "Why IVY?", value: whyIvy }
            )
            .setColor(0x2ECC71)
            .setTimestamp()
            .setFooter({ text: "IVY Guild Applications" });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("accept_button").setLabel("✅ Accept").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId("deny_button").setLabel("❌ Deny").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("close_button").setLabel("🔒 Close").setStyle(ButtonStyle.Secondary)
        );

        await ticketChannel.send({ content: `<@${applicant.id}> ${staffRole ? `<@&${staffRole.id}>` : ""}`, embeds: [embed], components: [row] });
        await interaction.reply({ content: `✅ Your application has been submitted! Check ${ticketChannel}.`, ephemeral: true });
        await log(client, "New Application", `${applicant.username} submitted an application. Ticket: ${ticketChannel}.`, 0x3498DB);
    }
};