import { Domain, Religion } from '~/db/models/Religion';
import { EmbedBuilder, TextChannel } from 'discord.js';
import { client } from '~/index';

async function update() {}
async function post() {
  const religions = await Religion.findAll({ order: [['follower_count', 'DESC']] });

  const embeds = [];
  const CHANNEL_ID = process.env.BOT_CHANNEL_ID;

  if (!CHANNEL_ID) {
    console.error('BOT_CHANNEL_ID is not defined');
    return;
  }

  if (religions.length === 0) {
    embeds.push(
      new EmbedBuilder().setTitle('Religion Rankings').setDescription('No religions found.').setColor('#FFD700')
    );
  } else {
    // Dominant religion gets its own detailed embed
    const dominantReligion = religions[0];
    const domainData = await Domain.findOne({
      where: {
        id: dominantReligion.dataValues.domain_id,
      },
    });

    const dominantEmbed = new EmbedBuilder()
      .setTitle(`👑 Dominant Religion: ${dominantReligion.dataValues.name}`)
      .setDescription(
        `**Followers:** ${dominantReligion.dataValues.follower_count}\n\n` +
          `**Dominant Effect:** ${domainData?.dataValues.dominant_effect || 'None'}`
      )
      .setColor('#FFD700');

    embeds.push(dominantEmbed);

    // Other religions in a simple list
    if (religions.length > 1) {
      const otherReligions = religions.slice(1);
      const religionList = otherReligions
        .map((religion) => `**${religion.dataValues.name}** - ${religion.dataValues.follower_count} followers`)
        .join('\n');

      const listEmbed = new EmbedBuilder().setTitle('Other Religions').setDescription(religionList).setColor('#00BFFF');

      embeds.push(listEmbed);
    }
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
