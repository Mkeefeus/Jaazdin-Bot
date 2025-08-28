import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { Domain, Religion } from '~/db/models/Religion';
import { findReligionByName, religionCommandAutocomplete } from '~/functions/religionHelpers';
import { replyWithUserMention, formatNames } from '~/functions/helpers';
import { HelpData } from '~/types/command';


export const data = new SlashCommandBuilder()
  .setName('showreligion')
  .setDescription('Show all information about selected religion')
  .addStringOption((option) =>
    option.setName('name').setDescription('The name of the religion').setRequired(true).setAutocomplete(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;

  // Use helper to find religion with error handling
  const selectedReligion = await findReligionByName(interaction, name);
  if (!selectedReligion) {
    return;
  }

  const message = await showReligion(selectedReligion);

  await replyWithUserMention(interaction, [message]);
}

async function showReligion(religion: Religion | null): Promise<EmbedBuilder> {
  //get domain name
  const domainData = await Domain.findOne({
    where: {
      id: religion?.dataValues.domain_id,
    },
  });

  // 📖 for religion name, ✨ for domain, 🌟 for dominant effect, 👥 for followers
  const title = `📖 ${formatNames(religion?.dataValues.name || '')}`;
  const message = `**✨ Domain:** ${formatNames(domainData?.dataValues.name)}
**🌟 Dominant Effect:** ${domainData?.dataValues.dominant_effect || 'None'}
**👥 Follower Count:** ${religion?.dataValues.follower_count}`;

  return new EmbedBuilder().setTitle(title).setDescription(message).setColor(Colors.Yellow);
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  await religionCommandAutocomplete(interaction);
}

export const help: HelpData = {
  name: 'showreligion',
  description: 'Display detailed information about a specific religion',
  category: 'religion',
};

export default {
  data,
  execute,
  autocomplete,
  showReligion,
};
