import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { checkUserRole } from '~/functions/helpers';
import { buildCommand } from '~/functions/commandHelpers';
import { CommandData, Roles } from '~/types';

const commandData: CommandData = {
  name: 'restart',
  description: 'Restarts the bot process',
  category: 'utility',
};

const data = buildCommand(commandData);

async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, [Roles.BOT_DEV, Roles.GM])) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  console.log('Restart command invoked by', interaction.user.tag);
  await interaction.reply({
    content: 'Restarting...',
    flags: MessageFlags.Ephemeral,
  });
  process.exit(0);
}

const help: CommandData = {
  name: 'restart',
  description: 'Restarts the bot process',
  requiredRole: Roles.BOT_DEV,
  category: 'utility',
};

export { commandData, data, execute, help };
