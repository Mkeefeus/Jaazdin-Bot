import { Domain, Religion } from '~/db/models/Religion';
import { EmbedBuilder, TextChannel } from 'discord.js';
import { client } from '~/index';

async function update() {}
async function post() {
  const religions = await Religion.findAll({ order: [['follower_count', 'DESC']] });

  const embeds = [];
  const CHANNEL_ID = '1309206984196755506';

  for (let i = 0; i < religions.length; i++) {
    let message = `${religions[i].dataValues.name} has ${religions[i].dataValues.follower_count} followers.`;

    if (i == 0) {
      const domainData = await Domain.findOne({
        where: {
          id: religions[i].dataValues.domain_id,
        },
      });
      message += `\n\n**Dominant effect:** ` + domainData?.dataValues.dominant_effect;
    }
    // Create an embed for each religion
    const embed = new EmbedBuilder()
      .setTitle(religions[i].dataValues.name)
      .setDescription(message)
      .setColor(i === 0 ? '#FFD700' : '#00BFFF') // Gold for top, blue for others
      .setFooter({ text: `Rank #${i + 1}` });

    embeds.push(embed);
  }

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

export { update, post };
