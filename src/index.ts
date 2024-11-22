// src/index.ts
import { Client, Events, GatewayIntentBits, Collection } from "discord.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

// Extend the Client type to include commands
declare module "discord.js" {
  export interface Client {
    commands: Collection<string, any>;
  }
}

// Load environment variables from .env file
dotenv.config();
const token = process.env.DISCORD_TOKEN;

// ES Module URL to filepath conversion
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// New Client Instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Initialize commands collection
client.commands = new Collection();
// Load commands at startup
const foldersPath = path.join(__dirname, "commands");
const commandFolders = await fs.readdir(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = (await fs.readdir(commandsPath)).filter(
    (file) => file.endsWith(".ts") || file.endsWith(".js")
  );

  for (const file of commandFiles) {
    if (file.endsWith("-bak.ts")) continue; // Skip backup files

    const filePath = path.join(commandsPath, file);
    const fileUrl = new URL(`file://${filePath}`).href;

    const command = await import(fileUrl);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    }
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command || !command.autocomplete) {
      console.error(`No autocomplete handler found for command ${interaction.commandName}`);
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(error);
      const errorMessage = {
        content: "There was an error while executing this command!",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
    return;
  }


  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const errorMessage = {
      content: "There was an error while executing this command!",
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(token);
