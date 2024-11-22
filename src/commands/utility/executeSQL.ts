import { db } from "~/db/db";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { isBotDev } from "~/functions/isBotDev";

export const data = new SlashCommandBuilder()
    .setName("sql")
    .setDescription("Execute a SQL query on the database")
    .addStringOption((option) => option.setName("query").setDescription("The SQL query to execute").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    let hasRole = isBotDev(interaction);
    if (!hasRole) {
        await interaction.reply("You do not have permission to use this command");
        return;
    }

    const query = interaction.options.getString("query", true);

    try {
        const [results] = await db.query(query);
        // const [results, metadata] = await db.query("SELECT * from Ingredient");
        console.log("Query results:", results);
        await interaction.reply("Query executed successfully: " + JSON.stringify(results));
    } catch (e) {
        console.error("Error executing query:", e);
        await interaction.reply("Error executing query");
    }
}

export default {
    data,
    execute,
};
