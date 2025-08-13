import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction, MessageFlags } from 'discord.js';
import { Shipment } from '~/db/models/Boat';
import { boatNameAutocomplete, itemNameAutocomplete, updateBoatEmbed } from '~/functions/boatHelpers';
import { formatNames } from '~/functions/helpers';

export const data = new SlashCommandBuilder()
  .setName('purchaseshipment')
  .setDescription('Purchase a shipment item from a boat (subtracts 1 from quantity, deletes if zero)')
  .addStringOption((opt) => opt.setName('boat').setDescription('Boat name').setRequired(true).setAutocomplete(true))
  .addStringOption((opt) => opt.setName('item').setDescription('Item name').setRequired(true).setAutocomplete(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  // if (!checkUserRole(interaction, Roles.GM)) {
  //   await interaction.reply({
  //     content: 'You do not have permission to use this command.',
  //     flags: MessageFlags.Ephemeral,
  //   });
  //   return;
  // }

  const boatName = interaction.options.getString('boat', true);
  const itemName = interaction.options.getString('item', true);

  // Use helper to find shipment with error handling
  const shipment = await Shipment.findOne({ where: { boatName, itemName } });

  if (!shipment) {
    await interaction.reply({
      content: `⚠️ **Shipment Not Found**\n\nNo shipment found for boat **${formatNames(boatName)}** with item **${formatNames(itemName)}**.`,
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }
  const price = shipment.price;

  if (shipment.quantity <= 1) {
    await shipment.destroy();

    // Update the boat's Discord embed if it exists
    await updateBoatEmbed(boatName);

    await interaction.reply({
      content: `💰 **Purchase Complete!**\n\nYou purchased the last **${formatNames(itemName)}** from **${formatNames(boatName)}** for **${price} gp**.\n\n⚠️ This item is now sold out!`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  shipment.quantity -= 1;
  await shipment.save();

  // Update the boat's Discord embed if it exists
  await updateBoatEmbed(boatName);

  await interaction.reply({
    content: `💰 **Purchase Complete!**\n\nYou purchased **${formatNames(itemName)}** from **${formatNames(boatName)}** for **${price} gp**.\n\n📦 Remaining quantity: **${shipment.quantity}**`,
    flags: MessageFlags.Ephemeral,
  });
}

// Autocomplete for boat name and item name
export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);
  if (focusedOption.name === 'boat') {
    await boatNameAutocomplete(interaction, { runningOnly: true, inTown: true }); // Only running boats
  } else if (focusedOption.name === 'item') {
    await itemNameAutocomplete(interaction);
  }
}

export const help = {
  name: 'purchaseshipment',
  description: 'Purchase a shipment item from a boat (subtracts 1 from quantity, deletes if zero)',
  category: 'boats',
};
