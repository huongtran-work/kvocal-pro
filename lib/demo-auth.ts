import { cookies } from 'next/headers';

export const DEMO_COOKIE = 'demo_auth';

export const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@kvoice.ai',
  image: null as string | null,
};

export function getDemoPassword(): string {
  const pwd = process.env.DEMO_PASSWORD;
  if (!pwd) throw new Error('DEMO_PASSWORD env var is not set');
  return pwd;
}

export async function getDemoSession(): Promise<typeof DEMO_USER | null> {
  const cookieStore = await cookies();
  const val = cookieStore.get(DEMO_COOKIE)?.value;
  return val === '1' ? DEMO_USER : null;
}
