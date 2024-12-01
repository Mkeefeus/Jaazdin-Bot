import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AutocompleteInteraction,
  Colors,
  userMention,
} from 'discord.js';
import { Op } from 'sequelize';

import { Jobs, JobTiers } from '~/db/models/Jobs';
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

  const jobData = await Jobs.findOne({ where: { name: jobName } });

  if (!jobData) {
    await interaction.reply('Job not found');
    return;
  }

  let modifiedRoll = tier > 3 ? roll + (Math.min(tier, 7) - 3) * 10 : roll;

  /*
  const boatsInTown = await Boats.findAll()
  const effectiveBoats = boatsInTown.filter((boat) => boatIsRunning && boatHasBonusForJob && boatInTown)
  for (const boat of effectiveBoats) {
    modifiedRoll += boat.isTier2 ? 15 : 10;
  }
  */

  const rolledTier = await JobTiers.findOne({
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

  const title = `${formatNames(jobData.getDataValue('name'))} Tier ${tier}, Final Roll: ${modifiedRoll}`;
  const message = `${rolledTier.getDataValue('bonus')}`;

  // await interaction.reply(message);
  await interaction.reply({
    content: userMention(interaction.user.id),
    embeds: [new EmbedBuilder().setTitle(title).setDescription(message).setColor(Colors.Green)],
  });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const jobs = await Jobs.findAll();

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
