import { DataTypes, Model } from 'sequelize';
import { db } from '~/db';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';

export class Seed extends Model {
  declare name: string;
  declare rarity: string;
  declare price_min: number;
  declare price_max: number;
  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}

Seed.init(
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
  },
  {
    sequelize: db,
  }
);

async function seed() {
  // Use await import with ~/seeds/ for portability
  const seedsData = (await import('~/seeds/seeds.json')).seeds;
  try {
    for (const seed of seedsData) {
      await Seed.create({
        name: seed.name,
        rarity: seed.rarity,
        price_min: seed.price.min,
        price_max: seed.price.max,
      });
    }
    console.log('Seeds seeded!');
  } catch (error) {
    console.error('Could not seed seeds:', error);
  }
}

export { seed };

Seed.sync();
