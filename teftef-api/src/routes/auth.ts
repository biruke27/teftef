import { FastifyReply, FastifyRequest } from 'fastify';
import crypto from 'node:crypto';
import { prisma } from '../prisma';

interface AuthSessionRequest extends FastifyRequest {
  body: {
    initData: string;
  };
}

/**
 * Validates the Telegram WebApp initData cryptographic signature.
 * Implementation follows the official Telegram Mini Apps verification process.
 */
function verifyTelegramInitData(initData: string, botToken: string): { telegramId: string; username?: string } | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  // 1. Extract all fields except 'hash' and sort them alphabetically
  const data: Record<string, string> = {};
  params.forEach((value, key) => {
    if (key !== 'hash') data[key] = value;
  });

  const sortedKeys = Object.keys(data).sort();
  const dataCheckString = sortedKeys
    .map((key) => `${key}=${data[key]}`)
    .join('\n');

  // 2. Derive the secret key using the Bot Token
  const secretKey = crypto
    .createHmac('sha256', 'WEBAPP_SECRET')
    .update(botToken)
    .digest();

  // 3. Compute the HMAC-SHA256 of the data-check-string using the derived secret key
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (computedHash !== hash) {
    return null;
  }

  // 4. Parse the user object from initData
  const userJson = params.get('user');
  if (!userJson) return null;

  try {
    const user = JSON.parse(userJson);
    return {
      telegramId: user.id.toString(),
      username: user.username,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Handles the POST /api/auth/session request for anonymous profiling
 * and core authentication initialization.
 */
export async function handleAuthSession(request: AuthSessionRequest, reply: FastifyReply) {
  const { initData } = request.body;
  const botToken = process.env.BOT_TOKEN_DEV || process.env.BOT_TOKEN_PROD;

  if (!botToken) {
    console.error('[AUTH-SESS] Server configuration error: Bot Token missing');
    return reply.code(500).send({ error: 'Internal server configuration error' });
  }

  // Cryptographic validation of Telegram identity
  const verifiedUser = verifyTelegramInitData(initData, botToken);
  if (!verifiedUser) {
    console.error('[AUTH-SESS] Invalid Telegram initData signature detected');
    return reply.code(401).send({ error: 'Invalid authentication data' });
  }

  const { telegramId, username } = verifiedUser;

  try {
    // Atomic Upsert: Create baseline user if they don't exist.
    // Initializes only telegramId and username to keep DB row footprint minimal.
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        username
      },
      create: {
        telegramId,
        username,
      },
    });

    // Generate a simple opaque session token for the route.
    // This route is not currently wired into the registered server endpoints,
    // but the source should still compile cleanly.
    const token = crypto.randomBytes(32).toString('hex');

    return reply.send({
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        role_mode: user.role_mode,
      },
    });
  } catch (error) {
    console.error('[AUTH-SESS] Database error during user session initialization:', error);
    return reply.code(500).send({ error: 'Failed to initialize user session' });
  }
}
