import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { MagicItem } from '../../db/models/MagicItem';
import {
  getRandomItemByTable,
  createItemEmbed,
  genericTableAutocomplete,
  calculateSimpleItemPrice,
} from '~/functions/boatHelpers';
import { checkUserRole } from '~/functions/helpers';
import { Roles } from '~/types/roles';

//TODO gm command only.

export const data = new SlashCommandBuilder()
  .setName('generatemagicitem')
  .setDescription('Generate a random magic item from a selected table')
  .addStringOption((option) =>
    option.setName('table').setDescription('Magic item table').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  await genericTableAutocomplete(
    interaction,
    '~/db/models/MagicItem',
    'table',
    (table) => `Table ${table.toUpperCase()}`
  );
}

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, Roles.DM)) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true,
    });
    return;
  }

  const table = interaction.options.getString('table', true);

  const item = await getRandomItemByTable<MagicItem>('~/db/models/MagicItem', table);
  if (!item) {
    await interaction.reply({
      content: `No items found for table ${table}.`,
      ephemeral: true,
    });
    return;
  }

  const price = calculateSimpleItemPrice(item);

  const embed = createItemEmbed(
    `Random Magic Item (Table ${table.toUpperCase()})`,
    item.name,
    [{ name: 'Price', value: `${price} gp` }],
    0x8e44ad
  );

  await interaction.reply({ embeds: [embed] });
}

export const help = {
  name: 'generatemagicitem',
  description: 'Generate a random magic item by table type',
  requiredRole: Roles.DM,
  category: 'items',
};
