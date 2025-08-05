import { AutocompleteInteraction } from 'discord.js';
import { getAvailableJobNames } from './boatHelpers';
import { formatNames } from './helpers';

/**
 * Simple autocomplete for single job names (no comma handling)
 */
export async function singleJobNameAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focusedValue = interaction.options.getFocused();
  const jobNames = getAvailableJobNames();
  
  // Remove any JSON formatting characters from the input
  const input = focusedValue
    .replace(/[[\]"]/g, '')
    .trim()
    .toLowerCase();
  
  const filtered = jobNames
    .filter((name) => name.toLowerCase().startsWith(input))
    .slice(0, 25)
    .map((name) => ({
      name: formatNames(name),
      value: name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  await interaction.respond(filtered);
}
