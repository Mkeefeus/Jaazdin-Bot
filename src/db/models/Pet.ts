import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class Pet extends Model {
  declare name: string;
  declare cr: number;
  declare price_min: number;
  declare price_max: number;
  declare type: string;
}

Pet.init(
  {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
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
      type: DataTypes.STRING(40),
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Pet',
    tableName: 'pets',
    timestamps: false,
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