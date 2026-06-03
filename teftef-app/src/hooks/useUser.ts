import { useQuery } from '@tanstack/react-query';
import { getSessionToken } from '../lib/session';
import { useMemo } from 'react';

interface User {
  id: string;
  telegramId: string;
  username?: string;
  nationalId: string | null;
  fullName: string | null;
  acceptedMasterTerms: boolean;
  role_mode: 'CLIENT' | 'FREELANCER';
  [key: string]: any;
}

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const token = getSessionToken();
      if (!token) return null;
      return decodeJwt(token);
    },
    staleTime: Infinity,
  });
}

/**
 * Global Identity Evaluation Logic
 * Ensures that the verification layer acts as an absolute bypass.
 * Contextual states (e.g. proposalStatus: 'REJECTED') are ignored in favor of profile data.
 */
export function useAuthSessionState(user: User | null) {
  return useMemo(() => {
    if (!user) return { isAuthenticated: false, isVerified: false };

    const hasProfileIdentity = user.nationalId !== null && user.nationalId !== undefined;

    return {
      isAuthenticated: true,
      isVerified: hasProfileIdentity,
      identityStatus: hasProfileIdentity ? 'VERIFIED' : 'ANONYMOUS',
      /**
       * ABSOLUTE BYPASS RULE: If the profile identity is present, the user bypasses
       * ALL entry forms globally, regardless of their history with specific job cards.
       */
      canBypassEntryForms: hasProfileIdentity,
    };
  }, [user?.id, user?.nationalId]);
}
