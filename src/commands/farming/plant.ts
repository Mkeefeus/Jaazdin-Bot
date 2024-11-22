import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AutocompleteInteraction,
} from "discord.js";
import { Plants, PlantInformation, PlantHarvestInformation } from "~/db/models/Plants";
import { formatPlantName } from "~/functions/helpers";

const MAX_PLANTS_PER_USER = 150;

export const data = new SlashCommandBuilder()
  .setName("plant")
  .setDescription("Plant a new plant in your garden")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("The type of plant to grow")
      .setRequired(true)
      .setAutocomplete(true)
  );

async function createPlantEmbed(
  plantInfo: any,
  owner: string,
): Promise<EmbedBuilder> {
  return new EmbedBuilder()
    .setTitle("🌱 New Plant Added!")
    .setColor(0x2ecc71)
    .addFields(
      { name: "Plant Type", value: formatPlantName(plantInfo.dataValues.name), inline: true },
      { name: "Time to Maturity", value: `${plantInfo.dataValues.maturity_time} weeks`, inline: true },
      { name: "Owner", value: `<@${owner}>`, inline: true },
    )
    .setTimestamp();
}

async function getUserPlantCount(userId: string): Promise<number> {
  return await Plants.count({
    where: {
      user: userId,
    },
  });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const plants = await PlantInformation.findAll();

  console.log(plants.map(plant => plant.dataValues.name))

  const filtered = plants.filter(plant => 
    plant.dataValues.name.includes(focusedValue)
  );

  await interaction.respond(
    filtered.slice(0, 25).map(plant => ({
      name: formatPlantName(plant.dataValues.name), // Display nicely formatted
      value: plant.dataValues.name, // Keep lowercase for database lookup
    }))
  );
}

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const userId = interaction.user.id;

    const currentPlants = await getUserPlantCount(userId);
    if (currentPlants >= MAX_PLANTS_PER_USER) {
      await interaction.reply({
        content: `You already have ${MAX_PLANTS_PER_USER} plants growing! Wait for some to finish before planting more.`,
        ephemeral: true,
      });
      return;
    }

    // Get the exact name from the autocomplete value (already lowercase)
    const plantName = interaction.options.getString("name", true).toLowerCase();

    const plantInfo = await PlantInformation.findOne({
      where: { name: plantName }
    });

    console.log(plantInfo)

    if (!plantInfo) {
      await interaction.reply({
        content: "That plant type doesn't exist!",
        ephemeral: true,
      });
      return;
    }

    await Plants.create({
      name: plantName,
      user: userId,
      planted_at: new Date()
    });

    const embed = await createPlantEmbed(
      plantInfo,
      userId
    );

    await interaction.reply({
      embeds: [embed],
    });
  } catch (error) {
    console.error("Error in plant command:", error);
    await interaction.reply({
      content: "There was an error while planting! Please try again later.",
      ephemeral: true,
    });
  }
}

export default {
  data,
  execute,
  autocomplete,
};