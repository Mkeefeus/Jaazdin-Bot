import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Shipment } from '~/db/models/Boat';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';
import { Boat } from '~/db/models/Boat';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('updateshipment')
  .setDescription('Update a shipment item for a boat (by boat and item name)')
  .addStringOption((opt) => opt.setName('boat').setDescription('Boat name').setRequired(true).setAutocomplete(true))
  .addStringOption((opt) => opt.setName('item').setDescription('Item name').setRequired(true).setAutocomplete(true))
  .addIntegerOption((opt) => opt.setName('price').setDescription('New item price (gp)').setRequired(false))
  .addIntegerOption((opt) => opt.setName('quantity').setDescription('New quantity').setRequired(false));

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
  const price = interaction.options.getInteger('price');
  const quantity = interaction.options.getInteger('quantity');

  const shipment = await Shipment.findOne({ where: { boatName, itemName } });

  if (!shipment) {
    await interaction.reply({
      content: `No shipment found for boat **${boatName}** with item **${itemName}**.`,
      ephemeral: true,
    });
    return;
  }

  // If quantity is zero or less, delete the shipment
  if (quantity !== null && quantity <= 0) {
    await shipment.destroy();
    await interaction.reply({
      content: `Shipment for **${itemName}** on boat **${boatName}** has been deleted (quantity set to ${quantity}).`,
      ephemeral: true,
    });
    return;
  }

  if (price !== null) shipment.price = price;
  if (quantity !== null) shipment.quantity = quantity;

  if (price === null && quantity === null) {
    await interaction.reply({
      content: 'No updates provided. Please specify at least one field to update.',
      ephemeral: true,
    });
    return;
  }

  try {
    await shipment.save();
    await interaction.reply({
      content: `Shipment for **${itemName}** on boat **${boatName}** updated successfully.`,
      ephemeral: true,
    });
  } catch (error) {
    await interaction.reply({
      content: `Failed to update shipment: ${error}`,
      ephemeral: true,
    });
  }
}

// Autocomplete for boat name and item name
export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);

  if (focusedOption.name === 'boat') {
    const focused = focusedOption.value.toLowerCase();
    const boats = await Boat.findAll({
      attributes: ['boatName'],
      where: { isRunning: true },
    });
    const filtered = boats
      .map((b) => b.boatName)
      .filter((name) => name.toLowerCase().startsWith(focused))
      .slice(0, 25)
      .map((name) => ({ name, value: name }));
    await interaction.respond(filtered);
  } else if (focusedOption.name === 'item') {
    // Autocomplete for item names based on selected boat
    const boatName = interaction.options.getString('boat');
    if (!boatName) {
      await interaction.respond([]);
      return;
    }
    const focused = focusedOption.value.toLowerCase();
    const shipments = await Shipment.findAll({
      where: { boatName },
      attributes: ['itemName'],
    });
    const filtered = shipments
      .map((s) => s.itemName)
      .filter((name) => name.toLowerCase().startsWith(focused))
      .slice(0, 25)
      .map((name) => ({ name, value: name }));
    await interaction.respond(filtered);
  }
}

export const help = {
  name: 'updateshipment',
  description: 'Update the price or quantity of a shipment item',
  requiredRole: Roles.GM,
  category: 'boats',
};
