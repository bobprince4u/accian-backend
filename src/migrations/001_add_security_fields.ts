import { query } from "../config/database";

export const up = async (): Promise<void> => {
  try {
    console.log("🔄 Running migration: Add security fields to contacts table");

    await query(`
      ALTER TABLE contacts 
      ADD COLUMN IF NOT EXISTS security_token VARCHAR(64),
      ADD COLUMN IF NOT EXISTS submission_timestamp TIMESTAMP;
    `);

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

export const down = async (): Promise<void> => {
  try {
    console.log("🔄 Rolling back migration: Remove security fields");

    await query(`
      ALTER TABLE contacts 
      DROP COLUMN IF EXISTS security_token,
      DROP COLUMN IF EXISTS submission_timestamp;
    `);

    console.log("✅ Rollback completed successfully!");
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    throw error;
  }
};
