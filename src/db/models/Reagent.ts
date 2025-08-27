import { DataTypes, Model } from 'sequelize';
import { db } from '../db';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';

export class Reagent extends Model {
  declare name: string;
  declare rarity: string;
  declare price_min: number;
  declare price_max: number;
  declare type: string;
  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}

Reagent.init(
  {
    name: {
      type: DataTypes.TEXT,
      primaryKey: true,
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
    type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize: db,
  }
);

async function seed() {
  // Use await import with ~/../ for portability
  const reagentsData = (await import('~/../Inventories/reagents.json')).reagents;
  try {
    for (const reagent of reagentsData) {
      await Reagent.create({
        name: reagent.name,
        rarity: reagent.rarity,
        price_min: reagent.price.min,
        price_max: reagent.price.max,
        type: reagent.type,
      });
    }
    console.log('Reagents seeded!');
  } catch (error) {
    console.error('Could not seed reagents:', error);
  }
}

export { seed };

Reagent.sync();
