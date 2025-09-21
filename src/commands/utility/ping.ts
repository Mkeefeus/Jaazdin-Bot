import { db } from 'db/db';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { HelpData } from '~/types';

export const data = new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!');

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await db.authenticate();
    console.log('Connection has been established successfully.');
  } catch (e) {
    console.error('Unable to connect to the database:', e);
  }
  await interaction.reply('Pong!');
}

export const help: HelpData = {
  name: 'ping',
  description: 'Test bot responsiveness and database connection',
  category: 'utility',
};

export default {
  data,
  execute,
};
