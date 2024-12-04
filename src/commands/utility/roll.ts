import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

type RollOptions = {
  dieModifier?: number;
  reroll?: string;
  recursiveReroll?: string;
  explode?: boolean;
  explodeCount?: number;
  keepHighest?: number;
  keepLowest?: number;
  dropHighest?: number;
  dropLowest?: number;
  replaceWithMinimum?: number;
  replaceWithMaximum?: number;
  countSuccesses?: string;
  countEvens?: boolean;
  countOdds?: boolean;
  countFailures?: number;
  deductFailures?: string;
  subtractFailures?: boolean;
  marginOfSuccess?: number;
  message?: string;
};

type RollData = {
  dieCount: number;
  dieType: number;
  rollOptions?: RollOptions;
};

export const data = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('Rolls a dice formula')
  .addStringOption((option) =>
    option
      .setName('formula')
      .setDescription('The formula to roll. Check foundry roll docs for information')
      .setRequired(true)
  );

type ValidOptions =
  | '+'
  | '-'
  | 'r'
  | 'rr'
  | 'x'
  | 'xo'
  | 'k'
  | 'kh'
  | 'kl'
  | 'dl'
  | 'dh'
  | 'min'
  | 'max'
  | 'cs'
  | 'cf'
  | 'even'
  | 'odd'
  | 'df'
  | 'sf'
  | 'ms';

const charToOption: { [key in ValidOptions]: keyof RollOptions } = {
  '+': 'dieModifier',
  '-': 'dieModifier',
  r: 'reroll',
  rr: 'recursiveReroll',
  x: 'explode',
  xo: 'explodeCount',
  k: 'keepHighest',
  kh: 'keepHighest',
  kl: 'keepLowest',
  dl: 'dropLowest',
  dh: 'dropHighest',
  min: 'replaceWithMinimum',
  max: 'replaceWithMaximum',
  cs: 'countSuccesses',
  cf: 'countFailures',
  even: 'countEvens',
  odd: 'countOdds',
  df: 'deductFailures',
  sf: 'subtractFailures',
  ms: 'marginOfSuccess',
};

function separateOptions(modifiers: string): { pattern: string; operator: string; number: string }[] {
  // Sort validPatterns so longer patterns come first (e.g., "kh" before "k")
  const validPatterns = Object.keys(charToOption)
    .sort((a, b) => b.length - a.length) // Sort by length, descending
    .map((pattern) => pattern.replace(/[+\\-]/g, '\\$&'));

  const optionRegex = new RegExp(`(${validPatterns.join('|')})([<>=+-]?)(\\d+)?`, 'g');

  const matches: { pattern: string; operator: string; number: string }[] = [];
  let match;

  while ((match = optionRegex.exec(modifiers)) !== null) {
    matches.push({
      pattern: match[1] || '', // The matched pattern
      operator: match[2] || '', // The operator (<, >, =, +, or -)
      number: match[3] || '', // The numeric part
    });
  }

  return matches;
}

function isValidOption(option: string): option is ValidOptions {
  return option in charToOption;
}
function parseRollData(options: { pattern: string; operator: string; number: string }[]): RollOptions | undefined {
  const rollData: RollOptions = {};
  for (const option of options) {
    // maybe switch this for a switch statement. Its kinda dirty but I think it will be easier when we go to execute the roll
    // type safety here is screwed, figure out a way to fix it
    if (!isValidOption(option.pattern)) {
      throw new Error('Invalid option');
    }
    switch (option.pattern) {
      case '+':
        if (!option.number) {
          throw new Error('Invalid option, number not found for dieModifier');
        }
        rollData['dieModifier'] = Number(option.number);
        break;
      case '-':
        if (!option.number) {
          throw new Error('Invalid option, number not found for dieModifier');
        }
        rollData['dieModifier'] = Number(option.number);
        break;
      // etc
    }
  }
  return rollData;
}

function parseFormula(formula: string): RollData | undefined {
  const match = formula.match(/^(\d+d\d+)(.*)$/);
  if (!match) {
    console.error('Invalid formula format');
    return;
  }
  const [_, dieRoll, modifiers] = match;
  const [dieCount, dieType] = dieRoll.split('d').map(Number);
  const parsedRoll: RollData = {
    dieCount,
    dieType,
  };
  const splitModifiers = separateOptions(modifiers);
  console.log(splitModifiers);
  parsedRoll.rollOptions = parseRollData(splitModifiers);
  return parsedRoll;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const formula = interaction.options.getString('formula')?.toLowerCase();
  if (!formula) {
    await interaction.reply('Please provide a formula to roll');
    return;
  }
  await interaction.deferReply();
  await interaction.editReply('Rolling...');
  const rollData = parseFormula(formula);
  if (!rollData) {
    await interaction.editReply('Invalid formula');
    return;
  }
  console.log(rollData);
  const embed = new EmbedBuilder()
    .setTitle('Roll Result')
    .setDescription(`\`\`\`json\n${JSON.stringify(rollData, null, 2)}\n\`\`\``)
    .setColor(0x00AE86);

  await interaction.editReply({ embeds: [embed] });
}
