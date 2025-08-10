import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Reagent } from '../../db/models/Reagent';
import { createItemEmbed } from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';
import { randomInt } from 'crypto';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('generatereagent')
  .setDescription('Generate a random reagent by rarity and creature type')
  .addStringOption((option) =>
    option
      .setName('rarity')
      .setDescription('Rarity of the metal')
      .setRequired(true)
      .addChoices(
        { name: 'Common', value: 'Common' },
        { name: 'Uncommon', value: 'Uncommon' },
        { name: 'Rare', value: 'Rare' },
        { name: 'Very Rare', value: 'Very Rare' },
        { name: 'Legendary', value: 'Legendary' }
      )
  )
  .addStringOption((option) =>
    option
      .setName('creaturetype')
      .setDescription('Creature type of the pet')
      .setRequired(true)
      .setChoices([
        { name: 'Aberration', value: 'Aberration' },
        { name: 'Beast', value: 'Beast' },
        { name: 'Celestial', value: 'Celestial' },
        { name: 'Construct', value: 'Construct' },
        { name: 'Dragon', value: 'Dragon' },
        { name: 'Elemental', value: 'Elemental' },
        { name: 'Fey', value: 'Fey' },
        { name: 'Fiend', value: 'Fiend' },
        { name: 'Giant', value: 'Giant' },
        { name: 'Humanoid', value: 'Humanoid' },
        { name: 'Monstrosity', value: 'Monstrosity' },
        { name: 'Ooze', value: 'Ooze' },
        { name: 'Plant', value: 'Plant' },
        { name: 'Undead', value: 'Undead' },
      ])
  );

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

  const price = randomInt(reagentChosen.price_min, reagentChosen.price_max);

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

export const help = {
  name: 'generatereagent',
  description: 'Generate a random reagent by rarity and creature type',
  requiredRole: Roles.DM,
  category: 'items',
};
