import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { checkUserRole } from '~/helpers';
import { CommandData, Roles } from '~/types';
import { exec } from 'child_process';

const commandData: CommandData = {
  name: 'codeupdate',
  description: 'Updates the bot code and restarts',
  category: 'utility',
};

async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, Roles.BOT_DEV)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  console.log('Update command invoked by', interaction.user.tag);
  await interaction.reply({
    content: 'Updating...',
    flags: MessageFlags.Ephemeral,
  });

  let followUpContent = '';
  try {
    console.log('Running git pull...');
    await new Promise<void>((resolve, reject) => {
      exec('git pull', (error, stdout, stderr) => {
        console.log(stdout, stderr);
        if (error) {
          followUpContent = `Git pull failed: ${stderr || error.message}`;
          reject(error);
        } else {
          followUpContent = `Git pull completed. Output:\n${stdout}`;
          resolve();
        }
      });
    });
  } catch (_error) {
    // followUpContent is already set
  }

  await interaction.followUp({
    content: followUpContent,
    flags: MessageFlags.Ephemeral,
  });

  console.log('Restarting to apply updates...');

  process.exit(0);
}

export { execute, commandData };
