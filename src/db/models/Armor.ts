import { DataTypes, Model } from 'sequelize';
import { db } from '~/db';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';

export class Armor extends Model {
  declare id: number;
  declare name: string;
  declare plates: number;
  declare price: number;
  declare invalidMetals: string[];
  @CreatedAt declare createdAt?: Date;
  @UpdatedAt declare updatedAt?: Date;
}

Armor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      unique: true,
    },
    plates: DataTypes.INTEGER,
    price: DataTypes.INTEGER,
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
  const armorsData = (await import('~/seeds/armors.json')).armors;
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
