import { AutocompleteInteraction, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { findReligionByName, checkReligionExists, religionCommandAutocomplete } from '~/functions/religionHelpers';
import { replyWithUserMention, parseChangeString } from '~/functions/helpers';
import showReligion from './showReligion';
import { Domain } from '~/db/models/Religion';
import { HelpData } from '~/types/command';

export const data = new SlashCommandBuilder()
  .setName('updatereligion')
  .setDescription('Will update a religion from the active religions')
  .addStringOption((option) =>
    option.setName('name').setDescription('The name of the religion').setRequired(true).setAutocomplete(true)
  )
  .addStringOption((option) => option.setName('newname').setDescription('The new name of the religion (optional)'))
  .addStringOption((option) =>
    option.setName('domain').setDescription('The domain of the religion').setAutocomplete(true)
  )
  .addStringOption((option) =>
    option.setName('followercount').setDescription('The follower count (+x to add, -x to subtract, =x to set exactly)')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
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
    0, null,
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

  const message = await showReligion.showReligion(selectedReligion);

  await replyWithUserMention(interaction, [message]);
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  await religionCommandAutocomplete(interaction);
}

export const help: HelpData = {
  name: 'updatereligion',
  description: 'Update religion properties such as name, domain, or follower count',
  category: 'religion',
};

export default {
  data,
  execute,
  autocomplete,
};