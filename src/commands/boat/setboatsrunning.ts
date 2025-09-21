import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Boat } from '~/db/models/Boat';
import { buildCommand, checkUserRole } from '~/helpers';
import { CommandData, Roles } from '~/types';
import { Op } from 'sequelize';

const commandData: CommandData = {
  name: 'setboatsrunning',
  description: 'Set all boats to running or not, with optional exceptions',
  category: 'boats',
  options: [
    {
      name: 'running',
      type: 'boolean',
      description: 'Set boats to running (true) or not running (false)',
      required: true,
    },
    { name: 'exceptions', type: 'string', description: 'Comma-separated boat names to leave unchanged (optional)' },
  ],
};

const data = buildCommand(commandData);
//TODO: for boats names use autocomplete to suggest existing boat names

async function execute(interaction: ChatInputCommandInteraction) {
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

export { data, execute, commandData };
