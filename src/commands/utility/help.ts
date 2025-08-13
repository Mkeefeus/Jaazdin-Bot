import { ChatInputCommandInteraction, Colors, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { checkUserRole } from '~/functions/helpers';
import { Command, HelpData } from '~/types/command';
import { Roles } from '~/types/roles';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show all available commands based on your permissions');

const commands: HelpData[] = [];

const categoryEmojis: { [key: string]: string } = {
  boats: '🚢',
  items: '🎲',
  religion: '⛪',
  farming: '🌱',
  fun: '🎭',
  jobs: '💰',
  timers: '⏰',
  utility: '🛠️',
};

function getUserRoles(interaction: ChatInputCommandInteraction): Roles[] {
  const userRoles: Roles[] = [];

  // Check each role
  if (checkUserRole(interaction, Roles.BOT_DEV)) userRoles.push(Roles.BOT_DEV);
  if (checkUserRole(interaction, Roles.GM)) userRoles.push(Roles.GM);
  if (checkUserRole(interaction, Roles.DM)) userRoles.push(Roles.DM);
  if (checkUserRole(interaction, Roles.PLAYER)) userRoles.push(Roles.PLAYER);

  return userRoles;
}

function canUseCommand(command: HelpData, userRoles: Roles[]): boolean {
  // Commands with no role requirement are available to everyone
  if (command.requiredRole === null) return true;

  // Check if user has the required role or a higher role
  if (userRoles.includes(Roles.BOT_DEV)) return true; // Bot devs can use everything
  if (command.requiredRole === Roles.GM && userRoles.includes(Roles.GM)) return true;
  if (command.requiredRole === Roles.DM && userRoles.includes(Roles.DM)) return true;
  if (command.requiredRole === Roles.PLAYER && userRoles.includes(Roles.PLAYER)) return true;

  return false;
}

async function loadCommands() {
  const foldersPath = path.join(__dirname, '../');

  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts') && file !== path.basename(__filename));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const fileUrl = new URL(`file://${filePath}`).href;

      try {
        const command = (await import(fileUrl)) as Command;

        if ('help' in command) {
          commands.push(command.help);
        } else {
          console.warn(`[WARNING] The command at ${filePath} is missing a required "help" property.`);
        }
      } catch (error) {
        console.error(`Error loading help data for command from ${filePath}:`, error);
      }
    }
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  if (commands.length == 0) {
    await loadCommands();
  }
  const userCommands = commands.filter((cmd) => canUseCommand(cmd, getUserRoles(interaction)));
  if (userCommands.length === 0) {
    await interaction.reply({
      content: '❌ No commands are available for your current role.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Group commands by category
  const commandsByCategory: { [key: string]: HelpData[] } = {};
  userCommands.forEach((cmd) => {
    if (!commandsByCategory[cmd.category]) {
      commandsByCategory[cmd.category] = [];
    }
    commandsByCategory[cmd.category].push(cmd);
  });

  // Create embed fields for each category that has commands
  const fields = Object.entries(commandsByCategory).map(([category, cmds]) => {
    const commandList = cmds
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((cmd) => `\`/${cmd.name}\` - ${cmd.description}`)
      .join('\n');

    return {
      name: `${categoryEmojis[category]} ${category.charAt(0).toUpperCase() + category.slice(1)} (${cmds.length})`,
      value: commandList,
      inline: false,
    };
  });

  const embed = new EmbedBuilder()
    .setTitle('🤖 Jaazdin Bot Commands')
    .setColor(Colors.Gold)
    .setDescription(`Here are all **${userCommands.length}** commands you can use:`)
    .addFields(fields)
    .setFooter({
      text: `Total commands available: ${userCommands.length}`,
    });

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

export default {
  data,
  execute,
};
