import { AutocompleteInteraction, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Domain } from '~/db/models/Religion';
import { checkUserRole, confirmAction, formatNames } from '~/functions/helpers';
import { findReligionByName, religionCommandAutocomplete } from '~/functions/religionHelpers';
import { Roles } from '~/types/roles';

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
    await interaction.reply({
      content: 'Could not find the specified religion.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const domain = await Domain.findOne({ where: { id: religion.dataValues.domain_id } });

  if (!domain) {
    await interaction.reply({
      content: 'Could not find the domain for this religion.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!checkUserRole(interaction, Roles.GM)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const confirm = await confirmAction({
    interaction,
    title: 'Destroy Religion',
    description: `Are you sure you want to destroy ${formatNames(religion.dataValues.name)}?`,
    confirmButtonText: 'Destroy',
    cancelButtonText: 'Cancel',
    fields: [
      {
        name: 'Religion Name',
        value: formatNames(religion.dataValues.name),
        inline: true,
      },
      {
        name: 'Domain',
        value: formatNames(domain.dataValues.name),
        inline: true,
      },
      {
        name: 'Followers',
        value: `${religion.dataValues.follower_count}`,
        inline: true,
      },
    ],
    confirmEmbed: [
      {
        title: '✅ Religion Destroyed',
        description: `The religion ${formatNames(religion.dataValues.name)} has been destroyed.`,
        color: 0x4caf50, // Green
        timestamp: new Date().toISOString(),
      },
    ],
  });

  if (!confirm) {
    return;
  }

  // Proceed with destruction
  religion.destroy();
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  await religionCommandAutocomplete(interaction);
}

export const help = {
  name: 'destroyreligion',
  description: 'Remove a religion from the database',
  requiredRole: Roles.GM,
  category: 'religion',
};

export default {
  data,
  execute,
  autocomplete,
};
