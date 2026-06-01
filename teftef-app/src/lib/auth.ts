import { getSessionToken } from './session';

export type AuthVerifyResponse = {
  user: {
    id: string;
    telegramId: string;
    username?: string;
    role_mode: string;
    trust_score: number;
  };
  sessionToken: string;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function verifyTelegramInitData(initData: string): Promise<AuthVerifyResponse> {
  const response = await fetch(`${API_URL}/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? `Auth verify failed: ${response.status}`);
  }

  return response.json();
}

export async function updateMasterConsent(accepted: boolean) {
  const token = getSessionToken();
  const response = await fetch(`${API_URL}/auth/consent`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ accepted }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? `Consent update failed: ${response.status}`);
  }

  return response.json();
}
