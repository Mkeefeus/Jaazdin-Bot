import { AutocompleteInteraction, ChatInputCommandInteraction, Colors, EmbedBuilder, MessageFlags } from 'discord.js';
import { loadCommandFiles, buildCommand } from '~/functions/commandHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles, CommandData } from '~/types';

const commandData: CommandData = {
  name: 'help',
  description: 'Get information about commands',
  category: 'utility',
  options: [
    {
      name: 'command',
      type: 'string',
      description: 'The command to get help for',
      autocomplete: true,
    },
  ],
};

const data = buildCommand(commandData);

const commands: CommandData[] = [];

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

function getUserRoles(interaction: ChatInputCommandInteraction | AutocompleteInteraction): Roles[] {
  const userRoles: Roles[] = [];

  // Check each role
  if (checkUserRole(interaction, Roles.BOT_DEV)) userRoles.push(Roles.BOT_DEV);
  if (checkUserRole(interaction, Roles.GM)) userRoles.push(Roles.GM);
  if (checkUserRole(interaction, Roles.DM)) userRoles.push(Roles.DM);
  if (checkUserRole(interaction, Roles.PLAYER)) userRoles.push(Roles.PLAYER);

  return userRoles;
}

function canUseCommand(command: CommandData, userRoles: Roles[]): boolean {
  if (Array.isArray(command.requiredRole)) {
    return command.requiredRole.some((role) => userRoles.includes(role));
  }

  return command.requiredRole ? userRoles.includes(command.requiredRole) : true;
}

async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused();
  if (commands.length == 0) {
    // await loadCommands();
    const commandsData = await loadCommandFiles('commandsData');
    commands.push(...commandsData);
  }
  const userRoles = getUserRoles(interaction);
  const userCommands = commands.filter((cmd) => canUseCommand(cmd, userRoles) /*&& cmd.args*/);
  const filtered = userCommands.filter((cmd) => cmd.name.startsWith(focusedValue));
  await interaction.respond(filtered.map((cmd) => ({ name: `/${cmd.name}`, value: cmd.name })).slice(0, 25));
}

async function executeSubhelp(interaction: ChatInputCommandInteraction, command: string) {
  const userCommands = commands.filter((cmd) => canUseCommand(cmd, getUserRoles(interaction)));
  if (userCommands.length === 0) {
    await interaction.reply({
      content: '❌ No commands are available for your current role.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const commandData = userCommands.find((cmd) => cmd.name === command);
  if (!commandData) {
    await interaction.reply({ content: `❌ Command \`${command}\` not found.`, flags: MessageFlags.Ephemeral });
    return;
  }

  let optionsString = (commandData.options || [])
    .map((option) => {
      return `\`${option.name}\` (${option.type})${option.required ? ' [required]' : ''}${option.description ? ` - ${option.description}` : ''}`;
    })
    .join('\n');
  if (optionsString === '') {
    optionsString = 'No options available for this command.';
  }

  const embed = new EmbedBuilder()
    .setTitle(`🤖 Help: /${commandData.name}`)
    .setColor(Colors.Gold)
    .setDescription(commandData.description)
    .addFields({ name: 'Options', value: optionsString });
  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

async function execute(interaction: ChatInputCommandInteraction) {
  if (commands.length == 0) {
    // await loadCommands();
    const commandsData = await loadCommandFiles('commandsData');
    commands.push(...commandsData);
  }
  const command = interaction.options.getString('command');
  if (command) {
    await executeSubhelp(interaction, command);
    return;
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
  const commandsByCategory: { [key: string]: CommandData[] } = {};
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

export { data, execute, commandData, autocomplete };
