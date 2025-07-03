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
  .addIntegerOption((option) =>
    option.setName('quantity').setDescription('The number of plants to grow').setRequired(false).setMinValue(1)
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

async function createPlantEmbed(plantData: Plant): Promise<EmbedBuilder> {
  const embed = new EmbedBuilder()
    .setTitle('🌱 New Plant Added!')
    .setColor(0x2ecc71)
    .addFields(
      { name: 'Plant Type', value: formatNames(plantData.getDataValue('name')), inline: true },
      { name: 'Time to Maturity', value: `${plantData.getDataValue('weeks_remaining')} weeks`, inline: true },
      { name: 'Quantity', value: `${plantData.getDataValue('quantity')}`, inline: true },
      { name: 'Owner', value: `<@${plantData.getDataValue('user')}>`, inline: true }
    );

  const fertilizerType = plantData.getDataValue('fertilizer_type');
  if (fertilizerType !== FertilizerType.NONE) {
    embed.addFields({
      name: '🧪 Fertilizer',
      value: `${fertilizerType.charAt(0) + fertilizerType.slice(1).toLowerCase()}`,
      inline: true,
    });
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

    const plantName = interaction.options.getString('name', true).toLowerCase();

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
      where: { plant_info_id: plantInfo.id },
    });

    if (!harvestInfo) {
      await interaction.reply({
        content: 'Failed to get harvest info!',
        ephemeral: true,
      });
      return;
    }

    const plantData = {
      name: plantName,
      plant_info_id: plantInfo.id,
      plant_harvest_info_id: harvestInfo.id,
      fertilizer_type: (interaction.options.getString('fertilizer') || FertilizerType.NONE) as FertilizerType,
      character: interaction.options.getString('character', true).toLowerCase(),
      has_persistent_fertilizer: interaction.options.getBoolean('persistent') || false,
      quantity: interaction.options.getInteger('quantity') || 1,
      user: userId,
      yield: harvestInfo.harvest_amount,
      weeks_remaining: harvestInfo.harvest_time,
    };

    switch (plantData.fertilizer_type) {
      case FertilizerType.ROBUST:
        plantData.yield += 1;
        break;
      case FertilizerType.FORTIFYING:
        if (plantData.weeks_remaining == 1) {
          break;
        }
        plantData.weeks_remaining -= 1;
        break;
      case FertilizerType.SPEEDGROW:
        plantData.weeks_remaining = 1;
        break;
      default:
        break;
    }

    const newPlant = await Plant.create(plantData);

    const embed = await createPlantEmbed(newPlant);

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
