import { getSessionToken } from './session';
import { JOBS_API_BASE_URL } from './jobs';

function authHeaders(): HeadersInit {
  const token = getSessionToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseError(res: Response, fallback: string) {
  const payload = await res.json().catch(() => null);
  throw new Error(payload?.error ?? `${fallback}: ${res.status}`);
}

export type AdminParty = {
  id: string;
  username: string | null;
  telegramId: string;
  trustTier: string;
  is_banned: boolean;
};

export type DisputeCard = {
  jobId: string;
  title: string;
  budget: number;
  status: string;
  postedAt: string;
  client: AdminParty;
  freelancer: AdminParty | null;
};

export type AdminUser = {
  id: string;
  telegramId: string;
  username: string | null;
  trust_score: number;
  trustTier: string;
  is_banned: boolean;
  role_mode: string;
  created_at: string;
};

export async function fetchAdminMe(): Promise<boolean> {
  const res = await fetch(`${JOBS_API_BASE_URL}/admin/me`, { headers: authHeaders() });
  if (res.status === 403) return false;
  if (!res.ok) await parseError(res, 'Admin check failed');
  return true;
}

export async function fetchAdminDisputes(page = 1) {
  const res = await fetch(`${JOBS_API_BASE_URL}/admin/disputes?page=${page}`, {
    headers: authHeaders(),
  });
  if (!res.ok) await parseError(res, 'Failed to load disputes');
  const payload = await res.json();
  return {
    disputes: (payload?.disputes ?? []) as DisputeCard[],
    total: payload?.total ?? 0,
    page: payload?.page ?? page,
  };
}

export async function lookupAdminUser(telegramId: string) {
  const res = await fetch(
    `${JOBS_API_BASE_URL}/admin/users?telegramId=${encodeURIComponent(telegramId)}`,
    { headers: authHeaders() },
  );
  if (!res.ok) await parseError(res, 'User lookup failed');
  const payload = await res.json();
  return payload?.user as AdminUser;
}

export async function setUserBanned(userId: string, is_banned: boolean) {
  const res = await fetch(`${JOBS_API_BASE_URL}/admin/users/${userId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ is_banned }),
  });
  if (!res.ok) await parseError(res, 'Ban update failed');
  return res.json();
}

export async function setUserTrust(userId: string, trust_score: number) {
  const res = await fetch(`${JOBS_API_BASE_URL}/admin/users/${userId}/trust`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ trust_score }),
  });
  if (!res.ok) await parseError(res, 'Trust update failed');
  return res.json();
}

export async function resolveDisputeJob(jobId: string, status: 'COMPLETED' | 'CLOSED') {
  const res = await fetch(`${JOBS_API_BASE_URL}/admin/jobs/${jobId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) await parseError(res, 'Job resolve failed');
  return res.json();
}

export async function deleteAdminJob(jobId: string) {
  const res = await fetch(`${JOBS_API_BASE_URL}/admin/jobs/${jobId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) await parseError(res, 'Job delete failed');
}
