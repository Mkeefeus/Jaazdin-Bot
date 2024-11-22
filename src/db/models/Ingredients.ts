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
  name: string;
  category: IngredientCategory;
}

export const Ingredients = db.define(
  "Ingredients",
  {
    // Model attributes are defined here
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
