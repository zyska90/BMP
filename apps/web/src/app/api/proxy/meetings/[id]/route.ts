import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const res = await fetch(`${process.env.API_URL}/meetings/${params.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: `token=${token}` },
    body: JSON.stringify(body)
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
