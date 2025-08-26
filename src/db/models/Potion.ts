import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class Potion extends Model {
  declare name: string;
  declare rarity: string;
  declare price_min: number;
  declare price_max: number;
}

Potion.init(
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
    modelName: 'Potion',
    tableName: 'potions',
    timestamps: false,
  }
);

async function seed() {
  // Use await import with ~/../ for portability
  const potionsData = (await import('~/../Inventories/potions.json')).potions;
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
