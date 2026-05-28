import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

async function getUsers() {
  const token = cookies().get('token')?.value;
  if (!token) return [];
  const res = await fetch(`${process.env.API_URL}/admin/users`, {
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

export default async function UsersPage() {
  const [me, users] = await Promise.all([getMe(), getUsers()]);
  if (!me || me.role !== 'admin') redirect('/login');
  return <UsersClient initialUsers={users} />;
}
