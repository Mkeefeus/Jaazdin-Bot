import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class Weapon extends Model {
  declare name: string;
  declare plates: number;
  declare price: number;
  declare invalidMetals: string[];
}

Weapon.init(
  {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
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
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Weapon',
    tableName: 'weapons',
    timestamps: false,
  }
);

async function seed() {
  // Use await import with ~/../ for portability
  const weaponsData = (await import('~/../Inventories/weapons.json')).weapons;
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
