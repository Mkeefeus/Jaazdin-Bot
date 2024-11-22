import { DataTypes } from "sequelize";
import { db } from "db/db";

interface HarvestData {
  time: number;
  amount: number;
  name: string
  renewable: boolean; // if the harvest is not renewable, the plant needs to be removed after harvesting
}

export interface Plant {
  name: string;
  maturityTime: number;
  harvest: HarvestData[];
  user: string;
}

// export const Plants = db.define(
//   "plants",
//   {
//     // Model attributes are defined here
//     name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     user: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     maturity_time: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     harvest: {
//       type: DataTypes.JSON,
//       allowNull: false,
//     },
//   }
// );

export const Plants = db.define(
  "plants",
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
    user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    planted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
  }
);

export const PlantInformation = db.define(
  "plant_information",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    maturity_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    }
  }, {
    freezeTableName: true,
  }
)

export const PlantHarvestInformation = db.define(
  "plant_harvest_information",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    plant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "plant_information",
        key: 'id'
      },
    },
    harvest_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    harvest_amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    harvest_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    renewable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    }
  }, {
    freezeTableName: true,
  }
)

export const PlantHarvests = db.define(
  "plant_harvests",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    plant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "plants",
        key: 'id'
      },
    },
    harvest_info_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "plant_harvest_information",
        key: 'id'
      },
    },
    harvested_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    amount_harvested: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    }
  },
  {
    freezeTableName: true,
  }
);

// Set up associations
PlantInformation.hasMany(PlantHarvestInformation, {
  foreignKey: 'plant_id',
  as: 'harvests',
});

PlantHarvestInformation.belongsTo(PlantInformation, {
  foreignKey: 'plant_id',
  as: 'plant',
});

Plants.hasMany(PlantHarvests, {
  foreignKey: 'plant_id',
  as: 'harvests',
});

PlantHarvests.belongsTo(Plants, {
  foreignKey: 'plant_id',
  as: 'plant',
});

PlantHarvests.belongsTo(PlantHarvestInformation, {
  foreignKey: 'harvest_info_id',
  as: 'harvest_info',
});