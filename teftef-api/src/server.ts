import crypto from 'crypto';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { prisma } from './prisma.js';
import { signJwt, verifyTelegramInitData, createTelegramSecret } from './utils.js';
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

// Strip leading/trailing whitespace and quotes from the token
const BOT_TOKEN_STR = BOT_TOKEN
  ?.trim()
  .replace(/^["']|["']$/, ''); // Remove surrounding quotes if present

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

    console.log('[M2-A1] Auth verify endpoint accessed');
    console.log('[M2-A1] initData received (present?):', !!initData);

    if (!initData) {
      console.error('[M2-A1] initData is missing or blank');
      return reply.status(400).send({ error: 'initData is required' });
    }

    console.log('[M2-A1] initData length:', initData.length);
    console.log('[M2-A1] initData preview (first 100 chars):', initData.substring(0, 100));

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    console.log('[M2-A1] hash extracted from initData:', hash);

    if (!hash) {
      console.error('[M2-A1] Missing hash parameter in initData');
      return reply.status(400).send({ error: 'Missing hash in initData' });
    }

    // Prepare data for HMAC calculation
    const entries = Array.from(params.entries())
      .filter(([key]) => key !== 'hash')
      .map(([key, value]) => `${key}=${value}`)
      .sort();

    const dataCheckString = entries.join('\n');
    console.log('[M2-A1] reconstructed data-check-string:');
    console.log('[M2-A1] ----------------------------------------');
    console.log(dataCheckString);
    console.log('[M2-A1] ----------------------------------------');

    // Generate secret key using Telegram's official method
    const secretKey = createTelegramSecret(BOT_TOKEN_STR);

    // Use SHA-256 (not SHA-512) for Mini Apps
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    console.log('[M2-A1] calculated expected hash:', expectedHash);
    console.log('[M2-A1] incoming Telegram hash:', hash);

    // Compare hashes
    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const receivedBuffer = Buffer.from(hash, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) {
      console.error('[M2-A1] Hash length mismatch:', {
        expectedLength: expectedBuffer.length,
        receivedLength: receivedBuffer.length,
      });
      return reply.status(401).send({ error: 'Invalid initData' });
    }

    if (!crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
      console.error('[M2-A1] Hash value mismatch:');
      console.error('[M2-A1] calculated:', expectedHash);
      console.error('[M2-A1] received:', hash);
      return reply.status(401).send({ error: 'Invalid initData' });
    }

    console.log('[M2-A1] Hash validation passed');

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
