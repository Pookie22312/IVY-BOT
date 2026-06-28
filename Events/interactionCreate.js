const { log } = require("../utils/logger");
const db = require("../database/db");

module.exports = {
    name: "interactionCreate",

    async execute(interaction, client) {

        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                const msg = { content: "❌ There was an error running this command.", ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(msg);
                } else {
                    await interaction.reply(msg);
                }
            }
        }

        if (interaction.isButton()) {
            const button = client.buttons.get(interaction.customId);
            if (!button) return;
            try {
                await button.execute(interaction, client);
            } catch (error) {
                console.error(error);
                if (!interaction.replied) await interaction.reply({ content: "❌ Something went wrong.", ephemeral: true });
            }
        }

        if (interaction.isModalSubmit() && interaction.customId === "deny_modal") {
            const reason = interaction.fields.getTextInputValue("deny_reason");
            const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'").get(interaction.channelId);
            if (!ticket) return;

            const member = await interaction.guild.members.fetch(ticket.applicant_id).catch(() => null);
            db.prepare("UPDATE tickets SET status = 'denied' WHERE channel_id = ?").run(interaction.channelId);

            if (member) {
                try {
                    await member.send(`❌ **Unfortunately your application has been denied.**\n\n**Denied by:**\n${interaction.user.username}\n\n**Reason:**\n${reason}`);
                } catch {}
            }

            await interaction.reply({ content: `❌ **${member?.user.username ?? "Applicant"}** denied. Deleting in 5 seconds...` });
            await log(client, "Application Denied", `${member?.user.username ?? "Unknown"} was denied by ${interaction.user.username}.\n**Reason:** ${reason}`, 0xE74C3C);
            setTimeout(async () => { await interaction.channel.delete().catch(() => {}); }, 5000);
        }
    }
};