"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
require("../models");
(async () => {
    await database_1.sequelize.authenticate();
    await database_1.sequelize.sync({ alter: true });
    console.log("Database tables synchronized successfully.");
    await database_1.sequelize.close();
})();
