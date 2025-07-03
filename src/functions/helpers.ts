import { ChatInputCommandInteraction, GuildMemberRoleManager } from 'discord.js';
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
