import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { getTrustTier } from '../utils.js';
import { requireAdmin } from '../middleware/admin.js';

export function registerAdminUserRoutes(app: FastifyInstance, jwtSecret: string) {
  app.get('/admin/me', async (request, reply) => {
    if (!requireAdmin(request, reply, jwtSecret)) return;
    return { isAdmin: true };
  });

  app.get('/admin/users', async (request, reply) => {
    if (!requireAdmin(request, reply, jwtSecret)) return;

    const telegramId = (request.query as { telegramId?: string }).telegramId?.trim();
    if (!telegramId) {
      return reply.status(400).send({ error: 'telegramId query parameter is required' });
    }

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return {
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        trust_score: user.trust_score,
        trustTier: getTrustTier(user.trust_score),
        is_banned: user.is_banned,
        role_mode: user.role_mode,
        created_at: user.created_at,
      },
    };
  });

  app.patch('/admin/users/:id', async (request, reply) => {
    if (!requireAdmin(request, reply, jwtSecret)) return;

    const { id } = request.params as { id: string };
    const { is_banned } = request.body as { is_banned?: boolean };

    if (typeof is_banned !== 'boolean') {
      return reply.status(400).send({ error: 'is_banned must be a boolean' });
    }

    try {
      const user = await prisma.user.update({
        where: { id },
        data: { is_banned },
      });
      return {
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          is_banned: user.is_banned,
          trust_score: user.trust_score,
          trustTier: getTrustTier(user.trust_score),
        },
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        return reply.status(404).send({ error: 'User not found' });
      }
      console.error('[M4-T2] admin user ban update failed:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  app.post('/admin/users/:id/trust', async (request, reply) => {
    if (!requireAdmin(request, reply, jwtSecret)) return;

    const { id } = request.params as { id: string };
    const { trust_score } = request.body as { trust_score?: number };
    const score = Number(trust_score);

    if (!Number.isInteger(score) || score < 0 || score > 100) {
      return reply.status(400).send({ error: 'trust_score must be an integer between 0 and 100' });
    }

    try {
      const user = await prisma.user.update({
        where: { id },
        data: { trust_score: score },
      });
      return {
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          trust_score: user.trust_score,
          trustTier: getTrustTier(user.trust_score),
          is_banned: user.is_banned,
        },
      };
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2025') {
        return reply.status(404).send({ error: 'User not found' });
      }
      console.error('[M4-T2] admin trust override failed:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
