import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Metal } from '../../db/models/Metal';
import { Op } from 'sequelize';
import { createItemEmbed } from '~/functions/boatHelpers';
import { checkUserRole, rarityChoices, randomInt } from '~/functions/helpers';
import { Roles } from '~/types/roles';

export const data = new SlashCommandBuilder()
  .setName('generatemetal')
  .setDescription('Generate a random metal by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the metal').setRequired(true).addChoices(rarityChoices)
  );

export async function getRandomMetalByRarity(rarity: string): Promise<Metal | null> {
  const metals = await Metal.findAll({ where: { rarity } });
  if (!metals || metals.length === 0) return null;
  return metals[Math.floor(Math.random() * metals.length)];
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

  const metal = await getRandomMetalByRarity(rarity);
  if (!metal) {
    await interaction.reply({
      content: `No metals found for rarity: ${rarity}`,
      ephemeral: true,
    });
    return;
  }

  const price = randomInt(metal.price_min, metal.price_max);

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
