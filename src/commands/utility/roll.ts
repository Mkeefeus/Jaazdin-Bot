import { randomInt } from 'crypto';
import { ChatInputCommandInteraction, MessageFlags, userMention } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { checkUserRole } from '~/functions/helpers';
import { buildCommand } from '~/functions/commandHelpers';
import { CommandData } from '~/types/command';
import { HelpData } from '~/types';
import { Roles } from '~/types';

type RollFormula = {
  limiter?: number;
  operator?: '<' | '>' | '=' | '<=' | '>=';
  number: number;
};

const rollOptionDefinitions = {
  r: { key: 'reroll', type: 'formula' },
  rr: { key: 'recursiveReroll', type: 'formula' },
  x: { key: 'explode', type: 'formula' },
  xo: { key: 'explodeOnce', type: 'formula' },
  k: { key: 'keepHighest', type: 'number' },
  kh: { key: 'keepHighest', type: 'number' },
  kl: { key: 'keepLowest', type: 'number' },
  d: { key: 'dropLowest', type: 'number' },
  dl: { key: 'dropLowest', type: 'number' },
  dh: { key: 'dropHighest', type: 'number' },
  min: { key: 'replaceWithMinimum', type: 'number' },
  max: { key: 'replaceWithMaximum', type: 'number' },
  // maybe later
  // cs: { key: 'countSuccesses', type: 'formula' },
  // cf: { key: 'countFailures', type: 'number' },
  // even: { key: 'countEvens', type: 'boolean' },
  // odd: { key: 'countOdds', type: 'boolean' },
  // df: { key: 'deductFailures', type: 'formula' },
  // sf: { key: 'subtractFailures', type: 'boolean' },
  // ms: { key: 'marginOfSuccess', type: 'number' },
} as const;

type RollOptions = {
  reroll?: RollFormula;
  recursiveReroll?: RollFormula;
  explode?: RollFormula;
  explodeOnce?: RollFormula;
  keepHighest?: number;
  keepLowest?: number;
  dropLowest?: number;
  dropHighest?: number;
  replaceWithMinimum?: number;
  replaceWithMaximum?: number;
  // maybe later
  // countSuccesses?: RollFormula;
  // countFailures?: number;
  // countEvens?: boolean;
  // countOdds?: boolean;
  // deductFailures?: RollFormula;
  // subtractFailures?: boolean;
  // marginOfSuccess?: number;
};

type RollData = {
  dieCount: number;
  dieType: number;
  dieModifiers?: number | number[];
  rollOptions?: RollOptions;
};

type Roll = {
  value: number;
  ref?: number;
  // rerolled?: boolean;
  rerolled?: number;
  replaced?: number;
  exploded?: boolean;
  dropped?: boolean;
  stringIgnore?: boolean;
  // success?: boolean;
};

const commandData: CommandData = {
  name: 'roll',
  description: 'Rolls a dice formula',
  category: 'utility',
  options: [
    {
      name: 'formula',
      description: 'The formula to roll. Check foundry roll docs for information',
      type: 'string',
      required: true,
    },
  ],
};

const data = buildCommand(commandData);

function parseRollOptions(modifiers: string): RollOptions {
  const validPatterns = Object.keys(rollOptionDefinitions)
    .sort((a, b) => b.length - a.length)
    .map((pattern) => pattern.replace(/[+\\-]/g, '\\$&'));

  const optionRegex = new RegExp(`(${validPatterns.join('|')})(\\d+)?((?:<=|>=|[<>=+]))?(\\d+)?`, 'g');
  const rollOptions: RollOptions = {};

  let match;
  while ((match = optionRegex.exec(modifiers)) !== null) {
    const pattern = match[1];
    const definition = rollOptionDefinitions[pattern as keyof typeof rollOptionDefinitions];

    if (!definition) continue;
    const operator = match[3] || '';
    const limiter = match[4] ? Number(match[2]) : undefined;
    const number = Number(match[4]) || Number(match[2]) || undefined;

    if (number && (isNaN(number) || number < 1)) {
      throw new Error(`Invalid number value for option ${definition.key}`);
    }

    if (limiter && (isNaN(limiter) || limiter < 1)) {
      throw new Error(`Invalid limiter value for option ${definition.key}`);
    }

    switch (definition.type) {
      case 'number': {
        rollOptions[definition.key] = number || -1;
        break;
      }
      case 'formula': {
        rollOptions[definition.key] = {
          limiter: limiter ? Number(limiter) : undefined,
          operator,
          number: Number(number),
        } as RollFormula;
        break;
      }
      // No booleans at the moment, maybe later
      // case 'boolean': {
      //   rollOptions[definition.key] = true;
      //   break;
      // }
    }
  }

  return rollOptions;
}

