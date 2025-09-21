import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import { buildCommand } from '~/functions/commandHelpers';
import { CommandData } from '~/types/command';
import { WeeklyData } from '~/types';
import { Roles } from '~/types';

const commandData: CommandData = {
  name: 'triggerweeklies',
  description: 'Triggers the weekly tasks',
  category: 'utility',
};

const data = buildCommand(commandData);

async function execute(interaction: ChatInputCommandInteraction) {
  const weeklyDir = path.join(__dirname, '../../weeklies');
  const weeklyFiles = readdirSync(weeklyDir).filter((file) => file.endsWith('.ts') && file !== 'weekly.ts');
  for (const file of weeklyFiles) {
    const { update, post } = (await import(path.join(weeklyDir, file))) as WeeklyData;
    if (!update || !post) {
      //Some sort of warning
      console.log(`Missing update or post method for ${file}.`);
      return;
    }
    await update();
    await post();
  }
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
