import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Metal } from '../../db/models/Metal';

export const data = new SlashCommandBuilder()
  .setName('generatemetal')
  .setDescription('Generate a random metal by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the metal').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  // Dynamically fetch rarities from the database
  const metals = await Metal.findAll({ attributes: ['rarity'] });
  const uniqueRarities = Array.from(new Set(metals.map((m) => m.rarity)));
  const focused = interaction.options.getFocused().toLowerCase();

  const filtered = uniqueRarities
    .filter((r) => r && r.toLowerCase().startsWith(focused))
    .map((r) => ({
      name: r.charAt(0).toUpperCase() + r.slice(1),
      value: r,
    }));

  await interaction.respond(filtered);
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const rarity = interaction.options.getString('rarity', true);

  const metalChosen = await getRandomMetalByRarity(rarity);
  if (!metalChosen) {
    await interaction.reply({ content: `No metals found for rarity: ${rarity}`, ephemeral: true });
    return;
  }

  await interaction.reply({
    embeds: [
      {
        title: `Random Metal (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
        description: `**Metal:** ${metalChosen.name}\n**Rarity:** ${metalChosen.rarity}`,
        color: 0xb2bec3,
      },
    ],
  });
}

// Utility function for use in other scripts
export async function getRandomMetalByRarity(rarity: string) {
  const validMetals = await Metal.findAll({ where: { rarity } });
  if (validMetals.length === 0) return null;
  return validMetals[Math.floor(Math.random() * validMetals.length)];
}

// Utility function: get a random metal by rarity, excluding certain planes
export async function getRandomMetalByRarityExcludingPlanes(
  rarity: string,
  excludedPlanes: string[]
) {
  // Assumes Metal model has a 'plane' property
  const validMetals = await Metal.findAll({
    where: {
      rarity,
      plane: { $notIn: excludedPlanes }
    }
  });
  if (validMetals.length === 0) return null;
  return validMetals[Math.floor(Math.random() * validMetals.length)];
}
