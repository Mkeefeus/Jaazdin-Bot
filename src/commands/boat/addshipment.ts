import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { Shipment } from '~/db/models/Shipment';
import { Boat } from '~/db/models/Boat';

export const data = new SlashCommandBuilder()
  .setName('addshipment')
  .setDescription('Add a new shipment item to a boat')
  .addStringOption((opt) => opt.setName('boat').setDescription('Boat name').setRequired(true).setAutocomplete(true))
  .addStringOption((opt) => opt.setName('item').setDescription('Item name').setRequired(true))
  .addIntegerOption((opt) => opt.setName('price').setDescription('Item price (gp)').setRequired(true))
  .addIntegerOption((opt) => opt.setName('quantity').setDescription('Quantity').setRequired(true).setMinValue(1));

export async function execute(interaction: ChatInputCommandInteraction) {
  const boatName = interaction.options.getString('boat', true);
  const itemName = interaction.options.getString('item', true);
  const price = interaction.options.getInteger('price', true);
  const quantity = interaction.options.getInteger('quantity', true);

  try {
    await Shipment.create({
      boatName,
      itemName,
      price,
      quantity,
    });

    await interaction.reply({
      content: `Shipment item **${itemName}** (x${quantity}, ${price}gp each) added to boat **${boatName}**.`,
      ephemeral: true,
    });
  } catch (error) {
    await interaction.reply({
      content: `Failed to add shipment: ${error}`,
      ephemeral: true,
    });
  }
}

// Autocomplete for boat name
export async function autocomplete(interaction: AutocompleteInteraction) {
  const focused = interaction.options.getFocused().toLowerCase();
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
}
