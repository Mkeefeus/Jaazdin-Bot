import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Weapon } from '../../db/models/Weapon';
import { createItemEmbed, calculateMetalItemPrice } from '~/functions/boatHelpers';
import { checkUserRole, randomInt, rarityChoices } from '~/functions/helpers';
import { Roles } from '~/types';
import { getRandomMetalByRarity } from './generatemetal';
import { HelpData } from '~/types';

export const data = new SlashCommandBuilder()
  .setName('generateweapon')
  .setDescription('Generate a random weapon with a random valid metal by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the metal').setRequired(true).setChoices(rarityChoices)
  );

export async function generateRandomWeaponWithMetalByRarity(rarity: string) {
  const metal = await getRandomMetalByRarity(rarity);
  if (!metal) return null;
  const allWeapons = await Weapon.findAll();
  const validWeapons = allWeapons.filter((weapon) => {
    return !weapon.invalidMetals || !weapon.invalidMetals.includes(metal.name);
  });
  const weapon = validWeapons[Math.floor(Math.random() * validWeapons.length)];
  return { weapon, metal };
}

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, [Roles.GM, Roles.DM])) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const rarity = interaction.options.getString('rarity', true);

  const result = await generateRandomWeaponWithMetalByRarity(rarity);
  if (!result) {
    await interaction.reply({
      content: `No valid weapon/metal combination found for rarity: ${rarity}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const { weapon, metal } = result;
  const price = calculateMetalItemPrice(weapon, randomInt(metal.price_min, metal.price_max));

  const embed = createItemEmbed(
    `Random Weapon (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
    `${metal.name} ${weapon.name}`,
    [
      { name: 'Metal', value: metal.name },
      { name: 'Price', value: `${price} gp` },
    ],
    0xaaaaaa
  );

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

export const help: HelpData = {
  name: 'generateweapon',
  description: 'Generate a random weapon with a random valid metal by rarity',
  requiredRole: [Roles.DM, Roles.GM],
  category: 'items',
};
