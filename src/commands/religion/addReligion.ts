import { AutocompleteInteraction, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Domain, Religion } from '~/db/models/Religion';
import { checkReligionExists, religionCommandAutocomplete } from '~/functions/religionHelpers';
import { replyWithUserMention } from '~/functions/helpers';
import showReligion from './showReligion';
import { HelpData } from '~/types';

export const data = new SlashCommandBuilder()
  .setName('addreligion')
  .setDescription('Will add a religion from the active religions')
  .addStringOption((option) => option.setName('name').setDescription('The name of the religion.').setRequired(true))
  .addStringOption((option) =>
    option.setName('domain').setDescription('The domain of the religion').setRequired(true).setAutocomplete(true)
  )
  .addIntegerOption((option) =>
    option.setName('follower_count').setDescription('The number of followers of the religion (default 0)').setRequired(false).setMinValue(0)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;
  const domain = interaction.options.getString('domain')?.toLowerCase() as string;
  const followers = interaction.options.getInteger('follower_count') ?? 0;

  // Check if religion name already exists using helper
  if (await checkReligionExists(interaction, name)) {
    return;
  }

  const domainData = await Domain.findOne({ where: { name: domain.toLowerCase() } });
  if (!domainData) {
    await interaction.reply({
      content: `Domain "${domain}" not found.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const selectedReligion = await Religion.create({
    name: name,
    domain_id: domainData.dataValues.id,
    follower_count: followers,
  });

  const message = await showReligion.showReligion(selectedReligion);

  await replyWithUserMention(interaction, [message]);
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  await religionCommandAutocomplete(interaction);
}

export const help: HelpData = {
  name: 'addreligion',
  description: 'Add a new religion with specified name, domain and followers',
  category: 'religion',
};

export default {
  data,
  execute,
  autocomplete,
};
