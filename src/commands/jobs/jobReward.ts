import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AutocompleteInteraction,
  Colors,
  userMention,
} from 'discord.js';
import { Op } from 'sequelize';
import { Boat } from '~/db/models/Boat';
import { Job, JobTier } from '~/db/models/Job';
import { formatNames } from '~/functions/helpers';

export const data = new SlashCommandBuilder()
  .setName('jobreward')
  .setDescription('Figure out what job reward you received')
  .addStringOption((option) =>
    option.setName('name').setDescription('The name of the job you are working').setRequired(true).setAutocomplete(true)
  )
  .addIntegerOption((option) =>
    option.setName('tier').setDescription('Enter the current tier you are at').setRequired(true).setMinValue(3)
  )
  .addIntegerOption((option) =>
    option
      .setName('roll')
      .setDescription('Enter the roll on the die (not including bonuses)')
      .setRequired(true)
      .setMaxValue(100)
      .setMinValue(1)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const jobName = interaction.options.getString('name');
  const tier = interaction.options.getInteger('tier');
  const roll = interaction.options.getInteger('roll');

  if (!jobName || !tier || !roll) {
    await interaction.reply('Please provide all required fields');
    return;
  }

  const jobData = await Job.findOne({ where: { name: jobName } });

  if (!jobData) {
    await interaction.reply('Job not found');
    return;
  }

  let modifiedRoll = tier > 3 ? roll + (Math.min(tier, 7) - 3) * 10 : roll;

  const effectiveBoats = await Boat.findAll({
    where: {
      isInTown: true,
      isRunning: true,
      jobsAffected: {
        [Op.contains]: [jobName],
      },
    },
  });
  for (const boat of effectiveBoats) {
    modifiedRoll += boat.isTier2 ? 15 : 10;
  }

  const rolledTier = await JobTier.findOne({
    where: {
      job_id: jobData.getDataValue('id'),
      roll_min: { [Op.lte]: modifiedRoll },
      roll_max: { [Op.gte]: modifiedRoll },
    },
  });

  if (!rolledTier) {
    await interaction.reply('Invalid roll for this job');
    return;
  }

  // string of all the boats that affected the roll
  const boatNames = effectiveBoats.map((boat) => boat.boatName).join(', ');

  const title = `${formatNames(jobData.getDataValue('name'))} Tier ${tier} ${boatNames ? `\n\n**Boats:**\n${boatNames}` : ''}, Final Roll: ${modifiedRoll}`;
  const message = `${rolledTier.getDataValue('bonus')} ${boatNames ? `\n\n**Boats affecting the roll:**\n${boatNames}` : ''}`;

  await interaction.reply({
    content: userMention(interaction.user.id),
    embeds: [new EmbedBuilder().setTitle(title).setDescription(message).setColor(Colors.Green)],
  });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const jobs = await Job.findAll();

  const filtered = jobs.filter((job) => job.dataValues.name.toLowerCase().startsWith(focusedValue));

  await interaction.respond(
    filtered
      .slice(0, 25)
      .map((job) => ({
        name: formatNames(job.dataValues.name), // Display nicely formatted
        value: job.dataValues.name, // Keep lowercase for database lookup
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
}

export default {
  data,
  execute,
  autocomplete,
};
