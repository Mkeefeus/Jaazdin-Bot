import { DataTypes, Model } from 'sequelize';
import { db } from '../db';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';

export class Weapon extends Model {
  declare name: string;
  declare plates: number;
  declare price: number;
  declare invalidMetals: string[];
  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}

Weapon.init(
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
    plates: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    invalidMetals: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
    },
  },
  {
    sequelize: db,
  }
);

async function seed() {
  // Use await import with ~/seeds/ for portability
  const weaponsData = (await import('~/seeds/weapons.json')).weapons;
  try {
    for (const weapon of weaponsData) {
      await Weapon.create({
        name: weapon.name,
        plates: weapon.plates,
        price: weapon.price,
        invalidMetals: weapon.invalidMetals,
      });
    }
    console.log('Weapons seeded!');
  } catch (error) {
    console.error('Could not seed weapons:', error);
  }
}

export { seed };

Weapon.sync();
