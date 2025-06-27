import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Armor } from '../../db/models/Armor';
import { getRandomMetalByRarity } from './generatemetal'; // Import the utility

export const data = new SlashCommandBuilder()
  .setName('generatearmor')
  .setDescription('Generate a random armor with a random valid metal by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the metal').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  // Dynamically fetch rarities from the metal generator
  const { Metal } = await import('../../db/models/Metal');
  const metals = await Metal.findAll({ attributes: ['rarity'] });
  const uniqueRarities = Array.from(new Set(metals.map(m => m.rarity)));
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

  const result = await generateRandomArmorWithMetal(rarity);
  if (!result) {
    await interaction.reply({ content: `No valid armor/metal combination found for rarity: ${rarity}`, ephemeral: true });
    return;
  }

  const { armor, metal } = result;

  await interaction.reply({
    embeds: [
      {
        title: `Random Armor (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
        description: `**Armor:** ${armor.name}\n**Metal:** ${metal.name}\n**Rarity:** ${metal.rarity}`,
        color: 0xaaaaaa,
      },
    ],
  });
}

// Utility function for use in other scripts
export async function generateRandomArmorWithMetal(rarity: string) {
  const metal = await getRandomMetalByRarity(rarity);
  if (!metal) return null;

  const allArmors = await Armor.findAll();
  const validArmors = allArmors.filter(
    (armor) => !armor.invalidMetals || !armor.invalidMetals.includes(metal.name)
  );
  if (validArmors.length === 0) return null;

  const armor = validArmors[Math.floor(Math.random() * validArmors.length)];
  return { armor, metal };
}
