import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Shipment } from '~/db/models/Shipment';
import { Boat } from '~/db/models/Boat';

export const data = new SlashCommandBuilder()
  .setName('purchaseshipment')
  .setDescription('Purchase a shipment item from a boat (subtracts 1 from quantity, deletes if zero)')
  .addStringOption((opt) => opt.setName('boat').setDescription('Boat name').setRequired(true).setAutocomplete(true))
  .addStringOption((opt) => opt.setName('item').setDescription('Item name').setRequired(true).setAutocomplete(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const boatName = interaction.options.getString('boat', true);
  const itemName = interaction.options.getString('item', true);

  const shipment = await Shipment.findOne({ where: { boatName, itemName } });

  if (!shipment) {
    await interaction.reply({
      content: `No shipment found for boat **${boatName}** with item **${itemName}**.`,
      ephemeral: true,
    });
    return;
  }

  if (shipment.quantity <= 1) {
    await shipment.destroy();
    await interaction.reply({
      content: `You purchased the last **${itemName}** from **${boatName}**. The shipment is now sold out!`,
      ephemeral: false,
    });
    return;
  }

  shipment.quantity -= 1;
  await shipment.save();

  await interaction.reply({
    content: `You purchased **${itemName}** from **${boatName}**. Remaining quantity: ${shipment.quantity}`,
    ephemeral: false,
  });
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
