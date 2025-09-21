import { db } from '~/db/db';
import { ChatInputCommandInteraction } from 'discord.js';
import { buildCommand } from '~/functions/commandHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types';
import { CommandData } from '~/types';

const commandData: CommandData = {
  name: 'sql',
  description: 'Execute a SQL query on the database',
  category: 'utility',
  options: [
    {
      name: 'query',
      type: 'string',
      description: 'The SQL query to execute',
      required: true,
    },
  ],
};

const data = buildCommand(commandData);

async function execute(interaction: ChatInputCommandInteraction) {
  const hasRole = checkUserRole(interaction, Roles.BOT_DEV);
  if (!hasRole) {
    await interaction.reply('You do not have permission to use this command');
    return;
  }

  const query = interaction.options.getString('query', true);

  try {
    const [results] = await db.query(query);
    // const [results, metadata] = await db.query("SELECT * from Ingredient");
    console.log('Query results:', results);
    await interaction.reply('Query executed successfully: ' + JSON.stringify(results));
  } catch (e) {
    console.error('Error executing query:', e);
    await interaction.reply('Error executing query');
  }
}

export { data, execute, commandData };

export default {
  data,
  execute,
};
