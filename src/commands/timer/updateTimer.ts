import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Timer } from '~/db/models/Timer';
import { formatNames } from '~/functions/helpers';

export const data = new SlashCommandBuilder()
  .setName('updatetimer')
  .setDescription('Will update timer value')
  .addStringOption((option) =>
    option.setName('name').setDescription('The name of the timer').setRequired(true).setAutocomplete(true)
  )
  .addIntegerOption((option) =>
    option.setName('time').setDescription('The modified number of time to add.').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;
  const selectedTimer = await Timer.findOne({
    where: {
      timer_name: name,
    },
  });

  const time = interaction.options.getInteger('time') as number;

  selectedTimer?.update({
    time_left: selectedTimer?.dataValues.time_left + time,
  });

  await interaction.reply(`Timer ${name} has been updated to finish in ${selectedTimer?.dataValues.time_left}`);
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const timers = await Timer.findAll();

  const filtered = timers.filter((timer) => timer.dataValues.timer_name.toLowerCase().startsWith(focusedValue));

  await interaction.respond(
    filtered
      .map((timer) => ({
        name: formatNames(timer.dataValues.timer_name), // Display nicely formatted
        value: timer.dataValues.timer_name, // Keep lowercase for database lookup
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
}

export default {
  data,
  execute,
  autocomplete,
};
