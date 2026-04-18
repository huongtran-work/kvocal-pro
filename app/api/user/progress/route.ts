import { NextResponse } from 'next/server';
import { getDemoSession } from '@/lib/demo-auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const user = await getDemoSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const progress = await prisma.userProgress.findMany({
      where: { userId: user.id },
      orderBy: { lastAccessed: 'desc' },
    });
    return NextResponse.json(progress);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
