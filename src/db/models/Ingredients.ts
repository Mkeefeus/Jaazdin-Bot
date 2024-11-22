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
