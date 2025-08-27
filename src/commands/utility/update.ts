import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';
import { exec } from 'child_process';

export const data = new SlashCommandBuilder().
    setName('update').
    setDescription('Updates the bot code and restarts');

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!checkUserRole(interaction, [Roles.BOT_DEV, Roles.GM])) {
        await interaction.reply({
            content: 'You do not have permission to use this command.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }
    console.log('Update command invoked by', interaction.user.tag);
    await interaction.reply({
        content: 'Updating...',
        flags: MessageFlags.Ephemeral
    });
    await new Promise<void>((resolve, reject) => {
        exec('git pull', (error, stdout, stderr) => {
            if (error) {
                interaction.followUp({
                    content: `Git pull failed: ${stderr || error.message}`,
                    flags: MessageFlags.Ephemeral
                });
                reject(error);
            } else {
                interaction.followUp({
                    content: `Git pull output:\n${stdout}`,
                    flags: MessageFlags.Ephemeral
                });
                resolve();
            }
        });
    });
    process.exit(0);
}