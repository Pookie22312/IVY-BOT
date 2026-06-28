require("dotenv").config();

const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const commands = [];
const commandsPath = path.join(__dirname, "commands");

function loadCommands(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            loadCommands(fullPath);
        } else if (file.endsWith(".js")) {
            const command = require(fullPath);
            if (command.data) commands.push(command.data.toJSON());
        }
    }
}

loadCommands(commandsPath);

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`Registering ${commands.length} slash command(s)...`);
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log("✅ Commands registered successfully.");
    } catch (error) {
        console.error(error);
    }
})();