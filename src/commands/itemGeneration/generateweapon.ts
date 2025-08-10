import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Weapon } from '../../db/models/Weapon';
import {
  generateItemWithValidMetal,
  genericRarityAutocomplete,
  createItemEmbed,
  calculateMetalItemPrice,
} from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('generateweapon')
  .setDescription('Generate a random weapon with a random valid metal by rarity')
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

  const result = await generateRandomWeaponWithMetal(rarity);
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

// Utility function for use in other scripts
export async function generateRandomWeaponWithMetal(rarity: string) {
  const result = await generateItemWithValidMetal<Weapon>('~/db/models/Weapon', rarity);
  if (!result) return null;

  return { weapon: result.item, metal: result.metal };
}

export const help = {
  name: 'generateweapon',
  description: 'Generate a random weapon with a random valid metal by rarity',
  requiredRole: Roles.DM,
  category: 'items',
};
