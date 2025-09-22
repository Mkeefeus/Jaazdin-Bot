import { db } from 'db/db';
import { ChatInputCommandInteraction } from 'discord.js';
import { buildCommand } from '~/helpers';
import { CommandData } from '~/types';

const commandData: CommandData = {
  name: 'ping',
  description: 'Replies with Pong!',
  category: 'utility',
};

const data = buildCommand(commandData);

async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await db.authenticate();
    console.log('Connection has been established successfully.');
  } catch (e) {
    console.error('Unable to connect to the database:', e);
  }
  await interaction.reply('Pong!');
}

export { data, execute, commandData };
