import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Pet } from '../../db/models/Pet';
import { Op } from 'sequelize';

// Rarity boundaries by CR
const RARITY_BOUNDS = [
  { name: 'Common', min: 0, max: 1 },
  { name: 'Uncommon', min: 2, max: 5 },
  { name: 'Rare', min: 6, max: 8 },
  { name: 'Very Rare', min: 9, max: 11 },
  { name: 'Legendary', min: 12, max: 13 },
];

function getPetRarity(cr: number): string {
  for (const bound of RARITY_BOUNDS) {
    if (cr >= bound.min && cr <= bound.max) return bound.name;
  }
  return 'Unknown';
}

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
    const pets = await Pet.findAll({ attributes: ['type'] });
    const uniqueTypes = Array.from(new Set(pets.map((p) => p.type)));
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

  const petChosen = await getRandomPetByRarityAndType(rarity, creatureType);
  if (!petChosen) {
    await interaction.reply({
      content: `No pets found for rarity "${rarity}" and creature type "${creatureType}".`,
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    embeds: [
      {
        title: `Random Pet (${rarity}, ${creatureType.charAt(0).toUpperCase() + creatureType.slice(1)})`,
        description: `**Pet:** ${petChosen.name}\n**CR:** ${petChosen.cr}\n**Rarity:** ${getPetRarity(petChosen.cr)}\n**Creature Type:** ${petChosen.type}`,
        color: 0x3498db,
      },
    ],
  });
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

  console.log(validPets);

  if (validPets.length === 0) return null;
  return validPets[Math.floor(Math.random() * validPets.length)];
}
