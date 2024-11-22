import { DataTypes } from "sequelize";
import { db } from "db/db";

interface Plant {
  name: string;
  time: number;
  user: string;
  repeatable: boolean;
  repeatTime: number;
}

export enum PlantStage {
  SEED = "Seed",
  SPROUT = "Sprout",
  GROWING = "Growing",
  MATURE = "Mature",
}

export const Plant = db.define(
  "Plant",
  {
    // Model attributes are defined here
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    time: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    repeatable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    repeatTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    nextWaterTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    freezeTableName: true,
    indexes: [
      {
        fields: ["user"],
      },
      {
        fields: ["nextWaterTime"],
      },
    ],
  }
);
