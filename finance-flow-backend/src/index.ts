/// <reference path="./types/express.d.ts" />
import { createApp } from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";

const startServer = async (): Promise<void> => {
  try {
    const app = createApp();

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`, {
        context: 'startup',
        port: config.port,
        environment: config.nodeEnv,
        apiPrefix: config.apiPrefix,
        corsOrigin: config.corsOrigin
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error, { context: 'startup' });
    process.exit(1);
  }
};

startServer();
