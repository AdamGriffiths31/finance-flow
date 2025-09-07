import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Middleware to add unique request ID to each request
 * Attaches a UUID to req.id for request tracking and correlation
 */
export const requestIdMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  req.id = randomUUID();
  next();
};