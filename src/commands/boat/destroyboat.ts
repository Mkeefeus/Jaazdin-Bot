import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { Shipment } from '~/db/models/Shipment';
import { formatNames, createConfirmationButtons, createConfirmationEmbed, handleConfirmationWorkflow } from '~/functions/helpers';
import { findBoatByName, boatNameAutocomplete, destroyBoatWithCascade } from '~/functions/boatHelpers';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('destroyboat')
  .setDescription('Will remove a boat from the active boats')
  .addStringOption((option) =>
    option.setName('name').setDescription('The name of the boat').setRequired(true).setAutocomplete(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name') as string;

  // Use helper to find boat with error handling
  const boat = await findBoatByName(interaction, name);
  if (!boat) {
    return;
  }

  // Check if boat has shipments
  const shipmentCount = await Shipment.count({ where: { boatName: boat.boatName } });

  // Build boat details for confirmation
  let details = `**Status:** ${boat.isRunning ? 'Running' : 'Stopped'}\n`;
  details += `**Location:** ${boat.isInTown ? 'In Town' : 'At Sea'}\n`;
  if (boat.isRunning) {
    details += `**Weeks Left:** ${boat.weeksLeft}\n`;
  }
  if (shipmentCount > 0) {
    details += `**Active Shipments:** ${shipmentCount}\n`;
  }
  if (boat.isTier2) {
    details += `**Tier 2 Boat:** Yes\n`;
  }

  // Create confirmation elements
  const row = createConfirmationButtons();
  const confirmEmbed = createConfirmationEmbed(
    'Confirm Boat Destruction',
    boat.boatName,
    details,
    shipmentCount > 0 ? 'remove all associated shipments' : undefined
  );

  // Handle the confirmation workflow
  await handleConfirmationWorkflow(
    interaction,
    confirmEmbed,
    row,
    async () => {
      // Use the cascade deletion helper
      const result = await destroyBoatWithCascade(boat.boatName);

      return {
        title: 'Boat Destroyed',
        description: 
          `${formatNames(boat.boatName)} was successfully removed from the boat list!` +
          (result.shipmentCount > 0 ? `\n\nAlso removed ${result.shipmentCount} associated shipment(s).` : '')
      };
    },
    'Boat destruction cancelled.'
  );
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  await boatNameAutocomplete(interaction);
}

export default {
  data,
  execute,
  autocomplete,
};
