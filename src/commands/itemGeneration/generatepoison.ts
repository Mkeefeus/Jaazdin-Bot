import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Poison } from '../../db/models/Poison';

export const data = new SlashCommandBuilder()
  .setName('generatepoison')
  .setDescription('Generate a random poison by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the poison').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const poisons = await Poison.findAll({ attributes: ['rarity'] });
  const uniqueRarities = Array.from(new Set(poisons.map((p) => p.rarity)));
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

  const poisonChosen = await getRandomPoisonByRarity(rarity);
  if (!poisonChosen) {
    await interaction.reply({ content: `No poisons found for rarity: ${rarity}`, ephemeral: true });
    return;
  }

  await interaction.reply({
    embeds: [
      {
        title: `Random Poison (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
        description: `**Poison:** ${poisonChosen.name}\n**Rarity:** ${poisonChosen.rarity}`,
        color: 0x8e44ad,
      },
    ],
  });
}

// Utility function for use in other scripts
export async function getRandomPoisonByRarity(rarity: string) {
  const validPoisons = await Poison.findAll({ where: { rarity } });
  if (validPoisons.length === 0) return null;
  return validPoisons[Math.floor(Math.random() * validPoisons.length)];
}
