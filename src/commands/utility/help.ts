import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Colors } from 'discord.js';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show all available commands based on your permissions');

interface Command {
  name: string;
  description: string;
  requiredRole: Roles | null; // null means available to everyone
  category: string;
}

const commands: Command[] = [
  // Boat Commands
  { name: 'showboats', description: 'View all boats and their current status', requiredRole: Roles.PLAYER, category: 'boats' },
  { name: 'addboat', description: 'Create a new boat', requiredRole: Roles.GM, category: 'boats' },
  { name: 'updateboat', description: 'Update boat properties', requiredRole: Roles.GM, category: 'boats' },
  { name: 'destroyboat', description: 'Remove a boat from the system', requiredRole: Roles.GM, category: 'boats' },
  { name: 'boat-add-job', description: 'Add a job to a boat', requiredRole: Roles.GM, category: 'boats' },
  { name: 'boat-remove-job', description: 'Remove a job from a boat', requiredRole: Roles.GM, category: 'boats' },
  { name: 'boat-clear-jobs', description: 'Remove all jobs from a boat', requiredRole: Roles.GM, category: 'boats' },
  { name: 'setboatsrunning', description: 'Set multiple boats running status', requiredRole: Roles.GM, category: 'boats' },
  { name: 'addshipment', description: 'Add shipment items to a boat', requiredRole: Roles.GM, category: 'boats' },
  { name: 'updateshipment', description: 'Update shipment item quantities', requiredRole: Roles.GM, category: 'boats' },
  { name: 'purchaseshipment', description: 'Purchase items from boat shipments', requiredRole: Roles.GM, category: 'boats' },

  // Item Generation Commands
  { name: 'generatearmor', description: 'Generate random armor', requiredRole: Roles.GM, category: 'items' },
  { name: 'generateweapon', description: 'Generate random weapon', requiredRole: Roles.GM, category: 'items' },
  { name: 'generatemagicitem', description: 'Generate random magic item', requiredRole: Roles.GM, category: 'items' },
  { name: 'generatemeal', description: 'Generate random meal', requiredRole: Roles.GM, category: 'items' },
  { name: 'generatemetal', description: 'Generate random metal', requiredRole: Roles.GM, category: 'items' },
  { name: 'generatepet', description: 'Generate random pet', requiredRole: Roles.GM, category: 'items' },
  { name: 'generatepoison', description: 'Generate random poison', requiredRole: Roles.GM, category: 'items' },
  { name: 'generatepotion', description: 'Generate random potion', requiredRole: Roles.GM, category: 'items' },
  { name: 'generatereagent', description: 'Generate random reagent', requiredRole: Roles.GM, category: 'items' },
  { name: 'generateseeds', description: 'Generate random seeds', requiredRole: Roles.GM, category: 'items' },
  { name: 'randomspell', description: 'Generate random spell', requiredRole: Roles.PLAYER, category: 'items' },

  // Religion Commands
  { name: 'addreligion', description: 'Add a new religion', requiredRole: Roles.PLAYER, category: 'religion' },
  { name: 'showreligion', description: 'Show details of a specific religion', requiredRole: Roles.PLAYER, category: 'religion' },
  { name: 'showallreligions', description: 'Show all religions', requiredRole: Roles.PLAYER, category: 'religion' },
  { name: 'updatereligion', description: 'Update religion information', requiredRole: Roles.PLAYER, category: 'religion' },
  { name: 'destroyreligion', description: 'Remove a religion', requiredRole: Roles.GM, category: 'religion' },

  // Farming Commands
  { name: 'addplant', description: 'Add a new plant to track', requiredRole: Roles.PLAYER, category: 'farming' },
  { name: 'showplants', description: 'View all tracked plants', requiredRole: Roles.PLAYER, category: 'farming' },
  { name: 'updateplant', description: 'Update plant information', requiredRole: Roles.PLAYER, category: 'farming' },
  { name: 'plantdebug', description: 'Debug plant information', requiredRole: Roles.GM, category: 'farming' },

  // Fun Commands
  { name: 'kitchen', description: 'Use the kitchen system', requiredRole: null, category: 'fun' },
  { name: 'makesandwich', description: 'Make a sandwich', requiredRole: null, category: 'fun' },
  { name: 'addingredient', description: 'Add ingredient to the kitchen', requiredRole: null, category: 'fun' },
  { name: 'exportkitchen', description: 'Export kitchen data', requiredRole: null, category: 'fun' },

  // Job Commands
  { name: 'jobreward', description: 'Calculate job rewards based on boat effects', requiredRole: Roles.PLAYER, category: 'jobs' },

  // Timer Commands
  { name: 'addtimer', description: 'Add a new timer', requiredRole: Roles.PLAYER, category: 'timers' },
  { name: 'updatetimer', description: 'Update your timer', requiredRole: Roles.PLAYER, category: 'timers' },
  { name: 'removetimer', description: 'Remove your timer', requiredRole: Roles.PLAYER, category: 'timers' },
  { name: 'gmupdatetimer', description: 'GM update any timer', requiredRole: Roles.GM, category: 'timers' },

  // Utility Commands
  { name: 'ping', description: 'Check bot responsiveness', requiredRole: null, category: 'utility' },
  { name: 'roll', description: 'Roll dice', requiredRole: null, category: 'utility' },
  { name: 'addchar', description: 'Add character to database', requiredRole: Roles.PLAYER, category: 'utility' },
  { name: 'deletechar', description: 'Delete character from database', requiredRole: Roles.PLAYER, category: 'utility' },
  { name: 'listusers', description: 'List all users in database', requiredRole: Roles.GM, category: 'utility' },
  { name: 'sql', description: 'Execute SQL commands', requiredRole: Roles.BOT_DEV, category: 'utility' },
  { name: 'resetdb', description: 'Reset database', requiredRole: Roles.BOT_DEV, category: 'utility' },
];

