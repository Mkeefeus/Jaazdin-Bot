import { DataTypes, Model } from 'sequelize';
import { db } from '../db';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';

export class Potion extends Model {
  declare name: string;
  declare rarity: string;
  declare price_min: number;
  declare price_max: number;
  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}

Potion.init(
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
  // Use await import with ~/seeds/ for portability
  const potionsData = (await import('~/seeds/potions.json')).potions;
  try {
    for (const potion of potionsData) {
      await Potion.create({
        name: potion.name,
        rarity: potion.rarity,
        price_min: potion.price.min,
        price_max: potion.price.max,
      });
    }
    console.log('Potions seeded!');
  } catch (error) {
    console.error('Could not seed potions:', error);
  }
}

export { seed };

Potion.sync();
