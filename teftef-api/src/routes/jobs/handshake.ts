import type { FastifyInstance } from 'fastify';
import { prisma } from '../../prisma.js';
import { getAuthPayload } from '../../middleware/auth.js';

export async function registerJobHandshakeRoutes(app: FastifyInstance, jwtSecret: string) {
  app.patch('/api/jobs/:id/handshake', async (request, reply) => {
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
    const body = request.body as { action?: string; proposalId?: string };
    const action = body.action;
    const proposalId = body.proposalId?.trim();

    if (action !== 'ACCEPT' && action !== 'CANCEL' && action !== 'CONFIRM') {
      return reply.status(400).send({ error: 'Invalid action. Expected ACCEPT, CANCEL, or CONFIRM.' });
    }

    if (!proposalId) {
      return reply.status(400).send({ error: 'proposalId is required' });
    }

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    if (job.clientId !== userId) {
      return reply.status(403).send({ error: 'Only the job owner can manage the handshake' });
    }

    const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal || proposal.jobId !== id) {
      return reply.status(404).send({ error: 'Proposal not found for this job' });
    }

    try {
      if (action === 'ACCEPT') {
        if (job.status !== 'OPEN') {
          return reply.status(400).send({ error: 'Job is not open for handshake acceptance.' });
        }

        if (proposal.status !== 'PENDING') {
          return reply.status(400).send({ error: 'Only pending proposals can be matched.' });
        }

        const result = await prisma.$transaction(async (tx) => {
          const updatedJob = await tx.job.update({
            where: { id },
            data: { status: 'PENDING_MATCH' },
          });
          const updatedProposal = await tx.proposal.update({
            where: { id: proposalId },
            data: { status: 'MATCHING' },
          });
          return { job: updatedJob, proposal: updatedProposal };
        });

        return reply.status(200).send(result);
      }

      if (action === 'CANCEL') {
        if (job.status !== 'PENDING_MATCH') {
          return reply.status(400).send({ error: 'Job is not in a pending match state.' });
        }

        if (proposal.status !== 'MATCHING') {
          return reply.status(400).send({ error: 'Only matching proposals can be canceled.' });
        }

        const result = await prisma.$transaction(async (tx) => {
          const resetJob = await tx.job.update({
            where: { id },
            data: { status: 'OPEN' },
          });
          const resetProposal = await tx.proposal.update({
            where: { id: proposalId },
            data: { status: 'PENDING' },
          });
          return { job: resetJob, proposal: resetProposal };
        });

        return reply.status(200).send(result);
      }

      const result = await prisma.$transaction(async (tx) => {
        if (job.status !== 'PENDING_MATCH') {
          throw new Error('Job is not in a pending match state.');
        }
        if (proposal.status !== 'MATCHING') {
          throw new Error('Only matching proposals can be confirmed.');
        }

        const updatedJob = await tx.job.update({
          where: { id },
          data: { status: 'IN_PROGRESS' },
        });

        const confirmedProposal = await tx.proposal.update({
          where: { id: proposalId },
          data: { status: 'ACCEPTED' },
        });

        await tx.proposal.updateMany({
          where: { jobId: id, id: { not: proposalId } },
          data: { status: 'ARCHIVED' },
        });

        return { job: updatedJob, proposal: confirmedProposal };
      });

      return reply.status(200).send(result);
    } catch (error: unknown) {
      console.error('[M5-T1] handshake processing failed:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
