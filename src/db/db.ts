import { Sequelize } from 'sequelize';

let sequelize: Sequelize | null = null;

const dialect = process.env.NODE_ENV === 'production' ? 'postgres' : 'sqlite';
const storage = process.env.NODE_ENV === 'production' ? undefined : 'database.sqlite';
const dialectOptions = process.env.NODE_ENV === 'production' ? { ssl: { require: true, rejectUnauthorized: false } } : {};
const database = process.env.DB_TABLE;
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT) || 5432;

export const db =
  sequelize ||
  new Sequelize({
    database,
    username,
    password,
    host,
    port,
    dialect,
    storage,
    dialectOptions,
    // logging: (msg) => console.log(`\u001b[1;46m [DB] \u001b[0m \u001b[1;36m ${msg} \u001b[0m `),
    logging: (msg) => {
      if (msg.toLowerCase().includes('error')) {
      console.error(`\u001b[1;41m [DB ERROR] \u001b[0m \u001b[1;31m ${msg} \u001b[0m`);
      }
    },
    pool: {
      max: 1, // Reduce concurrent connections
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  });

// Ensure only one connection
if (!sequelize) {
  sequelize = db;
}
