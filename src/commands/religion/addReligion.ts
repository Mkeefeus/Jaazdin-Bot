import { AutocompleteInteraction, ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBuilder, userMention } from 'discord.js';
import { Domain, Religion } from '~/db/models/Religion';
import { formatNames } from '~/functions/helpers';

export const data = new SlashCommandBuilder()
  .setName('addreligion')
  .setDescription('Will remove a religion from the active religions')
  .addStringOption((option) => option.setName('name').setDescription('The name of the religion.').setRequired(true))
  .addStringOption((option) =>
    option.setName('domain').setDescription('The domain of the religion').setRequired(true).setAutocomplete(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;
  const domain = interaction.options.getString('domain')?.toLowerCase() as string;

  const domainData = await Domain.findOne({
    where: {
      name: domain,
    },
  });

  console.log(domainData);

  await Religion.create({
    name: name,
    domain_id: domainData?.dataValues.id,
    follower_count: 0,
  });

  const title = `Religion ${name}`;
  const message = `${name} was successfully added to the religion list!`;

  // await interaction.reply(message);
  await interaction.reply({
    content: userMention(interaction.user.id),
    embeds: [new EmbedBuilder().setTitle(title).setDescription(message).setColor(Colors.Yellow)],
  });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const domains = await Domain.findAll();

  const filtered = domains.filter((domain) => domain.dataValues.name.toLowerCase().startsWith(focusedValue));

  await interaction.respond(
    filtered
      .slice(0, 25)
      .map((job) => ({
        name: formatNames(job.dataValues.name), // Display nicely formatted
        value: job.dataValues.name, // Keep lowercase for database lookup
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
}

export default {
  data,
  execute,
  autocomplete,
};
