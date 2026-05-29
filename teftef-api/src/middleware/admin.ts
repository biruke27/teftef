import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAuthPayload } from './auth.js';

// Hardcoded for MVP — do not use env vars (typos lock you out).
// Find your ID: message @userinfobot on Telegram.
export const ADMIN_IDS = ['8548332856'];

export function isAdmin(telegramId: string) {
  return ADMIN_IDS.includes(telegramId);
}

export function requireAdmin(request: FastifyRequest, reply: FastifyReply, jwtSecret: string) {
  let authPayload: Record<string, unknown>;

  try {
    authPayload = getAuthPayload(request, jwtSecret);
  } catch {
    reply.status(401).send({ error: 'Unauthorized' });
    return null;
  }

  const telegramId = authPayload.telegramId as string | undefined;
  if (!telegramId || !isAdmin(telegramId)) {
    reply.status(403).send({ error: 'Forbidden' });
    return null;
  }

  return authPayload;
}
