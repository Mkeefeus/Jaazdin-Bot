import { DataTypes } from 'sequelize';
import { db } from 'db/db';
import fs from 'fs/promises';
import path from 'path';

export interface Job {
  name: string;
  bonus: string;
  rollMin: number;
  rollMax: number;
}

export interface JobTier {
  bonus: string;
  roll: { min: number; max: number };
}

export const Jobs = db.define(
  'jobs',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

export const JobTiers = db.define(
  'job_tiers',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'jobs',
        key: 'id',
      },
    },
    bonus: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    roll_min: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    roll_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

Jobs.hasMany(JobTiers, {
  foreignKey: 'job_id',
  as: 'tiers',
});

JobTiers.belongsTo(Jobs, {
  foreignKey: 'job_id',
  as: 'job',
});

async function seed() {
  // Reading each file in d100tables and set them to create the objects.
  const d100TablesDir = path.join(__dirname, '../../../d100tables');
  console.log(d100TablesDir);
  try {
    const d100Jobs = await fs.readdir(d100TablesDir);

    for (const file of d100Jobs) {
      //confirming that the file is .json
      if (!file.endsWith('.json')) continue;
      const jobName = file.split('.')[0];
      //read in json file.
      const jobJson: JobTier[] = (await import(`${d100TablesDir}/${file}`)).default;
      const job = await Jobs.create({
        name: jobName,
      });
      for (const tier of jobJson) {
        await JobTiers.create({
          job_id: job.getDataValue('id'),
          bonus: tier.bonus,
          roll_min: tier.roll.min,
          roll_max: tier.roll.max,
        });
      }
    }
  } catch (err: any) {
    console.error('Error reading in folders for each json for the jobs.' + err.message);
  }
}

export { seed };
