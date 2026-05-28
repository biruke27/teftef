const STORAGE_KEY = 'teftef-session-token';

export function getSessionToken(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? '';
}

export function setSessionToken(token: string): void {
  window.localStorage.setItem(STORAGE_KEY, token);
}

export function clearSessionToken(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
