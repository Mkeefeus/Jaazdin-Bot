import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { IngredientCategory, Ingredients, Ingredient } from "~/db/models/Ingredients";
import { writeFile } from "fs/promises";
import { resolve } from "path";

export const data = new SlashCommandBuilder().setName("exportkitchen").setDescription("Save the kitchen to a JSON file");

export async function execute(interaction: ChatInputCommandInteraction) {
    try {
        await interaction.deferReply();

        const ingredients: Ingredient[] = (await Ingredients.findAll()).map((ingredient) => ingredient.toJSON());

        ingredients.forEach((ingredient) => {
            delete ingredient.id;
            delete ingredient.updatedAt;
            delete ingredient.createdAt;
        });

        const filePath = resolve("./ingredients.json");
        await writeFile(filePath, JSON.stringify(ingredients, null, 2));

        await interaction.editReply("Kitchen has been exported to ingredients.json");
        
    } catch (error) {
        console.error("Error in kitchen.ts:", error);
        await interaction.editReply("An error occurred while fetching the kitchen");
    }
}
