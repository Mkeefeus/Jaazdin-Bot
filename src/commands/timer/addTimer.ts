import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Timer } from '~/db/models/Timer';
import { checkUserRole, formatNames } from '~/functions/helpers';
import { HelpData } from '~/types';
import { Roles } from '~/types';
import { TimerType } from '~/types';
import { TIMER_MAX_LENGTH } from '~/constants';

const NAME_MAX_LENGTH = 100;
const CHAR_MAX_LENGTH = 15;

export const data = new SlashCommandBuilder()
  .setName('addtimer')
  .setDescription('will create a new timer')
  .addStringOption((option) =>
    option.setName('name').setDescription('The name of the timer.').setRequired(true).setMaxLength(NAME_MAX_LENGTH)
  )
  .addIntegerOption((option) =>
    option.setName('weeks').setDescription('The amount of weeks before the timer ends (max 1 year)').setRequired(true).setMinValue(1).setMaxValue(TIMER_MAX_LENGTH)
  )
  .addStringOption((option) =>
    option
      .setName('type')
      .setDescription('The type of the timer.')
      .setRequired(true)
      .addChoices(
        { name: 'Building', value: 'building' },
        { name: 'Plant', value: 'plant' },
        { name: 'Item', value: 'item' },
        { name: 'Other', value: 'other' }
      )
  )
  .addStringOption((option) =>
    option
      .setName('character')
      .setDescription('The character associated with the timer')
      .setRequired(true)
      .setMaxLength(CHAR_MAX_LENGTH)
  )
  .addBooleanOption((option) =>
    option.setName('repeatable').setDescription('Whether the timer is repeatable').setRequired(false)
  )
  .addUserOption((option) =>
    option.setName('player').setDescription('(GM ONLY) The discord id of the player, leave blank if yourself').setRequired(false)
  );

const ICON_MAP: Record<string, string> = {
  building: '🏗️',
  plant: '🌱',
  item: '📦',
  other: '🔧',
};

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase();
  const weeks = interaction.options.getInteger('weeks');
  const type = interaction.options.getString('type')?.toLowerCase();
  const discordId = (interaction.options.getUser('player') || interaction.user).id;
  const char = interaction.options.getString('character')?.toLowerCase();
  const repeatable = interaction.options.getBoolean('repeatable') || false;
  //todo check to see if timer name doesn't already exist.

  if (!name || !weeks || !type || !char) {
    console.log(name, weeks, type, char);
    return interaction.reply('Please provide all required fields.');
  }

  if (!Object.values(TimerType).includes(type as TimerType)) {
    return interaction.reply('Invalid timer type provided.');
  }

  if (type == TimerType.complete) {
    return interaction.reply('You cannot create a timer of type "complete".');
  }

  if (!(checkUserRole(interaction, Roles.GM) && interaction.user.id !== discordId)) {
    // If the user is not a GM, they can only set timers for themselves
    if (discordId !== interaction.user.id) {
      return interaction.reply('You can only set timers for yourself unless you are a GM.');
    }
  }

  // Handle character limits
  if (name.length > NAME_MAX_LENGTH) {
    return interaction.reply(`Timer name must be ${NAME_MAX_LENGTH} characters or less.`);
  }
  if (char.length > CHAR_MAX_LENGTH) {
    return interaction.reply(`Character name must be ${CHAR_MAX_LENGTH} characters or less.`);
  }

  await Timer.create({
    name: name,
    type: type as TimerType,
    weeks_remaining: weeks,
    user: discordId,
    character: char,
    repeatable: repeatable,
    repeat_weeks: repeatable ? weeks : undefined,
  });

  await interaction.reply({
    embeds: [
      {
        title: '⏳ Timer Added',
        color: 0x4caf50,
        fields: [
          { name: 'Name', value: formatNames(name), inline: true },
          { name: 'Type', value: `${ICON_MAP[type]} ${formatNames(type)}`, inline: true },
          { name: 'Duration', value: `🕒 ${weeks} week(s)`, inline: true },
          { name: 'Character', value: formatNames(char), inline: true },
          { name: 'Player', value: `<@${discordId}>`, inline: true },
          { name: 'Repeatable', value: repeatable ? 'Yes' : 'No', inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Timer successfully created!' },
      },
    ],
  });
}

export const help: HelpData = {
  name: 'addtimer',
  description: 'Add a new timer for yourself or another user',
  category: 'timers',
};

export default {
  data,
  execute,
};