function parseFormula(formula: string): RollData | undefined {
  const match = formula.match(/^(\d+d\d+)(.*)$/);
  if (!match) {
    throw new Error('Invalid formula');
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
  try {
    parsedRoll.rollOptions = parseRollOptions(options);
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    }
    throw new Error(`Error parsing roll options: ${message}`);
  }
  return parsedRoll;
}

function generateRandomInt(max: number): number {
  if (max <= 1) {
    throw new Error('Maximum value must be greater than 1.');
  }
  if (max > Math.pow(2, 48)) {
    throw new Error('Maximum value too large.');
  }
  return randomInt(1, max + 1);
}

function rollFormulaHandler(
  rolls: Roll[],
  dieType: number,
  formula: RollFormula,
  onConditionMet: (roll: Roll, index: number) => void,
  propertyToCheck?: keyof Roll,
  recursive?: boolean,
  recurseLimit?: number
): Roll[] {
  const { number, operator } = formula;
  let recurse = false;

  rolls.forEach((roll, index) => {
    if (propertyToCheck && roll[propertyToCheck]) return;

    let conditionMet = false;
    switch (operator) {
      case '<':
        conditionMet = roll.value < number;
        break;
      case '>':
        conditionMet = roll.value > number;
        break;
      case '=':
        conditionMet = roll.value === number;
        break;
      case '<=':
        conditionMet = roll.value <= number;
        break;
      case '>=':
        conditionMet = roll.value >= number;
        break;
      default:
        if (operator) {
          throw new Error(`Invalid operator ${operator}`);
        }
    }

    if (operator ? conditionMet : roll.value === number) {
      onConditionMet(roll, index);
      recurse = true;
    }
  });

  if (recurse && recursive && (!recurseLimit || recurseLimit > 0)) {
    recurseLimit = recurseLimit ? recurseLimit - 1 : undefined;
    return rollFormulaHandler(rolls, dieType, formula, onConditionMet, propertyToCheck, true, recurseLimit);
  }

  return rolls;
}

function executeRoll(rollData: RollData): Roll[] {
  let rolls: Roll[] = [];
  for (let i = 0; i < rollData.dieCount; i++) {
    try {
      rolls.push({ value: generateRandomInt(rollData.dieType) });
    } catch (error) {
      let message = 'Unknown error';
      if (error instanceof Error) {
        message = error.message;
      }
      throw new Error('Error generating random number. Error: ' + message);
    }
  }
  const rollOptions = rollData.rollOptions;
  if (!rollOptions) {
    const total = rolls.reduce((sum, roll) => sum + roll.value, 0);
    const modifier = Array.isArray(rollData.dieModifiers)
      ? rollData.dieModifiers.reduce((sum, mod) => sum + mod, 0)
      : rollData.dieModifiers || 0;
    return [{ value: total + modifier }];
  }
  if (rollOptions.reroll || rollOptions.recursiveReroll) {
    const rerollData = (rollOptions.reroll || rollOptions.recursiveReroll) as RollFormula;
    rolls = rollFormulaHandler(
      rolls,
      rollData.dieType,
      rerollData,
      (roll) => {
        roll.rerolled = rolls.push({ value: generateRandomInt(rollData.dieType) }) - 1;
        console.log(roll.rerolled);
      },
      'rerolled',
      !!rollOptions.recursiveReroll
    );
  }
  if (rollOptions.explode || rollOptions.explodeOnce) {
    const explodeData = (rollOptions.explode || rollOptions.explodeOnce) as RollFormula;
    const recursive = !rollOptions.explodeOnce && explodeData.number > 1 && !explodeData.operator;
    rolls = rollFormulaHandler(
      rolls,
      rollData.dieType,
      explodeData,
      (roll) => {
        roll.exploded = true;
        rolls.push({ value: generateRandomInt(rollData.dieType) });
      },
      'exploded',
      recursive
    );
  }
  if (
    (rollOptions.replaceWithMinimum && rollOptions.replaceWithMinimum !== -1) ||
    (rollOptions.replaceWithMaximum && rollOptions.replaceWithMaximum !== -1)
  ) {
    rolls.forEach((roll) => {
      if (roll.value > rollOptions.replaceWithMaximum!) {
        roll.replaced = rollOptions.replaceWithMaximum;
      } else if (roll.value < rollOptions.replaceWithMinimum!) {
        roll.replaced = rollOptions.replaceWithMinimum;
      }
    });
  }

  if (rollOptions.keepHighest || rollOptions.keepLowest || rollOptions.dropLowest || rollOptions.dropHighest) {
    const sortedRolls = rolls
      .map((roll, index) => {
        return { index, value: roll.value };
      })
      .sort((a, b) => a.value - b.value);
    let start, end: number | undefined;
    if (rollOptions.keepHighest) {
      start = 0;
      end = -(rollOptions.keepHighest === -1 ? 1 : rollOptions.keepHighest);
    } else if (rollOptions.keepLowest) {
      start = rollOptions.keepLowest === -1 ? 1 : rollOptions.keepLowest;
    } else if (rollOptions.dropLowest) {
      start = 0;
      end = rollOptions.dropLowest === -1 ? 1 : rollOptions.dropLowest;
    } else if (rollOptions.dropHighest) {
      start = -(rollOptions.dropHighest === -1 ? 1 : -rollOptions.dropHighest);
    }
    const keptIndices = new Set(sortedRolls.slice(start, end).map((roll) => roll.index));
    for (const index of keptIndices) {
      rolls[index].dropped = true;
    }
  }
  return rolls;
}

