import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Religion } from '~/db/models/Religion';
import { checkReligionExists, findDomainByName, religionCommandAutocomplete } from '~/functions/religionHelpers';
import { replyWithUserMention } from '~/functions/helpers';
import showReligion from './showReligion';

//TODO player command only.

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

  // Check if religion name already exists using helper
  if (await checkReligionExists(interaction, name)) {
    return;
  }

  const domainData = await findDomainByName(domain);
  if (!domainData) {
    await interaction.reply({
      content: `Domain "${domain}" not found.`,
      ephemeral: true,
    });
    return;
  }

  const selectedReligion = await Religion.create({
    name: name,
    domain_id: domainData.dataValues.id,
    follower_count: 0,
  });

  const message = await showReligion.showReligion(selectedReligion);

  await replyWithUserMention(interaction, [message]);
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  await religionCommandAutocomplete(interaction);
}

export default {
  data,
  execute,
  autocomplete,
};
