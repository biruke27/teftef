import type { FastifyInstance } from 'fastify';
import { registerAdminUserRoutes } from './admin-users.js';
import { registerAdminJobRoutes } from './admin-jobs.js';

export async function registerAdminRoutes(app: FastifyInstance, jwtSecret: string) {
  registerAdminUserRoutes(app, jwtSecret);
  registerAdminJobRoutes(app, jwtSecret);
}
