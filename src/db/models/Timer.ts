import { DataTypes, Model } from 'sequelize';
import { db } from 'db/db';

export class Timer extends Model {
  declare id: number;
  declare timer_name: string;
  declare time_left: number;
  declare discord_id: string;
}

Timer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    discord_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timer_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    time_left: {
      type: DataTypes.INTEGER,
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
