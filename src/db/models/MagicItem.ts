import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class MagicItem extends Model {
  declare id: number;
  declare name: string;
  declare table: string;
  declare roll_min: number;
  declare roll_max: number;
  declare price_min: number;
  declare price_max: number;
}

MagicItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    table: {
      type: DataTypes.STRING(2),
      allowNull: false,
    },
    roll_min: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    roll_max: {
      type: DataTypes.INTEGER,
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
    modelName: 'MagicItem',
    tableName: 'magic_items',
    timestamps: false,
  }
);

async function seed() {
  // Use await import with ~/../ for portability
  const magicItemsData = (await import('~/../Inventories/magicItems.json')).magicItems;
  try {
    for (const item of magicItemsData) {
      await MagicItem.create({
        name: item.name,
        table: item.table,
        roll_min: item.roll.min,
        roll_max: item.roll.max,
        price_min: item.price.min,
        price_max: item.price.max,
      });
    }
    console.log('Magic items seeded!');
  } catch (error) {
    console.error('Could not seed magic items:', error);
  }
}

export { seed };