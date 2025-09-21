import { AutocompleteInteraction, ChatInputCommandInteraction, Colors, EmbedBuilder } from 'discord.js';
import { Domain, Religion } from '~/db/models/Religion';
import { buildCommand, findReligionByName, formatNames, religionCommandAutocomplete, replyWithUserMention } from '~/helpers';
import { CommandData } from '~/types';

const commandData: CommandData = {
  name: 'showreligion',
  description: 'Show all information about selected religion',
  category: 'religion',
  options: [
    {
      name: 'name',
      type: 'string',
      description: 'The name of the religion',
      required: true,
      autocomplete: true,
    },
  ],
};

const data = buildCommand(commandData);

async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name')?.toLowerCase() as string;

  // Use helper to find religion with error handling
  const selectedReligion = await findReligionByName(interaction, name);
  if (!selectedReligion) {
    return;
  }

  const message = await showReligion(selectedReligion);

  await replyWithUserMention(interaction, [message], true);
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

async function autocomplete(interaction: AutocompleteInteraction) {
  await religionCommandAutocomplete(interaction);
}

export { data, execute, commandData, autocomplete, showReligion };
