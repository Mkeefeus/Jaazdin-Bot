import { ChatInputCommandInteraction, SlashCommandBuilder, AutocompleteInteraction } from 'discord.js';
import { Timer } from '~/db/models/Timer';
import { formatNames } from '~/functions/helpers';

export const data = new SlashCommandBuilder()
  .setName('updatetimer')
  .setDescription('Updates the remaining weeks on a timer')
  .addStringOption((option) =>
    option.setName('timer').setDescription('The name of the timer to update.').setRequired(true).setAutocomplete(true)
  )
  .addStringOption((option) =>
    option
      .setName('change')
      .setDescription('Number of weeks to add, subtract, or set equal to (+x, -x, =x)')
      .setRequired(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);
  const player = interaction.user.id;

  if (focusedOption.name !== 'timer') {
    return;
  }

  // Find all timers for the selected user
  const timers = await Timer.findAll({
    where: { user: player },
    limit: 25,
  });

  // Filter by what the user is typing
  const value = focusedOption.value?.toLowerCase() || '';
  const choices = timers
    .filter((t) => t.name.toLowerCase().includes(value) && t.id !== undefined)
    .map((t) => ({
      name: `${formatNames(t.name)} (${formatNames(t.character)}, ${t.weeks_remaining} weeks left)`,
      value: (t.id as number).toString(), // Ensure value is always defined
    }));
  await interaction.respond(choices);
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const timerId = interaction.options.getString('timer');
  const change = interaction.options.getString('change');
  const discordId = interaction.user.id;

  if (!timerId || change === null) {
    return interaction.reply('Please provide both the timer and the change in weeks.');
  }

  const timer = await Timer.findOne({
    where: {
      id: timerId,
      user: interaction.user.id,
    },
  });

  if (!timer) {
    return interaction.reply(`Failed to find timer.`);
  }

  const changeRegex = /^([+-=])(\d+)$/;
  const match = changeRegex.exec(change.toString());

  if (!match) {
    return interaction.reply('Invalid format for change. Use +x, -x, or =x.');
  }

  const operator = match[1];
  const value = parseInt(match[2], 10);

  if (operator === '+') {
    timer.weeks_remaining += value;
  } else if (operator === '-') {
    timer.weeks_remaining -= value;
  } else if (operator === '=') {
    timer.weeks_remaining = value;
  }
  await timer.save();

  await interaction.reply({
    embeds: [
      {
        title: '⏳ Timer Updated',
        color: 0xff9800,
        fields: [
          { name: 'Name', value: formatNames(timer.name), inline: true },
          { name: 'Character', value: formatNames(timer.character), inline: true },
          { name: 'Player', value: `<@${discordId}>`, inline: true },
          { name: 'Weeks Remaining', value: `🕒 ${timer.weeks_remaining} week(s)`, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Timer successfully updated!' },
      },
    ],
  });
}

export default {
  data,
  execute,
  autocomplete,
};
