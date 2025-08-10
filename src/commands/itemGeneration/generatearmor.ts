import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Armor } from '../../db/models/Armor';
import { checkUserRole, rarityChoices } from '~/functions/helpers';
import { Roles } from '~/types/roles';
import { createItemEmbed, calculateMetalItemPrice } from '~/functions/boatHelpers';
import { getRandomMetalByRarity } from './generatemetal';
import { Op } from 'sequelize';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('generatearmor')
  .setDescription('Generate a random armor with a random valid metal by rarity')
  .addStringOption((option) =>
    option
      .setName('rarity')
      .setDescription('Rarity of the metal')
      .setRequired(true)
      .setChoices(rarityChoices)
  );

// Utility function for use in other scripts
export async function generateRandomArmorWithMetalByRarity(rarity: string) {
  const metal = await getRandomMetalByRarity(rarity);
  if (!metal) return null;
  const validArmors = await Armor.findAll({
    where: {
      invalid_metals: {
        [Op.notLike]: `%${metal.name}%`,
      },
    },
  });
  const armor = validArmors[Math.floor(Math.random() * validArmors.length)];
  return { armor, metal };
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

  const result = await generateRandomArmorWithMetalByRarity(rarity);
  if (!result) {
    await interaction.reply({
      content: `No valid armor/metal combination found for rarity: ${rarity}`,
      ephemeral: true,
    });
    return;
  }

  const { armor, metal } = result;
  const price = calculateMetalItemPrice(armor, metal);

  const embed = createItemEmbed(
    `Random Armor (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
    `${metal.name} ${armor.name}`,
    [
      { name: 'Metal', value: metal.name },
      { name: 'Price', value: `${price} gp` },
    ],
    0xaaaaaa
  );

  await interaction.reply({ embeds: [embed] });
}

export const help = {
  name: 'generatearmor',
  description: 'Generate a random armor with a random valid metal by rarity',
  requiredRole: Roles.DM,
  category: 'items',
};
