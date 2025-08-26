import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class Armor extends Model {
  declare name: string;
  declare plates: number;
  declare price: number;
  declare invalidMetals: string[];
}

Armor.init(
  {
    name: {
      type: DataTypes.STRING(40),
      primaryKey: true,
    },
    plates: DataTypes.INTEGER,
    price: DataTypes.INTEGER,
    invalidMetals: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Armor',
    tableName: 'armors',
    timestamps: false,
  }
);

async function seed() {
  // Use await import with ~/../ for portability
  const armorsData = (await import('~/../Inventories/armors.json')).armors;
  try {
    for (const armor of armorsData) {
      await Armor.create({
        name: armor.name,
        plates: armor.plates,
        price: armor.price,
        invalidMetals: armor.invalidMetals,
      });
    }
    console.log('Armors seeded!');
  } catch (error) {
    console.error('Could not seed armors:', error);
  }
}

export { seed };

Armor.sync();
