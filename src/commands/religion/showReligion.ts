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
  .setName('showreligion')
  .setDescription('Show all information about selected religion')
  .addStringOption((option) =>
    option.setName('name').setDescription('The name of the religion').setRequired(true).setAutocomplete(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;
  const selectedReligion = await Religion.findOne({
    where: {
      name: name,
    },
  });

  const message = await showReligion(selectedReligion);

  await interaction.reply({
    content: userMention(interaction.user.id),
    embeds: [message],
  });
}

async function showReligion(religion: Religion | null) : Promise<EmbedBuilder> {
  //get domain name
  const domainData = await Domain.findOne({
    where: {
      id: religion?.dataValues.domain_id,
    },
  });

  const title = `${religion?.dataValues.name}`;
  const message = `Domain: ${domainData?.dataValues.name}
    Follower Count: ${religion?.dataValues.follower_count}
    `;

  return new EmbedBuilder().setTitle(title).setDescription(message).setColor(Colors.Yellow);
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
  showReligion,
};
