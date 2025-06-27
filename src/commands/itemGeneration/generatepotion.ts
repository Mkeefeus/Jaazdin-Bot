import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Potion } from '../../db/models/Potion';

export const data = new SlashCommandBuilder()
  .setName('generatepotion')
  .setDescription('Generate a random potion by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the potion').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const potions = await Potion.findAll({ attributes: ['rarity'] });
  const uniqueRarities = Array.from(new Set(potions.map((p) => p.rarity)));
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

  const potionChosen = await getRandomPotionByRarity(rarity);
  if (!potionChosen) {
    await interaction.reply({ content: `No potions found for rarity: ${rarity}`, ephemeral: true });
    return;
  }

  await interaction.reply({
    embeds: [
      {
        title: `Random Potion (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
        description: `**Potion:** ${potionChosen.name}\n**Rarity:** ${potionChosen.rarity}`,
        color: 0x5dade2,
      },
    ],
  });
}

// Utility function for use in other scripts
export async function getRandomPotionByRarity(rarity: string) {
  const validPotions = await Potion.findAll({ where: { rarity } });
  if (validPotions.length === 0) return null;
  return validPotions[Math.floor(Math.random() * validPotions.length)];
}
