import { ChatInputCommandInteraction, SlashCommandBuilder, AutocompleteInteraction } from 'discord.js';
import { Timer } from '~/db/models/Timer';
import { checkUserRole, formatNames } from '~/functions/helpers';
import { Roles } from '~/types/roles';

export const data = new SlashCommandBuilder()
  .setName('gmupdatetimer')
  .setDescription('Updates the remaining weeks on a timer')
  .addUserOption((option) =>
    option
      .setName('player')
      .setDescription('The discord user who owns the timer, leave blank if yourself')
      .setRequired(true)
  )
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
  const player = (interaction.options.get('player')?.value as string) || interaction.user.id;
  console.log(player);

  if (focusedOption.name === 'timer') {
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
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const timerId = interaction.options.getString('timer');
  const change = interaction.options.getString('change');
  const discordId = (interaction.options.getUser('player') || interaction.user).id;

  if (!timerId || change === null) {
    return interaction.reply('Please provide both the timer and the change in weeks.');
  }

  // Only GMs can update timers for others
  if (!checkUserRole(interaction, Roles.GM)) {
    if (discordId !== interaction.user.id) {
      return interaction.reply('This is a GM command. Use /updatetimer to update your own timers.');
    }
  }

  const timer = await Timer.findOne({
    where: {
      id: timerId,
      user: discordId,
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

export const help = {
  name: 'gmupdatetimer',
  description: "GM command to update any user's timer duration using +x, -x, or =x format",
  requiredRole: Roles.GM,
  category: 'timers',
};

export default {
  data,
  execute,
  autocomplete,
};
