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
// bread, protein, cheese, roughage, wild magic, sauce

export interface Ingredient {
  name: string;
  category: IngredientCategory;
}

export const Ingredient = db.define(
  "Ingredient",
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
  },
  {
    freezeTableName: true,
  }
);
