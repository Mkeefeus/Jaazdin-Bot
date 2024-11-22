import { db } from "~/db/db.js";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { User } from "~/db/models/User.js";
import { Ingredient } from "~/db/models/Ingredient";
import { Plant } from "~/db/models/Plant";

export const data = new SlashCommandBuilder()
  .setName("resetdb")
  .setDescription("Resets the database");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (
    !(
      interaction.user.id === "146092731179991040" ||
      interaction.user.id === "877279699473150052"
    )
  ) {
    await interaction.reply("You do not have permission to use this command");
    return;
  }

  //   await interaction.deferReply();

  try {
    await Promise.all([
      // User.sync({ force: true }),
      // Ingredient.sync({ force: true }),
      Plant.sync({ force: true }),
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
