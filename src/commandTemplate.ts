import { ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';

import { CommandData } from '~/types';

const commandData: CommandData = {
  name: '',
  alias: '', // Optional, can also be an array of strings
  description: '',
  category: '',
  options: [
    // Define command options here. If none, remove options property.
  ],
};

async function execute(interaction: ChatInputCommandInteraction) {
  // Command execution logic here
}

// Remove if not needed
async function autocomplete(interaction: AutocompleteInteraction) {
  // Autocomplete logic here
}

// Other exports can be exported here rather then inline
export { execute, autocomplete, commandData };
