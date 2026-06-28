module.exports = {

    name: "ready",
    once: true,

    execute(client) {

        console.log("--------------------------------");
        console.log(`Logged in as ${client.user.tag}`);
        console.log("IVY Bot is online.");
        console.log("--------------------------------");

    }

};