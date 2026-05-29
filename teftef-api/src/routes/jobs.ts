import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { getTrustTier, getPostedLabel } from '../utils.js';
import { getAuthPayload } from '../middleware/auth.js';

export async function registerJobRoutes(app: FastifyInstance, jwtSecret: string) {
  app.get('/jobs', async (request, reply) => {
    try {
      getAuthPayload(request, jwtSecret);
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const page = Number((request.query as { page?: string }).page ?? '1');
    const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
    const take = 20;
    const skip = (currentPage - 1) * take;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: { status: 'OPEN' },
        orderBy: { created_at: 'desc' },
        skip,
        take,
        include: {
          client: true,
          _count: { select: { proposals: true } },
        },
      }),
      prisma.job.count({ where: { status: 'OPEN' } }),
    ]);

    return {
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        description: job.description.slice(0, 160),
        budget: job.budget,
        status: job.status,
        trustTier: getTrustTier(job.client.trust_score),
        postedAt: getPostedLabel(job.created_at),
        proposalCount: job._count.proposals,
        clientName: job.client.username ?? 'Client',
      })),
      total,
      page: currentPage,
    };
  });

  app.get('/jobs/:id', async (request, reply) => {
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
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        client: true,
        _count: { select: { proposals: true } },
      },
    });

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    let freelancerContact: { username: string | null; telegramId: string; proposalId: string } | undefined;
    let myProposal: { id: string; amount: number; message: string; status: string } | undefined;
    let clientContact: { username: string | null; telegramId: string } | undefined;

    if (job.clientId === userId) {
      const acceptedProposal = await prisma.proposal.findFirst({
        where: { jobId: id, status: 'ACCEPTED' },
        include: { freelancer: true },
      });
      if (acceptedProposal) {
        freelancerContact = {
          username: acceptedProposal.freelancer.username,
          telegramId: acceptedProposal.freelancer.telegramId,
          proposalId: acceptedProposal.id,
        };
      }
    } else {
      const foundProposal = await prisma.proposal.findUnique({
        where: { jobId_freelancerId: { jobId: id, freelancerId: userId } },
      });
      if (foundProposal) {
        myProposal = {
          id: foundProposal.id,
          amount: foundProposal.amount,
          message: foundProposal.message,
          status: foundProposal.status,
        };
        if (foundProposal.status === 'ACCEPTED') {
          clientContact = {
            username: job.client.username,
            telegramId: job.client.telegramId,
          };
        }
      }
    }

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      budget: job.budget,
      status: job.status,
      clientName: job.client.username ?? 'Client',
      clientId: job.clientId,
      trustTier: getTrustTier(job.client.trust_score),
      postedAt: getPostedLabel(job.created_at),
      proposalCount: job._count.proposals,
      myProposal,
      clientContact,
      freelancerContact,
    };
  });

  app.post('/jobs', async (request, reply) => {
    let authPayload;

    try {
      authPayload = getAuthPayload(request, jwtSecret);
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const body = request.body as {
      title?: string;
      description?: string;
      budget?: number;
    };

    const title = body.title?.trim() ?? '';
    const description = body.description?.trim() ?? '';
    const budget = Number(body.budget ?? 0);

    if (title.length < 5) {
      return reply.status(400).send({ error: 'Title must be at least 5 characters.' });
    }

    if (description.length === 0) {
      return reply.status(400).send({ error: 'Description is required.' });
    }

    if (!Number.isFinite(budget) || budget <= 0) {
      return reply.status(400).send({ error: 'Budget must be greater than 0.' });
    }

    const userId = authPayload.userId as string | undefined;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const client = await prisma.user.findUnique({ where: { id: userId } });
    if (!client) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    if (client.is_banned) {
      return reply.status(403).send({ error: 'You are banned and cannot post jobs.' });
    }

    const jobCount = await prisma.job.count({
      where: {
        clientId: client.id,
        created_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    if (jobCount >= 3) {
      return reply.status(429).send({ error: 'Too many jobs. Maximum 3 jobs per hour.' });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        budget,
        clientId: client.id,
      },
    });

    return reply.status(201).send({ job });
  });
}
