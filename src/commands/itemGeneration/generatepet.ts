import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Pet } from '../../db/models/Pet';
import { Op } from 'sequelize';
import { createItemEmbed, genericTypeAutocomplete, calculateSimpleItemPrice } from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';

//TODO gm command only.

// Rarity boundaries by CR
const RARITY_BOUNDS = [
  { name: 'Common', min: 0, max: 1 },
  { name: 'Uncommon', min: 2, max: 5 },
  { name: 'Rare', min: 6, max: 8 },
  { name: 'Very Rare', min: 9, max: 11 },
  { name: 'Legendary', min: 12, max: 13 },
];

export const data = new SlashCommandBuilder()
  .setName('generatepet')
  .setDescription('Generate a random pet by rarity and creature type')
  .addStringOption((option) =>
    option.setName('rarity').setDescription('Rarity of the pet').setRequired(true).setAutocomplete(true)
  )
  .addStringOption((option) =>
    option.setName('creaturetype').setDescription('Creature type of the pet').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);

  if (focusedOption.name === 'rarity') {
    // Static rarity list based on CR boundaries
    const focused = focusedOption.value.toLowerCase();
    const filtered = RARITY_BOUNDS.map((r) => ({ name: r.name, value: r.name })).filter((r) =>
      r.name.toLowerCase().startsWith(focused)
    );
    await interaction.respond(filtered);
  } else if (focusedOption.name === 'creaturetype') {
    await genericTypeAutocomplete(interaction, '~/db/models/Pet');
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

  const pet = await getRandomPetByRarityAndType(rarity, creatureType);
  if (!pet) {
    await interaction.reply({
      content: `No pets found for rarity "${rarity}" and creature type "${creatureType}".`,
      ephemeral: true,
    });
    return;
  }

  const price = calculateSimpleItemPrice(pet);

  const embed = createItemEmbed(
    `Random Pet (${rarity}, ${creatureType.charAt(0).toUpperCase() + creatureType.slice(1)})`,
    pet.name,
    [
      { name: 'CR', value: pet.cr.toString() },
      { name: 'Creature Type', value: pet.type },
      { name: 'Price', value: `${price} gp` },
    ],
    0x3498db
  );

  await interaction.reply({ embeds: [embed] });
}

// Utility function for use in other scripts
export async function getRandomPetByRarityAndType(rarity: string, creatureType: string) {
  const bounds = RARITY_BOUNDS.find((r) => r.name.toLowerCase() === rarity.toLowerCase());
  if (!bounds) return null;

  const validPets = await Pet.findAll({
    where: {
      type: creatureType,
      cr: { [Op.gte]: bounds.min, [Op.lte]: bounds.max },
    },
  });

  if (validPets.length === 0) return null;
  return validPets[Math.floor(Math.random() * validPets.length)];
}

export const help = {
  name: 'generatepet',
  description: 'Generate a random pet by rarity and creature type',
  requiredRole: Roles.DM,
  category: 'items',
};
