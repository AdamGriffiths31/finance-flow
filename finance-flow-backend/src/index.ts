import { createApp } from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";

const startServer = async () => {
  try {
    const app = createApp();

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
