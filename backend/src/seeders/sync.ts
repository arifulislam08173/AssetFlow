import { sequelize } from "../config/database";
import "../models";

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    console.log("Database tables synchronized successfully.");
  } catch (error) {
    console.error("Database synchronization failed.", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

syncDatabase();
