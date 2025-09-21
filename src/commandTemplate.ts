import { ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { buildCommand } from '~/helpers';
import { CommandData } from '~/types';

const commandData: CommandData = {
  name: '',
  description: '',
  category: '',
  options: [
    // Define command options here
  ],
};

const data = buildCommand(commandData);

async function execute(interaction: ChatInputCommandInteraction) {
  // Command execution logic here
}

async function autocomplete(interaction: AutocompleteInteraction) {
  // Autocomplete logic here
}

export { data, execute, autocomplete, commandData };
