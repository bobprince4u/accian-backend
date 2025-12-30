"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const _001_add_security_fields_1 = require("./001_add_security_fields");
// Load environment variables FIRST
dotenv_1.default.config();
const runMigration = async () => {
    try {
        console.log("Starting database migration...");
        // Debug: Check if DATABASE_URL is loaded
        if (!process.env.DATABASE_URL && !process.env.DB_PASSWORD) {
            console.error("❌ Database credentials not found in environment variables!");
            console.log("Available env vars:", Object.keys(process.env).filter((k) => k.includes("DB")));
            process.exit(1);
        }
        await (0, _001_add_security_fields_1.up)();
        console.log("All migrations completed successfully!");
        process.exit(0);
    }
    catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};
runMigration();
