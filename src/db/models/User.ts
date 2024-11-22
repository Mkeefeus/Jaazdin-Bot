import { DataTypes } from "sequelize";
import { db } from "db/db";

interface User {
  username: string;
  points: number;
}

export const User = db.define(
  "User",
  {
    // Model attributes are defined here
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    freezeTableName: true,
  }
);
