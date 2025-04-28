import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName('updateplant')
  .setDescription('Update one of your plants')

export async function execute(interaction: ChatInputCommandInteraction) {
}