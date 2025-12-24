"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.connectionDatabase = void 0;
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
});
const connectionDatabase = async () => {
    try {
        const client = await pool.connect();
        console.log("PostgresSQL Database connected successfully");
        client.release();
        return pool;
    }
    catch (error) {
        console.error("Error connecting to the PostgreSQL database:", error.message);
        throw new Error("Failed to connect to the database");
    }
};
exports.connectionDatabase = connectionDatabase;
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log("Executed query", {
            text: text.substring(0, 50) + "...",
            duration: `${duration}ms`,
            rows: res.rowCount,
        });
        return res;
    }
    catch (error) {
        console.error("Database query error:", error.message);
        throw error;
    }
};
exports.query = query;
exports = {
    pool,
};
