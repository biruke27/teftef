import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { getPostedLabel } from '../utils.js';
import { requireAdmin } from '../middleware/admin.js';
import { mapAdminParty } from './admin-map.js';

export function registerAdminJobRoutes(app: FastifyInstance, jwtSecret: string) {
  app.get('/admin/disputes', async (request, reply) => {
    if (!requireAdmin(request, reply, jwtSecret)) return;

    const page = Number((request.query as { page?: string }).page ?? '1');
    const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
    const take = 20;
    const skip = (currentPage - 1) * take;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: { status: 'DISPUTED' },
        orderBy: { created_at: 'desc' },
        skip,
        take,
        include: {
          client: true,
          proposals: {
            where: { status: 'ACCEPTED' },
            include: { freelancer: true },
            take: 1,
          },
        },
      }),
      prisma.job.count({ where: { status: 'DISPUTED' } }),
    ]);

    return {
      disputes: jobs.map((job) => {
        const accepted = job.proposals[0];
        return {
          jobId: job.id,
          title: job.title,
          budget: job.budget,
          status: job.status,
          postedAt: getPostedLabel(job.created_at),
          client: mapAdminParty(job.client),
          freelancer: accepted ? mapAdminParty(accepted.freelancer) : null,
        };
      }),
      total,
      page: currentPage,
    };
  });

  app.patch('/admin/jobs/:id', async (request, reply) => {
    if (!requireAdmin(request, reply, jwtSecret)) return;

    const { id } = request.params as { id: string };
    const { status } = request.body as { status?: string };

    if (status !== 'COMPLETED' && status !== 'CLOSED') {
      return reply.status(400).send({ error: 'status must be COMPLETED or CLOSED' });
    }

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    if (job.status !== 'DISPUTED') {
      return reply.status(400).send({ error: 'Only disputed jobs can be resolved by admin' });
    }

    try {
      const updated = await prisma.job.update({
        where: { id },
        data: { status },
      });
      return { job: { id: updated.id, status: updated.status } };
    } catch (error) {
      console.error('[M4-T2] admin job resolve failed:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  app.delete('/admin/jobs/:id', async (request, reply) => {
    if (!requireAdmin(request, reply, jwtSecret)) return;

    const { id } = request.params as { id: string };
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    try {
      await prisma.$transaction([
        prisma.proposal.deleteMany({ where: { jobId: id } }),
        prisma.job.delete({ where: { id } }),
      ]);
      return reply.status(204).send();
    } catch (error) {
      console.error('[M4-T2] admin job delete failed:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
