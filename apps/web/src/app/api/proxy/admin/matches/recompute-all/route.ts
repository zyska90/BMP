import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const res = await fetch(`${process.env.API_URL}/admin/matches/recompute-all`, {
    method: 'POST', headers: { Cookie: `token=${token}` }
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
