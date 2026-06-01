import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const base = 'http://localhost:3000';
const token = execSync('node scripts/gen-session-token.mjs devsecret', { encoding: 'utf8' }).trim();

async function run(path) {
  const res = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const status = res.status;
  const payload = await res.json().catch(() => null);
  console.log('===', path, 'status', status);
  console.log('raw payload:', JSON.stringify(payload));
  const jobs = (payload?.jobs ?? payload) ?? [];
  if (!Array.isArray(jobs)) {
    console.warn('Unexpected jobs payload');
    return;
  }
  const mapped = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    listingType: job.listingType ?? 'FREELANCE',
    payType: job.payType ?? 'FIXED',
    minPay: job.minPay ?? job.budget ?? 0,
    maxPay: job.maxPay ?? null,
    description: job.description ?? job.description_preview ?? '',
    clientName: job.clientName ?? 'Client',
    status: job.status,
    postedAt: job.postedAt ?? new Date(job.createdAt).toLocaleDateString('en-ET'),
  }));
  console.log('mapped:', JSON.stringify(mapped, null, 2));
}

await run('/jobs');
await run('/jobs?mock=1');
