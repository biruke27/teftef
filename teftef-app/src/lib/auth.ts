import { getSessionToken, setSessionToken } from './session';

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

  const data = await response.json();
  if (data.sessionToken) {
    setSessionToken(data.sessionToken);
  }
  return data;
}

export async function updateUserProfile(data: {
  fullName?: string;
  nationalId?: string;
  acceptedMasterTerms?: boolean;
}) {
  const token = getSessionToken();
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? `Profile update failed: ${response.status}`);
  }

  const resData = await response.json();
  if (resData.sessionToken) {
    setSessionToken(resData.sessionToken);
  }
  return resData;
}
