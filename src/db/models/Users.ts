import {DataTypes} from "sequelize";
import {db} from "db/db";

export const Users = db.define(
    'users',
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
    }
)

async function seed() {
    await Users.sync({force: true});  
}

export {
    seed
}