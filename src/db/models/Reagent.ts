import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class Reagent extends Model {
  declare name: string;
  declare rarity: string;
  declare price_min: number;
  declare price_max: number;
  declare type: string;
}

Reagent.init(
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
    type: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Reagent',
    tableName: 'reagents',
    timestamps: false,
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
