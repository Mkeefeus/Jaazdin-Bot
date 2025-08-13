import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, MessageFlags } from 'discord.js';
import { Announcement } from '~/db/models/Announcement';
import { checkUserRole, confirmAction, formatNames } from '~/functions/helpers';
import { Roles } from '~/types/roles';

export const data = new SlashCommandBuilder()
	.setName('destroyannouncement')
	.setDescription('Delete an announcement from the database')
	.addStringOption(option =>
		option.setName('name').setDescription('Name of the announcement to delete').setRequired(true).setAutocomplete(true)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const name = interaction.options.getString('name') as string;

	// Find announcement
	const announcement = await Announcement.findOne({ where: { name } });
	if (!announcement) {
		await interaction.reply({
			content: 'Could not find the specified announcement.',
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (!checkUserRole(interaction, Roles.GM)) {
		await interaction.reply({
			content: 'You do not have permission to use this command.',
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const confirm = await confirmAction({
		interaction,
		title: 'Destroy Announcement',
		description: `Are you sure you want to destroy ${formatNames(announcement.name)}?`,
		confirmButtonText: 'Destroy',
		cancelButtonText: 'Cancel',
		fields: [
			{
				name: 'Announcement Name',
				value: formatNames(announcement.name),
				inline: true,
			},
			{
				name: 'Weeks Remaining',
				value: `${announcement.weeks}`,
				inline: true,
			},
			{
				name: 'Message',
				value: announcement.message,
				inline: false,
			},
		],
		confirmEmbed: [
			{
				title: '✅ Announcement Destroyed',
				description: `The announcement ${formatNames(announcement.name)} has been destroyed.`,
				color: 0x4caf50, // Green
				timestamp: new Date().toISOString(),
			},
		],
	});

	if (!confirm) {
		return;
	}

	// Proceed with destruction
	await announcement.destroy();
}

export async function autocomplete(interaction: AutocompleteInteraction) {
	const focusedValue = interaction.options.getFocused();
	const announcements = await Announcement.findAll();
	const choices = announcements.map(a => a.name);
	const filtered = choices.filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));
	await interaction.respond(
		filtered.map(name => ({ name, value: name })).slice(0, 25)
	);
}

export const help = {
	name: 'destroyannouncement',
	description: 'Delete an announcement from the database',
	requiredRole: Roles.GM,
	category: 'announcement',
};

export default {
	data,
	execute,
	autocomplete,
	help,
};
