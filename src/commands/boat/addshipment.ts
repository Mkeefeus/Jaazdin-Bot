import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, EmbedBuilder } from 'discord.js';
import { Shipment } from '~/db/models/Boat';
import { boatNameAutocomplete, formatShipmentInfo } from '~/functions/boatHelpers';
import { checkUserRole, formatNames } from '~/functions/helpers';
import { Roles } from '~/types/roles';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('addshipment')
  .setDescription('Add a new shipment item to a boat')
  .addStringOption((opt) => opt.setName('boat').setDescription('Boat name').setRequired(true).setAutocomplete(true))
  .addStringOption((opt) => opt.setName('item').setDescription('Item name').setRequired(true))
  .addIntegerOption((opt) => opt.setName('price').setDescription('Item price (gp)').setRequired(true))
  .addIntegerOption((opt) => opt.setName('quantity').setDescription('Quantity').setRequired(true).setMinValue(1));

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
  const price = interaction.options.getInteger('price', true);
  const quantity = interaction.options.getInteger('quantity', true);

  try {
    await Shipment.create({
      boatName,
      itemName,
      price,
      quantity,
    });

    // Show updated shipment list
    const shipmentInfo = await formatShipmentInfo(boatName);

    const embed = new EmbedBuilder()
      .setTitle(`✅ Shipment Added to ${formatNames(boatName)}`)
      .setDescription(`Added **${formatNames(itemName)}** (x${quantity}, ${price}gp each)\n\n${shipmentInfo}`)
      .setColor(0x00ff00);

    await interaction.reply({
      embeds: [embed],
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
  await boatNameAutocomplete(interaction, true); // Only running boats
}