function formatRolls(rolls: Roll[], formula: string, modifier?: number | number[]): string {
  let resultsString = '';
  rolls.forEach((roll) => {
    /*
      a roll can be all of these things, process them in this order.
      dropping is the last thing to happen to give a roll the best chance of surviving
      italics for reroll, ! for explode, -> for replaced, strikethrough for dropped, bold final results
      likely need another function I can call recursively to move down the chain of rolls. Something like...
      function getRollString(roll: Roll): string {
        if (roll.rerolled) {
        }
        if (roll.exploded) {
        }
        if (roll.replaced) {
        }
        if (roll.dropped) {
        }        
      }
      If I need to make a linked list for this I'm going to kill someone
    */
    let rollString = '';
    if (roll.stringIgnore) return '';
    if (roll.rerolled) {
      let nextRoll: Roll | undefined = rolls[roll.rerolled];
      rollString += `~~${roll.value}~~ `;
      while (nextRoll) {
        nextRoll.stringIgnore = true;
        const value = nextRoll.value;
        if (nextRoll.rerolled) {
          nextRoll = rolls[nextRoll.rerolled];
        } else {
          nextRoll = undefined;
        }
        if (nextRoll) {
          rollString += `~~${nextRoll.value}~~ `;
        } else {
          rollString += `**${value}**`;
        }
      }
    }
    if (roll.exploded) {
      rollString += `**${roll.value}!**`;
    }
    if (roll.replaced) {
      rollString += `**${roll.replaced}**`;
    }
    if (roll.dropped) {
      rollString += `~~${roll.value}~~`;
    }
    if (rollString === '') {
      rollString += roll.value;
    }
    resultsString += `${rollString}, `;
  });
  resultsString = resultsString.slice(0, -2);
  let modifierString = '';
  if (modifier) {
    if (typeof modifier === 'number') {
      modifier = [modifier];
    }
    modifierString = modifier
      .map((mod) => {
        return `${mod > 0 ? '+' : ''}${mod}`;
      })
      .join('');
  }
  return `**Formula**: ${formula}\n**Results**: (${resultsString})${modifierString}\n`;
}

async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, Roles.BOT_DEV)) {
    // Admin-specific logic
    interaction.reply({
      content: 'This command is WIP, check back later',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const formula = interaction.options.getString('formula')?.toLowerCase();
  if (!formula) {
    await interaction.reply('Please provide a formula to roll');
    return;
  }
  await interaction.deferReply();
  await interaction.editReply('Rolling...');
  let rollData: RollData | undefined;
  try {
    rollData = parseFormula(formula);
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    }
    await interaction.editReply(`Error parsing formula: ${message}`);
    return;
  }
  if (!rollData) {
    await interaction.editReply('Invalid formula');
    return;
  }
  let rolls: Roll[];
  try {
    rolls = executeRoll(rollData);
    console.log(rolls);
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    }
    await interaction.editReply(`Error executing roll: ${message}`);
    return;
  }
  const embed = new EmbedBuilder()
    .setTitle('Roll Result')
    // .setDescription(`\`\`\`json\n${JSON.stringify(rollData, null, 2)}\n\`\`\``)
    .setDescription(formatRolls(rolls, formula, rollData.dieModifiers))
    .setColor(0x00ae86);

  await interaction.editReply({ content: userMention(interaction.user.id), embeds: [embed] });
}

const help: HelpData = {
  name: 'roll',
  description: 'Roll dice with advanced modifiers and options',
  requiredRole: Roles.BOT_DEV,
  category: 'utility',
};

export { commandData, data, execute, help };
