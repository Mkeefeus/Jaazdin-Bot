import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  SlashCommandBuilder,
  userMention,
} from 'discord.js';
import { Religion } from '~/db/models/Religion';
import { formatNames } from '~/functions/helpers';

export const data = new SlashCommandBuilder()
  .setName('changefollowers')
  .setDescription('Will add followers to a selected religion')
  .addStringOption((option) =>
    option.setName('name').setDescription('The name of the religion').setRequired(true).setAutocomplete(true)
  )
  .addIntegerOption((option) =>
    option.setName('followercount').setDescription('The modified number of followers to add.').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;
  const selectedReligion = await Religion.findOne({
    where: {
      name: name,
    },
  });

  const follower_count = interaction.options.getInteger('followercount');

  selectedReligion?.update({
    follower_count: selectedReligion?.dataValues.follower_count + follower_count,
  });

  const title = `Religion ${name}`;
  const message = `${name} was successfully successfully updated!`;

  await interaction.reply({
    content: userMention(interaction.user.id),
    embeds: [new EmbedBuilder().setTitle(title).setDescription(message).setColor(Colors.Yellow)],
  });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const religions = await Religion.findAll();

  const filtered = religions.filter((religion) => religion.dataValues.name.toLowerCase().startsWith(focusedValue));

  await interaction.respond(
    filtered
      .map((religion) => ({
        name: formatNames(religion.dataValues.name), // Display nicely formatted
        value: religion.dataValues.name, // Keep lowercase for database lookup
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
}

export default {
  data,
  execute,
  autocomplete,
};
