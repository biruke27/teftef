/**
 * Strict text-only payload for user identity verification.
 * This interface explicitly excludes any binary, media, or file-stream properties
 * to ensure a zero-image storage layout for identity tracking.
 */
export interface UserIdentityTextPayload {
  fullName: string;
  nationalId: string;
}
