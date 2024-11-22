import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { Plants } from "~/db/models/Plants.js";

// List of available plants with their default grow times (in weeks)
const AVAILABLE_PLANTS = {
  "Fire Lily": 4,
  "Harmony Cap": 1,
  "Hiker's Bounty": 1,
  "Rusty Sprig": 3,
  "Drow's Wine Glass": 3,
  "Gem Root": 7,
  "Flaming Lily": 5,
  Mistcreeper: 1,
  "Red Winterberry": 2,
} as const;

type PlantName = keyof typeof AVAILABLE_PLANTS;

export const data = new SlashCommandBuilder()
  .setName("plant")
  .setDescription("Plant a new plant in your garden")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("The type of plant to grow")
      .setRequired(true)
      .addChoices(
        ...Object.entries(AVAILABLE_PLANTS).map(([name, _]) => ({
          name,
          value: name,
        }))
      )
  )
  .addIntegerOption((option) =>
    option
      .setName("time")
      .setDescription("Override the default grow time (in weeks)")
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(52)
  )
  .addBooleanOption((option) =>
    option
      .setName("repeatable")
      .setDescription("Whether the plant should regrow after harvesting")
      .setRequired(false)
  )
  .addIntegerOption((option) =>
    option
      .setName("repeat_time")
      .setDescription("Time between harvests for repeatable plants (in weeks)")
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(52)
  );

async function createPlantEmbed(
  plantName: string,
  timeToGrow: number,
  owner: string,
  repeatable: boolean,
  repeatTime?: number
): Promise<EmbedBuilder> {
  return new EmbedBuilder()
    .setTitle("🌱 New Plant Added!")
    .setColor(0x2ecc71)
    .addFields(
      { name: "Plant Type", value: plantName, inline: true },
      { name: "Time to Grow", value: `${timeToGrow} weeks`, inline: true },
      { name: "Owner", value: `<@${owner}>`, inline: true },
      { name: "Repeatable", value: repeatable ? "Yes" : "No", inline: true },
      ...(repeatTime
        ? [{ name: "Repeat Time", value: `${repeatTime} weeks`, inline: true }]
        : [])
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

const MAX_PLANTS_PER_USER = 150;

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const userId = interaction.user.id;

    // Check if user has reached the plant limit
    const currentPlants = await getUserPlantCount(userId);
    if (currentPlants >= MAX_PLANTS_PER_USER) {
      await interaction.reply({
        content: `You already have ${MAX_PLANTS_PER_USER} plants growing! Wait for some to finish before planting more.`,
        ephemeral: true,
      });
      return;
    }

    const plantName = interaction.options.getString("name", true) as PlantName;
    const defaultTime = AVAILABLE_PLANTS[plantName];
    const timeToGrow = interaction.options.getInteger("time") ?? defaultTime;
    const repeatable = interaction.options.getBoolean("repeatable") ?? true;
    const repeatTime = interaction.options.getInteger("repeat_time");

    // Validate repeat_time is provided if plant is repeatable
    if (repeatable && !repeatTime) {
      await interaction.reply({
        content: "You must specify a repeat_time for repeatable plants!",
        ephemeral: true,
      });
      return;
    }

    // Create the plant in the database
    const plant = await Plants.create({
      name: plantName,
      time: timeToGrow,
      user: userId,
      repeatable: repeatable,
      repeatTime: repeatTime,
    });

    const embed = await createPlantEmbed(
      plantName,
      timeToGrow,
      userId,
      repeatable,
      repeatTime ? repeatTime : undefined
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
};
