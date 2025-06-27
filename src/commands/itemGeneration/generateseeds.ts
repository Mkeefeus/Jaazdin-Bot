import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Seed } from '../../db/models/Seed';

export const data = new SlashCommandBuilder()
  .setName('generateseeds')
  .setDescription('Generate a random seed by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the seed').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const seeds = await Seed.findAll({ attributes: ['rarity'] });
  const uniqueRarities = Array.from(new Set(seeds.map((s) => s.rarity)));
  const focused = interaction.options.getFocused().toLowerCase();

  const filtered = uniqueRarities
    .filter((r) => r.toLowerCase().startsWith(focused))
    .map((r) => ({
      name: r.charAt(0).toUpperCase() + r.slice(1),
      value: r,
    }));

  await interaction.respond(filtered);
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const rarity = interaction.options.getString('rarity', true);

  const seedChosen = await getRandomSeedByRarity(rarity);
  if (!seedChosen) {
    await interaction.reply({ content: `No seeds found for rarity: ${rarity}`, ephemeral: true });
    return;
  }

  await interaction.reply({
    embeds: [
      {
        title: `Random Seed (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
        description: `**Seed:** ${seedChosen.name}\n**Rarity:** ${seedChosen.rarity}`,
        color: 0x2ecc71,
      },
    ],
  });
}

// Utility function for use in other scripts
export async function getRandomSeedByRarity(rarity: string) {
  const validSeeds = await Seed.findAll({ where: { rarity } });
  if (validSeeds.length === 0) return null;
  return validSeeds[Math.floor(Math.random() * validSeeds.length)];
}
