import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class Boat extends Model {
  declare boatName: string;
  declare city: string;
  declare country: string;
  declare waitTime: number;
  declare timeInTown: number;
  declare jobsAffected: string[];
  declare tier2Ability: string;
  declare tableToGenerate: string;
  declare isRunning: boolean;
  declare isTier2: boolean;
  declare weeksLeft: number;
  declare isInTown: boolean;
}

Boat.init(
  {
    boatName: {
      type: DataTypes.STRING(40),
      primaryKey: true,
    },
    city: DataTypes.STRING(40),
    country: DataTypes.STRING(40),
    waitTime: DataTypes.INTEGER,
    timeInTown: DataTypes.INTEGER,
    jobsAffected: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    tier2Ability: DataTypes.STRING(255),
    tableToGenerate: DataTypes.STRING(40),
    isRunning: DataTypes.BOOLEAN,
    isTier2: DataTypes.BOOLEAN,
    weeksLeft: DataTypes.INTEGER,
    isInTown: DataTypes.BOOLEAN,
  },
  {
    sequelize: db,
    modelName: 'Boat',
    tableName: 'boats',
    timestamps: false,
  }
);

async function seed() {
  // Use await import for portability
  const boatsData = (await import('~/../boats.json')).default || (await import('~/../boats.json'));
  try {
    for (const boat of boatsData) {
      await Boat.create({
        boatName: boat.boatName,
        city: boat.city,
        country: boat.country,
        waitTime: boat.waitTime,
        timeInTown: boat.timeInTown,
        jobsAffected: boat.jobsAffected,
        tier2Ability: boat.tier2Ability,
        tableToGenerate: boat.tableToGenerate,
        isRunning: boat.isRunning,
        isTier2: boat.isTier2,
        weeksLeft: boat.weeksLeft,
        isInTown: boat.isInTown,
      });
    }
    console.log('Boats seeded!');
  } catch (error) {
    console.error('Could not seed boats:', error);
  }
}

export { seed };