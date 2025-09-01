import { DataTypes, Model } from 'sequelize';
import { db } from '../db';
import { CreatedAt, UpdatedAt } from 'sequelize-typescript';

export class Boat extends Model {
  declare id: number;
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
  @CreatedAt declare createdAt?: Date;
  @UpdatedAt declare updatedAt?: Date;
}

Boat.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    boatName: {
      type: DataTypes.TEXT,
      unique: true,
    },
    city: DataTypes.TEXT,
    country: DataTypes.TEXT,
    waitTime: DataTypes.INTEGER,
    timeInTown: DataTypes.INTEGER,
    jobsAffected: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
    },
    tier2Ability: DataTypes.TEXT,
    tableToGenerate: DataTypes.TEXT,
    isRunning: DataTypes.BOOLEAN,
    isTier2: DataTypes.BOOLEAN,
    weeksLeft: DataTypes.INTEGER,
    isInTown: DataTypes.BOOLEAN,
    messageId: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize: db,
  }
);

export class Shipment extends Model {
  declare id: number;
  declare boatId: number;
  declare itemName: string;
  declare price: number;
  declare quantity: number;
  declare type: string;
  @CreatedAt declare createdAt?: Date;
  @UpdatedAt declare updatedAt?: Date;
}

Shipment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    boatId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Boat,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    itemName: DataTypes.TEXT,
    price: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    type: DataTypes.TEXT,
  },
  {
    sequelize: db,
  }
);

Boat.hasMany(Shipment);

Shipment.belongsTo(Boat);

async function seed() {
  // Use await import for portability
  const boatsData = (await import('~/../boats.json')).default || (await import('~/../boats.json'));
  const shipmentsData = (await import('~/../shipments.json')).default || (await import('~/../shipments.json'));
  const boats: Boat[] = [];
  try {
    for (const boat of boatsData) {
      boats.push(await Boat.create({
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
      }));
    }
    console.log('Boats seeded!');

    for (const shipment of shipmentsData) {
      await Shipment.create({
        boatId: boats.find(boat => boat.boatName === shipment.boatName)?.id,
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

Boat.sync();
