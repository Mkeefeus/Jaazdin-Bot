import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { findReligionByName, findDomainByName, parseFollowerCountChange, checkReligionExists, religionCommandAutocomplete } from '~/functions/religionHelpers';
import { replyWithUserMention } from '~/functions/helpers';
import showReligion from './showReligion';

//TODO player command only.

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
  .addStringOption((option) => option.setName('followercount').setDescription('The follower count (+x to add, -x to subtract, =x to set exactly)'));

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
  let newFollowerCount = 0;

  if (new_name == null) new_name = name;

  if (domainName == null) {
    domain = selectedReligion.dataValues.domain_id;
  } else {
    const domainData = await findDomainByName(domainName);
    if (!domainData) {
      await interaction.reply({
        content: `Domain "${domainName}" not found.`,
        ephemeral: true,
      });
      return;
    }
    domain = domainData.dataValues.id;
  }

  if (follower_count == null) {
    newFollowerCount = selectedReligion.dataValues.follower_count;
  } else {
    // Use helper to parse follower count change
    const result = parseFollowerCountChange(follower_count, selectedReligion.dataValues.follower_count);
    if (result.error) {
      await interaction.reply({
        content: result.error,
        ephemeral: true,
      });
      return;
    }
    newFollowerCount = result.value;
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

export default {
  data,
  execute,
  autocomplete,
};
