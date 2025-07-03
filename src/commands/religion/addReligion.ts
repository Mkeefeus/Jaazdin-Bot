import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder, userMention } from 'discord.js';
import { Domain, Religion } from '~/db/models/Religion';
import { formatNames } from '~/functions/helpers';
import showReligion from './showReligion';

export const data = new SlashCommandBuilder()
  .setName('addreligion')
  .setDescription('Will add a religion from the active religions')
  .addStringOption((option) => option.setName('name').setDescription('The name of the religion.').setRequired(true))
  .addStringOption((option) =>
    option.setName('domain').setDescription('The domain of the religion').setRequired(true).setAutocomplete(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;
  const domain = interaction.options.getString('domain')?.toLowerCase() as string;

  // Check if religion name already exists
  const existingReligion = await Religion.findOne({
    where: { name },
  });

  if (existingReligion) {
    await interaction.reply({
      content: `A religion with the name "${name}" already exists.`,
      ephemeral: true,
    });
    return;
  }

  const domainData = await Domain.findOne({
    where: {
      name: domain,
    },
  });

  const selectedReligion = await Religion.create({
    name: name,
    domain_id: domainData?.dataValues.id,
    follower_count: 0,
  });

  const message = await showReligion.showReligion(selectedReligion);

  await interaction.reply({
    content: userMention(interaction.user.id),
    embeds: [message],
  });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const domains = await Domain.findAll();

  const filtered = domains.filter((domain) => domain.dataValues.name.toLowerCase().startsWith(focusedValue));

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

export default {
  data,
  execute,
  autocomplete,
};
