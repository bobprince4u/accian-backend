import dotenv from "dotenv";
import { up } from "./001_add_security_fields";

// Load environment variables FIRST
dotenv.config();

const runMigration = async () => {
  try {
    console.log("Starting database migration...");

    // Debug: Check if DATABASE_URL is loaded
    if (!process.env.DATABASE_URL && !process.env.DB_PASSWORD) {
      console.error(
        "❌ Database credentials not found in environment variables!"
      );
      console.log(
        "Available env vars:",
        Object.keys(process.env).filter((k) => k.includes("DB"))
      );
      process.exit(1);
    }

    await up();
    console.log("All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
