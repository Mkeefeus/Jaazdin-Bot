import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
} from 'discord.js';
import {
  findBoatByName,
  boatNameAutocomplete,
  createBoatStatusDescription,
  buildCommand,
  checkUserRole,
} from '~/helpers';
import { CommandData, Roles } from '~/types';

const commandData: CommandData = {
  name: 'boat-clear-jobs',
  description: 'Remove all jobs from a boat',
  category: 'boats',
  options: [{ name: 'boat', type: 'string', description: 'Boat name', required: true, autocomplete: true }],
};

const data = buildCommand(commandData);

async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  await boatNameAutocomplete(interaction);
}

async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
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

export { data, execute, commandData, autocomplete };
