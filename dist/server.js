"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const init_1 = require("./migrations/init");
const PORT = Number(process.env.PORT) || 2025;
// Startup banner
console.log("");
console.log("═══════════════════════════════════════════════════");
console.log("   ACCIAN NIGERIA LIMITED - BACKEND API SERVER");
console.log("═══════════════════════════════════════════════════");
console.log("");
// Async startup function
async function startServer() {
    try {
        // 1. Connect to database
        await (0, database_1.connectionDatabase)();
        console.log("✅ Database connected");
        // 2. Run migrations
        await (0, init_1.runMigrations)();
        // 3. Start server
        app_1.default.listen(PORT, () => {
            console.log("🚀 Server Status: RUNNING");
            console.log(`📡 Port: ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`🔗 Base URL: http://localhost:${PORT}`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            console.log("");
            console.log("📋 Available Endpoints:");
            console.log(`   POST   /api/contact`);
            console.log(`   GET    /api/services`);
            console.log(`   GET    /api/testimonials`);
            console.log(`   GET    /api/projects`);
            console.log(`   GET    /api/projects/:slug`);
            console.log(`   POST   /api/admin/login`);
            console.log(`   GET    /api/admin/contacts`);
            console.log(`   GET    /api/admin/dashboard/stats`);
            console.log("");
            console.log("✅ Server ready to accept requests");
            console.log("═══════════════════════════════════════════════════");
            console.log("");
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) {
            console.error("Stack:", error.stack);
        }
        process.exit(1);
    }
}
// Start the server
startServer();
// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Promise Rejection:", err.message);
    console.error("Stack:", err.stack);
    process.exit(1);
});
// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err.message);
    console.error("Stack:", err.stack);
    process.exit(1);
});
// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("");
    console.log("👋 SIGTERM signal received: closing HTTP server");
    process.exit(0);
});
process.on("SIGINT", () => {
    console.log("");
    console.log("👋 SIGINT signal received: closing HTTP server");
    process.exit(0);
});
