import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Reagent } from '../../db/models/Reagent';
import {
  genericRarityAutocomplete,
  genericTypeAutocomplete,
  createItemEmbed,
  calculateSimpleItemPrice,
} from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';

//TODO gm command only.

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
    await genericRarityAutocomplete(interaction, '~/db/models/Reagent');
  } else if (focusedOption.name === 'creaturetype') {
    await genericTypeAutocomplete(interaction, '~/db/models/Reagent', 'type');
  }
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
  const creatureType = interaction.options.getString('creaturetype', true);

  const reagentChosen = await getRandomReagentByRarityAndType(rarity, creatureType);
  if (!reagentChosen) {
    await interaction.reply({
      content: `No reagents found for rarity "${rarity}" and creature type "${creatureType}".`,
      ephemeral: true,
    });
    return;
  }

  const price = calculateSimpleItemPrice(reagentChosen);

  const embed = createItemEmbed(
    `Random Reagent (${rarity.charAt(0).toUpperCase() + rarity.slice(1)}, ${creatureType.charAt(0).toUpperCase() + creatureType.slice(1)})`,
    reagentChosen.name,
    [{ name: 'Price', value: `${price} gp` }],
    0x16a085
  );

  await interaction.reply({ embeds: [embed] });
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
