import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { findBoatByName, boatNameAutocomplete, createBoatStatusDescription } from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types';
import { Boat } from '~/db/models/Boat';

export const data = new SlashCommandBuilder()
  .setName('boat-remove-job')
  .setDescription('Remove a single job from a boat')
  .addStringOption((opt) => opt.setName('boat').setDescription('Boat name').setRequired(true).setAutocomplete(true))
  .addStringOption((opt) =>
    opt.setName('job').setDescription('Job name to remove').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focusedOption = interaction.options.getFocused(true);

  if (focusedOption.name === 'boat') {
    await boatNameAutocomplete(interaction);
  } else if (focusedOption.name === 'job') {
    // For job removal, show only jobs that are currently on the selected boat
    const boatName = interaction.options.getString('boat');
    if (boatName) {
      const boat = await Boat.findOne({ where: { boatName: boatName } });
      if (boat) {
        const currentJobs = boat.jobsAffected || [];
        const focusedValue = interaction.options.getFocused().toLowerCase();

        const filtered = currentJobs
          .filter((job) => job.toLowerCase().includes(focusedValue))
          .slice(0, 25)
          .map((job) => ({
            name: job,
            value: job,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        await interaction.respond(filtered);
        return;
      }
    }
    // Fallback: respond with empty array if no boat selected or boat not found
    await interaction.respond([]);
  }
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
  const jobName = interaction.options.getString('job', true);

  const boat = await findBoatByName(interaction, boatName);
  if (!boat) {
    // Error message already sent by findBoatByName
    return;
  }

  // Check if job exists in the list
  const currentJobs = boat.jobsAffected || [];
  if (!currentJobs.includes(jobName)) {
    await interaction.reply({
      content: `⚠️ Job "${jobName}" is not assigned to boat "${boat.boatName}".`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Remove the job from the list
  const updatedJobs = currentJobs.filter((job) => job !== jobName);

  await boat.update({
    jobsAffected: updatedJobs,
  });

  const embed = new EmbedBuilder()
    .setTitle('✅ Job Removed from Boat')
    .setColor('Orange')
    .addFields([
      { name: 'Boat', value: boat.boatName, inline: true },
      { name: 'Removed Job', value: jobName, inline: true },
      { name: 'Remaining Jobs', value: updatedJobs.length.toString(), inline: true },
    ])
    .setDescription(await createBoatStatusDescription(boat));

  // Show remaining job list if there are any jobs left
  if (updatedJobs.length > 0) {
    embed.addFields([{ name: 'Remaining Jobs', value: updatedJobs.join(', ') }]);
  } else {
    embed.addFields([{ name: 'Jobs', value: 'No jobs assigned to this boat' }]);
  }

  await interaction.reply({ embeds: [embed] });
}

export const help = {
  name: 'boat-remove-job',
  description: 'Remove a job from a boat',
  requiredRole: Roles.GM,
  category: 'boats',
};
