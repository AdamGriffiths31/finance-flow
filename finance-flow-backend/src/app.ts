/// <reference path="./types/express.d.ts" />
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { config } from "./config";
import { handleError } from "./utils/errorHandler";
import { requestLogger } from "./middleware/logger";
import { requestIdMiddleware } from "./middleware/requestId";
import { FinancesServiceFactory } from "./factories/FinancesServiceFactory";
import healthRoutes from "./routes/health";
import financesRoutes from "./routes/finances";
import projectionsRoutes from "./routes/projections";

export const createApp = (): Application => {
  const app = express();

  // Create service instances
  const financesService = FinancesServiceFactory.getInstance();

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

  // Request ID middleware
  app.use(requestIdMiddleware);

  // Request logging middleware
  app.use(requestLogger);

  // Inject services into routes
  app.use(`${config.apiPrefix}/health`, healthRoutes);
  app.use(`${config.apiPrefix}/finances`, financesRoutes(financesService));
  app.use(`${config.apiPrefix}/projections`, projectionsRoutes(financesService));

  // Global error handler middleware should be last
  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    handleError(error, res, 'globalErrorHandler', req.id);
  });

  return app;
};
