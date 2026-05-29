import crypto from 'crypto';

const secret = process.env.JWT_SECRET ?? 'dev-test-jwt';
const base = process.env.VERIFY_API_BASE ?? 'http://127.0.0.1:3000';
const ADMIN_TELEGRAM_ID = '8548332856';
const exp = Math.floor(Date.now() / 1000) + 3600;

function base64UrlEncode(input) {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest(),
  );
  return `${header}.${body}.${signature}`;
}

async function adminMe(token) {
  const res = await fetch(`${base}/admin/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const outsider = signJwt({ userId: 'x', telegramId: '9999999999', exp });
const admin = signJwt({ userId: 'y', telegramId: ADMIN_TELEGRAM_ID, exp });

const nonAdmin = await adminMe(outsider);
const adminOk = await adminMe(admin);

const pass = nonAdmin.status === 403 && adminOk.status === 200 && adminOk.body?.isAdmin === true;
console.log(JSON.stringify({ nonAdmin, adminOk, pass }, null, 2));
process.exit(pass ? 0 : 1);
