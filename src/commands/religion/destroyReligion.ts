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
  .setName('destroyreligion')
  .setDescription('Will remove a religion from the active religions')
  .addStringOption((option) =>
    option.setName('name').setDescription('The name of the religion').setRequired(true).setAutocomplete(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;

  await Religion.destroy({
    where: {
      name: name,
    },
  });

  const title = `Religion ${name}`;
  const message = `${name} was successfully removed from the religion list!`;

  // await interaction.reply(message);
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
