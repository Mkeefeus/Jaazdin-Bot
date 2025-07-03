import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder, userMention } from 'discord.js';
import { Domain, Religion } from '~/db/models/Religion';
import { formatNames } from '~/functions/helpers';
import showReligion from './showReligion';

export const data = new SlashCommandBuilder()
  .setName('updatereligion')
  .setDescription('Will update a religion from the active religions')
  .addStringOption((option) =>
    option.setName('oldname').setDescription('The old name of the religion').setRequired(true).setAutocomplete(true)
  )
  .addStringOption((option) => option.setName('newname').setDescription('The name of the religion.'))
  .addStringOption((option) =>
    option.setName('domain').setDescription('The domain of the religion').setAutocomplete(true)
  )
  .addIntegerOption((option) => option.setName('followercount').setDescription('The new number of followers'));

export async function execute(interaction: ChatInputCommandInteraction) {
  const old_name = interaction.options.getString('oldname')?.toLowerCase() as string;
  const selectedReligion = await Religion.findOne({
    where: {
      name: old_name,
    },
  });

  let new_name = interaction.options.getString('newname')?.toLowerCase() as string;
  const domainName = interaction.options.getString('domain')?.toLowerCase() as string;

  let follower_count = interaction.options.getInteger('followercount');

  let domain = 0;

  if (follower_count == null) follower_count = selectedReligion?.dataValues.follower_count;

  if (new_name == null) new_name = old_name;

  if (domainName == null) {
    domain = selectedReligion?.dataValues.domain_id;
  } else {
    const domainData = await Domain.findOne({
      where: {
        name: domainName,
      },
    });

    domain = domainData?.dataValues.id;
  }

  // Check to see if the new name to update doesn't already exist
  if (new_name !== old_name) {
    const existingReligion = await Religion.findOne({
      where: {
        name: new_name,
      },
    });
    if (existingReligion) {
      await interaction.reply({
        content: `A religion with the name "${formatNames(new_name)}" already exists.`,
        ephemeral: true,
      });
      return;
    }
  }

  selectedReligion?.update({
    name: new_name,
    domain_id: domain,
    follower_count: follower_count,
  });

  const message = await showReligion.showReligion(selectedReligion);

  await interaction.reply({
    content: userMention(interaction.user.id),
    embeds: [message],
  });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const focusedOption = interaction.options.getFocused(true).name;

  let filtered = [];
  if (focusedOption === 'domain') {
    const domains = await Domain.findAll();

    filtered = domains.filter((domain) => domain.dataValues.name.toLowerCase().startsWith(focusedValue));
    await interaction.respond(
      filtered
        .slice(0, 25)
        .map((domain) => ({
          name: formatNames(domain.dataValues.name), // Display nicely formatted
          value: domain.dataValues.name, // Keep lowercase for database lookup
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  }
  if (focusedOption === 'oldname') {
    const religions = await Religion.findAll();

    filtered = religions.filter((religion) => religion.dataValues.name.toLowerCase().startsWith(focusedValue));
    await interaction.respond(
      filtered
        .slice(0, 25)
        .map((religion) => ({
          name: formatNames(religion.dataValues.name), // Display nicely formatted
          value: religion.dataValues.name, // Keep lowercase for database lookup
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  }
}

export default {
  data,
  execute,
  autocomplete,
};
