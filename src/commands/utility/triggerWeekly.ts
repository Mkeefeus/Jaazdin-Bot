import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import { WeeklyFunctions } from '~/types/weeklyfunctions';
import { Roles } from '~/types/roles';

export const data = new SlashCommandBuilder().setName('triggerweeklies').setDescription('Triggers the weekly tasks');

export async function execute(interaction: ChatInputCommandInteraction) {
  const weeklyDir = path.join(__dirname, '../../weeklies');
  const weeklyFiles = readdirSync(weeklyDir).filter((file) => file.endsWith('.ts') && file !== 'weekly.ts');
  for (const file of weeklyFiles) {
    const { update, post } = (await import(path.join(weeklyDir, file))) as WeeklyFunctions;
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
    ephemeral: true,
  });
}

export const help = {
  name: 'triggerweekly',
  description: 'Manually trigger weekly tasks (GM only)',
  requiredRole: Roles.GM,
  category: 'utility',
};
