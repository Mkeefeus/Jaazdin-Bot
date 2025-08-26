import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class Poison extends Model {
  declare name: string;
  declare rarity: string;
  declare price_min: number;
  declare price_max: number;
}

Poison.init(
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
    modelName: 'Poison',
    tableName: 'poisons',
    timestamps: false,
  }
);

async function seed() {
  // Use await import with ~/../ for portability
  const poisonsData = (await import('~/../Inventories/poisons.json')).poisons;
  try {
    for (const poison of poisonsData) {
      await Poison.create({
        name: poison.name,
        rarity: poison.rarity,
        price_min: poison.price.min,
        price_max: poison.price.max,
      });
    }
    console.log('Poisons seeded!');
  } catch (error) {
    console.error('Could not seed poisons:', error);
  }
}

export { seed };

Poison.sync();
