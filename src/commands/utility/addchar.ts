import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Users } from "~/db/models/Users";

export const data = new SlashCommandBuilder()
    .setName("addchar")
    .setDescription("Add a character to the database")
    .addStringOption(option => option.setName("name").setDescription("The name of the character").setRequired(true))
    .addStringOption(option => option.setName("discord_id").setDescription("The discord id of the user").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString("name");
    const discordId = interaction.options.getString("discord_id");
    // Add the character to the database
    Users.create({
        discord_id: discordId,
        character_name: name
    });
    await interaction.reply(`Added character ${name}`);
}