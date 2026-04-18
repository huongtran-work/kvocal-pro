import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

function fixUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try { new URL(raw); return raw; } catch {}
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

const dbUrl = fixUrl(process.env.DATABASE_URL);

const prisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
});

async function seed() {
  console.log('Seeding lessons...');

  const lessonsDir = path.join(process.cwd(), 'data', 'lessons');
  const files = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));

  let seeded = 0;
  for (const file of files) {
    const topicId = file.replace('.json', '');
    const lessonData = JSON.parse(fs.readFileSync(path.join(lessonsDir, file), 'utf-8'));
    await prisma.lesson.upsert({
      where: { topicId },
      update: { lessonData },
      create: { topicId, lessonData },
    });
    seeded++;
    process.stdout.write(`\r  Seeded ${seeded}/${files.length}: ${topicId}        `);
  }

  console.log(`\nDone! Seeded ${seeded} lessons to Supabase.`);
  await prisma.$disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
