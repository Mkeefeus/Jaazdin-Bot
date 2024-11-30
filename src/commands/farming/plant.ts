import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  AutocompleteInteraction,
} from "discord.js";
import { Plants, PlantInformation, PlantHarvestInformation, FertilizerType, FERTILIZER_EFFECTS } from "~/db/models/Plants";
import { formatNames } from "~/functions/helpers";

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
  )
  .addStringOption((option) =>
    option
      .setName("fertilizer")
      .setDescription("Type of fertilizer to use")
      .setRequired(false)
      .addChoices(
        { name: "None", value: FertilizerType.NONE },
        { name: "Normal - Basic yield boost", value: FertilizerType.NORMAL },
        { name: "Robust - Balanced yield and growth", value: FertilizerType.ROBUST },
        { name: "Fortifying - Strong yield boost", value: FertilizerType.FORTIFYING },
        { name: "Enriching - Superior yield and growth", value: FertilizerType.ENRICHING },
        { name: "Speed-Grow - Fast growth", value: FertilizerType.SPEEDGROW },
        { name: "Miracle-Grow - Premium all-around", value: FertilizerType.MIRACLEGROW },
        { name: "Mystery-Grow - Random powerful effects", value: FertilizerType.MYSTERYGROW }
      )
  );

async function createPlantEmbed(
  plantInfo: any,
  owner: string,
  fertilizerType: FertilizerType,
  yieldMult: number,
  growthMult: number
): Promise<EmbedBuilder> {
  const fertilizerEffect = FERTILIZER_EFFECTS[fertilizerType];
  const embed = new EmbedBuilder()
    .setTitle("🌱 New Plant Added!")
    .setColor(0x2ecc71)
    .addFields(
      { name: "Plant Type", value: formatNames(plantInfo.dataValues.name), inline: true },
      { name: "Time to Maturity", value: `${plantInfo.dataValues.maturity_time} weeks`, inline: true },
      { name: "Owner", value: `<@${owner}>`, inline: true },
    );

  if (fertilizerType !== FertilizerType.NONE) {
    embed.addFields(
      { 
        name: "🧪 Fertilizer", 
        value: `${fertilizerType.charAt(0) + fertilizerType.slice(1).toLowerCase()}`, 
        inline: true 
      },
      { 
        name: "📈 Effects", 
        value: [
          `Yield: ${((yieldMult - 1) * 100).toFixed(0)}%`,
          `Growth: ${((growthMult - 1) * 100).toFixed(0)}%`
        ].join('\n'), 
        inline: true 
      },
      {
        name: "ℹ️ Description",
        value: fertilizerEffect.description,
        inline: false
      }
    );
  }
  return embed.setTimestamp();
  // return new EmbedBuilder()
  //   .setTitle("🌱 New Plant Added!")
  //   .setColor(0x2ecc71)
  //   .addFields(
  //     { name: "Plant Type", value: formatNames(plantInfo.dataValues.name), inline: true },
  //     { name: "Time to Maturity", value: `${plantInfo.dataValues.maturity_time} weeks`, inline: true },
  //     { name: "Owner", value: `<@${owner}>`, inline: true },
  //   )
  //   .setTimestamp();
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

  const filtered = plants.filter(plant => 
    plant.dataValues.name.includes(focusedValue)
  );

  await interaction.respond(
    filtered.slice(0, 25).map(plant => ({
      name: formatNames(plant.dataValues.name), // Display nicely formatted
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
    const fertilizerType = (interaction.options.getString("fertilizer") || FertilizerType.NONE) as FertilizerType;

    const plantInfo = await PlantInformation.findOne({
      where: { name: plantName }
    });

    let yieldMult = 1.0;
    let growthMult = 1.0;

    if (fertilizerType === FertilizerType.MYSTERYGROW) {
      console.log("Mystery grow. Fix this shit.")
    } else {
      const effects = FERTILIZER_EFFECTS[fertilizerType];
      yieldMult = effects.yieldMultiplier;
      growthMult = effects.growthMultiplier;
    }

    if (!plantInfo) {
      await interaction.reply({
        content: "That plant type doesn't exist!",
        ephemeral: true,
      });
      return;
    }

    const plant = await Plants.create({
      name: plantName,
      user: userId,
      planted_at: new Date(),
      fertilizer_type: fertilizerType,
      yield_multiplier: yieldMult,
      growth_multiplier: growthMult
    });

    const embed = await createPlantEmbed(
      plantInfo,
      userId,
      fertilizerType,
      yieldMult,
      growthMult
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