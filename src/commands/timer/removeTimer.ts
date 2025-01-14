import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Timer } from '~/db/models/Timer';
import { formatNames } from '~/functions/helpers';

export const data = new SlashCommandBuilder()
  .setName('removetimer')
  .setDescription('will delete an existing timer')
  .addStringOption((option) =>
    option.setName('name').setDescription('The name of the timer').setRequired(true).setAutocomplete(true)
  )

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;

  await Timer.destroy({
    where: {
      timer_name: name,
    },
  });

  await interaction.reply(`${name} timer was deleted.`);
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
