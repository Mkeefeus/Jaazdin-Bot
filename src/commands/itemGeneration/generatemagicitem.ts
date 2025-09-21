import { ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import { MagicItem } from '../../db/models/MagicItem';
import { buildCommand, checkUserRole, createItemEmbed, randomInt } from '~/helpers';
import { CommandData, Roles } from '~/types';

const commandData: CommandData = {
  name: 'generatemagicitem',
  description: 'Generate a random magic item from a selected table',
  category: 'items',
  options: [
    {
      name: 'table',
      type: 'string',
      description: 'Magic item table',
      required: true,
      autocomplete: true,
    },
  ],
};

const data = buildCommand(commandData);

async function autocomplete(interaction: AutocompleteInteraction) {
  const items = await MagicItem.findAll({
    group: ['table'],
  });
  const tables = items.map((item) => item.table).filter((value, index, self) => self.indexOf(value) === index);
  const choices = tables.map((table) => ({
    name: `Table ${table.toUpperCase()}`,
    value: table,
  }));
  await interaction.respond(choices);
}

async function getRandomMagicItemByTable(table: string): Promise<MagicItem | null> {
  const items = await MagicItem.findAll({
    where: { table },
  });
  if (items.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex].dataValues;
}

async function getRandomMagicItemByRarity(rarity: string): Promise<MagicItem | null> {
  const items = await MagicItem.findAll({
    where: { rarity },
  });
  if (items.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex].dataValues;
}

async function execute(interaction: ChatInputCommandInteraction) {
  if (!checkUserRole(interaction, [Roles.GM, Roles.DM])) {
    await interaction.reply({
      content: 'You do not have permission to use this command.',
    });
    return;
  }

  const table = interaction.options.getString('table', true);

  const item = await getRandomMagicItemByTable(table);

  if (!item) {
    await interaction.reply({
      content: `No items found for table ${table}.`,
    });
    return;
  }

  const price = randomInt(item.price_min, item.price_max);

  const embed = createItemEmbed(
    `Random Magic Item (Table ${table.toUpperCase()})`,
    item.name,
    [{ name: 'Price', value: `${price} gp` }],
    0x8e44ad
  );

  await interaction.reply({ embeds: [embed] });
}

export { data, execute, commandData, autocomplete, getRandomMagicItemByRarity, getRandomMagicItemByTable };
