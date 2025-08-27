import { DataTypes, Model } from 'sequelize';
import { db } from '../db';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';

export class Poison extends Model {
  declare name: string;
  declare rarity: string;
  declare price_min: number;
  declare price_max: number;
  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}

Poison.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    rarity: {
      type: DataTypes.TEXT,
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
