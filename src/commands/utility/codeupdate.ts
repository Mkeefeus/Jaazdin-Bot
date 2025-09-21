import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types';
import { exec } from 'child_process';
import { HelpData } from '~/types';

export const data = new SlashCommandBuilder().
    setName('codeupdate').
    setDescription('Updates the bot code and restarts');

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!checkUserRole(interaction, Roles.BOT_DEV)) {
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
        flags: MessageFlags.Ephemeral
    });

    console.log('Restarting to apply updates...');

    process.exit(0);
}

export const help: HelpData = {
    name: 'codeupdate',
    description: 'Updates the bot code and restarts',
    requiredRole: Roles.BOT_DEV,
    category: 'utility'
};