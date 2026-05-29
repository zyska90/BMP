import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const apiUrl = process.env.API_URL || 'http://localhost:3001';

  // Forward to the webhook endpoint which saves as pending registration
  const res = await fetch(`${apiUrl}/webhooks/registration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        submissionId: `web-${Date.now()}`,
        fields: [
          { label: 'name', value: body.fullName },
          { label: 'email', type: 'EMAIL', value: body.email },
          { label: 'role', value: body.roleType },
          { label: 'company', value: body.company },
          { label: 'city', value: body.city },
          { label: 'whatsapp', value: body.whatsappNumber },
          { label: 'offer', value: body.intentOffer },
          { label: 'seek', value: body.intentSeek },
          { label: 'linkedin', value: body.linkedinUrl },
        ]
      }
    })
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
