import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MatchesClient from './MatchesClient';

async function getMatches() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${process.env.API_URL}/matches`, {
      headers: { Cookie: `token=${token}` },
      cache: 'no-store'
    });
    if (!res.ok) return { matches: [], total: 0 };
    return res.json();
  } catch {
    return { matches: [], total: 0 };
  }
}

async function getMe() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${process.env.API_URL}/auth/me`, {
      headers: { Cookie: `token=${token}` },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function MatchesPage() {
  const [me, data] = await Promise.all([getMe(), getMatches()]);
  if (!me) redirect('/login');
  if (!me.hasCompletedProfile) redirect('/profile/setup');

  return <MatchesClient initialMatches={data?.matches || []} />;
}
