import { ChatInputCommandInteraction, SlashCommandBuilder, AutocompleteInteraction } from 'discord.js';
import { Timer } from '~/db/models/Timer';
import { checkUserRole, formatNames } from '~/functions/helpers';
import { Roles } from '~/types/roles';

export const data = new SlashCommandBuilder()
  .setName('removetimer')
  .setDescription('Removes an existing timer')
  .addUserOption((option) =>
    option.setName('player').setDescription('The discord id of the player, leave blank if yourself').setRequired(true)
  )
  .addStringOption((option) =>
    option.setName('timer').setDescription('The name of the timer to remove.').setRequired(true).setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);
  const player = (interaction.options.get('player')?.value as string) || interaction.user.id;
  console.log(player);

  if (focusedOption.name === 'timer') {
    // Find all timers for the selected user
    const timers = await Timer.findAll({
      where: { user: player },
      limit: 25,
    });

    // Filter by what the user is typing
    const value = focusedOption.value?.toLowerCase() || '';
    const choices = timers
      .filter((t) => t.name.toLowerCase().includes(value) && t.id !== undefined)
      .map((t) => ({
        name: `${formatNames(t.name)} (${formatNames(t.character)}, ${t.weeks_remaining} weeks left)`,
        value: (t.id as number).toString(), // Ensure value is always defined
      }));
    await interaction.respond(choices);
  }
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const timerId = interaction.options.getString('timer')?.toLowerCase();
  const discordId = (interaction.options.getUser('player') || interaction.user).id;

  if (!timerId) {
    return interaction.reply('Please provide both the timer name and player.');
  }

  // Only GMs can remove timers for others
  if (!(checkUserRole(interaction, Roles.GM) && interaction.user.id !== discordId)) {
    if (discordId !== interaction.user.id) {
      return interaction.reply('You can only remove your own timers unless you are a GM.');
    }
  }

  const timer = await Timer.findOne({
    where: {
      id: timerId,
      user: discordId,
    },
  });

  if (!timer) {
    return interaction.reply(`Failed to find timer`);
  }

  await timer.destroy();

  await interaction.reply({
    embeds: [
      {
        title: '🗑️ Timer Removed',
        color: 0xf44336,
        fields: [
          { name: 'Name', value: formatNames(timer.name), inline: true },
          { name: 'Player', value: `<@${discordId}>`, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Timer successfully removed!' },
      },
    ],
  });
}

export default {
  data,
  execute,
  autocomplete,
};
