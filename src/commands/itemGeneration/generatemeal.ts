import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Meal } from '../../db/models/Meal';
import { createItemEmbed } from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';
import { randomInt } from 'crypto';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('generatemeal')
  .setDescription('Generate a random meal by rarity')
  .addStringOption((option) =>
    option
      .setName('rarity')
      .setDescription('Rarity of the metal')
      .setRequired(true)
      .setChoices([
        { name: 'Common', value: 'Common' },
        { name: 'Uncommon', value: 'Uncommon' },
        { name: 'Rare', value: 'Rare' },
        { name: 'Very Rare', value: 'Very Rare' },
        { name: 'Legendary', value: 'Legendary' },
      ])
  );

export async function getRandomMealByRarity(rarity: string): Promise<Meal | null> {
  const meals = await Meal.findAll({ where: { rarity } });
  if (!meals || meals.length === 0) return null;
  return meals[Math.floor(Math.random() * meals.length)];
}

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, Roles.DM)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true,
    });
    return;
  }

  const rarity = interaction.options.getString('rarity', true);

  const meal = await getRandomMealByRarity(rarity);
  if (!meal) {
    await interaction.reply({
      content: `No meals found for rarity: ${rarity}`,
      ephemeral: true,
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
  requiredRole: Roles.DM,
  category: 'items',
};
