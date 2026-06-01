import type { FastifyInstance } from 'fastify';
import { registerAdminUserRoutes } from './admin-users.js';
import { registerAdminJobRoutes } from './admin-jobs.js';
import { registerAdminBlacklistRoutes } from './admin/blacklist.js';
import { registerAdminDisputesRoutes } from './admin/disputes.js';

export async function registerAdminRoutes(app: FastifyInstance, jwtSecret: string) {
  registerAdminUserRoutes(app, jwtSecret);
  registerAdminJobRoutes(app, jwtSecret);
  await registerAdminBlacklistRoutes(app, jwtSecret);
  await registerAdminDisputesRoutes(app, jwtSecret);
}
