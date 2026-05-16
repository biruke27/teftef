import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

dotenv.config();

async function start() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: '*' });

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: Date.now(),
  }));

  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`[M0-T2] Server listening on port ${port}`);
}

start().catch((error) => {
  console.error('[M0-T2] startup failed:', error);
  process.exit(1);
});
