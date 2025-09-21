import { REST, Routes } from 'discord.js';
import { loadCommandFiles } from './src/functions/commandHelpers';
import dotenv from 'dotenv';

dotenv.config();

async function deployCommands() {
  const clientId = process.env.CLIENT_ID;
  const guildId = process.env.GUILD_ID;
  const token = process.env.DISCORD_TOKEN;

  if (!clientId) throw new Error('Missing CLIENT_ID in environment variables');
  if (!guildId) throw new Error('Missing GUILD_ID in environment variables');
  if (!token) throw new Error('Missing DISCORD_TOKEN in environment variables');

  const commands = await loadCommandFiles('commands');
  const rest = new REST().setToken(token);

  console.log(`Started refreshing ${commands.length} application (/) commands.`);

  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

  console.log(`Successfully reloaded ${commands.length} application (/) commands.`);
}

try {
  await deployCommands();
} catch (error) {
  console.error('Error deploying commands:', error);
}
