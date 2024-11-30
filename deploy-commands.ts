import { REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from './src/types/command';

dotenv.config();
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_TOKEN;

if (!clientId) throw new Error('Missing CLIENT_ID in environment variables');
if (!guildId) throw new Error('Missing GUILD_ID in environment variables');
if (!token) throw new Error('Missing DISCORD_TOKEN in environment variables');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
// Update this path to point to src/commands
const foldersPath = path.join(__dirname, 'src', 'commands');

try {
  const commandFolders = await fs.readdir(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = (await fs.readdir(commandsPath)).filter(
      (file) => file.endsWith('.ts') || file.endsWith('.js')
    );

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const fileUrl = new URL(`file://${filePath}`).href;

      try {
        const command = (await import(fileUrl)) as Command;

        if ('data' in command) {
          commands.push(command.data.toJSON());
          console.log(`Loaded command: ${command.data.name}`);
        } else {
          console.log(`[WARNING] The command at ${filePath} is missing a required "data" property.`);
        }
      } catch (error) {
        console.error(`Error loading command from ${filePath}:`, error);
      }
    }
  }

  const rest = new REST().setToken(token);

  console.log(`Started refreshing ${commands.length} application (/) commands.`);

  const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

  console.log(`Successfully reloaded ${commands.length} application (/) commands.`);
} catch (error) {
  console.error('Error deploying commands:', error);
}
