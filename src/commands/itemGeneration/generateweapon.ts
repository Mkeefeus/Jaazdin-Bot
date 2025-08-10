import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Weapon } from '../../db/models/Weapon';
import { createItemEmbed, calculateMetalItemPrice } from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';
import { getRandomMetalByRarity } from './generatemetal';
import { Op } from 'sequelize';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('generateweapon')
  .setDescription('Generate a random weapon with a random valid metal by rarity')
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

export async function generateRandomWeaponWithMetalByRarity(rarity: string) {
  const metal = await getRandomMetalByRarity(rarity);
  if (!metal) return null;
  const validWeapons = await Weapon.findAll({
    where: {
      invalid_metals: {
        [Op.notLike]: `%${metal.name}%`,
      },
    },
  });
  const weapon = validWeapons[Math.floor(Math.random() * validWeapons.length)];
  return { weapon, metal };
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

  const result = await generateRandomWeaponWithMetalByRarity(rarity);
  if (!result) {
    await interaction.reply({
      content: `No valid weapon/metal combination found for rarity: ${rarity}`,
      ephemeral: true,
    });
    return;
  }

  const { weapon, metal } = result;
  const price = calculateMetalItemPrice(weapon, metal);

  const embed = createItemEmbed(
    `Random Weapon (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
    `${metal.name} ${weapon.name}`,
    [
      { name: 'Metal', value: metal.name },
      { name: 'Price', value: `${price} gp` },
    ],
    0xaaaaaa
  );

  await interaction.reply({ embeds: [embed] });
}

export const help = {
  name: 'generateweapon',
  description: 'Generate a random weapon with a random valid metal by rarity',
  requiredRole: Roles.DM,
  category: 'items',
};
