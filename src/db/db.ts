import { Options, Sequelize } from 'sequelize';

let sequelize: Sequelize | null = null;

const dbsettings: Partial<Options> = {
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  dialect: 'postgres',
};

export const db =
  sequelize ||
  new Sequelize({
    ...dbsettings,
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
