import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Meal } from '../../db/models/Meal';

export const data = new SlashCommandBuilder()
  .setName('generatemeal')
  .setDescription('Generate a random meal by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the meal').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  // Dynamically fetch rarities from the database
  const meals = await Meal.findAll({ attributes: ['rarity'] });
  const uniqueRarities = Array.from(new Set(meals.map((m) => m.rarity)));
  const focused = interaction.options.getFocused().toLowerCase();

  const filtered = uniqueRarities
    .filter((r) => r.toLowerCase().startsWith(focused))
    .map((r) => ({
      name: r.charAt(0).toUpperCase() + r.slice(1),
      value: r,
    }));

  await interaction.respond(filtered);
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const rarity = interaction.options.getString('rarity', true);

  const mealChosen = await getRandomMealByRarity(rarity);
  if (!mealChosen) {
    await interaction.reply({ content: `No meals found for rarity: ${rarity}`, ephemeral: true });
    return;
  }

  await interaction.reply({
    embeds: [
      {
        title: `Random Meal (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
        description: `**Meal:** ${mealChosen.name}\n**Rarity:** ${mealChosen.rarity}`,
        color: 0x27ae60,
      },
    ],
  });
}

// Utility function for use in other scripts
export async function getRandomMealByRarity(rarity: string) {
  const validMeals = await Meal.findAll({ where: { rarity } });
  if (validMeals.length === 0) return null;
  return validMeals[Math.floor(Math.random() * validMeals.length)];
}
