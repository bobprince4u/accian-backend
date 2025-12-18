import "dotenv/config";
import bcrypt from "bcryptjs";
import { query, connectionDatabase } from "../src/config/database";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
};

const createAdmin = async (): Promise<void> => {
  try {
    console.log("");
    console.log("═══════════════════════════════════════");
    console.log("   ACCIAN - Create Admin User");
    console.log("═══════════════════════════════════════");
    console.log("");

    // Connect to database
    await connectionDatabase();

    // Get admin details
    const fullName = await prompt("Full Name: ");
    const username = await prompt("Username: ");
    const email = await prompt("Email: ");
    const password = await prompt("Password (min 8 characters): ");

    // Validate password
    if (password.length < 8) {
      console.log("❌ Password must be at least 8 characters");
      rl.close();
      process.exit(1);
    }

    // Hash password
    console.log("\n🔐 Hashing password...");
    const passwordHash: string = await bcrypt.hash(password, 12);

    // Insert admin user
    console.log("💾 Creating admin user...");
    const result = await query(
      `INSERT INTO admin_users (username, email, password_hash, full_name, role, active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, username, email, full_name, role`,
      [username, email, passwordHash, fullName, "admin"]
    );

    console.log("");
    console.log("✅ Admin user created successfully!");
    console.log("Details:", result.rows[0]);
  } catch (error: unknown) {
    console.error("❌ Error creating admin user:", (error as Error).message);
  } finally {
    rl.close();
  }
};

createAdmin();
