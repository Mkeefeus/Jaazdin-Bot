import { ChatInputCommandInteraction, AutocompleteInteraction, MessageFlags } from 'discord.js';
import { Spell } from '~/db/models/Spell';
import { createItemEmbed } from '~/helpers';
import { CommandData } from '~/types';

const SPELL_SCHOOLS = [
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation',
];

const SCHOOL_LETTER_MAP: { [key: string]: string } = {
  A: 'Abjuration',
  C: 'Conjuration',
  D: 'Divination',
  E: 'Enchantment',
  V: 'Evocation',
  I: 'Illusion',
  N: 'Necromancy',
  T: 'Transmutation',
};

const SCHOOL_NAME_TO_LETTER: { [key: string]: string } = {
  Abjuration: 'A',
  Conjuration: 'C',
  Divination: 'D',
  Enchantment: 'E',
  Evocation: 'V',
  Illusion: 'I',
  Necromancy: 'N',
  Transmutation: 'T',
};

const commandData: CommandData = {
  name: 'randomspell',
  description: 'Generate a random spell by level and optionally by school',
  category: 'items',
  options: [
    {
      name: 'level',
      type: 'integer',
      description: 'Spell level (0-9)',
      required: true,
      minValue: 0,
      maxValue: 9,
    },
    {
      name: 'school',
      type: 'string',
      description: 'Spell school (optional)',
      autocomplete: true,
    },
  ],
};

async function execute(interaction: ChatInputCommandInteraction) {
  const level = interaction.options.getInteger('level', true);
  const school = interaction.options.getString('school');

  const whereClause: { level: number; school?: string } = { level };
  if (school) {
    // Convert school name to letter for database query
    const schoolLetter = SCHOOL_NAME_TO_LETTER[school];
    if (schoolLetter) {
      whereClause.school = schoolLetter;
    }
  }

  try {
    const spells = await Spell.findAll({ where: whereClause });

    if (spells.length === 0) {
      await interaction.reply({
        content: `No spells found for level ${level}${school ? ` in ${school} school` : ''}.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const randomSpell = spells[Math.floor(Math.random() * spells.length)];

    // Convert school letter back to full name for display
    const schoolName = SCHOOL_LETTER_MAP[randomSpell.school] || randomSpell.school;

    const embed = createItemEmbed(
      `Random Spell`,
      randomSpell.name,
      [
        { name: 'Level', value: randomSpell.level.toString() },
        { name: 'School', value: schoolName },
      ],
      0x9b59b6
    );

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    await interaction.reply({
      content: `Failed to generate random spell: ${error}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

// Autocomplete for spell schools
async function autocomplete(interaction: AutocompleteInteraction) {
  const focused = interaction.options.getFocused().toLowerCase();
  const filtered = SPELL_SCHOOLS.filter((school) => school.toLowerCase().startsWith(focused))
    .slice(0, 25)
    .map((school) => ({ name: school, value: school }));
  await interaction.respond(filtered);
}

export { execute, commandData, autocomplete };
