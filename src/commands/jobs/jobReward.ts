import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AutocompleteInteraction,
} from "discord.js";

import { Jobs, Job } from "~/db/models/Jobs";
import { formatNames } from "~/functions/helpers";

export const data = new SlashCommandBuilder()
  .setName("jobreward")
  .setDescription("Figure out what job reward you received")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("The name of the job you are working")
      .setRequired(true)
      .setAutocomplete(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("tier")
      .setDescription("Enter the current tier you are at")
      .setRequired(true)
      .setMinValue(3)
  )
  .addIntegerOption((option) =>
    option
      .setName("roll")
      .setDescription("Enter the roll on the die (not including bonuses)")
      .setRequired(true)
      .setMaxValue(100)
      .setMinValue(1)
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  
  //parse in values. 
  //calc bonuses. 
  console.log("guh")
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const jobs = await Jobs.findAll();

  console.log(jobs.map(job => job.dataValues.name))

  const filtered = jobs.filter(job => 
    job.dataValues.name.includes(focusedValue)
  );

  await interaction.respond(
    filtered.slice(0, 25).map(job => ({
      name: formatNames(job.dataValues.name), // Display nicely formatted
      value: job.dataValues.name, // Keep lowercase for database lookup
    }))
  );
}

export default {
  data,
  execute,
  autocomplete,
};