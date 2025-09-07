import dotenv from "dotenv";
import path from "path";

dotenv.config();

function validatePort(port: string | undefined): number {
  const defaultPort = 3001;
  
  if (!port) {
    return defaultPort;
  }
  
  const numericPort = parseInt(port, 10);
  
  if (isNaN(numericPort) || numericPort < 1 || numericPort > 65535) {
    // Use process.stderr for configuration warnings since logger may not be initialized yet
    process.stderr.write(`Warning: Invalid PORT value: ${port}. Using default port ${defaultPort}\n`);
    return defaultPort;
  }
  
  return numericPort;
}

export const config = {
  port: validatePort(process.env.PORT),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  apiPrefix: "/api/v1",
  dataDir: process.env.DATA_DIR || path.join(process.cwd(), 'data'),
  dataEnvironment: process.env.DATA_ENVIRONMENT || "test",
};
