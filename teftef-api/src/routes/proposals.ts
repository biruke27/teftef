import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { getTrustTier } from '../utils.js';
import { getAuthPayload } from '../middleware/auth.js';

export async function registerProposalRoutes(app: FastifyInstance, jwtSecret: string) {
  app.post('/proposals', async (request, reply) => {
    let authPayload;

    try {
      authPayload = getAuthPayload(request, jwtSecret);
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const body = request.body as {
      jobId?: string;
      amount?: number;
      message?: string;
    };

    const jobId = body.jobId?.trim();
    const amount = Number(body.amount ?? 0);
    const message = body.message?.trim() ?? '';

    if (!jobId) {
      return reply.status(400).send({ error: 'jobId is required' });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return reply.status(400).send({ error: 'Amount must be greater than 0.' });
    }

    if (message.length < 20 || message.length > 500) {
      return reply.status(400).send({ error: 'Message must be between 20 and 500 characters.' });
    }

    const userId = authPayload.userId as string | undefined;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const freelancer = await prisma.user.findUnique({ where: { id: userId } });
    if (!freelancer || !freelancer.can_freelance || freelancer.is_banned) {
      return reply.status(403).send({ error: 'You do not have permission to submit proposals.' });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    if (job.status !== 'OPEN') {
      return reply.status(400).send({ error: 'Job is not open for proposals.' });
    }

    if (job.clientId === freelancer.id) {
      return reply.status(400).send({ error: 'You cannot submit a proposal on your own job.' });
    }

    try {
      const proposal = await prisma.proposal.create({
        data: {
          jobId,
          freelancerId: freelancer.id,
          amount,
          message,
        },
      });

      return reply.status(201).send({ proposal });
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        return reply.status(409).send({ error: 'You have already submitted a proposal for this job.' });
      }
      console.error('[M3-T1] proposal creation failed:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  app.get('/jobs/:id/proposals', async (request, reply) => {
    let authPayload;

    try {
      authPayload = getAuthPayload(request, jwtSecret);
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const userId = authPayload.userId as string | undefined;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    if (job.clientId !== userId) {
      return reply.status(403).send({ error: 'Only the job owner can view proposals.' });
    }

    const page = Number((request.query as { page?: string }).page ?? '1');
    const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
    const take = 20;
    const skip = (currentPage - 1) * take;

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where: { jobId: id },
        orderBy: { created_at: 'desc' },
        skip,
        take,
        include: { freelancer: true },
      }),
      prisma.proposal.count({ where: { jobId: id } }),
    ]);

    return {
      proposals: proposals.map((p) => ({
        id: p.id,
        amount: p.amount,
        message: p.message,
        status: p.status,
        createdAt: p.created_at,
        freelancerName: p.freelancer.username ?? 'Freelancer',
        trustTier: getTrustTier(p.freelancer.trust_score),
      })),
      total,
      page: currentPage,
    };
  });

  app.patch('/proposals/:id', async (request, reply) => {
    let authPayload;
    try {
      authPayload = getAuthPayload(request, jwtSecret);
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const userId = authPayload.userId as string | undefined;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { id } = request.params as { id: string };
    const { status } = request.body as { status?: string };

    if (status !== 'ACCEPTED' && status !== 'REJECTED') {
      return reply.status(400).send({ error: 'Invalid status' });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!proposal) {
      return reply.status(404).send({ error: 'Proposal not found' });
    }

    if (proposal.job.clientId !== userId) {
      return reply.status(403).send({ error: 'Only the job client can accept or reject proposals' });
    }

    if (status === 'ACCEPTED') {
      if (proposal.job.status !== 'OPEN') {
        return reply.status(400).send({ error: 'Job is not open for proposals' });
      }

      try {
        const [updatedProposal] = await prisma.$transaction([
          prisma.proposal.update({
            where: { id: proposal.id },
            data: { status: 'ACCEPTED' },
          }),
          prisma.proposal.updateMany({
            where: {
              jobId: proposal.jobId,
              id: { not: proposal.id },
              status: 'PENDING',
            },
            data: { status: 'REJECTED' },
          }),
          prisma.job.update({
            where: { id: proposal.jobId },
            data: { status: 'IN_PROGRESS' },
          }),
        ]);

        console.log('[M3-T2] proposal accepted, telegram notification would go to freelancer:', proposal.freelancerId);
        return { proposal: updatedProposal };
      } catch (error) {
        console.error('[M3-T2] proposal acceptance transaction failed:', error);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }

    try {
      const updatedProposal = await prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'REJECTED' },
      });
      return { proposal: updatedProposal };
    } catch (error) {
      console.error('[M3-T2] proposal rejection failed:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

