import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { checkUserRole } from '~/helpers';
import { CommandData, Roles } from '~/types';
import { executeWeeklyTasks } from '~/weeklies/weekly';

const commandData: CommandData = {
  name: 'repostweekly',
  description: 'Repost the weekly downtime message',
  category: 'utility',
};

async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, [Roles.GM, Roles.BOT_DEV])) {
    await interaction.reply({
      content: `You do not have permission to use this command.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  await executeWeeklyTasks(true);
  await interaction.reply({
    content: `Weekly tasks have been reposted.`,
    flags: MessageFlags.Ephemeral,
  });
}

export { commandData, execute };
