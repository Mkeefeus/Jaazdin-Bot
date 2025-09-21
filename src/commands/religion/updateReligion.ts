import { AutocompleteInteraction, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { findReligionByName, checkReligionExists, religionCommandAutocomplete, buildCommand, parseChangeString, replyWithUserMention } from '~/helpers';
import { showReligion } from './showReligion';
import { Domain } from '~/db/models/Religion';
import { CommandData } from '~/types';

const commandData: CommandData = {
  name: 'updatereligion',
  description: 'Will update a religion from the active religions',
  category: 'religion',
  options: [
    {
      name: 'name',
      type: 'string',
      description: 'The name of the religion',
      required: true,
      autocomplete: true,
    },
    {
      name: 'newname',
      type: 'string',
      description: 'The new name of the religion (optional)',
    },
    {
      name: 'domain',
      type: 'string',
      description: 'The domain of the religion',
      autocomplete: true,
    },
    {
      name: 'followercount',
      type: 'string',
      description: 'The follower count (+x to add, -x to subtract, =x to set exactly)',
    },
  ],
};

const data = buildCommand(commandData);

async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;

  // Use helper to find religion with error handling
  const selectedReligion = await findReligionByName(interaction, name);
  if (!selectedReligion) {
    return;
  }

  let new_name = interaction.options.getString('newname')?.toLowerCase() as string;
  const domainName = interaction.options.getString('domain')?.toLowerCase() as string;
  const follower_count = interaction.options.getString('followercount');
  let domain = 0;

  if (new_name == null) new_name = name;

  if (domainName == null) {
    domain = selectedReligion.dataValues.domain_id;
  } else {
    const domainData = await Domain.findOne({ where: { name: domainName } });
    if (!domainData) {
      await interaction.reply({
        content: `Domain "${domainName}" not found.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    domain = domainData.dataValues.id;
  }

  const newFollowerCount = await parseChangeString(
    follower_count,
    selectedReligion.dataValues.follower_count,
    'follower count',
    0,
    null,
    interaction
  );
  if (newFollowerCount === null) return;

  // Cap the follower count at 0 if it's below.
  if (newFollowerCount < 0) {
    await interaction.reply({
      content: `Follower count is below 0 from this change. Please provide a valid follower count.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Check to see if the new name to update doesn't already exist
  if (new_name !== name) {
    if (await checkReligionExists(interaction, new_name)) {
      return;
    }
  }

  await selectedReligion.update({
    name: new_name,
    domain_id: domain,
    follower_count: newFollowerCount,
  });

  const message = await showReligion(selectedReligion);

  await replyWithUserMention(interaction, [message]);
}

async function autocomplete(interaction: AutocompleteInteraction) {
  await religionCommandAutocomplete(interaction);
}

export { data, execute, commandData, autocomplete };
