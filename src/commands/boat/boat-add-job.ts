import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder } from 'discord.js';
import { findBoatByName, createBoatStatusDescription, boatNameAutocomplete } from '~/functions/boatHelpers';
import { checkUserRole, jobNameAutocomplete } from '~/functions/helpers';
import { Roles } from '~/types/roles';

export const data = new SlashCommandBuilder()
  .setName('boat-add-job')
  .setDescription('Add a single job to a boat')
  .addStringOption((opt) => opt.setName('boat').setDescription('Boat name').setRequired(true).setAutocomplete(true))
  .addStringOption((opt) =>
    opt.setName('job').setDescription('Job name to add').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focusedOption = interaction.options.getFocused(true);

  if (focusedOption.name === 'boat') {
    await boatNameAutocomplete(interaction);
  } else if (focusedOption.name === 'job') {
    await jobNameAutocomplete(interaction);
  }
}

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!checkUserRole(interaction, Roles.GM)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true,
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

  // Check if job is already in the list
  const currentJobs = boat.jobsAffected || [];
  if (currentJobs.includes(jobName)) {
    await interaction.reply({
      content: `⚠️ Job "${jobName}" is already assigned to boat "${boat.boatName}".`,
      ephemeral: true,
    });
    return;
  }

  // Add the job to the list
  const updatedJobs = [...currentJobs, jobName];

  await boat.update({
    jobsAffected: updatedJobs,
  });

  const embed = new EmbedBuilder()
    .setTitle('✅ Job Added to Boat')
    .setColor('Green')
    .addFields([
      { name: 'Boat', value: boat.boatName, inline: true },
      { name: 'Added Job', value: jobName, inline: true },
      { name: 'Total Jobs', value: updatedJobs.length.toString(), inline: true },
    ])
    .setDescription(await createBoatStatusDescription(boat));

  // Show current job list if there are multiple jobs
  if (updatedJobs.length > 1) {
    embed.addFields([{ name: 'All Jobs', value: updatedJobs.join(', ') }]);
  }

  await interaction.reply({ embeds: [embed] });
}

export const help = {
  name: 'boat-add-job',
  description: 'Add a job to a boat',
  requiredRole: Roles.GM,
  category: 'boats',
};
