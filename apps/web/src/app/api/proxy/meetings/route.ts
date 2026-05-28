import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${process.env.API_URL}/meetings`, {
    headers: { Cookie: `token=${token}` },
    cache: 'no-store'
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(request: NextRequest) {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const res = await fetch(`${process.env.API_URL}/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `token=${token}` },
    body: JSON.stringify(body)
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
