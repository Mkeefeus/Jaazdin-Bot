import { AutocompleteInteraction, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { Shipment } from '~/db/models/Boat';
import { findBoatByName, boatNameAutocomplete } from '~/functions/boatHelpers';
import { buildCommand } from '~/functions/commandHelpers';
import { checkUserRole, confirmAction, formatNames } from '~/functions/helpers';
import { CommandData, Roles } from '~/types';

const commandData: CommandData = {
  name: 'destroyboat',
  description: 'Will remove a boat from the active boats',
  category: 'boats',
  options: [{ name: 'name', type: 'string', description: 'The name of the boat', required: true, autocomplete: true }],
};

const data = buildCommand(commandData);

async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name') as string;

  if (!checkUserRole(interaction, Roles.GM)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Use helper to find boat with error handling
  const boat = await findBoatByName(interaction, name);
  if (!boat) {
    return;
  }

  // Check if boat has shipments
  const shipments: Shipment[] = await Shipment.findAll({ where: { boatId: boat.id } });

  const confirmed = confirmAction({
    interaction,
    title: 'Destroy Boat',
    description: `Are you sure you want to destroy the boat **${boat.boatName}** and all of its shipments?`,
    confirmButtonText: 'Destroy',
    cancelButtonText: 'Cancel',
    fields: [
      {
        name: 'Boat Name',
        value: formatNames(boat.boatName),
        inline: true,
      },
      {
        name: 'Shipments',
        value: `${shipments.length}`,
        inline: true,
      },
    ],
    confirmEmbed: [
      {
        title: '✅ Boat Destroyed',
        description: `The boat **${boat.boatName}** has been destroyed.`,
        color: 0x4caf50, // Green
        timestamp: new Date().toISOString(),
      },
    ],
  });
  if (!confirmed) {
    return;
  }
  // Destroy all shipments for this boat
  await Promise.all(shipments.map((shipment) => shipment.destroy()));
  boat.destroy();
}

async function autocomplete(interaction: AutocompleteInteraction) {
  await boatNameAutocomplete(interaction);
}

export { data, execute, commandData, autocomplete };
