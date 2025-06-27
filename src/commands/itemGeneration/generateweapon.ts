import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Weapon } from '../../db/models/Weapon';
import { getRandomMetalByRarity } from './generatemetal';

export const data = new SlashCommandBuilder()
  .setName('generateweapon')
  .setDescription('Generate a random weapon with a random valid metal by rarity')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the metal').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const { Metal } = await import('../../db/models/Metal');
  const metals = await Metal.findAll({ attributes: ['rarity'] });
  type MetalRarity = { rarity: string };
  const uniqueRarities = Array.from(new Set((metals as MetalRarity[]).map((m) => m.rarity)));
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

  const result = await generateRandomWeaponWithMetal(rarity);
  if (!result) {
    await interaction.reply({
      content: `No valid weapon/metal combination found for rarity: ${rarity}`,
      ephemeral: true,
    });
    return;
  }

  const { weapon, metal } = result;

  await interaction.reply({
    embeds: [
      {
        title: `Random Weapon (${rarity.charAt(0).toUpperCase() + rarity.slice(1)})`,
        description: `**Weapon:** ${weapon.name}\n**Metal:** ${metal.name}\n**Rarity:** ${metal.rarity}`,
        color: 0xaaaaaa,
      },
    ],
  });
}

// Utility function for use in other scripts
export async function generateRandomWeaponWithMetal(rarity: string) {
  const metal = await getRandomMetalByRarity(rarity);
  if (!metal) return null;

  const allWeapons = await Weapon.findAll();
  const validWeapons = allWeapons.filter(
    (weapon) => !weapon.invalidMetals || !weapon.invalidMetals.includes(metal.name)
  );
  if (validWeapons.length === 0) return null;

  const weapon = validWeapons[Math.floor(Math.random() * validWeapons.length)];
  return { weapon, metal };
}
