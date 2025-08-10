import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Potion } from '../../db/models/Potion';
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
  .setName('generatepotion')
  .setDescription('Generate a random potion by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the potion').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  await genericRarityAutocomplete(interaction, '~/db/models/Potion');
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

  const potion = await getRandomItemByRarity<Potion>('~/db/models/Potion', rarity);
  if (!potion) {
    await interaction.reply({
      content: `No potions found for rarity: ${rarity}`,
      ephemeral: true,
    });
    return;
  }

  const price = calculateSimpleItemPrice(potion);

  const embed = createItemEmbed(
    `Random Potion (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
    potion.name,
    [{ name: 'Price', value: `${price} gp` }],
    0x5dade2
  );

  await interaction.reply({ embeds: [embed] });
}

export const help = {
  name: 'generatepotion',
  description: 'Generate a random potion by rarity',
  requiredRole: Roles.DM,
  category: 'items',
};
