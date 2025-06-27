import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class Shipment extends Model {
  declare id: number;
  declare boatName: string;
  declare itemName: string;
  declare price: number;
  declare quantity: number;
}

Shipment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    boatName: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    itemName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Shipment',
    tableName: 'shipments',
    timestamps: false,
  }
);