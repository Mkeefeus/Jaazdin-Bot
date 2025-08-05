import { ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Religion } from '~/db/models/Religion';
import { replyWithUserMention } from '~/functions/helpers';
import showReligion from './showReligion';

//TODO player command only.

export const data = new SlashCommandBuilder().setName('showallreligions').setDescription('Shows all active religions');

export async function execute(interaction: ChatInputCommandInteraction) {
  const allMessages = await showAllReligions();
  await replyWithUserMention(interaction, allMessages);
}

async function showAllReligions(): Promise<EmbedBuilder[]> {
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

  return allMessages;
}

export default {
  data,
  execute,
  showAllReligions,
};
