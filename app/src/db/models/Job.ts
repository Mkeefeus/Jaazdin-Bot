import { DataTypes, Model } from 'sequelize';
import { db } from 'db/db';
import fs from 'fs/promises';
import path from 'path';

export class Job extends Model {
  declare id: number;
  declare name: string;
}

export class JobTier extends Model {
  declare id: number;
  declare job_id: number;
  declare bonus: string;
  declare roll_min: number;
  declare roll_max: number;
}
interface JobTierData {
  bonus: string;
  roll: { min: number; max: number };
}

Job.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize: db,
  }
);

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
      type: DataTypes.TEXT,
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
  }
);

Job.hasMany(JobTier, {
  foreignKey: 'job_id',
});

JobTier.belongsTo(Job);

async function seed() {
  // Reading each file in d100tables and set them to create the objects.
  const d100TablesDir = path.join(__dirname, '../../d100tables');
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
    console.log('Jobs and Job Tiers seeded!');
  } catch (err) {
    let message = 'Unknown Error';
    if (err instanceof Error) {
      message = err.message;
    }
    console.error('Error reading in folders for each json for the jobs. ' + message);
  }
}

export { seed };

Job.sync();
