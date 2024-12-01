import { DataTypes, Model } from 'sequelize';
import { db } from 'db/db';

export enum FertilizerType {
  NONE = 'NONE',
  NORMAL = 'NORMAL',
  ROBUST = 'ROBUST',
  FORTIFYING = 'FORTIFYING',
  ENRICHING = 'ENRICHING',
  SPEEDGROW = 'SPEEDGROW',
  MIRACLEGROW = 'MIRACLEGROW',
  MYSTERYGROW = 'MYSTERYGROW',
}

export const FERTILIZER_EFFECTS = {
  [FertilizerType.NONE]: {
    yieldMultiplier: 1.0,
    growthMultiplier: 1.0,
    description: 'No fertilizer applied',
    persistent: false,
  },
  [FertilizerType.NORMAL]: {
    yieldMultiplier: 1.1,
    growthMultiplier: 1.0,
    description: 'Slightly increases harvest yield',
    persistent: false, // Basic fertilizer doesn't persist
  },
  [FertilizerType.ROBUST]: {
    yieldMultiplier: 1.25,
    growthMultiplier: 1.1,
    description: 'Moderately increases yield and slightly speeds growth',
    persistent: true, // Persists through harvests
  },
  [FertilizerType.FORTIFYING]: {
    yieldMultiplier: 1.5,
    growthMultiplier: 1.0,
    description: 'Significantly increases harvest yield',
    persistent: false,
  },
  [FertilizerType.ENRICHING]: {
    yieldMultiplier: 1.75,
    growthMultiplier: 1.15,
    description: 'Greatly increases yield and speeds growth',
    persistent: true,
  },
  [FertilizerType.SPEEDGROW]: {
    yieldMultiplier: 2.0,
    growthMultiplier: 1.5,
    description: 'Significantly speeds up growth',
    persistent: false,
  },
  [FertilizerType.MIRACLEGROW]: {
    yieldMultiplier: 2.0,
    growthMultiplier: 1.25,
    description: 'Doubles yield and speeds growth',
    persistent: true,
  },
  [FertilizerType.MYSTERYGROW]: {
    yieldMultiplier: 0, // Set dynamically
    growthMultiplier: 0, // Set dynamically
    description: 'Random powerful effects with unpredictable persistence',
    persistent: false, // Set dynamically when used
  },
};

export class Plant extends Model {
  declare id: number;
  declare name: string;
  declare user: string;
  declare planted_at: Date;
  declare fertilizer_type: FertilizerType;
  declare yield_multiplier: number;
  declare growth_multiplier: number;
  declare has_persistent_fertilizer: boolean;
}

Plant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    planted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fertilizer_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: FertilizerType.NONE,
    },
    yield_multiplier: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    },
    growth_multiplier: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    },
    has_persistent_fertilizer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize: db,
  }
);

export class PlantInformation extends Model {
  declare id: number;
  declare name: string;
  declare maturity_time: number;
}

PlantInformation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    maturity_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize: db,
  }
);

export class PlantHarvestInformation extends Model {
  declare id: number;
  declare plant_id: number;
  declare harvest_time: number;
  declare harvest_amount: number;
  declare harvest_name: string;
  declare renewable: boolean;
}

PlantHarvestInformation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    plant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: PlantInformation,
        key: 'id',
      },
    },
    harvest_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    harvest_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    harvest_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    renewable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize: db,
  }
);

export class PlantHarvest extends Model {
  declare id: number;
  declare plant_id: number;
  declare harvest_info_id: number;
  declare harvested_at: Date;
  declare amount_harvested: number;
}

PlantHarvest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    plant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Plant,
        key: 'id',
      },
    },
    harvest_info_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: PlantHarvestInformation,
        key: 'id',
      },
    },
    harvested_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    amount_harvested: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize: db,
  }
);

// Set up associations
PlantInformation.hasMany(PlantHarvestInformation, {
  foreignKey: 'plant_id',
  as: 'harvests',
});

PlantHarvestInformation.belongsTo(PlantInformation, {
  foreignKey: 'plant_id',
  as: 'plant',
});

Plant.hasMany(PlantHarvest, {
  foreignKey: 'plant_id',
  as: 'harvests',
});

PlantHarvest.belongsTo(Plant, {
  foreignKey: 'plant_id',
  as: 'plant',
});

PlantHarvest.belongsTo(PlantHarvestInformation, {
  foreignKey: 'harvest_info_id',
  as: 'harvest_info',
});

Plant.belongsTo(PlantInformation, {
  foreignKey: 'name',
  targetKey: 'name',
  as: 'information',
});

PlantInformation.hasMany(Plant, {
  foreignKey: 'name',
  sourceKey: 'name',
  as: 'plants',
});

async function seed() {
  const plantData = await import('~/../plantInformation.json');
  try {
    // Create each plant and its harvests in sequence
    for (const plant of plantData.plants) {
      try {
        // First create the plant information
        const plantInfo = await PlantInformation.create({
          name: plant.name.toLowerCase(),
          maturity_time: plant.maturityTime,
        });

        // Wait a moment before creating harvests
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Then create all harvests for this plant
        for (const harvest of plant.harvest) {
          await PlantHarvestInformation.create({
            plant_id: plantInfo.getDataValue('id'),
            harvest_time: harvest.harvestTime,
            harvest_amount: harvest.harvestAmount,
            harvest_name: harvest.harvestName.toLowerCase(),
            renewable: harvest.renewable,
          });
        }
      } catch (error) {
        console.error(`Error seeding plant ${plant.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in seedDatabase:', error);
    throw error;
  }
}

export { seed };
