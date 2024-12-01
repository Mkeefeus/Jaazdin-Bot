import { DataTypes, Model } from 'sequelize';
import { db } from 'db/db';
import fs from 'fs/promises';
import path from 'path';

interface JobTierData {
  bonus: string;
  roll: { min: number; max: number };
}

export class Job extends Model {
  declare id: number;
  declare name: string;
}

Job.init(
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
    sequelize: db,
    timestamps: true,
  }
);

export class JobTier extends Model {
  declare id: number;
  declare job_id: number;
  declare bonus: string;
  declare roll_min: number;
  declare roll_max: number;
}

JobTier.init(
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
        model: Job,
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
    sequelize: db,
    timestamps: true,
  }
);

Job.hasMany(JobTier, {
  foreignKey: 'job_id',
  as: 'tiers',
});

JobTier.belongsTo(Job, {
  foreignKey: 'job_id',
  as: 'job',
});

async function seed() {
  // Reading each file in d100tables and set them to create the objects.
  const d100TablesDir = path.join(__dirname, '../../../d100tables');
  try {
    const d100Jobs = await fs.readdir(d100TablesDir);

    for (const file of d100Jobs) {
      //confirming that the file is .json
      if (!file.endsWith('.json')) continue;
      let jobName = file.split('.')[0].toLowerCase();
      jobName = jobName.replace('-', ' ');
      //read in json file.
      const jobJson: JobTierData[] = (await import(`${d100TablesDir}/${file}`)).default;
      const job = await Job.create({
        name: jobName,
      });
      for (const tier of jobJson) {
        await JobTier.create({
          job_id: job.getDataValue('id'),
          bonus: tier.bonus,
          roll_min: tier.roll.min,
          roll_max: tier.roll.max,
        });
      }
    }
  } catch (err) {
    let message = 'Unknown Error';
    if (err instanceof Error) {
      message = err.message;
    }
    console.error('Error reading in folders for each json for the jobs. ' + message);
  }
}

export { seed };
