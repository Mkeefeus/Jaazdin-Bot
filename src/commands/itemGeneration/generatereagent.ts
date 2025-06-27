import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Reagent } from '../../db/models/Reagent';

export const data = new SlashCommandBuilder()
  .setName('generatereagent')
  .setDescription('Generate a random reagent by rarity and creature type')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the reagent').setRequired(true).setAutocomplete(true)
  )
  .addStringOption((option) =>
    option
      .setName('creaturetype')
      .setDescription('Creature type of the reagent')
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);
  if (focusedOption.name === 'rarity') {
    const reagents = await Reagent.findAll({ attributes: ['rarity'] });
    const uniqueRarities = Array.from(new Set(reagents.map((r) => r.rarity)));
    const focused = focusedOption.value.toLowerCase();
    const filtered = uniqueRarities
      .filter((r) => r && r.toLowerCase().startsWith(focused))
      .map((r) => ({
        name: r.charAt(0).toUpperCase() + r.slice(1),
        value: r,
      }));
    await interaction.respond(filtered);
  } else if (focusedOption.name === 'creaturetype') {
    const reagents = await Reagent.findAll({ attributes: ['type'] });
    const uniqueTypes = Array.from(new Set(reagents.map((r) => r.type)));
    const focused = focusedOption.value.toLowerCase();
    const filtered = uniqueTypes
      .filter((t) => t && t.toLowerCase().startsWith(focused))
      .map((t) => ({
        name: t.charAt(0).toUpperCase() + t.slice(1),
        value: t,
      }));
    await interaction.respond(filtered);
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const rarity = interaction.options.getString('rarity', true);
  const creatureType = interaction.options.getString('creaturetype', true);

  const reagentChosen = await getRandomReagentByRarityAndType(rarity, creatureType);
  if (!reagentChosen) {
    await interaction.reply({
      content: `No reagents found for rarity "${rarity}" and creature type "${creatureType}".`,
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    embeds: [
      {
        title: `Random Reagent (${rarity.charAt(0).toUpperCase() + rarity.slice(1)}, ${creatureType.charAt(0).toUpperCase() + creatureType.slice(1)})`,
        description: `**Reagent:** ${reagentChosen.name}\n**Rarity:** ${reagentChosen.rarity}\n**Creature Type:** ${reagentChosen.type}`,
        color: 0x16a085,
      },
    ],
  });
}

// Utility function for use in other scripts
export async function getRandomReagentByRarityAndType(rarity: string, creatureType: string) {
  const validReagents = await Reagent.findAll({ where: { rarity, type: creatureType } });
  if (validReagents.length === 0) return null;
  return validReagents[Math.floor(Math.random() * validReagents.length)];
}

// New helper: get a random reagent by rarity, regardless of type
export async function getRandomReagentByRarity(rarity: string) {
  const validReagents = await Reagent.findAll({ where: { rarity } });
  if (validReagents.length === 0) return null;
  return validReagents[Math.floor(Math.random() * validReagents.length)];
}
