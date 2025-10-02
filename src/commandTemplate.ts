import { ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { buildCommand } from '~/helpers';
import { CommandData } from '~/types';

const commandData: CommandData = {
  name: '',
  description: '',
  category: '',
  options: [
    // Define command options here. If none, remove options property.
  ],
};

const data = buildCommand(commandData);

async function execute(interaction: ChatInputCommandInteraction) {
  // Command execution logic here
}

// Remove if not needed
async function autocomplete(interaction: AutocompleteInteraction) {
  // Autocomplete logic here
}

// Other exports can be exported here rather then inline
export { data, execute, autocomplete, commandData };
