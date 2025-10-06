import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { buildCommand } from '~/helpers';
import { CommandData } from '~/types/command';
import { Roles } from '~/types';
import { executeWeeklyTasks } from '~/weeklies/weekly';

const commandData: CommandData = {
  name: 'triggerweeklies',
  description: 'Triggers the weekly tasks',
  category: 'utility',
};

const data = buildCommand(commandData);

async function execute(interaction: ChatInputCommandInteraction) {
  await executeWeeklyTasks();
  await interaction.reply({
    content: `Weekly tasks have been triggered.`,
    flags: MessageFlags.Ephemeral,
  });
}

const help = {
  name: 'triggerweekly',
  description: 'Manually trigger weekly tasks (GM only)',
  requiredRole: Roles.GM,
  category: 'utility',
};

export { commandData, data, execute, help };
