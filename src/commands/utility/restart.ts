import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';

export const data = new SlashCommandBuilder().
    setName('restart').
    setDescription('Restarts the bot process');

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!checkUserRole(interaction, [Roles.BOT_DEV, Roles.GM])) {
        await interaction.reply({
            content: 'You do not have permission to use this command.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }
    await interaction.reply({
        content: 'Restarting...',
        flags: MessageFlags.Ephemeral
    });
    process.exit(0);
}