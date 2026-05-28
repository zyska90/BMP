import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MeetingsClient from './MeetingsClient';

async function getMeetings() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${process.env.API_URL}/meetings`, {
      headers: { Cookie: `token=${token}` },
      cache: 'no-store'
    });
    if (!res.ok) return { pending: [], confirmed: [], past: [] };
    return res.json();
  } catch {
    return { pending: [], confirmed: [], past: [] };
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
    return res.ok ? res.json() : null;
  } catch { return null; }
}

export default async function MeetingsPage() {
  const [me, meetings] = await Promise.all([getMe(), getMeetings()]);
  if (!me) redirect('/login');

  return <MeetingsClient meetings={meetings || { pending: [], confirmed: [], past: [] }} />;
}
