import { Timer } from '~/db/models/Timer';
import { SortedTimers } from '~/types';
import { client } from '..';
import { TextChannel, MessageCreateOptions } from 'discord.js';
import { createTimerEmbed } from '~/commands/timer/showTimer';

const currTimers: SortedTimers = {
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
      if (timer.repeatable) {
        timer.id = undefined; // Reset ID for new instance
        Timer.create({
          name: timer.name,
          type: timer.type,
          user: timer.user,
          character: timer.character,
          repeatable: timer.repeatable,
          weeks_remaining: timer.repeat_weeks as number,
          repeat_weeks: timer.repeat_weeks as number,
        });
      }
    } else {
      currTimers[timer.type][timer.user] = currTimers[timer.type][timer.user] || [];
      currTimers[timer.type][timer.user].push(timer.dataValues);
    }
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
  const allEmbedMessages = createTimerEmbed(currTimers, true);
  const usersWithCompletedTimers = new Set<string>(); // Track users with completed timers

  // Handle completed timers
  if (currTimers.complete && Object.keys(currTimers.complete).length > 0) {
    // Add users with completed timers to the set
    for (const userId of Object.keys(currTimers.complete)) {
      usersWithCompletedTimers.add(userId);
    }
  }

  // Create ping message for users with completed timers
  let messageContent = '';
  if (usersWithCompletedTimers.size > 0 && process.env.NODE_ENV === 'production') {
    const userMentions = Array.from(usersWithCompletedTimers)
      .map((userId) => `<@${userId}>`)
      .join(' ');
    messageContent = `🎉 The following players have completed timers: ${userMentions}`;
  }

  // Send message with pings and embeds
  allEmbedMessages.forEach(async (embeds) => {
    if (embeds.length > 0) {
      for (let i = 0; i < embeds.length; i += 10) {
        const messageOptions: MessageCreateOptions = { embeds: embeds.slice(i, i + 10) };

        // Add the ping message to the first batch of embeds
        if (i === 0 && messageContent) {
          messageOptions.content = messageContent;
        }

        // await channel.send(messageOptions);
      }
    } else if (messageContent) {
      // Send just the ping message if there are no embeds
      await channel.send({ content: messageContent });
    }
  });
}

const order = 1;

export { update, post, order };
