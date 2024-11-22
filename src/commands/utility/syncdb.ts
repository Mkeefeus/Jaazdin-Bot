import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { isBotDev } from "~/functions/isBotDev";

export const data = new SlashCommandBuilder().setName("resetdb").setDescription("Resets the database");

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.member) {
        return;
    }
    let hasRole = isBotDev(interaction);
    if (!hasRole) {
        await interaction.reply("You do not have permission to use this command");
        return;
    }

    try {
        await Promise.all([
            // Ingredients.sync({ force: true }),
            // Plants.sync({ force: true }),
        ]);
        // await db.sync({ force: true });
        await interaction.reply("Database synced!");
    } catch (e) {
        console.error("Error syncing database:", e);
        await interaction.reply("Error syncing database");
    }
}

export default {
    data,
    execute,
};
