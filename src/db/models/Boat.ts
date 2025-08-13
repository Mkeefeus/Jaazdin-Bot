import { DataTypes, Model } from 'sequelize';
import { db } from '../db';

export class Boat extends Model {
  declare boatName: string;
  declare city: string;
  declare country: string;
  declare waitTime: number;
  declare timeInTown: number;
  declare jobsAffected: string[];
  declare tier2Ability: string;
  declare tableToGenerate: string;
  declare isRunning: boolean;
  declare isTier2: boolean;
  declare weeksLeft: number;
  declare isInTown: boolean;
  declare messageId: string | null; // Store Discord message ID for the boat's embed
}

Boat.init(
  {
    boatName: {
      type: DataTypes.STRING(40),
      primaryKey: true,
    },
    city: DataTypes.STRING(40),
    country: DataTypes.STRING(40),
    waitTime: DataTypes.INTEGER,
    timeInTown: DataTypes.INTEGER,
    jobsAffected: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    tier2Ability: DataTypes.STRING(255),
    tableToGenerate: DataTypes.STRING(40),
    isRunning: DataTypes.BOOLEAN,
    isTier2: DataTypes.BOOLEAN,
    weeksLeft: DataTypes.INTEGER,
    isInTown: DataTypes.BOOLEAN,
    messageId: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize: db,
    modelName: 'Boat',
    tableName: 'boats',
    timestamps: false,
  }
);

export class Shipment extends Model {
  declare id: number;
  declare boatName: string;
  declare itemName: string;
  declare price: number;
  declare quantity: number;
  declare type: string;
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
      field: 'boat_name',
      references: {
        model: 'boats',
        key: 'boatName',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
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
    type: {
      type: DataTypes.STRING(10),
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

Boat.hasMany(Shipment, {
  foreignKey: 'boat_name', // <-- use the DB column name
  sourceKey: 'boatName',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Shipment.belongsTo(Boat, {
  foreignKey: 'boat_name',
  targetKey: 'boatName',
});

async function seed() {
  // Use await import for portability
  const boatsData = (await import('~/../boats.json')).default || (await import('~/../boats.json'));
  const shipmentsData = (await import('~/../shipments.json')).default || (await import('~/../shipments.json'));
  try {
    for (const boat of boatsData) {
      await Boat.create({
        boatName: boat.boatName,
        city: boat.city,
        country: boat.country,
        waitTime: boat.waitTime,
        timeInTown: boat.timeInTown,
        jobsAffected: boat.jobsAffected,
        tier2Ability: boat.tier2Ability,
        tableToGenerate: boat.tableToGenerate,
        isRunning: boat.isRunning,
        isTier2: boat.isTier2,
        weeksLeft: boat.weeksLeft,
        isInTown: boat.isInTown,
      });
    }
    console.log('Boats seeded!');

    for (const shipment of shipmentsData) {
      await Shipment.create({
        boatName: shipment.boatName,
        itemName: shipment.itemName,
        price: shipment.price,
        quantity: shipment.quantity,
        type: shipment.type
      });
    }
    console.log('Shipments seeded!');
  } catch (error) {
    console.error('Could not seed boats or shipments:', error);
  }
}

export { seed };
