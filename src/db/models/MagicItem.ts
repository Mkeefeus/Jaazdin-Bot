import { DataTypes, Model } from 'sequelize';
import { db } from '../db';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';

export class MagicItem extends Model {
  declare id: number;
  declare name: string;
  declare item_table: string;
  declare roll_min: number;
  declare roll_max: number;
  declare price_min: number;
  declare price_max: number;
  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
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
    item_table: {
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
  }
);

async function seed() {
  // Use await import with ~/seeds/ for portability
  const magicItemsData = (await import('~/seeds/magicItems.json')).magicItems;
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

MagicItem.sync();
