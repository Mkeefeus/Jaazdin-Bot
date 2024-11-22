import { ChatInputCommandInteraction, GuildMemberRoleManager } from "discord.js";

const WHITELISTED_ROLES = ["1309210371797680149"];

export function isBotDev(interaction: ChatInputCommandInteraction) {
    if (!interaction.member) {
        return;
    }
    let hasRole = false;

    if (Array.isArray(interaction.member.roles)) {
        if (interaction.member.roles.some((role) => WHITELISTED_ROLES.includes(role))) {
            hasRole = true;
        }
    } else {
        const roleManager = interaction.member.roles as GuildMemberRoleManager;
        if (WHITELISTED_ROLES.some((role) => roleManager.cache.has(role))) {
            hasRole = true;
        }
    }
    return hasRole;
}
