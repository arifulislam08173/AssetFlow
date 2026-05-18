import { app } from "./app";
import { sequelize } from "./config/database";
import { env } from "./config/env";
import "./models";

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");
    app.listen(env.port, () => console.log(`AssetFlow API running on http://localhost:${env.port}`));
  }
  catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}
bootstrap();
