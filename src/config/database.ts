import { Pool, PoolClient, QueryResult } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export const connectionDatabase = async (): Promise<Pool> => {
  try {
    const client: PoolClient = await pool.connect();
    console.log("PostgresSQL Database connected successfully");
    client.release();
    return pool;
  } catch (error: any) {
    console.error(
      "Error connecting to the PostgreSQL database:",
      error.message
    );
    throw new Error("Failed to connect to the database");
  }
};

export const query = async (
  text: string,
  params?: any[]
): Promise<QueryResult<any>> => {
  const start = Date.now();
  try {
    const res: QueryResult<any> = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", {
      text: text.substring(0, 50) + "...",
      duration: `${duration}ms`,
      rows: res.rowCount,
    });
    return res;
  } catch (error: any) {
    console.error("Database query error:", error.message);
    throw error;
  }
};

exports = {
  pool,
};
