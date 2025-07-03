import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class Metal extends Model {
  declare name: string;
  declare rarity: string;
  declare price_min: number;
  declare price_max: number;
  declare plane: string;
  declare runesmithed: boolean;
}

Metal.init(
  {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
    },
    rarity: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    price_min: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    plane: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    runesmithed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Metal',
    tableName: 'metals',
    timestamps: false,
  }
);

async function seed() {
  // Use await import with ~/../ for portability
  const metalsData = (await import('~/../Inventories/metals.json')).metals;
  try {
    for (const metal of metalsData) {
      await Metal.create({
        name: metal.name,
        rarity: metal.rarity,
        price_min: metal.price.min,
        price_max: metal.price.max,
        plane: metal.plane,
        runesmithed: metal.runesmithed ?? false,
      });
    }
    console.log('Metals seeded!');
  } catch (error) {
    console.error('Could not seed metals:', error);
  }
}

export { seed };
