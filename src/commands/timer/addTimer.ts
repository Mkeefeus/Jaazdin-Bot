import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Timer } from '~/db/models/Timer';
import { checkUserRole, formatNames } from '~/functions/helpers';
import { Roles } from '~/types/roles';

export const data = new SlashCommandBuilder()
  .setName('addtimer')
  .setDescription('will create a new timer')
  .addStringOption((option) => option.setName('name').setDescription('The name of the timer.').setRequired(true))
  .addIntegerOption((option) =>
    option.setName('weeks').setDescription('The amount of weeks before the timer ends').setRequired(true).setMinValue(1)
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
    option.setName('character').setDescription('The character associated with the timer').setRequired(true)
  )
  .addUserOption((option) =>
    option.setName('player').setDescription('The discord id of the player, leave blank if yourself').setRequired(false)
  );

const ICON_MAP: Record<string, string> = {
  'building': '🏗️',
  'plant': '🌱',
  'item': '📦',
  'other': '🔧',
};

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase();
  const weeks = interaction.options.getInteger('weeks');
  const type = interaction.options.getString('type');
  const discordId = (interaction.options.getUser('player') || interaction.user).id;
  const char = interaction.options.getString('character')?.toLowerCase();
  //todo check to see if timer name doesn't already exist.

  if (!name || !weeks || !type || !char) {
    console.log(name, weeks, type, char);
    return interaction.reply('Please provide all required fields.');
  }

  if (!(checkUserRole(interaction, Roles.GM) && interaction.user.id !== discordId)) {
    // If the user is not a GM, they can only set timers for themselves
    if (discordId !== interaction.user.id) {
      return interaction.reply('You can only set timers for yourself unless you are a GM.');
    }
  }

  await Timer.create({
    name: name,
    type: type,
    weeks_remaining: weeks,
    user: discordId,
    character: char,
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
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Timer successfully created!' },
      },
    ],
  });
}

export default {
  data,
  execute,
};
