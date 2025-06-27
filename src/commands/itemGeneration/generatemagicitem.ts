import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { MagicItem } from '../../db/models/MagicItem';

export const data = new SlashCommandBuilder()
  .setName('generatemagicitem')
  .setDescription('Generate a random magic item from a selected table')
  .addStringOption((option) =>
    option.setName('table').setDescription('Magic item table').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  // Dynamically fetch unique tables from the database
  const items = await MagicItem.findAll({ attributes: ['table'] });
  const uniqueTables = Array.from(new Set(items.map((i) => i.table)));
  const focused = interaction.options.getFocused().toLowerCase();

  const filtered = uniqueTables
    .filter((t) => t.toLowerCase().startsWith(focused))
    .map((t) => ({
      name: `Table ${t.toUpperCase()}`,
      value: t,
    }));

  await interaction.respond(filtered);
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const table = interaction.options.getString('table', true);

  const itemChosen = await getRandomMagicItemByTable(table);
  if (!itemChosen) {
    await interaction.reply({ content: `No items found for table ${table}.`, ephemeral: true });
    return;
  }

  await interaction.reply({
    embeds: [
      {
        title: `Random Magic Item (Table ${table.toUpperCase()})`,
        description: `**Item:** ${itemChosen.name}`,
        color: 0x8e44ad,
      },
    ],
  });
}

// Utility function for use in other scripts
export async function getRandomMagicItemByTable(table: string) {
  const items = await MagicItem.findAll({ where: { table } });
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}
