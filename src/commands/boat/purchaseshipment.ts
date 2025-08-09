import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { findShipmentByBoatAndItem, handleShipmentPurchase, boatNameAutocomplete } from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('purchaseshipment')
  .setDescription('Purchase a shipment item from a boat (subtracts 1 from quantity, deletes if zero)')
  .addStringOption((opt) => opt.setName('boat').setDescription('Boat name').setRequired(true).setAutocomplete(true))
  .addStringOption((opt) => opt.setName('item').setDescription('Item name').setRequired(true).setAutocomplete(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, Roles.GM)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true,
    });
    return;
  }

  const boatName = interaction.options.getString('boat', true);
  const itemName = interaction.options.getString('item', true);

  // Use helper to find shipment with error handling
  const shipment = await findShipmentByBoatAndItem(interaction, boatName, itemName);
  if (!shipment) {
    return;
  }

  // Use helper to handle purchase logic
  await handleShipmentPurchase(interaction, shipment, boatName, itemName);
}

// Autocomplete for boat name and item name
export async function autocomplete(interaction: AutocompleteInteraction) {
  // This command only needs boat name autocomplete
  await boatNameAutocomplete(interaction);
}
