import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TagsClient from './TagsClient';

async function getTags() {
  const token = cookies().get('token')?.value;
  if (!token) return [];
  const res = await fetch(`${process.env.API_URL}/admin/tags`, {
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

export default async function TagsPage() {
  const [me, tags] = await Promise.all([getMe(), getTags()]);
  if (!me || me.role !== 'admin') redirect('/login');
  return <TagsClient initialTags={tags} />;
}
