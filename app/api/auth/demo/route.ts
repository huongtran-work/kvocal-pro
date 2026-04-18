import { NextResponse } from 'next/server';
import { getDemoPassword, DEMO_COOKIE, DEMO_USER } from '@/lib/demo-auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { password } = await request.json();
  if (password !== getDemoPassword()) {
    return NextResponse.json({ error: 'Sai mật khẩu' }, { status: 401 });
  }
  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.json({ user: DEMO_USER });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);
  return NextResponse.json({ ok: true });
}
