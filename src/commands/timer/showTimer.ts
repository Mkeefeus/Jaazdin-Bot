import { EmbedBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Timer } from '~/db/models/Timer';
import { buildCommand } from '~/functions/commandHelpers';
import { formatNames } from '~/functions/helpers';
import { SortedTimers, TimerType, typeColors, typeIcons } from '~/types';
import { CommandData } from '~/types';

const commandData: CommandData = {
  name: 'showtimers',
  description: 'Display active timers',
  category: 'timer',
  options: [
    {
      name: 'all',
      type: 'boolean',
      description: 'Show all timers or just your own',
    },
  ],
};

const data = buildCommand(commandData);

function sortTimersByTypeAndUser(timers: Timer[]): SortedTimers {
  const sorted: SortedTimers = {
    plant: {},
    building: {},
    item: {},
    other: {},
    complete: {},
  };

  for (const timer of timers) {
    if (timer.weeks_remaining <= 0) {
      sorted.complete[timer.user] = sorted.complete[timer.user] || [];
      sorted.complete[timer.user].push(timer.dataValues);
    } else {
      sorted[timer.type][timer.user] = sorted[timer.type][timer.user] || [];
      sorted[timer.type][timer.user].push(timer.dataValues);
    }
  }

  return sorted;
}

export function createTimerEmbed(sortedTimers: SortedTimers, showComplete: boolean): EmbedBuilder[] {
  const allEmbeds: EmbedBuilder[] = [];

  // Handle completed timers
  if (showComplete && sortedTimers.complete && Object.keys(sortedTimers.complete).length > 0) {
    // Group completed timers by type
    const completedTimersByType: { [key in TimerType]?: Timer['dataValues'][] } = {};

    for (const [userId, timers] of Object.entries(sortedTimers.complete)) {
      for (const timer of timers) {
        if (!completedTimersByType[timer.type]) {
          completedTimersByType[timer.type] = [];
        }
        completedTimersByType[timer.type]!.push({ ...timer, user: userId });
      }
    }

    // Create completed embeds with chunking
    for (const type of ['plant', 'building', 'item', 'other'] as TimerType[]) {
      const timers = completedTimersByType[type];
      if (timers && timers.length > 0) {
        // Split into chunks of 25 fields (Discord's limit)
        const chunks = [];
        for (let i = 0; i < timers.length; i += 25) {
          chunks.push(timers.slice(i, i + 25));
        }

        // Create multiple embeds if needed
        chunks.forEach((chunk, index) => {
          const embed = new EmbedBuilder()
            .setTitle(
              `${typeIcons[type]} Completed ${formatNames(type)}s${chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : ''}`
            )
            .setColor(typeColors[type])
            .setTimestamp()
            .addFields(
              chunk.map((timer) => ({
                name: `${formatNames(timer.character)}'s ${formatNames(timer.name)}`.slice(0, 256), // Limit field name
                value: `Player: <@${timer.user}>${timer.repeatable ? ' (Repeating)' : ''}`.slice(0, 1024), // Limit field value
                inline: true,
              }))
            );
          allEmbeds.push(embed);
        });
      }
    }
  }

  // Handle active timers (not complete) - FIXED VERSION
  for (const type of ['plant', 'building', 'item', 'other'] as TimerType[]) {
    const typeTimers = sortedTimers[type];
    if (typeTimers && Object.keys(typeTimers).length > 0) {
      const allTimersForType = [];

      for (const [userId, timers] of Object.entries(typeTimers)) {
        for (const timer of timers) {
          allTimersForType.push({ ...timer, user: userId });
        }
      }

      if (allTimersForType.length > 0) {
        // Split into chunks of 25 fields (Discord's limit)
        const chunks = [];
        for (let i = 0; i < allTimersForType.length; i += 25) {
          chunks.push(allTimersForType.slice(i, i + 25));
        }

        // Create multiple embeds if needed
        // Create multiple embeds if needed
        chunks.forEach((chunk, index) => {
          const embed = new EmbedBuilder()
            .setTitle(
              `${typeIcons[type]} Active ${formatNames(type)}s${chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : ''}`
            )
            .setColor(typeColors[type])
            .setTimestamp()
            .addFields(
              chunk.map((timer) => ({
                name: `${formatNames(timer.character)}'s ${formatNames(timer.name)}`.slice(0, 256), // Limit field name
                value: `Player: <@${timer.user}>\nWeeks remaining: ${timer.weeks_remaining}`.slice(0, 1024), // Limit field value
                inline: true,
              }))
            );
          allEmbeds.push(embed);
        });
      }
    }
  }
  return allEmbeds;
}

async function execute(interaction: ChatInputCommandInteraction) {
  const showAll = interaction.options.getBoolean('all') ?? false;
  const userId = interaction.user.id;

  // TODO: Implement timer retrieval logic
  // const timers = showAll ? getAllTimers() : getUserTimers(userId);

  const timers = await Timer.findAll({
    where: showAll ? {} : { user: userId },
  });

  const sortedTimers = sortTimersByTypeAndUser(timers);
  const embeds = createTimerEmbed(sortedTimers, false);
  if (embeds.length === 0) {
    return interaction.reply({ content: 'No timers found.', flags: MessageFlags.Ephemeral });
  }
  await interaction.reply({ embeds, flags: MessageFlags.Ephemeral });
}

export { data, execute, commandData, sortTimersByTypeAndUser };
