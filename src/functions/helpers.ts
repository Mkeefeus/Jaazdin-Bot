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

export const rarityChoices = [
  { name: 'Common', value: 'Common' },
  { name: 'Uncommon', value: 'Uncommon' },
  { name: 'Rare', value: 'Rare' },
  { name: 'Very Rare', value: 'Very Rare' },
  { name: 'Legendary', value: 'Legendary' },
];

export const creatureTypeChoices = [
  { name: 'Aberration', value: 'Aberration' },
  { name: 'Beast', value: 'Beast' },
  { name: 'Celestial', value: 'Celestial' },
  { name: 'Construct', value: 'Construct' },
  { name: 'Dragon', value: 'Dragon' },
  { name: 'Elemental', value: 'Elemental' },
  { name: 'Fey', value: 'Fey' },
  { name: 'Fiend', value: 'Fiend' },
  { name: 'Giant', value: 'Giant' },
  { name: 'Humanoid', value: 'Humanoid' },
  { name: 'Monstrosity', value: 'Monstrosity' },
  { name: 'Ooze', value: 'Ooze' },
  { name: 'Plant', value: 'Plant' },
  { name: 'Undead', value: 'Undead' },
];

// Helper to format plant names for display (capitalize words)
export function formatNames(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper to parse +x, -x, =x for numeric changes and reply if invalid
export async function parseChangeString(
  change: string | null | undefined,
  current: number,
  variableName: string,
  interaction?: ChatInputCommandInteraction
): Promise<number | null> {
  if (change == null) return current;
  const changeRegex = /^([+-=])(\d+)$/;
  const match = changeRegex.exec(change.trim());

  const errorMsg = `Invalid format for ${variableName}. Use +x, -x, or =x.`;

  if (!match) {
    if (interaction) {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    }
    return null;
  }
  const operator = match[1];
  const value = parseInt(match[2], 10);
  if (operator === '+') return current + value;
  if (operator === '-') return current - value;
  if (operator === '=') return value;
  return null;
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
