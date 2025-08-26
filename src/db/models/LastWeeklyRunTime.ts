import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class LastWeeklyRunTime extends Model {
  declare value: Date;
}
LastWeeklyRunTime.init(
  {
    value: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'last_weekly_run_time',
    freezeTableName: true,
    timestamps: false,
  }
);

LastWeeklyRunTime.sync();
