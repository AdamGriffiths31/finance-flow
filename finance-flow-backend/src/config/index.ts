import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  apiPrefix: "/api/v1",
  dataDir: process.env.DATA_DIR || path.join(process.cwd(), 'data'),
  dataEnvironment: process.env.DATA_ENVIRONMENT || "test",
};
