import { DataTypes, Model } from 'sequelize';
import { db } from 'db/db';

export class Religion extends Model {
  declare id: number;
  declare name: string;
  declare follower_count: number;
  declare domain_id: number;
}

export class Domain extends Model {
  declare id: number;
  declare name: string;
  declare dominant_effect: string;
}

Domain.init(
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
    dominant_effect: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    timestamps: true,
  }
);

Religion.init(
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
    follower_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    domain_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Domain,
        key: 'id',
      },
    },
  },
  {
    sequelize: db,
    timestamps: true,
  }
);

Religion.belongsTo(Domain);

Domain.hasMany(Religion, {
  foreignKey: 'domain_id',
});


async function seed() {
  
  // parse through the religionInformation.json create each domain.
  const domainData = (await import('~/../religionInformation.json')).default;
  try {
    console.log(domainData);
    for (const domain of domainData) {
      await Domain.create({
        name: domain.domain,
        dominant_effect: domain.dominant_effect,
      });
    }
  } catch (error) {
    console.log('could not parse religions domains.', error);
  }
}


export { seed };
