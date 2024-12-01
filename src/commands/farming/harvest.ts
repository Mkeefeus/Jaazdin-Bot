import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AutocompleteInteraction } from 'discord.js';
import {
  Plant,
  PlantHarvest,
  PlantHarvestInformation,
  PlantInformation,
  FERTILIZER_EFFECTS,
  FertilizerType,
} from '~/db/models/Plant';
import { User } from '~/db/models/User';
import { formatNames } from '~/functions/helpers';

// Export the command data
export const data = new SlashCommandBuilder()
  .setName('harvest')
  .setDescription('Harvest a specific plant')
  .addStringOption((option) =>
    option.setName('character').setDescription('Character doing the harvesting').setRequired(true).setAutocomplete(true)
  )
  .addStringOption((option) =>
    option.setName('plant_id').setDescription('ID of the plant to harvest').setRequired(true).setAutocomplete(true)
  )
  .addBooleanOption((option) =>
    option.setName('harvest_seeds').setDescription('Whether to harvest seeds').setRequired(false)
  )
  .addBooleanOption((option) =>
    option.setName('replant').setDescription('Automatically replant after harvesting').setRequired(false)
  );

interface HarvestResult {
  plantName: string;
  harvestName: string;
  amount: number;
  seedsHarvested?: number;
  fertilizerPersisted: boolean;
}

interface HarvestCheck {
  harvestable: boolean;
  reason?: string;
  timeRemaining?: number;
  currentStage: 'growing' | 'maturing' | 'ready' | 'complete';
}

async function checkPlantHarvestability(plant: any, plantInfo: any, harvestInfo: any): Promise<HarvestCheck> {
  const now = Date.now();
  const plantedAt = new Date(plant.planted_at).getTime();

  // Get the latest harvest for this plant
  const latestHarvest = await PlantHarvest.findOne({
    where: { plant_id: plant.id },
    order: [['harvested_at', 'DESC']],
  });

  const timeReference = latestHarvest ? new Date(latestHarvest.getDataValue('harvested_at')).getTime() : plantedAt;

  // Apply growth multiplier from fertilizer
  const adjustedMaturityTime = plantInfo.maturity_time / plant.growth_multiplier;
  const adjustedHarvestTime = harvestInfo.harvest_time / plant.growth_multiplier;

  const ageInWeeks = (now - plantedAt) / (1000 * 60 * 60 * 24 * 7);
  const timeSinceLastHarvest = (now - timeReference) / (1000 * 60 * 60 * 24 * 7);

  // Get current harvest count
  const harvestCount = await PlantHarvest.count({
    where: { plant_id: plant.id },
  });

  // Check if we've reached max harvests
  if (harvestCount >= harvestInfo.harvest_amount) {
    return {
      harvestable: false,
      reason: 'Plant has completed all its harvests',
      currentStage: 'complete',
    };
  }

  // If no harvests yet, check initial maturity
  if (harvestCount === 0 && ageInWeeks < adjustedMaturityTime) {
    return {
      harvestable: false,
      reason: 'Plant is still growing to maturity',
      timeRemaining: adjustedMaturityTime - ageInWeeks,
      currentStage: 'growing',
    };
  }

  // Check if current harvest cycle is complete
  if (timeSinceLastHarvest < adjustedHarvestTime) {
    return {
      harvestable: false,
      reason: 'Plant is growing its next harvest',
      timeRemaining: adjustedHarvestTime - timeSinceLastHarvest,
      currentStage: 'maturing',
    };
  }

  // Plant has matured and completed a harvest cycle
  return {
    harvestable: true,
    currentStage: 'ready',
  };
}

async function harvestPlant(
  plant: any,
  harvestSeeds: boolean = false,
  character: string
): Promise<HarvestResult | null> {
  const plantInfo = await PlantInformation.findOne({
    where: { name: plant.name },
    include: [
      {
        model: PlantHarvestInformation,
        as: 'harvests',
      },
    ],
  });

  if (!plantInfo) return null;
  const harvestInfo = plantInfo.harvests[0];

  // Check harvestability
  const harvestCheck = await checkPlantHarvestability(plant, plantInfo, harvestInfo);

  if (!harvestCheck.harvestable) {
    throw new Error(
      `Plant not ready: ${harvestCheck.reason}${
        harvestCheck.timeRemaining ? ` (${harvestCheck.timeRemaining.toFixed(1)} weeks remaining)` : ''
      }`
    );
  }

  // Calculate harvest amount with fertilizer boost
  const baseAmount = harvestInfo.harvest_amount;
  const finalAmount = Math.floor(baseAmount * plant.yield_multiplier);

  // Handle fertilizer persistence
  const fertilizerType = plant.fertilizer_type as FertilizerType;
  const fertilizerEffect = FERTILIZER_EFFECTS[fertilizerType];
  const fertilizerPersists = plant.has_persistent_fertilizer && fertilizerEffect.persistent;

  // Calculate seeds if harvesting them
  const seedAmount = harvestSeeds ? Math.floor(Math.random() * 3) + 1 : 0;

  // Record the harvest
  await PlantHarvest.create({
    plant_id: plant.id,
    harvest_info_id: harvestInfo.id,
    amount_harvested: finalAmount,
    harvested_at: new Date(),
    fertilizer_multiplier: plant.yield_multiplier,
    character_name: character,
  });

  // Get total harvests after this one
  const harvestCount = await PlantHarvest.count({
    where: { plant_id: plant.id },
  });

  // Handle plant state after harvest
  if (harvestCount >= harvestInfo.harvest_amount && !harvestInfo.renewable) {
    // Only remove plant if it's reached max harvests AND isn't renewable
    await plant.destroy();
  } else {
    // Reset fertilizer if not persistent
    if (!fertilizerPersists) {
      await plant.update({
        fertilizer_type: FertilizerType.NONE,
        yield_multiplier: 1.0,
        growth_multiplier: 1.0,
        has_persistent_fertilizer: false,
      });
    }
  }

  return {
    plantName: plant.name,
    harvestName: harvestInfo.harvest_name,
    amount: finalAmount,
    seedsHarvested: seedAmount,
    fertilizerPersisted: fertilizerPersists,
  };
}

