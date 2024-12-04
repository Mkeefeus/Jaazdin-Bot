import { ChatInputCommandInteraction, SlashCommandBuilder, userMention } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

const rollOptionDefinitions = {
  r: { key: 'reroll', type: 'string' },
  rr: { key: 'recursiveReroll', type: 'string' },
  x: { key: 'explode', type: 'string' },
  xo: { key: 'explodeOnce', type: 'string' },
  k: { key: 'keepHighest', type: 'number' },
  kh: { key: 'keepHighest', type: 'number' },
  kl: { key: 'keepLowest', type: 'number' },
  dl: { key: 'dropLowest', type: 'number' },
  dh: { key: 'dropHighest', type: 'number' },
  min: { key: 'replaceWithMinimum', type: 'number' },
  max: { key: 'replaceWithMaximum', type: 'number' },
  cs: { key: 'countSuccesses', type: 'string' },
  cf: { key: 'countFailures', type: 'number' },
  even: { key: 'countEvens', type: 'boolean' },
  odd: { key: 'countOdds', type: 'boolean' },
  df: { key: 'deductFailures', type: 'string' },
  sf: { key: 'subtractFailures', type: 'boolean' },
  ms: { key: 'marginOfSuccess', type: 'number' },
} as const;

type RollOptions = {
  [K in (typeof rollOptionDefinitions)[keyof typeof rollOptionDefinitions]['key']]?: (typeof rollOptionDefinitions)[keyof typeof rollOptionDefinitions]['type'] extends 'number'
    ? number
    : (typeof rollOptionDefinitions)[keyof typeof rollOptionDefinitions]['type'] extends 'string'
      ? string
      : (typeof rollOptionDefinitions)[keyof typeof rollOptionDefinitions]['type'] extends 'boolean'
        ? boolean
        : never;
} & Record<never, never>;

type RollData = {
  dieCount: number;
  dieType: number;
  dieModifiers?: number | number[];
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

function parseRollOptions(modifiers: string): RollOptions {
  const validPatterns = Object.keys(rollOptionDefinitions)
    .sort((a, b) => b.length - a.length)
    .map((pattern) => pattern.replace(/[+\\-]/g, '\\$&'));

  const optionRegex = new RegExp(`(${validPatterns.join('|')})([<>=+-]?)(\\d+)?`, 'g');
  const rollOptions = {} as RollOptions;

  let match;
  while ((match = optionRegex.exec(modifiers)) !== null) {
    const pattern = match[1];
    const definition = rollOptionDefinitions[pattern as keyof typeof rollOptionDefinitions];

    if (!definition) continue;

    const operator = match[2] || '';
    const numberStr = match[3] || '';

    switch (definition.type) {
      case 'number': {
        const numberValue = numberStr ? Number(numberStr) : 1;
        (rollOptions[definition.key as keyof RollOptions] as number) = numberValue;
        break;
      }
      case 'string': {
        const stringValue = operator + numberStr || 'true';
        (rollOptions[definition.key as keyof RollOptions] as string) = stringValue;
        break;
      }
      case 'boolean': {
        (rollOptions[definition.key as keyof RollOptions] as boolean) = true;
        break;
      }
    }
  }

  return rollOptions;
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
  // Extract +/- modifier
  const regex = /([+-]\d+)/g;
  const matches = modifiers.match(regex) || [];
  if (matches.length > 1) {
    parsedRoll.dieModifiers = matches.map(Number);
  } else if (matches.length === 1) {
    parsedRoll.dieModifiers = Number(matches[0]);
  }
  // cleanup options string
  const options = modifiers.replace(regex, '').replace(/\s/g, '').trim();
  parsedRoll.rollOptions = parseRollOptions(options);
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
    .setColor(0x00ae86);

  await interaction.editReply({ content: userMention(interaction.user.id), embeds: [embed] });
}
