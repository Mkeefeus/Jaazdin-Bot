import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Meal } from '../../db/models/Meal';
import {
  getRandomItemByRarity,
  createItemEmbed,
  genericRarityAutocomplete,
  calculateSimpleItemPrice,
} from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('generatemeal')
  .setDescription('Generate a random meal by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the meal').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  await genericRarityAutocomplete(interaction, '~/db/models/Meal');
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

  const meal = await getRandomItemByRarity<Meal>('~/db/models/Meal', rarity);
  if (!meal) {
    await interaction.reply({
      content: `No meals found for rarity: ${rarity}`,
      ephemeral: true,
    });
    return;
  }

  const price = calculateSimpleItemPrice(meal);

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
