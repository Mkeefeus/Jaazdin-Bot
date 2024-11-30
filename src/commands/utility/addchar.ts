import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Sequelize } from 'sequelize';
import { Users } from '~/db/models/Users';

const MAX_CHARACTERS = 2;
const MAX_LENGTH = 200;

export const data = new SlashCommandBuilder()
  .setName('addchar')
  .setDescription('Add a character to the database')
  .addStringOption((option) => option.setName('name').setDescription('The name of the character').setRequired(true))
  .addStringOption((option) =>
    option
      .setName('discord_id')
      .setDescription('The discord id of the user, leave blank if yourself')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString('name');
  if (!name) {
    await interaction.reply('Please provide a name for the character.');
    return;
  }
  if (name.length > MAX_LENGTH) {
    await interaction.reply(`Character name must be less than ${MAX_LENGTH} characters.`);
    return;
  }
  let discordId = interaction.options.getString('discord_id');
  if (!discordId) {
    discordId = interaction.user.id;
  }

  const numUserChars = await Users.count({
    where: Sequelize.where(Sequelize.fn('lower', Sequelize.col('discord_id')), discordId),
  });

  if (numUserChars >= MAX_CHARACTERS) {
    await interaction.reply(`You already have ${MAX_CHARACTERS} characters. You cannot add more.`);
    return;
  }

  // Add the character to the database
  Users.create({
    discord_id: discordId,
    character_name: name.toLowerCase(),
  });
  await interaction.reply(`Added character ${name}`);
}
