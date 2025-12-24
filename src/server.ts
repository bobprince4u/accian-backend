// src/server.ts
import "dotenv/config";
import app from "./app";
import { connectionDatabase } from "./config/database";

const PORT: number = Number(process.env.PORT) || 2025;

// Startup banner
console.log("");
console.log("═══════════════════════════════════════════════════");
console.log("   ACCIAN NIGERIA LIMITED - BACKEND API SERVER");
console.log("═══════════════════════════════════════════════════");
console.log("");

// Connect to database and start server
connectionDatabase()
  .then(() => {
    // Start server
    app.listen(PORT, () => {
      console.log("🚀 Server Status: RUNNING");
      console.log(`📡 Port: ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Base URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log("");
      console.log("📋 Available Endpoints:");
      console.log(`   POST   /api/contact`);
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
  })
  .catch((error: Error) => {
    console.error("❌ Failed to start server:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  console.error("❌ Unhandled Promise Rejection:", err.message);
  console.error("Stack:", err.stack);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
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
