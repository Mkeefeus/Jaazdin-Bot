import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class Seed extends Model {
  declare name: string;
  declare rarity: string;
  declare price_min: number;
  declare price_max: number;
}

Seed.init(
  {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
    },
    rarity: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    price_min: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Seed',
    tableName: 'seeds',
    timestamps: false,
  }
);

async function seed() {
  // Use await import with ~/../ for portability
  const seedsData = (await import('~/../Inventories/seeds.json')).seeds;
  try {
    for (const seed of seedsData) {
      await Seed.create({
        name: seed.name,
        rarity: seed.rarity,
        price_min: seed.price.min,
        price_max: seed.price.max,
      });
    }
    console.log('Seeds seeded!');
  } catch (error) {
    console.error('Could not seed seeds:', error);
  }
}

export { seed };
