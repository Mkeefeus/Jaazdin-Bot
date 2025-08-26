import { DataTypes, Model } from 'sequelize';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { db } from '../db';
import { TimerType } from '~/types/timers';

interface TimerAttributes {
  id?: number;
  name: string;
  weeks_remaining: number;
  type: TimerType;
  user: string; // Discord ID of the user
  character: string; // Character associated with the timer
  repeatable: boolean; // Whether the timer is repeatable
  repeat_weeks?: number; // Weeks to repeat if repeatable
  createdAt?: Date;
  updatedAt?: Date;
}

type TimerCreationAttributes = Omit<TimerAttributes, 'id' | 'createdAt' | 'updatedAt'>;

export class Timer extends Model<TimerAttributes, TimerCreationAttributes> implements TimerAttributes {
  declare id?: number;
  declare name: string;
  declare weeks_remaining: number;
  declare type: TimerType;
  declare user: string;
  declare character: string;
  declare repeatable: boolean;
  declare repeat_weeks?: number;
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
      type: DataTypes.TEXT,
      allowNull: false,
    },
    weeks_remaining: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    user: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    character: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    repeatable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    repeat_weeks: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize: db,
  }
);

async function seed() {
  //await Timer.sync({ force: true });
  const timersData = (await import('~/../timers.json')).default;
  try {
    for (const timer of timersData) {
      await Timer.create({
        name: timer.name,
        weeks_remaining: timer.weeksRemaining,
        type: (typeof timer.type === 'string' ? TimerType[timer.type as keyof typeof TimerType] : timer.type),
        user: timer.user,
        character: timer.character,
        repeatable: timer.repeatable,
        repeat_weeks: timer.repeatWeeks,
      });
    }
    console.log('Timers seeded!');
  } catch (error) {
    console.error('Could not seed timers:', error);
  }
}

export { seed };

Timer.sync();
