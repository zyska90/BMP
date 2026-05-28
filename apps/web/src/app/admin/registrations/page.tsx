import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RegistrationsClient from './RegistrationsClient';

async function getRegistrations() {
  const token = cookies().get('token')?.value;
  if (!token) return [];
  const res = await fetch(`${process.env.API_URL}/admin/registrations`, {
    headers: { Cookie: `token=${token}` }, cache: 'no-store'
  });
  return res.ok ? res.json() : [];
}

async function getMe() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  const res = await fetch(`${process.env.API_URL}/auth/me`, {
    headers: { Cookie: `token=${token}` }, cache: 'no-store'
  });
  return res.ok ? res.json() : null;
}

export default async function RegistrationsPage() {
  const [me, registrations] = await Promise.all([getMe(), getRegistrations()]);
  if (!me || me.role !== 'admin') redirect('/login');
  return <RegistrationsClient initialData={registrations} />;
}
