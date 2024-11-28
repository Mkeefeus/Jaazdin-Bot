import { DataTypes } from "sequelize";
import { db } from "db/db";
import fs from "fs/promises";


export interface Job {
  name: string,
  bonus: string,
  rollMin: number,
  rollMax: number,
}

export interface JobTier {
  bonus: string
  roll: {min: number, max: number}
}

export const Jobs = db.define(
  "jobs",
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

async function seed() {
  // Reading each file in d100tables and set them to create the objects.
  const d100TablesDir = '~/../d100tables'
  try {
    const d100Jobs = await fs.readdir(d100TablesDir);

    for (const file of d100Jobs) {
      //confirming that the file is .json
      if (!file.endsWith(".json")) continue;
      const jobName = file.split('.')[0]
      //read in json file. 
      const jobJson: JobTier[] = (await import(`${d100TablesDir}/${file}`)).default
      for (const tier of jobJson) {
        //make new job row.
        console.log(tier)
        const job = await Jobs.create({
          name: jobName,
          bonus: tier.bonus,
          roll_min: tier.roll.min,
          roll_max: tier.roll.max
        });
      }
    }
  }
  catch (err: any) {
    console.error("Error reading in folders for each json for the jobs." + err.message);
  }
}

export {
  seed
}