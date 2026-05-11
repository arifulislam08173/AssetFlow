"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
require("../models");
const seed_data_1 = require("./seed-data");
(async () => {
    await database_1.sequelize.authenticate();
    await database_1.sequelize.sync({ alter: true });
    const result = await (0, seed_data_1.seedDatabase)();
    console.log("Database seeded successfully.", result);
    await database_1.sequelize.close();
})();
