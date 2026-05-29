import type { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { clampTrustScore, getTrustTier } from '../utils.js';
import { getAuthPayload } from '../middleware/auth.js';

const CONFIRM_BONUS = 8;
const REPORT_PENALTY = 15;

export async function registerJobFeedbackRoutes(app: FastifyInstance, jwtSecret: string) {
  app.post('/jobs/:id/feedback', async (request, reply) => {
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
    const { action } = request.body as { action?: string };

    if (action !== 'CONFIRM' && action !== 'REPORT') {
      return reply.status(400).send({ error: 'Invalid action. Use CONFIRM or REPORT.' });
    }

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    if (job.status !== 'IN_PROGRESS') {
      return reply.status(400).send({ error: 'Feedback is only allowed while the job is in progress.' });
    }

    const acceptedProposal = await prisma.proposal.findFirst({
      where: { jobId: id, status: 'ACCEPTED' },
      include: { freelancer: true },
    });

    if (!acceptedProposal) {
      return reply.status(400).send({ error: 'No accepted proposal for this job.' });
    }

    const clientId = job.clientId;
    const freelancerId = acceptedProposal.freelancerId;
    const isClient = userId === clientId;
    const isFreelancer = userId === freelancerId;

    if (!isClient && !isFreelancer) {
      return reply
        .status(403)
        .send({ error: 'Only the job client or accepted freelancer can submit feedback.' });
    }

    const [client, freelancer] = await Promise.all([
      prisma.user.findUnique({ where: { id: clientId } }),
      prisma.user.findUnique({ where: { id: freelancerId } }),
    ]);

    if (!client || !freelancer) {
      console.error('[M4-T1] feedback failed: missing client or freelancer record');
      return reply.status(500).send({ error: 'Internal server error' });
    }

    try {
      if (action === 'CONFIRM') {
        await prisma.$transaction([
          prisma.job.update({ where: { id }, data: { status: 'COMPLETED' } }),
          prisma.user.update({
            where: { id: clientId },
            data: { trust_score: clampTrustScore(client.trust_score, CONFIRM_BONUS) },
          }),
          prisma.user.update({
            where: { id: freelancerId },
            data: { trust_score: clampTrustScore(freelancer.trust_score, CONFIRM_BONUS) },
          }),
        ]);
      } else {
        const penalizedId = isClient ? freelancerId : clientId;
        const penalizedScore = isClient ? freelancer.trust_score : client.trust_score;

        await prisma.$transaction([
          prisma.job.update({ where: { id }, data: { status: 'DISPUTED' } }),
          prisma.user.update({
            where: { id: penalizedId },
            data: { trust_score: clampTrustScore(penalizedScore, -REPORT_PENALTY) },
          }),
        ]);
      }

      const [updatedJob, updatedClient, updatedFreelancer] = await Promise.all([
        prisma.job.findUnique({ where: { id } }),
        prisma.user.findUnique({ where: { id: clientId } }),
        prisma.user.findUnique({ where: { id: freelancerId } }),
      ]);

      return {
        job: { id: updatedJob!.id, status: updatedJob!.status },
        trustUpdated: {
          clientTier: getTrustTier(updatedClient!.trust_score),
          freelancerTier: getTrustTier(updatedFreelancer!.trust_score),
        },
      };
    } catch (error) {
      console.error('[M4-T1] job feedback transaction failed:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
