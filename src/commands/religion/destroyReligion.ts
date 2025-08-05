import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import { Religion } from '~/db/models/Religion';
import { formatNames, createConfirmationButtons, createConfirmationEmbed, handleConfirmationWorkflow } from '~/functions/helpers';
import { findReligionByName, religionCommandAutocomplete } from '~/functions/religionHelpers';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('destroyreligion')
  .setDescription('Will remove a religion from the active religions')
  .addStringOption((option) =>
    option.setName('name').setDescription('The name of the religion').setRequired(true).setAutocomplete(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;

  // Use helper to find religion with error handling
  const religion = await findReligionByName(interaction, name);
  if (!religion) {
    return;
  }

  // Build religion details for confirmation
  const details = `**Followers:** ${religion.dataValues.follower_count}`;

  // Create confirmation elements
  const row = createConfirmationButtons();
  const confirmEmbed = createConfirmationEmbed(
    'Confirm Religion Destruction',
    formatNames(religion.dataValues.name),
    details
  );

  // Handle the confirmation workflow
  await handleConfirmationWorkflow(
    interaction,
    confirmEmbed,
    row,
    async () => {
      await Religion.destroy({ where: { name } });

      return {
        title: 'Religion Destroyed',
        description: `${formatNames(name)} was successfully removed from the religion list!`
      };
    },
    'Religion destruction cancelled.'
  );
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  await religionCommandAutocomplete(interaction);
}

export default {
  data,
  execute,
  autocomplete,
};
