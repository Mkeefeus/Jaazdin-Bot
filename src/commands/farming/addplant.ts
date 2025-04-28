import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AutocompleteInteraction } from 'discord.js';
import { Plant, PlantInformation, FertilizerType, PlantHarvestInformation } from '~/db/models/Plant';
import { formatNames } from '~/functions/helpers';

const MAX_PLANTS_PER_USER = 150;

export const data = new SlashCommandBuilder()
  .setName('addplant')
  .setDescription('Plant a new plant in your garden')
  .addStringOption((option) =>
    option.setName('name').setDescription('The type of plant to grow').setRequired(true).setAutocomplete(true)
  )
  .addStringOption((option) =>
    option.setName('character').setDescription('The character this plant belongs to').setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName('fertilizer')
      .setDescription('Type of fertilizer to use')
      .setRequired(false)
      .addChoices(
        { name: 'None', value: FertilizerType.NONE },
        { name: 'Robust', value: FertilizerType.ROBUST },
        { name: 'Fortifying', value: FertilizerType.FORTIFYING },
        { name: 'Enriching', value: FertilizerType.ENRICHING },
        { name: 'Speed-Grow', value: FertilizerType.SPEEDGROW },
        { name: 'Miracle-Grow', value: FertilizerType.MIRACLEGROW },
        { name: 'Mystery-Grow', value: FertilizerType.MYSTERYGROW }
      )
  )
  .addBooleanOption((option) =>
    option.setName('persistent').setDescription('Whether the fertilizer is persistent').setRequired(false)
  )
  .addUserOption((option) => option.setName('owner').setDescription('The owner of the plant').setRequired(false));

async function createPlantEmbed(
  plant: Plant,
  owner: string,
  fertilizerType: FertilizerType
): Promise<EmbedBuilder> {
  const embed = new EmbedBuilder()
    .setTitle('🌱 New Plant Added!')
    .setColor(0x2ecc71)
    .addFields(
      { name: 'Plant Type', value: formatNames(plant.getDataValue('name')), inline: true },
      { name: 'Time to Maturity', value: `${plant.getDataValue('weeks_remaining')} weeks`, inline: true },
      { name: 'Owner', value: `<@${owner}>`, inline: true }
    );

  if (fertilizerType !== FertilizerType.NONE) {
    embed.addFields(
      {
        name: '🧪 Fertilizer',
        value: `${fertilizerType.charAt(0) + fertilizerType.slice(1).toLowerCase()}`,
        inline: true,
      }
    );
  }
  return embed.setTimestamp();
}

async function getUserPlantCount(userId: string): Promise<number> {
  return await Plant.count({
    where: {
      user: userId,
    },
  });
}

const plantInfoCache: Record<string, PlantInformation> = {};

export async function loadPlantInformation() {
  const plantInfo = await PlantInformation.findAll();
  for (const plant of plantInfo) {
    plantInfoCache[plant.name] = plant;
  }
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  if (Object.keys(plantInfoCache).length === 0) {
    await loadPlantInformation();
  }
  const plants = Object.values(plantInfoCache);

  const filtered = plants.filter((plant) => plant.dataValues.name.includes(focusedValue));

  await interaction.respond(
    filtered.slice(0, 25).map((plant) => ({
      name: formatNames(plant.dataValues.name), // Display nicely formatted
      value: plant.dataValues.name, // Keep lowercase for database lookup
    }))
  );
}

function getMondayWeeksFromNow(weeks: number): Date {
  const today = new Date();
  const dayOfWeek = today.getUTCDay(); // 0 (Sun) to 6 (Sat)
  const daysUntilMonday = dayOfWeek === 1 ? 0 : (dayOfWeek === 0 ? 1 : 8 - dayOfWeek); // Days to next Monday
  
  const targetDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + daysUntilMonday + (weeks - 1) * 7, 0, 0, 0, 0));
  
  return targetDate;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const userId = interaction.options.getUser('owner', false)?.id || interaction.user.id;

    const currentPlants = await getUserPlantCount(userId);
    if (currentPlants >= MAX_PLANTS_PER_USER) {
      await interaction.reply({
        content: `You already have ${MAX_PLANTS_PER_USER} plants growing! Wait for some to finish before planting more.`,
        ephemeral: true,
      });
      return;
    }

    // Get the exact name from the autocomplete value (already lowercase)
    const plantName = interaction.options.getString('name', true).toLowerCase();
    const fertilizerType = (interaction.options.getString('fertilizer') || FertilizerType.NONE) as FertilizerType;
    const characterName = interaction.options.getString('character', true).toLowerCase();
    const persistent = interaction.options.getBoolean('persistent') || false;

    const plantInfo = await PlantInformation.findOne({
      where: { name: plantName },
    });

    if (!plantInfo) {
      await interaction.reply({
        content: "That plant type doesn't exist!",
        ephemeral: true,
      });
      return;
    }

    const harvestInfo = await PlantHarvestInformation.findOne({
      where: { plant_id: plantInfo.id },
    });

    if (!harvestInfo) {
      await interaction.reply({
        content: 'Failed to get harvest info!',
        ephemeral: true,
      });
      return;
    }

    let harvestYield = harvestInfo.harvest_amount;
    let completedDate = getMondayWeeksFromNow(harvestInfo.harvest_time);

    switch (fertilizerType) {
      case FertilizerType.ROBUST:
        harvestYield += 1;
        break;
      case FertilizerType.FORTIFYING:
        if (harvestInfo.harvest_time == 1) {
          break;
        }
        completedDate = getMondayWeeksFromNow(harvestInfo.harvest_time - 1);
        break;
      case FertilizerType.SPEEDGROW:
        completedDate = getMondayWeeksFromNow(1);
        break;
      default:
        break;
    }

    const plant = await Plant.create({
      name: plantName,
      user: userId,
      character: characterName,
      fertilizer_type: fertilizerType,
      yield: harvestYield,
      weeks_remaining: harvestInfo.harvest_time,
      has_persistent_fertilizer: persistent,
    });

    const embed = await createPlantEmbed(plant, userId, fertilizerType);

    await interaction.reply({
      embeds: [embed],
    });
  } catch (error) {
    console.error('Error in plant command:', error);
    await interaction.reply({
      content: 'There was an error while planting! Please try again later.',
      ephemeral: true,
    });
  }
}

export default {
  data,
  execute,
  autocomplete,
};
