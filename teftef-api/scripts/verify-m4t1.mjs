import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

function base64UrlEncode(input) {
  const buffer = Buffer.from(input, 'utf8');
  return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJwt(payload, secret) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest(),
  );
  return `${header}.${body}.${signature}`;
}

async function request(base, token, jobId, action) {
  const res = await fetch(`${base}/jobs/${jobId}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  if (!JWT_SECRET) throw new Error('JWT_SECRET required');

  const base = process.env.VERIFY_API_BASE ?? 'http://127.0.0.1:3000';

  const client = await prisma.user.upsert({
    where: { telegramId: 'm4t1-client' },
    update: { trust_score: 50 },
    create: { telegramId: 'm4t1-client', username: 'm4client', trust_score: 50 },
  });
  const freelancer = await prisma.user.upsert({
    where: { telegramId: 'm4t1-freelancer' },
    update: { trust_score: 50 },
    create: { telegramId: 'm4t1-freelancer', username: 'm4free', trust_score: 50 },
  });

  const exp = Math.floor(Date.now() / 1000) + 3600;
  const clientToken = signJwt({ userId: client.id, telegramId: client.telegramId, exp }, JWT_SECRET);
  const freelancerToken = signJwt(
    { userId: freelancer.id, telegramId: freelancer.telegramId, exp },
    JWT_SECRET,
  );

  const job = await prisma.job.create({
    data: {
      title: 'M4-T1 verify job',
      description: 'Verification job for feedback endpoint',
      budget: 1000,
      status: 'IN_PROGRESS',
      clientId: client.id,
    },
  });
  await prisma.proposal.create({
    data: {
      jobId: job.id,
      freelancerId: freelancer.id,
      amount: 900,
      message: 'I can do this work within the agreed timeline for you.',
      status: 'ACCEPTED',
    },
  });

  const confirm = await request(base, clientToken, job.id, 'CONFIRM');
  const afterConfirm = await prisma.job.findUnique({ where: { id: job.id } });
  const usersAfterConfirm = await prisma.user.findMany({
    where: { id: { in: [client.id, freelancer.id] } },
  });

  const reportJob = await prisma.job.create({
    data: {
      title: 'M4-T1 report job',
      description: 'Second verification job for report action',
      budget: 2000,
      status: 'IN_PROGRESS',
      clientId: client.id,
    },
  });
  await prisma.proposal.create({
    data: {
      jobId: reportJob.id,
      freelancerId: freelancer.id,
      amount: 1800,
      message: 'Ready to deliver this second verification job on time.',
      status: 'ACCEPTED',
    },
  });

  const report = await request(base, freelancerToken, reportJob.id, 'REPORT');
  const afterReport = await prisma.job.findUnique({ where: { id: reportJob.id } });
  const clientAfterReport = await prisma.user.findUnique({ where: { id: client.id } });
  const duplicate = await request(base, clientToken, job.id, 'CONFIRM');

  console.log(JSON.stringify({
    confirm: { http: confirm.status, body: confirm.body },
    dbAfterConfirm: {
      jobStatus: afterConfirm?.status,
      clientScore: usersAfterConfirm.find((u) => u.id === client.id)?.trust_score,
      freelancerScore: usersAfterConfirm.find((u) => u.id === freelancer.id)?.trust_score,
    },
    report: { http: report.status, body: report.body },
    dbAfterReport: {
      jobStatus: afterReport?.status,
      clientScore: clientAfterReport?.trust_score,
    },
    duplicateConfirm: { http: duplicate.status, body: duplicate.body },
  }, null, 2));

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('[M4-T1] verification script failed:', error);
  await prisma.$disconnect();
  process.exit(1);
});
