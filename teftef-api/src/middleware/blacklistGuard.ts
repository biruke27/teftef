import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../prisma.js';
import { getAuthPayload } from './auth.js';

export interface BlacklistGuardOptions {
  jwtSecret: string;
}

export function createBlacklistGuard(options: BlacklistGuardOptions) {
  const { jwtSecret } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authPayload = getAuthPayload(request, jwtSecret);
      const telegramId = authPayload.telegramId as string | undefined;

      if (!telegramId) {
        return;
      }

      const blacklistEntry = await prisma.blacklist.findFirst({
        where: { telegramId },
      });

      if (blacklistEntry) {
        console.error('[M6-L1] blocked blacklisted telegramId:', telegramId);
        return reply.status(403).send({ error: 'BANNED_USER' });
      }
    } catch {
      return;
    }
  };
}

export async function checkBlacklistByNationalId(nationalId: string): Promise<boolean> {
  if (!nationalId) return false;

  const entry = await prisma.blacklist.findFirst({
    where: { nationalId },
  });

  return !!entry;
}

export async function addToBlacklist(data: {
  telegramId?: string;
  nationalId?: string;
  fullName?: string;
  reason?: string;
  created_by?: string;
}): Promise<void> {
  await prisma.blacklist.create({
    data: {
      telegramId: data.telegramId ?? null,
      nationalId: data.nationalId ?? null,
      fullName: data.fullName ?? null,
      reason: data.reason ?? null,
      created_by: data.created_by ?? null,
    },
  });
}
