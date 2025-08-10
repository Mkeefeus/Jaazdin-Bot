import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
} from 'discord.js';
import { findBoatByName, boatNameAutocomplete, createBoatStatusDescription } from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';

export const data = new SlashCommandBuilder()
  .setName('boat-clear-jobs')
  .setDescription('Remove all jobs from a boat')
  .addStringOption((opt) => opt.setName('boat').setDescription('Boat name').setRequired(true).setAutocomplete(true));

export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  await boatNameAutocomplete(interaction);
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!checkUserRole(interaction, Roles.GM)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const boatName = interaction.options.getString('boat', true);

  const boat = await findBoatByName(interaction, boatName);
  if (!boat) {
    // Error message already sent by findBoatByName
    return;
  }

  const currentJobs = boat.jobsAffected || [];

  if (currentJobs.length === 0) {
    await interaction.reply({
      content: `ℹ️ Boat "${boat.boatName}" already has no jobs assigned.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Create confirmation buttons
  const confirmButton = new ButtonBuilder()
    .setCustomId(`confirm-clear-jobs-${boat.boatName}`)
    .setLabel('Yes, Clear All Jobs')
    .setStyle(ButtonStyle.Danger);

  const cancelButton = new ButtonBuilder()
    .setCustomId('cancel-clear-jobs')
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

  const embed = new EmbedBuilder()
    .setTitle('⚠️ Confirm Clear All Jobs')
    .setColor('Orange')
    .addFields([
      { name: 'Boat', value: boat.boatName, inline: true },
      { name: 'Current Jobs', value: currentJobs.length.toString(), inline: true },
    ])
    .setDescription(
      `Are you sure you want to remove all jobs from **${boat.boatName}**?\n\n**Jobs to be removed:**\n${currentJobs.join(', ')}`
    );

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    flags: MessageFlags.Ephemeral,
  });

  try {
    const confirmation = await response.awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id,
      time: 60000,
    });

    if (confirmation.customId === `confirm-clear-jobs-${boat.boatName}`) {
      // Clear all jobs
      await boat.update({
        jobsAffected: [],
      });

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ All Jobs Cleared')
        .setColor('Green')
        .addFields([
          { name: 'Boat', value: boat.boatName, inline: true },
          { name: 'Jobs Removed', value: currentJobs.length.toString(), inline: true },
        ])
        .setDescription(await createBoatStatusDescription(boat));

      await confirmation.update({
        embeds: [successEmbed],
        components: [],
      });
    } else {
      await confirmation.update({
        content: 'Job clearing cancelled.',
        embeds: [],
        components: [],
      });
    }
  } catch (_error) {
    await interaction.editReply({
      content: 'Confirmation timed out. Job clearing cancelled.',
      embeds: [],
      components: [],
    });
  }
}

export const help = {
  name: 'boat-clear-jobs',
  description: 'Clear all jobs from a boat',
  requiredRole: Roles.GM,
  category: 'boats',
};
