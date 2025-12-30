"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const database_1 = require("../config/database");
const up = async () => {
    try {
        console.log("🔄 Running migration: Add security fields to contacts table");
        await (0, database_1.query)(`
      ALTER TABLE contacts 
      ADD COLUMN IF NOT EXISTS security_token VARCHAR(64),
      ADD COLUMN IF NOT EXISTS submission_timestamp TIMESTAMP;
    `);
        console.log("✅ Migration completed successfully!");
    }
    catch (error) {
        console.error("❌ Migration failed:", error);
        throw error;
    }
};
exports.up = up;
const down = async () => {
    try {
        console.log("🔄 Rolling back migration: Remove security fields");
        await (0, database_1.query)(`
      ALTER TABLE contacts 
      DROP COLUMN IF EXISTS security_token,
      DROP COLUMN IF EXISTS submission_timestamp;
    `);
        console.log("✅ Rollback completed successfully!");
    }
    catch (error) {
        console.error("❌ Rollback failed:", error);
        throw error;
    }
};
exports.down = down;
