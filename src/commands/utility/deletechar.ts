import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  Interaction,
} from 'discord.js';
import { User } from '~/db/models/User';
import { formatNames, isBotDev } from '~/functions/helpers';

export const data = new SlashCommandBuilder()
  .setName('deletechar')
  .setDescription('Delete a character from the database')
  .addStringOption((option) =>
    option.setName('name').setDescription('The name of the character').setRequired(true).setAutocomplete(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!isBotDev(interaction)) {
    await interaction.reply('You do not have permission to use this command.');
    return;
  }
  const charName = interaction.options.getString('name');
  if (!charName) {
    await interaction.reply('Please provide a name for the character.');
    return;
  }
  const formattedName = formatNames(charName);
  const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Confirm').setStyle(ButtonStyle.Danger);
  const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Primary);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(cancel, confirm);

  const response = await interaction.reply({
    content: `Are you sure you want to delete character ${formattedName}?`,
    components: [row],
  });

  const collectorFilter = (i: Interaction) => i.user.id === interaction.user.id;

  try {
    const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 15000 });
    if (confirmation.customId === 'confirm') {
      try {
        await User.destroy({ where: { character_name: charName } });
      } catch (error) {
        console.error('Error deleting character:', error);
        await confirmation.update({ content: `Error deleting character ${formattedName}.`, components: [] });
        return;
      }
      await confirmation.update({ content: `Deleted character ${formattedName}.`, components: [] });
    } else {
      await confirmation.update({ content: 'Deletion cancelled.', components: [] });
    }
  } catch (error) {
    console.error('Error deleting character:', error);
    await interaction.editReply('Deletion timed out.');
  }
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  //   const focusedValue = interaction.options.getFocused().toLowerCase();
  const characters = await User.findAll();
  const characterNames = characters.map((character) => character.dataValues.character_name);

  await interaction.respond(characterNames.map((character) => ({ name: formatNames(character), value: character })));
}

export default { data, execute, autocomplete };
