// config/db.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const DB_NAME = process.env.DB_NAME || "restoflow_pos";
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASS ?? "";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT) || 3306;

export const dbConfig = {
    user: DB_USER,
    password: DB_PASS,
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    dialect: "mysql"
};

/**
 * Shared Sequelize instance configured for MySQL (restoflow_pos)
 */
export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "mysql",
    logging: process.env.DB_LOGGING === "true" ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        charset: "utf8mb4"
    },
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci"
    }
});

/**
 * Authenticate connection to MySQL and optionally synchronize Sequelize models.
 * @param {Object} [options]
 * @param {boolean} [options.sync=true] - Whether to run sequelize.sync()
 * @param {boolean} [options.alter=false] - Whether to alter existing tables safely
 */
export const connectDB = async ({ sync = true, alter = false } = {}) => {
    await sequelize.authenticate();
    console.log(`✅ MySQL connected successfully (${DB_HOST}:${DB_PORT}/${DB_NAME})`);

    if (sync) {
        await sequelize.sync({ alter });
        console.log(`✅ Sequelize models synchronized with database '${DB_NAME}'`);
    }

    return sequelize;
};

export default sequelize;
