import { DataTypes } from "sequelize";
import { db } from "db/db";

export enum IngredientCategory {
  bread = "bread",
  protein = "protein",
  roughage = "roughage",
  sauce = "sauce",
  cheese = "cheese",
  extra = "extra",
}

export interface Ingredient {
  id?: number;
  name: string;
  category: IngredientCategory;
  createdAt?: Date;
  updatedAt?: Date;
}

export const Ingredients = db.define(
  "ingredients",
  {
    // Model attributes are defined here
    id : {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }
);

async function seed() {
  const ingredientModule = await import('~/../ingredients.json');
  const ingredientData: Ingredient[] = ingredientModule.default.map((ingredient: { name: string; category: string }) => ({
      name: ingredient.name,
      category: ingredient.category as IngredientCategory,
  }));
    try {
        // Create each ingredient and its category in sequence
        ingredientData.forEach((ingredient) => {
            Ingredients.create({
                name: ingredient.name,
                category: ingredient.category,
            });
        });
        console.log("Seeded ingredients");
    } catch (error) {
        console.error("Error in seedDatabase:", error);
        throw error;
    }
}

export {
  seed,
}