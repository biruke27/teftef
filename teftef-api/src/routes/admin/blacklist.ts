import type { FastifyInstance } from 'fastify';
import { prisma } from '../../prisma.js';
import { getAuthPayload } from '../../middleware/auth.js';
import { isAdmin } from '../../middleware/admin.js';
import { addToBlacklist } from '../../middleware/blacklistGuard.js';

export async function registerAdminBlacklistRoutes(app: FastifyInstance, jwtSecret: string) {
  app.post('/admin/blacklist', async (request, reply) => {
    let authPayload;
    try {
      authPayload = getAuthPayload(request, jwtSecret);
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const adminId = authPayload.telegramId as string | undefined;
    if (!adminId || !isAdmin(adminId)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const body = request.body as {
      userId?: string;
      telegramId?: string;
      reason?: string;
    };

    const userId = body.userId;
    const reason = body.reason ?? 'No reason provided';

    let user;

    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
    } else {
      return reply.status(400).send({ error: 'userId is required' });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        await addToBlacklist({
          telegramId: user.telegramId,
          nationalId: user.nationalId ?? undefined,
          fullName: user.fullName ?? undefined,
          reason,
          created_by: adminId,
        });

        const deletedJobs = await tx.job.deleteMany({
          where: {
            clientId: userId,
            status: { in: ['OPEN', 'PENDING_MATCH'] },
          },
        });

        const deletedProposals = await tx.proposal.deleteMany({
          where: {
            freelancerId: userId,
            status: { in: ['PENDING', 'MATCHING'] },
          },
        });

        console.log('[M6-T1] blacklist cascade purge completed:', {
          userId,
          telegramId: user.telegramId,
          jobsDeleted: deletedJobs.count,
          proposalsDeleted: deletedProposals.count,
        });

        return {
          blacklistedUser: {
            id: user.id,
            telegramId: user.telegramId,
            fullName: user.fullName,
            nationalId: user.nationalId,
          },
          purged: {
            jobsDeleted: deletedJobs.count,
            proposalsDeleted: deletedProposals.count,
          },
        };
      });

      return reply.status(200).send(result);
    } catch (error) {
      console.error('[M6-T1] blacklist cascade purge failed:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
