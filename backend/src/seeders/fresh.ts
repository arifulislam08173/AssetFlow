import { sequelize } from "../config/database";
import "../models";
import { seedDatabase } from "./seed-data";

async function freshSeed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    const result = await seedDatabase();

    console.log("Fresh database created and seeded successfully.", result);
  } catch (error) {
    console.error("Fresh database seed failed.", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

freshSeed();
