import { DataTypes, Model } from 'sequelize';
import { db } from '~/db';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';

export class Metal extends Model {
  declare name: string;
  declare rarity: string;
  declare price_min: number;
  declare price_max: number;
  declare plane: string;
  declare runesmithed: boolean;
  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}

Metal.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    rarity: {
      type: DataTypes.TEXT,
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
      type: DataTypes.TEXT,
      allowNull: false,
    },
    runesmithed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    sequelize: db,
  }
);

async function seed() {
  // Use await import with ~/seeds/ for portability
  const metalsData = (await import('~/seeds/metals.json')).metals;
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

Metal.sync();
