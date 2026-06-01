import { signJwt } from '../dist/utils.js';

const secret = process.argv[2] ?? process.env.JWT_SECRET ?? 'devsecret';
const userId = process.argv[3] ?? 'local-test-user';
const telegramId = process.argv[4] ?? '12345';
const username = process.argv[5] ?? 'localtester';

const token = signJwt({
  userId,
  telegramId,
  username,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
}, secret);

console.log(token);
