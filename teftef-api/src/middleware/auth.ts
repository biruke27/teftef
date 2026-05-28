import type { FastifyRequest } from 'fastify';
import { verifyJwt } from '../utils.js';

export function getAuthPayload(request: FastifyRequest, jwtSecret: string) {
  const authHeader = (request.headers.authorization as string | undefined) ?? '';
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    throw new Error('Missing authorization header');
  }

  return verifyJwt(token, jwtSecret);
}
