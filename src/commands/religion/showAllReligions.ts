import { ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBuilder, userMention } from 'discord.js';
import { Religion } from '~/db/models/Religion';
import showReligion from './showReligion';

export const data = new SlashCommandBuilder().setName('showallreligions').setDescription('Shows all active religions');

export async function execute(interaction: ChatInputCommandInteraction) {
  const religions = await Religion.findAll({ order: [['follower_count', 'DESC']] });

  const allMessages = [];
  for (let i = 0; i < religions.length; i++) {
    allMessages.push(await showReligion.showReligion(religions[i]));
  }

  if (allMessages.length == 0) {
    const title = `Error`;
    const message = `There is no god. No religions exist.`;

    allMessages.push(new EmbedBuilder().setTitle(title).setDescription(message).setColor(Colors.DarkRed));
  }

  await interaction.reply({
    content: userMention(interaction.user.id),
    embeds: allMessages,
  });
}

export default {
  data,
  execute,
};
