import type { FastifyInstance } from 'fastify';
import { prisma } from '../../prisma.js';
import { getAuthPayload } from '../../middleware/auth.js';
import { isAdmin } from '../../middleware/admin.js';

export async function registerAdminDisputesRoutes(app: FastifyInstance, jwtSecret: string) {
  app.post('/admin/disputes/:id/unmask', async (request, reply) => {
    let authPayload;
    try {
      authPayload = getAuthPayload(request, jwtSecret);
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const adminId = authPayload.telegramId as string | undefined;
    if (!adminId || !isAdmin(adminId)) {
      console.error('[M6-T2] unauthorized unmask attempt:', adminId);
      return reply.status(403).send({ error: 'Forbidden' });
    }

    const { id } = request.params as { id: string };

    const job = await prisma.job.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    const unmaskedData = {
      jobId: job.id,
      jobTitle: job.title,
      clientFullName: job.client.fullName ?? null,
      clientNationalId: job.client.nationalId ?? null,
      clientTelegramId: job.client.telegramId,
      clientUsername: job.client.username ?? null,
      extractedAt: new Date().toISOString(),
      extractedBy: adminId,
    };

    console.log('[M6-T2] identity unmask for dispute:', {
      jobId: id,
      clientId: job.clientId,
      adminId,
    });

    return reply.status(200).send(unmaskedData);
  });
}
