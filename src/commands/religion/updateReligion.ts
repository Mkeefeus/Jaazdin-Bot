import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  SlashCommandBuilder,
  userMention,
} from 'discord.js';
import { Domain, Religion } from '~/db/models/Religion';
import { formatNames } from '~/functions/helpers';

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

	let domain_id = 0;

  if (follower_count == null) follower_count = selectedReligion?.dataValues.follower_count;

  if (new_name == null) new_name = old_name;

	// TODO fix domain not changing. 
  if (domainName == null) domain_id = selectedReligion?.dataValues.domain_id;
  else {
    const domainData = await Domain.findOne({
      where: {
        name: domainName,
      },
    });

    domain_id = domainData?.dataValues.domain_id;
  }

  selectedReligion?.update({
    name: new_name,
    domain: domain_id,
    follower_count: follower_count,
  });

  const title = `Religion ${new_name}`;
  const message = `${new_name} was successfully successfully updated!`;

  // await interaction.reply(message);
  await interaction.reply({
    content: userMention(interaction.user.id),
    embeds: [new EmbedBuilder().setTitle(title).setDescription(message).setColor(Colors.Yellow)],
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
