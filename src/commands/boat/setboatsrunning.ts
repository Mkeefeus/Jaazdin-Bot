import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Boat } from '~/db/models/Boat';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';
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
//TODO: for boats names use autocomplete to suggest existing boat names

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, Roles.GM)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

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
      where: exceptions.length > 0 ? { boatName: { [Op.notIn]: exceptions } } : {},
    }
  );

  await interaction.reply({
    content: `Set ${affected} boat(s) to ${running ? 'running' : 'not running'}${exceptions.length ? ` (except: ${exceptions.join(', ')})` : ''}.`,
    flags: MessageFlags.Ephemeral,
  });
}

export const help = {
  name: 'setboatsrunning',
  description: 'Set all boats to running or not running status',
  requiredRole: Roles.GM,
  category: 'boats',
};
