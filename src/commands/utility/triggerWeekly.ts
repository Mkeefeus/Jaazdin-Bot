import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { CommandData } from '~/types';
import { executeWeeklyTasks } from '~/weeklies/weekly';

const commandData: CommandData = {
  name: 'triggerweeklies',
  description: 'Triggers the weekly tasks',
  category: 'utility',
};

async function execute(interaction: ChatInputCommandInteraction) {
  await executeWeeklyTasks();
  await interaction.reply({
    content: `Weekly tasks have been triggered.`,
    flags: MessageFlags.Ephemeral,
  });
}

export { commandData, execute };
