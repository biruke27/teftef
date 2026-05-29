import { getTrustTier } from '../utils.js';

export function mapAdminParty(user: {
  id: string;
  telegramId: string;
  username: string | null;
  trust_score: number;
  is_banned: boolean;
}) {
  return {
    id: user.id,
    username: user.username,
    telegramId: user.telegramId,
    trustTier: getTrustTier(user.trust_score),
    is_banned: user.is_banned,
  };
}
