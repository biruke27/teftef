import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_TELEGRAM_ID = '8548332856';

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

async function api(base, token, method, path, jsonBody) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: jsonBody !== undefined ? JSON.stringify(jsonBody) : undefined,
  });
  const body = res.status === 204 ? {} : await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  if (!JWT_SECRET) throw new Error('JWT_SECRET required');

  const base = process.env.VERIFY_API_BASE ?? 'http://127.0.0.1:3000';
  const exp = Math.floor(Date.now() / 1000) + 3600;

  const admin = await prisma.user.upsert({
    where: { telegramId: ADMIN_TELEGRAM_ID },
    update: {},
    create: { telegramId: ADMIN_TELEGRAM_ID, username: 'admin_verify' },
  });
  const client = await prisma.user.upsert({
    where: { telegramId: 'm4t2-client' },
    update: { is_banned: false, trust_score: 40 },
    create: { telegramId: 'm4t2-client', username: 'm4t2client', trust_score: 40 },
  });
  const freelancer = await prisma.user.upsert({
    where: { telegramId: 'm4t2-freelancer' },
    update: { is_banned: false, trust_score: 45 },
    create: { telegramId: 'm4t2-freelancer', username: 'm4t2free', trust_score: 45 },
  });

  const disputedJob = await prisma.job.create({
    data: {
      title: 'M4-T2 disputed verify job',
      description: 'Admin panel verification seed job',
      budget: 5000,
      status: 'DISPUTED',
      clientId: client.id,
    },
  });
  await prisma.proposal.create({
    data: {
      jobId: disputedJob.id,
      freelancerId: freelancer.id,
      amount: 4500,
      message: 'Verification proposal for admin dispute queue testing.',
      status: 'ACCEPTED',
    },
  });

  const adminToken = signJwt(
    { userId: admin.id, telegramId: ADMIN_TELEGRAM_ID, exp },
    JWT_SECRET,
  );
  const outsiderToken = signJwt(
    { userId: client.id, telegramId: '9999999999', exp },
    JWT_SECRET,
  );

  const nonAdminMe = await api(base, outsiderToken, 'GET', '/admin/me');
  const adminMe = await api(base, adminToken, 'GET', '/admin/me');
  const disputes = await api(base, adminToken, 'GET', '/admin/disputes?page=1');
  const lookup = await api(
    base,
    adminToken,
    'GET',
    `/admin/users?telegramId=${client.telegramId}`,
  );
  const ban = await api(base, adminToken, 'PATCH', `/admin/users/${freelancer.id}`, {
    is_banned: true,
  });
  const trust = await api(base, adminToken, 'POST', `/admin/users/${client.id}/trust`, {
    trust_score: 72,
  });
  const resolve = await api(base, adminToken, 'PATCH', `/admin/jobs/${disputedJob.id}`, {
    status: 'COMPLETED',
  });

  const dbJob = await prisma.job.findUnique({ where: { id: disputedJob.id } });
  const dbClient = await prisma.user.findUnique({ where: { id: client.id } });
  const dbFreelancer = await prisma.user.findUnique({ where: { id: freelancer.id } });

  console.log(
    JSON.stringify(
      {
        nonAdminMe,
        adminMe,
        disputesCount: disputes.body?.disputes?.length ?? 0,
        lookupTelegramId: lookup.body?.user?.telegramId,
        ban,
        trust,
        resolve,
        db: {
          jobStatus: dbJob?.status,
          clientTrust: dbClient?.trust_score,
          freelancerBanned: dbFreelancer?.is_banned,
        },
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('[M4-T2] verification script failed:', error);
  await prisma.$disconnect();
  process.exit(1);
});
