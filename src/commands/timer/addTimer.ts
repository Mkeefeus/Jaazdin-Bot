import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Timer } from '~/db/models/Timer';

export const data = new SlashCommandBuilder()
  .setName('addtimer')
  .setDescription('will create a new timer')
  .addStringOption((option) => option.setName('name').setDescription('The name of the timer.').setRequired(true))
  .addIntegerOption((option) =>
    option
      .setName('length')
      .setDescription('The amount of weeks before the timer ends')
      .setRequired(true)
      .setMinValue(0)
  )
  .addStringOption((option) =>
    option
      .setName('discord_id')
      .setDescription('The discord id of the user, leave blank if yourself')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;
  const length = interaction.options.getInteger('length') as number;

  let discordId = interaction.options.getString('discord_id');
  if (!discordId) {
    discordId = interaction.user.id;
  }

  //todo check to see if timer name doesn't already exist.

  await Timer.create({
    timer_name: name,
    time_left: length,
    discord_id: discordId,
  });

  await interaction.reply(`Added ${name} that will end in ${length}`);
}

export default {
  data,
  execute,
};
