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
  APIEmbed,
  JSONEncodable,
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
export function createStandardEmbed(title: string, description: string, color: number = 0x2e86c1): EmbedBuilder {
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(color);
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
    ephemeral: ephemeral,
  });

  // Send remaining chunks as follow-ups
  for (let i = 1; i < chunks.length; i++) {
    await interaction.followUp({
      embeds: chunks[i],
      ephemeral: ephemeral,
    });
  }
}

type ConfirmActionOptions = {
  interaction: ChatInputCommandInteraction;
  title: string;
  description: string;
  fields: { name: string; value: string; inline?: boolean }[];
  confirmButtonText?: string;
  cancelButtonText?: string;
  timeoutMs?: number;
  confirmEmbed?: (APIEmbed | JSONEncodable<APIEmbed>)[] | undefined;
  cancelEmbed?: (APIEmbed | JSONEncodable<APIEmbed>)[] | undefined;
};

export async function confirmAction(options: ConfirmActionOptions): Promise<boolean> {
  // Create confirmation buttons
  const confirmButton = new ButtonBuilder()
    .setCustomId('confirm_action')
    .setLabel(options.confirmButtonText || 'Confirm')
    .setStyle(ButtonStyle.Danger);

  const cancelButton = new ButtonBuilder()
    .setCustomId('cancel_action')
    .setLabel(options.cancelButtonText || 'Cancel')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

  // Send confirmation message
  const confirmationMessage = await options.interaction.reply({
    embeds: [
      {
        title: `⚠️ ${options.title}`,
        description: options.description,
        color: 0xffa500, // Orange for warning
        fields: options.fields,
        timestamp: new Date().toISOString(),
      },
    ],
    components: [row],
    ephemeral: true,
  });

  try {
    // Wait for user interaction
    const confirmation = await confirmationMessage.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: options.timeoutMs,
    });

    if (confirmation.customId === 'confirm_action') {
      // User confirmed
      await confirmation.update({
        embeds: options.confirmEmbed || [
          {
            title: '✅ Action Confirmed',
            description: 'Processing your request...',
            color: 0x4caf50, // Green
            timestamp: new Date().toISOString(),
          },
        ],
        components: [], // Remove buttons
      });
      return true;
    } else {
      // User cancelled
      await confirmation.update({
        embeds: options.cancelEmbed || [
          {
            title: '❌ Action Cancelled',
            description: 'The action was cancelled.',
            color: 0x9e9e9e, // Gray
            timestamp: new Date().toISOString(),
          },
        ],
        components: [], // Remove buttons
      });
      return false;
    }
  } catch (_error) {
    // Timeout occurred
    await options.interaction.editReply({
      embeds: [
        {
          title: '⏱️ Confirmation Timeout',
          description: 'The action was cancelled due to timeout.',
          color: 0x9e9e9e, // Gray
          timestamp: new Date().toISOString(),
        },
      ],
      components: [], // Remove buttons
    });
    return false;
  }
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
