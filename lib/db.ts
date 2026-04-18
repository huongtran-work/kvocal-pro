import { PrismaClient } from '@prisma/client';

function fixDbUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    new URL(raw);
    return raw;
  } catch {
    // Password likely has unencoded special chars — parse manually
    const protoEnd = raw.indexOf('://');
    const atIdx = raw.lastIndexOf('@');
    if (protoEnd === -1 || atIdx === -1) return raw;
    const proto = raw.substring(0, protoEnd + 3);
    const credentials = raw.substring(protoEnd + 3, atIdx);
    const colonIdx = credentials.indexOf(':');
    if (colonIdx === -1) return raw;
    const user = credentials.substring(0, colonIdx);
    const pass = credentials.substring(colonIdx + 1);
    const rest = raw.substring(atIdx + 1);
    return proto + user + ':' + encodeURIComponent(pass) + '@' + rest;
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbUrl = fixDbUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
