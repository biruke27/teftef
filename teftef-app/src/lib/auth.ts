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

export async function verifyTelegramInitData(initData: string): Promise<AuthVerifyResponse> {
  const response = await fetch('/auth/verify', {
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
