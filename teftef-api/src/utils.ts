import crypto from 'crypto';

export function getTrustTier(score: number) {
  if (score >= 80) return 'Verified';
  if (score >= 60) return 'Trusted';
  if (score >= 40) return 'Rising';
  return 'New';
}

export function clampTrustScore(score: number, delta: number) {
  return Math.min(100, Math.max(0, score + delta));
}

export function getPostedLabel(createdAt: Date) {
  const diffMs = Date.now() - createdAt.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} minutes ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hours ago`;
  return new Intl.DateTimeFormat('en-ET', {
    month: 'short',
    day: 'numeric',
  }).format(createdAt);
}

export function base64UrlEncode(input: Buffer | string) {
  const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64');
}

export function signJwt(payload: Record<string, unknown>, secret: string) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest(),
  );
  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token: string, secret: string) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [header, body, signature] = parts;
  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest(),
  );

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error('Invalid token signature');
  }

  const payloadJson = base64UrlDecode(body).toString('utf8');
  const parsed = JSON.parse(payloadJson) as { exp?: number } & Record<string, unknown>;

  if (parsed.exp && Date.now() / 1000 > Number(parsed.exp)) {
    throw new Error('Token has expired');
  }

  return parsed;
}

export function createTelegramSecret(botToken: string) {
  return crypto.createHmac('sha256', botToken).update('WebAppData').digest();
}

export function verifyTelegramInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) {
    throw new Error('Missing hash in initData');
  }

  const entries = Array.from(params.entries())
    .filter(([key]) => key !== 'hash')
    .map(([key, value]) => `${key}=${value}`)
    .sort();
  const dataCheckString = entries.join('\n');

  const secretKey = createTelegramSecret(botToken);
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const receivedBuffer = Buffer.from(hash, 'hex');

  if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    throw new Error('Invalid initData hash');
  }

  const rawUser = params.get('user');
  const user = rawUser ? JSON.parse(rawUser) : undefined;

  return {
    user,
    auth_date: params.get('auth_date'),
    query_id: params.get('query_id'),
  };
}
