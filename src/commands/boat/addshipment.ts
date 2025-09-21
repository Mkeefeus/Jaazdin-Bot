import { ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { Shipment } from '~/db/models/Boat';
import { boatNameAutocomplete, buildCommand, checkUserRole, formatNames, updateBoatEmbed } from '~/helpers';
import { CommandData, Roles } from '~/types';

//TODO gm command only.

const commandData: CommandData = {
  name: 'addshipment',
  description: 'Add a new shipment item to a boat',
  category: 'boats',
  options: [
    { name: 'boat', type: 'string', description: 'Boat name', required: true, autocomplete: true },
    { name: 'item', type: 'string', description: 'Item name', required: true },
    { name: 'type', type: 'string', description: 'Item type', required: true },
    { name: 'price', type: 'integer', description: 'Item price (gp)', required: true },
    { name: 'quantity', type: 'integer', description: 'Quantity', required: true, minValue: 1 },
  ],
};

const data = buildCommand(commandData);

async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, Roles.GM)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const boatName = interaction.options.getString('boat', true);
  const itemName = interaction.options.getString('item', true);
  const itemType = interaction.options.getString('type', true);
  const price = interaction.options.getInteger('price', true);
  const quantity = interaction.options.getInteger('quantity', true);

  try {
    await Shipment.create({
      boatName,
      itemName,
      price,
      quantity,
      type: itemType,
    });

    // Update the boat's Discord embed if it exists
    await updateBoatEmbed(boatName);

    const embed = new EmbedBuilder()
      .setTitle(`✅ Shipment Added to ${formatNames(boatName)}`)
      .setDescription(`Added **${formatNames(itemName)}** (x${quantity}, ${price}gp each)`)
      .setColor(0x00ff00);

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    await interaction.reply({
      content: `Failed to add shipment: ${error}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}

// Autocomplete for boat name
async function autocomplete(interaction: AutocompleteInteraction) {
  await boatNameAutocomplete(interaction, { runningOnly: true, inTown: true }); // Only running boats
}

export { data, execute, commandData, autocomplete };
