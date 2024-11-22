import { Sequelize } from "sequelize";

let sequelize: Sequelize | null = null;

export const db =
  sequelize ||
  new Sequelize({
    dialect: "sqlite",
    storage: "database.sqlite",
    logging: (msg) =>
      console.log(`\u001b[1;46m [DB] \u001b[0m \u001b[1;36m ${msg} \u001b[0m `),
    pool: {
      max: 1, // Reduce concurrent connections
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });

// Ensure only one connection
if (!sequelize) {
  sequelize = db;
}
