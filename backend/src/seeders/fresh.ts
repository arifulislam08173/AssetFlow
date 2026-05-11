import { sequelize } from "../config/database";
import "../models";
import { seedDatabase } from "./seed-data";

(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
  const result = await seedDatabase();
  console.log("Fresh database created and seeded successfully.", result);
  await sequelize.close();
})();
