import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder } from 'discord.js';
import {
  findBoatByName,
  buildBoatUpdatesFromOptions,
  handleShipmentUpdate,
  createBoatUpdateMessage,
  boatNameAutocomplete,
  tableNamesAutocomplete,
} from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';

//TODO gm command only.
// This command updates boat properties and automatically manages shipments:
// - If boat becomes in town with a valid table, generates new shipment
// - If boat leaves town or table is removed/changed, clears shipments
// - If table changes while in town, regenerates shipment with new table

export const data = new SlashCommandBuilder()
  .setName('updateboat')
  .setDescription('Update properties of an existing boat')
  .addStringOption((opt) =>
    opt.setName('name').setDescription('Boat name (required)').setRequired(true).setAutocomplete(true)
  )
  .addStringOption((opt) => opt.setName('city').setDescription('City of origin').setRequired(false))
  .addStringOption((opt) => opt.setName('country').setDescription('Country of origin').setRequired(false))
  .addIntegerOption((opt) => opt.setName('waittime').setDescription('Weeks at sea').setRequired(false))
  .addIntegerOption((opt) => opt.setName('timeintown').setDescription('Weeks in town').setRequired(false))
  .addStringOption((opt) => opt.setName('tier2ability').setDescription('Tier 2 ability description').setRequired(false))
  .addStringOption((opt) =>
    opt.setName('table').setDescription('Table to generate (optional)').setRequired(false).setAutocomplete(true)
  )
  .addBooleanOption((opt) => opt.setName('istier2').setDescription('Is this a tier 2 boat?').setRequired(false))
  .addBooleanOption((opt) => opt.setName('isrunning').setDescription('Is this boat running?').setRequired(false))
  .addIntegerOption((opt) => opt.setName('weeksleft').setDescription('Weeks left (optional)').setRequired(false))
  .addBooleanOption((opt) => opt.setName('isintown').setDescription('Is the boat in town?').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, Roles.GM)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true,
    });
    return;
  }

  const boatName = interaction.options.getString('name', true);

  // Use helper to find boat with error handling
  const boat = await findBoatByName(interaction, boatName);
  if (!boat) {
    return;
  }

  // Build update object using helper
  const { updates, error } = buildBoatUpdatesFromOptions(interaction, boat);
  if (error) {
    await interaction.reply({
      content: error,
      ephemeral: true,
    });
    return;
  }

  try {
    // Update the boat
    await boat.update(updates);

    // Handle shipment generation/removal based on the updates
    await handleShipmentUpdate(boat, updates);

    // Create response message using helper
    const responseMessage = await createBoatUpdateMessage(boatName, updates, boat);

    const embed = new EmbedBuilder().setDescription(responseMessage).setColor(0x2e86c1);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    await interaction.reply({ content: `Failed to update boat: ${error}`, ephemeral: true });
  }
}

// Autocomplete for boat name and table options
export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);

  if (focusedOption.name === 'name') {
    await boatNameAutocomplete(interaction);
  } else if (focusedOption.name === 'table') {
    await tableNamesAutocomplete(interaction);
  }
}
