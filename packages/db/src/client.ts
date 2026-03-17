import { PrismaClient } from '@prisma/client';
import { env } from '@marketbrain/config';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const client = new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  if (env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

/** Lazily initialized PrismaClient — avoids env validation at module-load time. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
