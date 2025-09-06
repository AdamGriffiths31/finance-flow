import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { randomUUID } from "crypto";
import { config } from "./config";
import { handleError } from "./utils/errorHandler";
import { logger } from "./utils/logger";
import healthRoutes from "./routes/health";
import sankeyRoutes from "./routes/sankey";
import financesRoutes from "./routes/finances";
import projectionsRoutes from "./routes/projections";

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

  // Request ID and logging middleware
  app.use((req: Request & { id?: string }, _res: Response, next: NextFunction) => {
    req.id = randomUUID();
    logger.info(`[${req.id}] ${req.method} ${req.path}`);
    next();
  });

  app.use(`${config.apiPrefix}/health`, healthRoutes);
  app.use(`${config.apiPrefix}/sankey`, sankeyRoutes);
  app.use(`${config.apiPrefix}/finances`, financesRoutes);
  app.use(`${config.apiPrefix}/projections`, projectionsRoutes);

  // Global error handler middleware should be last
  app.use((error: unknown, req: Request & { id?: string }, res: Response, _next: NextFunction) => {
    handleError(error, res, 'globalErrorHandler', req.id);
  });

  return app;
};
