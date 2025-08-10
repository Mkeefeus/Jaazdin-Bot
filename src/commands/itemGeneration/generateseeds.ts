import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Seed } from '../../db/models/Seed';
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
  .setName('generateseeds')
  .setDescription('Generate a random seed by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the seed').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  await genericRarityAutocomplete(interaction, '~/db/models/Seed');
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

  const seed = await getRandomItemByRarity<Seed>('~/db/models/Seed', rarity);
  if (!seed) {
    await interaction.reply({
      content: `No seeds found for rarity: ${rarity}`,
      ephemeral: true,
    });
    return;
  }

  const price = calculateSimpleItemPrice(seed);

  const embed = createItemEmbed(
    `Random Seed (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
    seed.name,
    [{ name: 'Price', value: `${price} gp` }],
    0x2ecc71
  );

  await interaction.reply({ embeds: [embed] });
}

export const help = {
  name: 'generateseeds',
  description: 'Generate a random seed by rarity',
  requiredRole: Roles.DM,
  category: 'items',
};
