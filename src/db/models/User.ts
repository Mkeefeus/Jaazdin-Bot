import { DataTypes, Model } from 'sequelize';
import { db } from 'db/db';

export class User extends Model {
  declare id: number;
  declare discord_id: string;
  declare character_name: string;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    discord_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    character_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: db,
  }
);

async function seed() {
  await User.sync({ force: true });
}

export { seed };
