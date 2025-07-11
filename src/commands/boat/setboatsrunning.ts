import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Boat } from '~/db/models/Boat';
import { Op } from 'sequelize';

export const data = new SlashCommandBuilder()
  .setName('setboatsrunning')
  .setDescription('Set all boats to running or not, with optional exceptions')
  .addBooleanOption((opt) =>
    opt.setName('running').setDescription('Set boats to running (true) or not running (false)').setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('exceptions')
      .setDescription('Comma-separated boat names to leave unchanged (optional)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const running = interaction.options.getBoolean('running', true);
  const exceptionsRaw = interaction.options.getString('exceptions');
  let exceptions: string[] = [];

  if (exceptionsRaw) {
    exceptions = exceptionsRaw
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }
  // Update all boats except those in exceptions
  const [affected] = await Boat.update(
    { isRunning: running },
    {
      where: exceptions.length > 0
        ? { boatName: { [Op.notIn]: exceptions } }
        : {}
    }
  );

  await interaction.reply({
    content: `Set ${affected} boat(s) to ${running ? 'running' : 'not running'}${exceptions.length ? ` (except: ${exceptions.join(', ')})` : ''}.`,
    ephemeral: true,
  });
}
