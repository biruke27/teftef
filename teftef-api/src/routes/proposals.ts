import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { getTrustTier, signJwt } from '../utils.js';
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
      fullName?: string;
      nationalId?: string;
      acceptedMasterTerms?: boolean;
    };

    const jobId = body.jobId?.trim();
    const amount = Number(body.amount ?? 0);
    const message = body.message?.trim() ?? '';

    if (!jobId) {
      return reply.status(400).send({ error: 'jobId is required' });
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
      // Update freelancer identity fields if provided and not already set
      const profileUpdate: Record<string, string | boolean> = {};
      if (body.fullName && !freelancer.fullName) profileUpdate.fullName = body.fullName.trim();
      if (body.nationalId && !freelancer.nationalId) profileUpdate.nationalId = body.nationalId.trim();
      if (body.acceptedMasterTerms && !freelancer.acceptedMasterTerms) profileUpdate.acceptedMasterTerms = true;

      const result = await prisma.$transaction(async (tx) => {
        if (Object.keys(profileUpdate).length > 0) {
          await tx.user.update({ where: { id: freelancer.id }, data: profileUpdate });
        }

        const proposal = await tx.proposal.create({
          data: {
            jobId,
            freelancerId: freelancer.id,
            amount,
            message,
          },
        });

        return proposal;
      });

      const proposal = result;
      let token;
      if (Object.keys(profileUpdate).length > 0) {
        const updatedUser = await prisma.user.findUnique({ where: { id: freelancer.id } });
        if (updatedUser) {
          token = signJwt({
            userId: updatedUser.id,
            telegramId: updatedUser.telegramId,
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24h
          }, jwtSecret);
        }
      }

      return reply.status(201).send({
        success: true,
        token: token ?? undefined,
        data: proposal,
      });
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

