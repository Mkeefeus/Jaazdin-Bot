import { Timer } from '~/db/models/Timer';
import { TimerType } from '~/types/timertype';
import { client } from '..';
import { TextChannel, MessageCreateOptions } from 'discord.js';
import { formatNames } from '~/functions/helpers';

type TimerUserMap = {
  [userId: string]: Timer['dataValues'][];
};
type CurrTimers = {
  [key in TimerType]: TimerUserMap;
};

const currTimers: CurrTimers = {
  building: {},
  plant: {},
  item: {},
  other: {},
  complete: {},
};

async function update() {
  currTimers.complete = {};
  currTimers.building = {};
  currTimers.plant = {};
  currTimers.item = {};
  currTimers.other = {};
  await Timer.destroy({
    where: {
      weeks_remaining: 0,
    },
  });
  const timers: Timer[] = await Timer.findAll({
    order: ['user', 'character', 'weeks_remaining'],
  });
  for (const timer of timers) {
    timer.weeks_remaining -= 1;
    if (timer.weeks_remaining <= 0) {
      currTimers.complete[timer.user] = currTimers.complete[timer.user] || [];
      currTimers.complete[timer.user].push(timer.dataValues);
      continue;
    }
    currTimers[timer.type][timer.user] = currTimers[timer.type][timer.user] || [];
    currTimers[timer.type][timer.user].push(timer.dataValues);
    await timer.save();
  }
}
async function post() {
  const CHANNEL_ID = process.env.BOT_CHANNEL_ID;
  if (!CHANNEL_ID) {
    console.error('BOT_CHANNEL_ID is not defined');
    return;
  }

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!(channel instanceof TextChannel)) {
    console.log('Target channel is not a text channel or not found.');
    return;
  }

  const typeIcons: { [key in TimerType]: string } = {
    plant: '🌱',
    building: '🏗️',
    item: '📦',
    other: '🔧',
    complete: '✅',
  };

  const typeColors: { [key in TimerType]: number } = {
    plant: 0x4caf50, // Green
    building: 0x795548, // Brown
    item: 0x2196f3, // Blue
    other: 0x9e9e9e, // Gray
    complete: 0x00ff00,
  };

  interface EmbedField {
    name: string;
    value: string;
    inline: boolean;
  }

  interface Embed {
    title: string;
    fields: EmbedField[];
    color: number;
    timestamp: string;
  }

  const allEmbeds: Embed[] = [];
  const usersWithCompletedTimers = new Set<string>(); // Track users with completed timers

  // Handle completed timers
  if (currTimers.complete && Object.keys(currTimers.complete).length > 0) {
    // Add users with completed timers to the set
    for (const userId of Object.keys(currTimers.complete)) {
      usersWithCompletedTimers.add(userId);
    }

    // Group completed timers by type
    const completedTimersByType: { [key in TimerType]?: Timer['dataValues'][] } = {};

    for (const [userId, timers] of Object.entries(currTimers.complete)) {
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
          const embed = {
            title: `${typeIcons[type]} Completed ${formatNames(type)}s${chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : ''}`,
            fields: chunk.map((timer) => ({
              name: `${formatNames(timer.character)}'s ${formatNames(timer.name)}`.slice(0, 256), // Limit field name
              value: `Player: <@${timer.user}>`.slice(0, 1024), // Limit field value
              inline: true,
            })),
            color: typeColors[type],
            timestamp: new Date().toISOString(),
          };
          allEmbeds.push(embed);
        });
      }
    }
  }

  // Handle active timers (not complete) - FIXED VERSION
  for (const type of ['plant', 'building', 'item', 'other'] as TimerType[]) {
    const typeTimers = currTimers[type];
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
        chunks.forEach((chunk, index) => {
          const embed = {
            title: `${typeIcons[type]} Active ${formatNames(type)}s${chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : ''}`,
            fields: chunk.map((timer) => ({
              name: `${formatNames(timer.character)}'s ${formatNames(timer.name)}`.slice(0, 256), // Limit field name
              value: `Player: <@${timer.user}>\nWeeks remaining: ${timer.weeks_remaining}`.slice(0, 1024), // Limit field value
              inline: true,
            })),
            color: typeColors[type],
            timestamp: new Date().toISOString(),
          };
          allEmbeds.push(embed);
        });
      }
    }
  }

  // Create ping message for users with completed timers
  let messageContent = '';
  if (usersWithCompletedTimers.size > 0) {
    const userMentions = Array.from(usersWithCompletedTimers)
      .map((userId) => `<@${userId}>`)
      .join(' ');
    messageContent = `🎉 The following players have completed timers: ${userMentions}`;
  }

  // Send message with pings and embeds
  if (allEmbeds.length > 0) {
    for (let i = 0; i < allEmbeds.length; i += 10) {
      const messageOptions: MessageCreateOptions = { embeds: allEmbeds.slice(i, i + 10) };

      // Add the ping message to the first batch of embeds
      if (i === 0 && messageContent) {
        messageOptions.content = messageContent;
      }

      await channel.send(messageOptions);
    }
  } else if (messageContent) {
    // Send just the ping message if there are no embeds
    await channel.send({ content: messageContent });
  }
}

export { update, post };
