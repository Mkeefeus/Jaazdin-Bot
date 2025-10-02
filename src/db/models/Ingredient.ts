import { DataTypes, Model } from 'sequelize';
import { db } from 'db/db';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';

export enum IngredientCategory {
  bread = 'bread',
  protein = 'protein',
  roughage = 'roughage',
  sauce = 'sauce',
  cheese = 'cheese',
  extra = 'extra',
}

export interface IngredientData {
  id?: number;
  name: string;
  category: IngredientCategory;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Ingredient extends Model {
  declare id: number;
  declare name: string;
  declare category: IngredientCategory;
  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}

Ingredient.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize: db,
  }
);

async function seed() {
  const ingredientModule = await import('~/seeds/ingredients.json');
  const ingredientData: IngredientData[] = ingredientModule.default.map(
    (ingredient: { name: string; category: string }) => ({
      name: ingredient.name,
      category: ingredient.category as IngredientCategory,
    })
  );
  try {
    // Create each ingredient and its category in sequence
    ingredientData.forEach((ingredient) => {
      Ingredient.create({
        name: ingredient.name,
        category: ingredient.category,
      });
    });
    console.log('Ingredients seeded!');
  } catch (error) {
    console.error('Error in seedDatabase:', error);
    throw error;
  }
}

export { seed };

Ingredient.sync();
