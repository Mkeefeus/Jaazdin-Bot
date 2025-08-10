import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Metal } from '../../db/models/Metal';
import { Op } from 'sequelize';
import {
  getRandomItemByRarity,
  createItemEmbed,
  genericRarityAutocomplete,
  calculateMetalPrice,
} from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('generatemetal')
  .setDescription('Generate a random metal by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the metal').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  await genericRarityAutocomplete(interaction, '~/db/models/Metal');
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

  const metal = await getRandomItemByRarity<Metal>('~/db/models/Metal', rarity);
  if (!metal) {
    await interaction.reply({
      content: `No metals found for rarity: ${rarity}`,
      ephemeral: true,
    });
    return;
  }

  const price = calculateMetalPrice(metal);

  const embed = createItemEmbed(
    `Random Metal (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
    metal.name,
    [{ name: 'Price', value: `${price} gp` }],
    0xb2bec3
  );

  await interaction.reply({ embeds: [embed] });
}

export const help = {
  name: 'generatemetal',
  description: 'Generate a random metal by rarity',
  requiredRole: Roles.DM,
  category: 'items',
};

// Utility function: get a random metal by rarity, excluding certain planes
export async function getRandomMetalByRarityExcludingPlanes(rarity: string, excludedPlane: string) {
  // Assumes Metal model has a 'plane' property
  const validMetals = await Metal.findAll({
    where: {
      rarity,
      plane: { [Op.ne]: excludedPlane },
    },
  });
  if (validMetals.length === 0) return null;
  return validMetals[Math.floor(Math.random() * validMetals.length)];
}
