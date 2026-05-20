import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { prisma } from './prisma';

dotenv.config();

function getTrustTier(score: number) {
  if (score >= 80) return 'Verified';
  if (score >= 60) return 'Trusted';
  if (score >= 40) return 'Rising';
  return 'New';
}

async function start() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: '*' });

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: Date.now(),
  }));

  app.get('/jobs', async (request) => {
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
        description_preview: job.description.slice(0, 120),
        budget: job.budget,
        status: job.status,
        trustTier: getTrustTier(job.client.trust_score),
        createdAt: job.created_at,
        proposalCount: job._count.proposals,
        clientName: job.client.username ?? 'Client',
      })),
      total,
      page: currentPage,
    };
  });

  app.post('/jobs', async (request, reply) => {
    const body = request.body as {
      title?: string;
      description?: string;
      budget?: number;
      clientId?: string;
      category?: string;
    };

    const title = body.title?.trim() ?? '';
    const description = body.description?.trim() ?? '';
    const budget = Number(body.budget ?? 0);
    const clientId = body.clientId?.trim();

    if (title.length < 5) {
      return reply.status(400).send({ error: 'Title must be at least 5 characters.' });
    }

    if (description.length === 0) {
      return reply.status(400).send({ error: 'Description is required.' });
    }

    if (!Number.isFinite(budget) || budget <= 0) {
      return reply.status(400).send({ error: 'Budget must be greater than 0.' });
    }

    if (!clientId) {
      return reply.status(400).send({ error: 'clientId is required until auth is implemented.' });
    }

    const jobCount = await prisma.job.count({
      where: {
        clientId,
        created_at: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });

    if (jobCount >= 3) {
      return reply.status(429).send({ error: 'Too many jobs. Maximum 3 jobs per hour.' });
    }

    const existingClient = await prisma.user.findUnique({ where: { id: clientId } });
    if (!existingClient) {
      return reply.status(400).send({ error: 'Invalid clientId.' });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        budget,
        clientId,
      },
    });

    return reply.status(201).send({ job });
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`[M0-T2] Server listening on port ${port}`);
}

start().catch((error) => {
  console.error('[M0-T2] startup failed:', error);
  process.exit(1);
});
