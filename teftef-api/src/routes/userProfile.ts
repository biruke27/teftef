import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { getAuthPayload } from '../middleware/auth.js';
import { signJwt } from '../utils.js';

export async function registerUserProfileRoutes(app: FastifyInstance, jwtSecret: string) {
  app.patch('/auth/consent', async (request, reply) => {
    let authPayload;
    try {
      authPayload = getAuthPayload(request, jwtSecret);
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const userId = authPayload.userId as string | undefined;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const body = request.body as { accepted?: boolean };
    const accepted = !!body.accepted;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { acceptedMasterTerms: accepted },
    });

    const sessionToken = signJwt(
      {
        userId: user.id,
        telegramId: user.telegramId,
        username: user.username ?? null,
        nationalId: user.nationalId ?? null,
        fullName: user.fullName ?? null,
        acceptedMasterTerms: user.acceptedMasterTerms,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      },
      jwtSecret
    );

    return {
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        role_mode: user.role_mode,
        trust_score: user.trust_score,
        nationalId: user.nationalId,
        fullName: user.fullName,
        acceptedMasterTerms: user.acceptedMasterTerms,
      },
      sessionToken,
    };
  });

  app.patch('/auth/profile', async (request, reply) => {
    let authPayload;
    try {
      authPayload = getAuthPayload(request, jwtSecret);
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const userId = authPayload.userId as string | undefined;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const body = request.body as {
      fullName?: string;
      nationalId?: string;
      acceptedMasterTerms?: boolean;
    };

    const updateData: any = {};
    if (body.fullName !== undefined) {
      const fn = body.fullName.trim();
      if (fn.length > 2) updateData.fullName = fn;
      else if (fn.length > 0) return reply.status(400).send({ error: 'fullName must be > 2 chars' });
    }
    if (body.nationalId !== undefined) {
      const nid = body.nationalId.trim();
      if (nid.length > 5) updateData.nationalId = nid;
      else if (nid.length > 0) return reply.status(400).send({ error: 'nationalId must be > 5 chars' });
    }
    if (body.acceptedMasterTerms !== undefined) {
      updateData.acceptedMasterTerms = !!body.acceptedMasterTerms;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    const sessionToken = signJwt(
      {
        userId: user.id,
        telegramId: user.telegramId,
        username: user.username ?? null,
        nationalId: user.nationalId ?? null,
        fullName: user.fullName ?? null,
        acceptedMasterTerms: user.acceptedMasterTerms,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      },
      jwtSecret
    );

    return {
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        role_mode: user.role_mode,
        trust_score: user.trust_score,
        nationalId: user.nationalId,
        fullName: user.fullName,
        acceptedMasterTerms: user.acceptedMasterTerms,
      },
      sessionToken,
    };
  });
}
