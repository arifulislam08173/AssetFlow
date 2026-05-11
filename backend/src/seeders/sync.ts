import { sequelize } from "../config/database";
import "../models";

(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log("Database tables synchronized successfully.");
  await sequelize.close();
})();
