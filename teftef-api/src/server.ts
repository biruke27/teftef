import Fastify, { type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { prisma } from './prisma.js';

dotenv.config();

const BOT_TOKEN =
  process.env.BOT_MODE === 'PROD'
    ? process.env.BOT_TOKEN_PROD
    : process.env.BOT_TOKEN_DEV;
const JWT_SECRET = process.env.JWT_SECRET;

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN_DEV or BOT_TOKEN_PROD is required');
}

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

const BOT_TOKEN_STR = BOT_TOKEN;
const JWT_SECRET_STR = JWT_SECRET;

function getTrustTier(score: number) {
  if (score >= 80) return 'Verified';
  if (score >= 60) return 'Trusted';
  if (score >= 40) return 'Rising';
  return 'New';
}

function getPostedLabel(createdAt: Date) {
  const diffMs = Date.now() - createdAt.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} minutes ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hours ago`;
  return new Intl.DateTimeFormat('en-ET', {
    month: 'short',
    day: 'numeric',
  }).format(createdAt);
}

function base64UrlEncode(input: Buffer | string) {
  const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64');
}

function signJwt(payload: Record<string, unknown>) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', JWT_SECRET_STR as string).update(`${header}.${body}`).digest(),
  );
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [header, body, signature] = parts;
  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', JWT_SECRET_STR as string).update(`${header}.${body}`).digest(),
  );

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error('Invalid token signature');
  }

  const payloadJson = base64UrlDecode(body).toString('utf8');
  const payload = JSON.parse(payloadJson) as { exp?: number } & Record<string, unknown>;

  if (payload.exp && Date.now() / 1000 > Number(payload.exp)) {
    throw new Error('Token has expired');
  }

  return payload;
}

function createTelegramSecret(botToken: string) {
  return crypto.createHmac('sha256', botToken).update('WebAppData').digest();
}

function verifyTelegramInitData(initData: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) {
    throw new Error('Missing hash in initData');
  }

  const entries = Array.from(params.entries())
    .filter(([key]) => key !== 'hash')
    .map(([key, value]) => `${key}=${value}`)
    .sort();
  const dataCheckString = entries.join('\n');

  const secretKey = createTelegramSecret(BOT_TOKEN_STR);
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const receivedBuffer = Buffer.from(hash, 'hex');

  if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    throw new Error('Invalid initData hash');
  }

  const rawUser = params.get('user');
  const user = rawUser ? JSON.parse(rawUser) : undefined;

  return {
    user,
    auth_date: params.get('auth_date'),
    query_id: params.get('query_id'),
  };
}

function getAuthPayloadFromRequest(request: FastifyRequest) {
  const authHeader = (request.headers.authorization as string | undefined) ?? '';
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    throw new Error('Missing authorization header');
  }

  return verifyJwt(token);
}

async function start() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: '*' });

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: Date.now(),
  }));

  app.post('/auth/verify', async (request, reply) => {
    const body = request.body as { initData?: string };
    const initData = body.initData?.trim();

    if (!initData) {
      return reply.status(400).send({ error: 'initData is required' });
    }

    let payload;

    try {
      payload = verifyTelegramInitData(initData);
    } catch (error) {
      console.error('[M2-T1] initData verification failed:', error);
      return reply.status(401).send({ error: 'Invalid initData' });
    }

    const userInfo = payload.user as { id?: number; username?: string } | undefined;
    if (!userInfo?.id) {
      return reply.status(401).send({ error: 'Invalid user payload' });
    }

    const telegramId = String(userInfo.id);
    const username = userInfo.username?.trim() || undefined;

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { username },
      create: {
        telegramId,
        username,
      },
    });

    const sessionToken = signJwt({
      userId: user.id,
      telegramId: user.telegramId,
      username: user.username ?? null,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    });

    return {
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        role_mode: user.role_mode,
        trust_score: user.trust_score,
      },
      sessionToken,
    };
  });

  app.get('/jobs', async (request, reply) => {
    try {
      getAuthPayloadFromRequest(request);
    } catch (error) {
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

  app.post('/jobs', async (request, reply) => {
    let authPayload;

    try {
      authPayload = getAuthPayloadFromRequest(request);
    } catch (error) {
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

  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`[M0-T2] Server listening on port ${port}`);
}

start().catch((error) => {
  console.error('[M0-T2] startup failed:', error);
  process.exit(1);
});
