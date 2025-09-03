import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/logger";
import healthRoutes from "./routes/health";
import sankeyRoutes from "./routes/sankey";
import financesRoutes from "./routes/finances";

export const createApp = (): Application => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(compression());

  app.use(requestLogger);

  app.use(`${config.apiPrefix}/health`, healthRoutes);
  app.use(`${config.apiPrefix}/sankey`, sankeyRoutes);
  app.use(`${config.apiPrefix}/finances`, financesRoutes);

  app.use(errorHandler);

  return app;
};
