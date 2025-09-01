import { TextChannel } from 'discord.js';
import { client } from '~/index';

async function update() {}
async function post() {
  const CHANNEL_ID = process.env.BOT_CHANNEL_ID;

  if (!CHANNEL_ID) {
    console.error('BOT_CHANNEL_ID is not defined');
    return;
  }

  // Use showAllReligions to get embeds
  const { showAllReligions } = await import('~/commands/religion/showAllReligions');
  const embeds = await showAllReligions();

  if (!client.isReady()) {
    console.warn('Client is not ready yet. Delaying message send.');
    return;
  }

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel instanceof TextChannel) {
      // Discord allows up to 10 embeds per message
      for (let i = 0; i < embeds.length; i += 10) {
        await channel.send({ embeds: embeds.slice(i, i + 10) });
      }
    } else {
      console.log('Target channel is not a text channel or not found.');
    }
  } catch (error) {
    console.error('Failed to send religion update:', error);
  }
}

const order = 3;

export { update, post, order };
