import { AutocompleteInteraction, SlashCommandBuilder } from 'discord.js';
import { FertilizerType, Plant } from '~/db/models/Plant';
import { formatNames } from '~/functions/helpers';

export const data = new SlashCommandBuilder()
  .setName('updateplant')
  .setDescription('Update one of your plants')
  .addStringOption((option) =>
    option.setName('plant').setDescription('The plant to update').setRequired(true).setAutocomplete(true)
  )
  .addStringOption((option) =>
    option
      .setName('field')
      .setDescription('The field to update')
      .setRequired(true)
      .addChoices(
        { name: 'Quantity', value: 'quantity' },
        { name: 'Fertilizer Type', value: 'fertilizer_type' },
        { name: 'Character', value: 'character' },
        { name: 'Persistent Fertilizer', value: 'has_persistent_fertilizer' },
        { name: 'Yield', value: 'yield' },
        { name: 'Weeks Remaining', value: 'weeks_remaining' }
      )
  )
  .addStringOption((option) =>
    option.setName('value').setDescription('The new value for the field').setRequired(true).setAutocomplete(true)
  );

function getValueChoices(field: string): { name: string; value: string }[] {
  const choices: { name: string; value: string }[] = [];
  if (field === 'fertilizer_type') {
    choices.push(
      { name: 'None', value: FertilizerType.NONE },
      { name: 'Robust', value: FertilizerType.ROBUST },
      { name: 'Fortifying', value: FertilizerType.FORTIFYING },
      { name: 'Enriching', value: FertilizerType.ENRICHING },
      { name: 'Speed-Grow', value: FertilizerType.SPEEDGROW },
      { name: 'Miracle-Grow', value: FertilizerType.MIRACLEGROW },
      { name: 'Mystery-Grow', value: FertilizerType.MYSTERYGROW }
    );
  } else if (field === 'has_persistent_fertilizer') {
    choices.push({ name: 'Yes', value: 'true' }, { name: 'No', value: 'false' });
  }
  return choices;
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);
  if (focusedOption.name === 'plant') {
    const plants = await Plant.findAll({
      where: { user: interaction.user.id },
      attributes: ['name', 'weeks_remaining', 'id', 'character', 'quantity'],
    });
    if (!plants || plants.length === 0) {
      await interaction.respond([{ name: 'No plants found', value: 'none' }]);
      return;
    }
    const choices = plants.map((plant) => {
      if (!plant.id) {
        {
          console.error(`Plant with name ${plant.name} has no ID.`);
          return { name: 'Error: Plant ID not found', value: 'error' };
        }
      }
      return {
        name: `${formatNames(plant.character)}'s ${formatNames(plant.name)} x${plant.quantity} (${plant.weeks_remaining} weeks remaining)`,
        value: plant.id.toString(),
      };
    });
    await interaction.respond(choices);
  } else if (focusedOption.name === 'value') {
    const field = interaction.options.getString('field');
    if (!field) {
      await interaction.respond([{ name: 'No field selected', value: 'none' }]);
      return;
    }
    const valueChoices = getValueChoices(field);
    await interaction.respond(valueChoices);
  } else {
    await interaction.respond([]);
  }
}

export async function execute(interaction: AutocompleteInteraction) {
  console.log('Update Plant Command Executed');
}

export default {
  data,
  autocomplete,
};
