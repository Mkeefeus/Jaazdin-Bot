import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class Meal extends Model {
  declare name: string;
  declare rarity: string;
  declare price_min: number;
  declare price_max: number;
}

Meal.init(
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
  const mealsData = (await import('~/../Inventories/meals.json')).meals;
  try {
    for (const meal of mealsData) {
      await Meal.create({
        name: meal.name,
        rarity: meal.rarity,
        price_min: meal.price.min,
        price_max: meal.price.max,
      });
    }
    console.log('Meals seeded!');
  } catch (error) {
    console.error('Could not seed meals:', error);
  }
}

export { seed };

Meal.sync();
