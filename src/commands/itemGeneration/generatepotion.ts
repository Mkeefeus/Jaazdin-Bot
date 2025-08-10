import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Potion } from '../../db/models/Potion';
import { createItemEmbed } from '~/functions/boatHelpers';
import { checkUserRole, rarityChoices, randomInt } from '~/functions/helpers';
import { Roles } from '~/types/roles';

export const data = new SlashCommandBuilder()
  .setName('generatepotion')
  .setDescription('Generate a random potion by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the potion').setRequired(true).setChoices(rarityChoices)
  );

export async function getRandomPotionByRarity(rarity: string): Promise<Potion | null> {
  const potions = await Potion.findAll({ where: { rarity } });
  if (!potions || potions.length === 0) return null;
  return potions[Math.floor(Math.random() * potions.length)];
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

  const potion = await getRandomPotionByRarity(rarity);
  if (!potion) {
    await interaction.reply({
      content: `No potions found for rarity: ${rarity}`,
      ephemeral: true,
    });
    return;
  }

  const price = randomInt(potion.price_min, potion.price_max);

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
