import { NextResponse } from 'next/server';
import { getDemoSession } from '@/lib/demo-auth';

export async function GET() {
  const user = await getDemoSession();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user });
}
