import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${process.env.API_URL}/matches`, {
    headers: { Cookie: `token=${token}` },
    cache: 'no-store'
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST() {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${process.env.API_URL}/matches/recompute`, {
    method: 'POST',
    headers: { Cookie: `token=${token}` }
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
