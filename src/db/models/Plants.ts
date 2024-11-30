import { DataTypes } from "sequelize";
import { db } from "db/db";

interface HarvestData {
  time: number;
  amount: number;
  name: string
  renewable: boolean; // if the harvest is not renewable, the plant needs to be removed after harvesting
}

export interface Plant {
  name: string;
  maturityTime: number;
  harvest: HarvestData[];
  user: string;
}

export enum FertilizerType {
  NONE = "NONE",
  NORMAL = "NORMAL",
  ROBUST = "ROBUST",
  FORTIFYING = "FORTIFYING",
  ENRICHING = "ENRICHING",
  SPEEDGROW = "SPEEDGROW",
  MIRACLEGROW = "MIRACLEGROW",
  MYSTERYGROW = "MYSTERYGROW",
}

export const FERTILIZER_EFFECTS = {
  [FertilizerType.NONE]: {
    yieldMultiplier: 1.0,
    growthMultiplier: 1.0,
    description: "No fertilizer applied",
    persistent: false
  },
  [FertilizerType.NORMAL]: {
    yieldMultiplier: 1.1,
    growthMultiplier: 1.0,
    description: "Slightly increases harvest yield",
    persistent: false // Basic fertilizer doesn't persist
  },
  [FertilizerType.ROBUST]: {
    yieldMultiplier: 1.25,
    growthMultiplier: 1.1,
    description: "Moderately increases yield and slightly speeds growth",
    persistent: true // Persists through harvests
  },
  [FertilizerType.FORTIFYING]: {
    yieldMultiplier: 1.5,
    growthMultiplier: 1.0,
    description: "Significantly increases harvest yield",
    persistent: false
  },
  [FertilizerType.ENRICHING]: {
    yieldMultiplier: 1.75,
    growthMultiplier: 1.15,
    description: "Greatly increases yield and speeds growth",
    persistent: true
  },
  [FertilizerType.SPEEDGROW]: {
    yieldMultiplier: 2.0,
    growthMultiplier: 1.5,
    description: "Significantly speeds up growth",
    persistent: false
  },
  [FertilizerType.MIRACLEGROW]: {
    yieldMultiplier: 2.0,
    growthMultiplier: 1.25,
    description: "Doubles yield and speeds growth",
    persistent: true
  },
  [FertilizerType.MYSTERYGROW]: {
    yieldMultiplier: 0, // Set dynamically
    growthMultiplier: 0, // Set dynamically
    description: "Random powerful effects with unpredictable persistence",
    persistent: false // Set dynamically when used
  }
};

// export const Plants = db.define(
//   "plants",
//   {
//     // Model attributes are defined here
//     name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     user: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     maturity_time: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     harvest: {
//       type: DataTypes.JSON,
//       allowNull: false,
//     },
//   }
// );

export const Plants = db.define(
  "plants",
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
    timestamps: true,
  }
);


export const PlantInformation = db.define(
  "plant_information",
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
    }
  }, {
    freezeTableName: true,
  }
)

export const PlantHarvestInformation = db.define(
  "plant_harvest_information",
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
        model: "plant_information",
        key: 'id'
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
    }
  }, {
    freezeTableName: true,
  }
)

export const PlantHarvests = db.define(
  "plant_harvests",
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
        model: "plants",
        key: 'id'
      },
    },
    harvest_info_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "plant_harvest_information",
        key: 'id'
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
    freezeTableName: true,
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

Plants.hasMany(PlantHarvests, {
  foreignKey: 'plant_id',
  as: 'harvests',
});

PlantHarvests.belongsTo(Plants, {
  foreignKey: 'plant_id',
  as: 'plant',
});

PlantHarvests.belongsTo(PlantHarvestInformation, {
  foreignKey: 'harvest_info_id',
  as: 'harvest_info',
});

Plants.belongsTo(PlantInformation, {
  foreignKey: 'name',
  targetKey: 'name',
  as: 'information'
});

PlantInformation.hasMany(Plants, {
  foreignKey: 'name',
  sourceKey: 'name',
  as: 'plants'
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
                        plant_id: plantInfo.getDataValue("id"),
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
        console.error("Error in seedDatabase:", error);
        throw error;
    }
}

export {
  seed
}