import { DataTypes, Model } from 'sequelize';
import { db } from '../db';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';

export class Pet extends Model {
  declare name: string;
  declare cr: number;
  declare price_min: number;
  declare price_max: number;
  declare type: string;
  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}

Pet.init(
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
    cr: {
      type: DataTypes.FLOAT,
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
    type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize: db,
  }
);

async function seed() {
  // Use await import with ~/../ for portability
  const petsData = (await import('~/../Inventories/pets.json')).pets;
  try {
    for (const pet of petsData) {
      await Pet.create({
        name: pet.name,
        cr: pet.cr,
        price_min: pet.price.min,
        price_max: pet.price.max,
        type: pet.type,
      });
    }
    console.log('Pets seeded!');
  } catch (error) {
    console.error('Could not seed pets:', error);
  }
}

export { seed };

Pet.sync();