// Character autocomplete handler
async function autocompleteCharacter(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();

  const characters = await User.findAll({
    where: { discord_id: interaction.user.id },
  });

  const filtered = characters.filter((char) => char.character_name.toLowerCase().includes(focusedValue));

  return interaction.respond(
    filtered.map((char) => ({
      name: char.character_name,
      value: char.character_name,
    }))
  );
}

// Plant autocomplete handler
async function autocompletePlant(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();

  const plants = await Plant.findAll({
    where: { user: interaction.user.id },
    include: [
      {
        model: PlantInformation,
        as: 'information',
      },
    ],
  });

  const filtered = plants.filter(
    (plant) =>
      plant.getDataValue('id').toString().includes(focusedValue) ||
      plant.getDataValue('name').toLowerCase().includes(focusedValue)
  );

  return interaction.respond(
    filtered.slice(0, 25).map((plant) => ({
      name: `${plant.getDataValue('id')} - ${formatNames(plant.getDataValue('name'))}`,
      value: plant.getDataValue('id').toString(),
    }))
  );
}

// Main execute handler
export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const character = interaction.options.getString('character', true);
    const plantId = interaction.options.getString('plant_id', true);
    const harvestSeeds = interaction.options.getBoolean('harvest_seeds') ?? false;
    const shouldReplant = interaction.options.getBoolean('replant') ?? false;

    // Verify character ownership
    const userChar = await User.findOne({
      where: {
        discord_id: interaction.user.id,
        character_name: character,
      },
    });

    if (!userChar) {
      await interaction.reply({
        content: "You don't have a character with that name!",
        ephemeral: true,
      });
      return;
    }

    // Get the plant
    const plant = await Plant.findOne({
      where: {
        id: plantId,
        user: interaction.user.id,
      },
    });

    if (!plant) {
      await interaction.reply({
        content: "Could not find that plant or it doesn't belong to you!",
        ephemeral: true,
      });
      return;
    }

    try {
      const result = await harvestPlant(plant, harvestSeeds, character);

      if (!result) {
        await interaction.reply({
          content: 'Could not harvest plant!',
          ephemeral: true,
        });
        return;
      }

      // Create harvest summary embed
      const embed = new EmbedBuilder()
        .setTitle('🌾 Harvest Complete!')
        .setColor(0x2ecc71)
        .addFields(
          { name: 'Plant', value: formatNames(result.plantName), inline: true },
          {
            name: 'Harvested',
            value: `${result.amount}x ${result.harvestName}`,
            inline: true,
          }
        );

      if (result.seedsHarvested) {
        embed.addFields({
          name: 'Seeds',
          value: `${result.seedsHarvested}x seeds harvested`,
          inline: true,
        });
      }

      if (result.fertilizerPersisted) {
        embed.addFields({
          name: 'Fertilizer',
          value: '🧪 Fertilizer effects persisted!',
          inline: true,
        });
      }

      // Handle replanting if requested and plant was removed
      if (shouldReplant && !plant.isNewRecord) {
        await Plant.create({
          name: plant.getDataValue('name'),
          user: interaction.user.id,
          planted_at: new Date(),
          fertilizer_type: FertilizerType.NONE,
          yield_multiplier: 1.0,
          growth_multiplier: 1.0,
          has_persistent_fertilizer: false,
        });
        embed.addFields({
          name: 'Replanted',
          value: '🌱 A new plant has been planted!',
          inline: true,
        });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      let message = 'Unknown error';
      if (error instanceof Error) {
        message = error.message;
      }
      await interaction.reply({
        content: message,
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error('Error in harvest command:', error);
    await interaction.reply({
      content: 'There was an error while harvesting!',
      ephemeral: true,
    });
  }
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);

  if (focusedOption.name === 'character') {
    return autocompleteCharacter(interaction);
  } else if (focusedOption.name === 'plant_id') {
    return autocompletePlant(interaction);
  }
}

export default {
  data,
  execute,
  autocomplete,
};
