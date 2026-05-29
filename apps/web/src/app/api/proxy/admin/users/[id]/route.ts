import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const res = await fetch(`${process.env.API_URL}/admin/users/${params.id}`, {
    headers: { Cookie: `token=${token}` }, cache: 'no-store'
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
