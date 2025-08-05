import { 
  ChatInputCommandInteraction, 
  GuildMemberRoleManager, 
  AutocompleteInteraction, 
  EmbedBuilder, 
  userMention,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  Colors
} from 'discord.js';
import { Roles } from '~/types/roles';

const RoleMap = {
  [Roles.BOT_DEV]: process.env.BOT_DEV_ROLE_ID,
  [Roles.GM]: process.env.GM_ROLE_ID,
  [Roles.PLAYER]: process.env.PLAYER_ROLE_ID,
  [Roles.DM]: process.env.DM_ROLE_ID,
};

export function checkUserRole(interaction: ChatInputCommandInteraction, role: Roles) {
  if (!interaction.member) {
    return false;
  }
  const roleManager = interaction.member.roles as GuildMemberRoleManager;
  if (!roleManager || !roleManager.cache || !RoleMap[role]) {
    return false;
  }
  return Array.isArray(interaction.member.roles)
    ? interaction.member.roles.includes(RoleMap[role])
    : roleManager.cache.has(RoleMap[role]);
}

// Helper to format plant names for display (capitalize words)
export function formatNames(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Reply with user mention and embeds - Generic version for all commands
 */
export async function replyWithUserMention(
  interaction: ChatInputCommandInteraction,
  embeds: EmbedBuilder[],
  ephemeral: boolean = false
): Promise<void> {
  await interaction.reply({
    content: userMention(interaction.user.id),
    embeds: embeds,
    ephemeral: ephemeral,
  });
}

/**
 * Reply with user mention and content only
 */
export async function replyWithUserMentionText(
  interaction: ChatInputCommandInteraction,
  content: string,
  ephemeral: boolean = false
): Promise<void> {
  await interaction.reply({
    content: `${userMention(interaction.user.id)} ${content}`,
    ephemeral: ephemeral,
  });
}

/**
 * Generic job name autocomplete
 */
export async function jobNameAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const { Job } = await import('~/db/models/Job');
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const jobs = await Job.findAll();

  const filtered = jobs.filter((job) => 
    (job as { dataValues: { name: string } }).dataValues.name.toLowerCase().startsWith(focusedValue)
  );

  await interaction.respond(
    filtered
      .slice(0, 25)
      .map((job) => ({
        name: formatNames((job as { dataValues: { name: string } }).dataValues.name),
        value: (job as { dataValues: { name: string } }).dataValues.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
}

/**
 * Handle standard error responses with ephemeral replies
 */
export async function handleError(
  interaction: ChatInputCommandInteraction,
  message: string,
  error?: unknown
): Promise<void> {
  console.error('Command error:', error);
  await interaction.reply({
    content: message,
    ephemeral: true,
  });
}

/**
 * Create a standard embed with consistent styling
 */
export function createStandardEmbed(
  title: string,
  description: string,
  color: number = 0x2e86c1
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color);
}

/**
 * Create a success embed
 */
export function createSuccessEmbed(title: string, description: string): EmbedBuilder {
  return createStandardEmbed(title, description, 0x00ff00);
}

/**
 * Create an error embed
 */
export function createErrorEmbed(title: string, description: string): EmbedBuilder {
  return createStandardEmbed(title, description, 0xff0000);
}

/**
 * Split embeds into chunks for Discord's 10 embed limit
 */
export function chunkEmbeds(embeds: EmbedBuilder[], chunkSize: number = 10): EmbedBuilder[][] {
  const chunks: EmbedBuilder[][] = [];
  for (let i = 0; i < embeds.length; i += chunkSize) {
    chunks.push(embeds.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Send multiple embeds respecting Discord's limits
 */
export async function sendEmbedChunks(
  interaction: ChatInputCommandInteraction,
  embeds: EmbedBuilder[],
  ephemeral: boolean = false
): Promise<void> {
  if (embeds.length === 0) {
    await interaction.reply({ content: 'No results found.', ephemeral: true });
    return;
  }

  const chunks = chunkEmbeds(embeds);
  
  // Send first chunk as reply
  await interaction.reply({ 
    embeds: chunks[0], 
    ephemeral: ephemeral 
  });
  
  // Send remaining chunks as follow-ups
  for (let i = 1; i < chunks.length; i++) {
    await interaction.followUp({ 
      embeds: chunks[i], 
      ephemeral: ephemeral 
    });
  }
}

/**
 * Create confirmation buttons for destructive actions
 */
export function createConfirmationButtons(): ActionRowBuilder<ButtonBuilder> {
  const confirmButton = new ButtonBuilder()
    .setCustomId('confirm_destroy')
    .setLabel('Yes, Destroy')
    .setStyle(ButtonStyle.Danger);

  const cancelButton = new ButtonBuilder()
    .setCustomId('cancel_destroy')
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder<ButtonBuilder>()
    .addComponents(confirmButton, cancelButton);
}

/**
 * Create a confirmation embed for destructive actions
 */
export function createConfirmationEmbed(
  title: string,
  itemName: string,
  details: string,
  additionalWarning?: string
): EmbedBuilder {
  let description = `Are you sure you want to permanently destroy **${formatNames(itemName)}**?\n\n`;
  description += details;
  description += '\n\nThis action cannot be undone';
  if (additionalWarning) {
    description += ` and will also ${additionalWarning}`;
  }
  description += '.';

  return new EmbedBuilder()
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setColor(Colors.Orange);
}

/**
 * Handle confirmation workflow for destructive actions
 */
export async function handleConfirmationWorkflow(
  interaction: ChatInputCommandInteraction,
  confirmEmbed: EmbedBuilder,
  row: ActionRowBuilder<ButtonBuilder>,
  onConfirm: () => Promise<{ title: string; description: string }>,
  cancelMessage: string = 'Action cancelled.'
): Promise<void> {
  await interaction.reply({
    embeds: [confirmEmbed],
    components: [row],
    ephemeral: true,
  });

  try {
    const confirmation = await interaction.followUp({
      content: 'Waiting for confirmation...',
      ephemeral: true,
      fetchReply: true,
    });

    const collector = confirmation.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30_000, // 30 seconds
    });

    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        await buttonInteraction.reply({
          content: 'Only the person who ran this command can confirm.',
          ephemeral: true,
        });
        return;
      }

      if (buttonInteraction.customId === 'confirm_destroy') {
        try {
          const result = await onConfirm();
          
          const successEmbed = new EmbedBuilder()
            .setTitle(result.title)
            .setDescription(result.description)
            .setColor(Colors.Green);

          await buttonInteraction.update({
            content: userMention(interaction.user.id),
            embeds: [successEmbed],
            components: [],
          });
        } catch (error) {
          await buttonInteraction.update({
            content: `An error occurred: ${error}`,
            embeds: [],
            components: [],
          });
        }
      } else {
        await buttonInteraction.update({
          content: cancelMessage,
          embeds: [],
          components: [],
        });
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({
          content: 'Confirmation timed out. Action cancelled.',
          embeds: [],
          components: [],
        });
      }
    });
  } catch (error) {
    await interaction.editReply({
      content: `An error occurred: ${error}`,
      embeds: [],
      components: [],
    });
  }
}
