import { DataTypes, Model, Optional } from 'sequelize';
import { db } from 'db/db';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum FertilizerType {
  NONE = 'NONE',
  // NORMAL = 'NORMAL',
  ROBUST = 'ROBUST',
  FORTIFYING = 'FORTIFYING',
  ENRICHING = 'ENRICHING',
  SPEEDGROW = 'SPEEDGROW',
  MIRACLEGROW = 'MIRACLEGROW',
  MYSTERYGROW = 'MYSTERYGROW',
}

export enum PersistentFertilizers {
  NONE = 'NONE',
  ROBUST = 'ROBUST',
  FORTIFYING = 'FORTIFYING',
  ENRICHING = 'ENRICHING',
}

// --- Interfaces for Model Attributes ---
// This is good practice for type safety with Sequelize models
interface PlantInformationAttributes {
  id?: number; // Make id optional for creation
  name: string;
  maturity_time: number;
}
type PlantInformationCreationAttributes = Optional<PlantInformationAttributes, 'id'>;

interface PlantHarvestInformationAttributes {
  id?: number; // Make id optional for creation
  plant_info_id: number;
  harvest_time: number;
  harvest_amount: number;
  harvest_name: string;
  renewable: boolean;
}
type PlantHarvestInformationCreationAttributes = Optional<PlantHarvestInformationAttributes, 'id'>;

interface PlantAttributes {
  id?: number;
  plant_info_id: number; // This is the foreign key to PlantInformation
  plant_harvest_info_id?: number; // This can be null if not set
  name: string;
  user: string;
  character: string;
  quantity: number;
  fertilizer_type: FertilizerType;
  yield: number;
  weeks_remaining: number;
  has_persistent_fertilizer: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  harvest_information?: PlantHarvestInformation; // For easier typing in associations
  plant_information?: PlantInformation; // For easier typing in associations
}
// For attributes that are optional during creation (like auto-incremented IDs)
type PlantCreationAttributes = Optional<
  PlantAttributes,
  'id' | 'createdAt' | 'updatedAt' | 'harvest_information' | 'plant_information'
>;

// --- Models ---

export class PlantInformation
  extends Model<PlantInformationAttributes, PlantInformationCreationAttributes>
  implements PlantInformationAttributes
{
  declare id: number; // For TypeScript type safety, you might want this to be `number | undefined` or simply `number` and rely on `Optional` for creation
  declare name: string;
  declare maturity_time: number;

  // Define associations for easier typing
  declare harvestInformation?: PlantHarvestInformation[]; // For hasMany
}

export class PlantHarvestInformation
  extends Model<PlantHarvestInformationAttributes, PlantHarvestInformationCreationAttributes>
  implements PlantHarvestInformationAttributes
{
  declare id: number; // Similar to PlantInformation, can be `number | undefined`
  declare plant_info_id: number;
  declare harvest_time: number;
  declare harvest_amount: number;
  declare harvest_name: string;
  declare renewable: boolean;

  // Define associations for easier typing
  declare plantInformation?: PlantInformation; // For belongsTo
}

export class Plant extends Model<PlantAttributes, PlantCreationAttributes> implements PlantAttributes {
  declare id?: number;
  declare plant_info_id: number; // This is the foreign key to PlantInformation
  declare plant_harvest_info_id?: number; // This can be null if not set
  declare name: string;
  declare user: string;
  declare character: string;
  declare quantity: number;
  declare fertilizer_type: FertilizerType;
  declare yield: number;
  declare weeks_remaining: number;
  declare has_persistent_fertilizer: boolean;
  @CreatedAt declare createdAt?: Date;
  @UpdatedAt declare updatedAt?: Date;
  declare harvest_information?: PlantHarvestInformation;
  declare plant_information?: PlantInformation; // For easier typing in associations
}

// --- Initialize Models ---
// It's crucial to initialize all models before setting up associations.
// Place all .init() calls here, consecutively.
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

PlantHarvestInformation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    plant_info_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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

Plant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    plant_info_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    plant_harvest_info_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // This can be null if not set
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    character: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    fertilizer_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: FertilizerType.NONE,
    },
    yield: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    },
    weeks_remaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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

// --- Define Associations ---
// Define all associations AFTER all models have been initialized with .init()
PlantInformation.hasMany(PlantHarvestInformation, {
  foreignKey: 'plant_info_id',
  as: 'harvest_information',
});

PlantHarvestInformation.belongsTo(PlantInformation, {
  foreignKey: 'plant_info_id',
  as: 'plant_information',
});

PlantInformation.hasMany(Plant, {
  foreignKey: 'plant_info_id',
  as: 'plants',
});

Plant.belongsTo(PlantInformation, {
  foreignKey: 'plant_info_id',
  as: 'plant_information',
});

PlantHarvestInformation.hasMany(Plant, {
  foreignKey: 'plant_harvest_info_id',
  as: 'plants',
});

Plant.belongsTo(PlantHarvestInformation, {
  foreignKey: 'plant_harvest_info_id',
  as: 'harvest_information',
});

async function seed() {
  const plantData = await import('~/../plantInformation.json');
  console.log('Retrieved plant data');
  try {
    // Create each plant and its harvests in sequence
    for (const plant of plantData.plants) {
      try {
        // First create the plant information
        const plantInfo = await PlantInformation.create({
          name: plant.name.toLowerCase(),
          maturity_time: plant.maturityTime,
        });

        // Then create all harvests for this plant
        for (const harvest of plant.harvest) {
          await PlantHarvestInformation.create({
            plant_info_id: plantInfo.getDataValue('id') as number,
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
