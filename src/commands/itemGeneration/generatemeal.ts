import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Meal } from '../../db/models/Meal';
import { createItemEmbed } from '~/functions/boatHelpers';
import { rarityChoices, randomInt } from '~/functions/helpers';

export const data = new SlashCommandBuilder()
  .setName('generatemeal')
  .setDescription('Generate a random meal by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the meal').setRequired(true).setChoices(rarityChoices)
  );

export async function getRandomMealByRarity(rarity: string): Promise<Meal | null> {
  const meals = await Meal.findAll({ where: { rarity } });
  if (!meals || meals.length === 0) return null;
  return meals[Math.floor(Math.random() * meals.length)];
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const rarity = interaction.options.getString('rarity', true);

  const meal = await getRandomMealByRarity(rarity);
  if (!meal) {
    await interaction.reply({
      content: `No meals found for rarity: ${rarity}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const price = randomInt(meal.price_min, meal.price_max);

  const embed = createItemEmbed(
    `Random Meal (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
    meal.name,
    [{ name: 'Price', value: `${price} gp` }],
    0x27ae60
  );

  await interaction.reply({ embeds: [embed] });
}

export const help = {
  name: 'generatemeal',
  description: 'Generate a random meal by rarity',
  category: 'items',
};
