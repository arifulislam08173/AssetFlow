"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const database_1 = require("./config/database");
const env_1 = require("./config/env");
require("./models");
async function bootstrap() {
    try {
        await database_1.sequelize.authenticate();
        console.log("Database connected successfully");
        app_1.app.listen(env_1.env.port, () => console.log(`AssetFlow API running on http://localhost:${env_1.env.port}`));
    }
    catch (error) {
        console.error("Failed to start server", error);
        process.exit(1);
    }
}
bootstrap();
