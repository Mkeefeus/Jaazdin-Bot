import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Armor } from '../../db/models/Armor';
import { checkUserRole, randomInt, rarityChoices } from '~/functions/helpers';
import { Roles } from '~/types';
import { createItemEmbed, calculateMetalItemPrice } from '~/functions/boatHelpers';
import { getRandomMetalByRarity } from './generatemetal';
import { HelpData } from '~/types';

export const data = new SlashCommandBuilder()
  .setName('generatearmor')
  .setDescription('Generate a random armor with a random valid metal by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the metal').setRequired(true).setChoices(rarityChoices)
  );

// Utility function for use in other scripts
export async function generateRandomArmorWithMetalByRarity(rarity: string) {
  const metal = await getRandomMetalByRarity(rarity);
  if (!metal) return null;
  const allArmors = await Armor.findAll();
  const validArmors = allArmors.filter((armor) => {
    return !armor.invalidMetals || !armor.invalidMetals.includes(metal.name);
  });
  const armor = validArmors[Math.floor(Math.random() * validArmors.length)];
  return { armor, metal };
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

  const result = await generateRandomArmorWithMetalByRarity(rarity);
  if (!result) {
    await interaction.reply({
      content: `No valid armor/metal combination found for rarity: ${rarity}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const { armor, metal } = result;
  const price = calculateMetalItemPrice(armor, randomInt(metal.price_min, metal.price_max));

  const embed = createItemEmbed(
    `Random Armor (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
    `${metal.name} ${armor.name}`,
    [
      { name: 'Metal', value: metal.name },
      { name: 'Price', value: `${price} gp` },
    ],
    0xaaaaaa
  );

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

export const help: HelpData = {
  name: 'generatearmor',
  description: 'Generate a random armor with a random valid metal by rarity',
  requiredRole: [Roles.DM, Roles.GM],
  category: 'items',
};
