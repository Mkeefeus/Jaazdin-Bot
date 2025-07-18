import { DataTypes, Model } from 'sequelize';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { db } from '../db';

interface TimerAttributes {
  id?: number;
  name: string;
  weeks_remaining: number;
  type: string;
  user: string; // Discord ID of the user
  character: string; // Character associated with the timer
  createdAt?: Date;
  updatedAt?: Date;
}

type TimerCreationAttributes = Omit<TimerAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class Timer extends Model<TimerAttributes, TimerCreationAttributes> implements TimerAttributes {
  declare id?: number;
  declare name: string;
  declare weeks_remaining: number;
  declare type: string;
  declare user: string;
  declare character: string;
  @CreatedAt declare createdAt?: Date;
  @UpdatedAt declare updatedAt?: Date;
}

// --- Initialize Model ---
Timer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    weeks_remaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    character: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: db,
  }
);

async function seed() {
  await Timer.sync({ force: true });
}

export { seed };
