import { sequelize } from "../config/database";
import "../models";
import { seedDatabase } from "./seed-data";

async function runSeeder() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const result = await seedDatabase();

    console.log("Database seeded successfully.", result);
  } catch (error) {
    console.error("Database seeding failed.", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

runSeeder();
