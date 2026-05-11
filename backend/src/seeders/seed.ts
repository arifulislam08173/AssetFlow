import { sequelize } from "../config/database";
import "../models";
import { seedDatabase } from "./seed-data";

(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  const result = await seedDatabase();
  console.log("Database seeded successfully.", result);
  await sequelize.close();
})();
