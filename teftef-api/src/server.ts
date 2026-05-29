import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { prisma } from './prisma.js';
import { signJwt, verifyTelegramInitData } from './utils.js';
import { registerJobRoutes } from './routes/jobs.js';
import { registerJobFeedbackRoutes } from './routes/job-feedback.js';
import { registerProposalRoutes } from './routes/proposals.js';
import { registerAdminRoutes } from './routes/admin.js';

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
      payload = verifyTelegramInitData(initData, BOT_TOKEN_STR);
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

    const sessionToken = signJwt(
      {
        userId: user.id,
        telegramId: user.telegramId,
        username: user.username ?? null,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      },
      JWT_SECRET_STR,
    );

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

  await registerJobRoutes(app, JWT_SECRET_STR);
  await registerJobFeedbackRoutes(app, JWT_SECRET_STR);
  await registerProposalRoutes(app, JWT_SECRET_STR);
  await registerAdminRoutes(app, JWT_SECRET_STR);

  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`[M0-T2] Server listening on port ${port}`);
}

start().catch((error) => {
  console.error('[M0-T2] startup failed:', error);
  process.exit(1);
});