const categoryEmojis: { [key: string]: string } = {
  boats: '🚢',
  items: '🎲',
  religion: '⛪',
  farming: '🌱',
  fun: '🎭',
  jobs: '💰',
  timers: '⏰',
  utility: '🛠️'
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

function canUseCommand(command: Command, userRoles: Roles[]): boolean {
  // Commands with no role requirement are available to everyone
  if (command.requiredRole === null) return true;
  
  // Check if user has the required role or a higher role
  if (userRoles.includes(Roles.BOT_DEV)) return true; // Bot devs can use everything
  if (command.requiredRole === Roles.GM && userRoles.includes(Roles.GM)) return true;
  if (command.requiredRole === Roles.DM && userRoles.includes(Roles.DM)) return true;
  if (command.requiredRole === Roles.PLAYER && userRoles.includes(Roles.PLAYER)) return true;
  
  return false;
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const userRoles = getUserRoles(interaction);
  
  // Filter commands based on user permissions
  const availableCommands = commands.filter(cmd => canUseCommand(cmd, userRoles));
  
  if (availableCommands.length === 0) {
    await interaction.reply({
      content: '❌ No commands are available for your current role.',
      ephemeral: true
    });
    return;
  }

  // Group commands by category
  const commandsByCategory: { [key: string]: Command[] } = {};
  availableCommands.forEach(cmd => {
    if (!commandsByCategory[cmd.category]) {
      commandsByCategory[cmd.category] = [];
    }
    commandsByCategory[cmd.category].push(cmd);
  });

  // Create embed fields for each category that has commands
  const fields = Object.entries(commandsByCategory).map(([category, cmds]) => {
    const commandList = cmds
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(cmd => `\`/${cmd.name}\` - ${cmd.description}`)
      .join('\n');
    
    return {
      name: `${categoryEmojis[category]} ${category.charAt(0).toUpperCase() + category.slice(1)} (${cmds.length})`,
      value: commandList,
      inline: false
    };
  });

  const embed = new EmbedBuilder()
    .setTitle('🤖 Jaazdin Bot Commands')
    .setColor(Colors.Gold)
    .setDescription(`Here are all **${availableCommands.length}** commands you can use:`)
    .addFields(fields)
    .setFooter({ 
      text: `Your roles: ${userRoles.join(', ') || 'None'} • Total commands available: ${availableCommands.length}` 
    });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
