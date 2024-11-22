import { DataTypes } from "sequelize";
import { db } from "db/db";

interface HarvestData {
  time: number;
  amount: number;
  name: string
  renewable: boolean; // if the harvest is not renewable, the plant needs to be removed after harvesting
}

interface Plant {
  name: string;
  maturityTime: number;
  harvest: HarvestData[];
  user: string;
}

export const Plants = db.define(
  "Plant",
  {
    // Model attributes are defined here
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    maturityTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    harvest: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  }
);
