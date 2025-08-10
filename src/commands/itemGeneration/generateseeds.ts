import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Seed } from '../../db/models/Seed';
import { createItemEmbed } from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';
import { randomInt } from 'crypto';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('generateseeds')
  .setDescription('Generate a random seed by rarity')
  .addStringOption((option) =>
    option
      .setName('rarity')
      .setDescription('Rarity of the seed')
      .setRequired(true)
      .setChoices([
        { name: 'Common', value: 'Common' },
        { name: 'Uncommon', value: 'Uncommon' },
        { name: 'Rare', value: 'Rare' },
        { name: 'Very Rare', value: 'Very Rare' },
        { name: 'Legendary', value: 'Legendary' },
      ])
  );

export async function getRandomSeedByRarity(rarity: string): Promise<Seed | null> {
  const items = await Seed.findAll({
    where: { rarity },
  });
  if (items.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex].dataValues;
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

  const seed = await getRandomSeedByRarity(rarity);
  if (!seed) {
    await interaction.reply({
      content: `No seeds found for rarity: ${rarity}`,
      ephemeral: true,
    });
    return;
  }

  const price = randomInt(seed.price_min, seed.price_max);

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
