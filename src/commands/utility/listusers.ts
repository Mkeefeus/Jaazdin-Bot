// Import necessary modules from discord.js
import { SlashCommandBuilder, CommandInteraction, CacheType } from 'discord.js';

// Define the command structure
export const data = new SlashCommandBuilder()
  .setName('listusers')
  .setDescription('Lists all members in the current guild (debug command).');

// Define the execute function for the command
export async function execute(
  interaction: CommandInteraction<CacheType> // Specify the interaction type
) {
  // Ensure the command is used within a guild
  if (!interaction.guild) {
    return interaction.reply({
      content: 'This command can only be used in a guild.',
      ephemeral: true, // Only visible to the user who ran the command
    });
  }

  // Defer the reply, as fetching members can take time, especially in large guilds
  await interaction.deferReply({ ephemeral: true });

  try {
    // Fetch all members from the guild. This requires the GuildMembers intent.
    const members = await interaction.guild.members.fetch();

    // Initialize a string to build the list of users
    let userList = `Users in this server (${members.size}):\n`;

    // Iterate over the fetched members
    members.forEach((member) => {
      // Exclude bots from the list if only human users are desired
      if (!member.user.bot) {
        userList += `- ${member.user.tag}\n`;
      }
    });

    // Check if the list exceeds Discord's message character limit (2000 characters)
    const MAX_MESSAGE_LENGTH = 1900; // Leave some room for prefix/suffix

    if (userList.length > MAX_MESSAGE_LENGTH) {
      userList = userList.substring(0, MAX_MESSAGE_LENGTH) + '...\n(List too long to display fully)';
    }

    // Edit the deferred reply with the list of users, wrapped in a code block
    await interaction.editReply({
      content: `\`\`\`\n${userList}\n\`\`\``,
    });
  } catch (error) {
    // Log any errors that occur during member fetching
    console.error('Error fetching members:', error);

    // Inform the user about the error
    await interaction.editReply({
      content:
        'There was an error fetching members. Please check bot permissions and ensure the Guild Members Intent is enabled in the Developer Portal.',
    });
  }
}
