import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { getTrustTier, getPostedLabel } from '../utils.js';
import { getAuthPayload } from '../middleware/auth.js';

export async function registerJobRoutes(app: FastifyInstance, jwtSecret: string) {
  // 1. GET /jobs - Fetch and page active open jobs
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

    let jobs: any[] = [];
    let total = 0;

    try {
      const res = await Promise.all([
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
      jobs = res[0] ?? [];
      total = Number(res[1] ?? 0);
    } catch (dbErr) {
      console.error('[Production API] /jobs database fetch failed:', dbErr);
      return reply.status(200).send({ jobs: [], total: 0, page: currentPage });
    }

    try {
      const mapped = jobs.map((job) => {
        const desc = String(job.description ?? '');
        const client = job.client ?? { trust_score: 50, username: 'Client' };

        return {
          id: job.id,
          title: job.title,
          description: desc.slice(0, 160),
          budget: job.budget,
          status: job.status,
          listingType: job.listingType,
          payType: job.payType,
          minPay: job.minPay ?? job.budget,
          maxPay: job.maxPay ?? null,
          trustTier: getTrustTier(client.trust_score),
          postedAt: getPostedLabel(job.created_at),
          proposalCount: job._count?.proposals ?? 0, // Protected fallback
          clientName: client.username ?? 'Client',
        };
      });

      return reply.status(200).send({ jobs: mapped, total, page: currentPage });
    } catch (error) {
      console.error('[Production API] /jobs data mapping execution failed:', error);
      return reply.status(200).send({ jobs: [], total: 0, page: currentPage });
    }
  });

  // 2. GET /jobs/:id - Fetch individual job specifications with contextual contacts
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
    let pendingMatchCandidate: { username: string | null; telegramId: string } | undefined;

    if (job.status === 'PENDING_MATCH') {
      const matchingProposal = await prisma.proposal.findFirst({
        where: { jobId: id, status: 'MATCHING' },
        include: { freelancer: true },
      });
      if (matchingProposal) {
        pendingMatchCandidate = {
          username: matchingProposal.freelancer.username,
          telegramId: matchingProposal.freelancer.telegramId,
        };
      }
    }

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
      listingType: job.listingType,
      payType: job.payType,
      minPay: job.minPay ?? job.budget,
      maxPay: job.maxPay ?? null,
      status: job.status,
      clientName: job.client.username ?? 'Client',
      clientUsername: job.client.username,
      clientId: job.clientId,
      trustTier: getTrustTier(job.client.trust_score),
      postedAt: getPostedLabel(job.created_at),
      proposalCount: job._count?.proposals ?? 0, // Protected fallback
      myProposal,
      clientContact,
      freelancerContact,
      pendingMatchCandidate,
    };
  });

  // 3. POST /jobs - Create a new job listing
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
      listingType?: 'FREELANCE' | 'FULL_TIME';
      payType?: 'FIXED' | 'RANGE' | 'NEGOTIABLE';
      minPay?: number | null;
      maxPay?: number | null;
      fullName?: string;
      nationalId?: string;
    };

    const title = body.title?.trim() ?? '';
    const description = body.description?.trim() ?? '';
    const listingType = body.listingType === 'FULL_TIME' ? 'FULL_TIME' : 'FREELANCE';

    // 1. Hardened Numeric Inputs
    const parsedBudget = Math.round(Number(body.budget)) || 0;
    const parsedMinPay = Math.round(Number(body.minPay)) || 0;
    const parsedMaxPay = body.maxPay !== undefined && body.maxPay !== null
      ? Math.round(Number(body.maxPay))
      : null;

    if (title.length < 5) {
      return reply.status(400).send({ error: 'Title must be at least 5 characters.' });
    }

    if (description.length === 0) {
      return reply.status(400).send({ error: 'Description is required.' });
    }

    // 2. PayType Conditional Validation Rules
    let budget: number;
    let minPay: number | null = null;
    let maxPay: number | null = null;

    const payType = body.payType;

    if (payType === 'FIXED') {
      if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
        return reply.status(400).send({ error: 'Budget must be greater than 0 for fixed-price jobs.' });
      }
      budget = parsedBudget;
      minPay = parsedBudget;
      maxPay = null;
    } else if (payType === 'RANGE') {
      if (
        !Number.isFinite(parsedMinPay) ||
        parsedMinPay <= 0 ||
        parsedMaxPay === null ||
        !Number.isFinite(parsedMaxPay) ||
        parsedMaxPay <= 0 ||
        parsedMinPay > parsedMaxPay
      ) {
        return reply.status(400).send({ error: 'Invalid range: minPay must be less than or equal to maxPay and both must be greater than 0.' });
      }
      budget = parsedMinPay;
      minPay = parsedMinPay;
      maxPay = parsedMaxPay;
    } else if (payType === 'NEGOTIABLE') {
      budget = 0;
      minPay = null;
      maxPay = null;
    } else {
      return reply.status(400).send({ error: 'Invalid or missing payType. Must be FIXED, RANGE, or NEGOTIABLE.' });
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

    try {
      const job = await prisma.job.create({
        data: {
          title,
          description,
          budget,
          listingType,
          payType,
          minPay,
          maxPay,
          clientId: client.id,
        },
      });
      return reply.status(201).send({ job });
    } catch (createErr) {
      console.error('[Production API Error] Failed to write Job entry into Prisma:', createErr);
      return reply.status(500).send({ error: 'Internal Server Error while inserting job record.' });
    }
  });
}