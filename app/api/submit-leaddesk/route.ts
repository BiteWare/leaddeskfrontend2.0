export async function POST(req: Request) {
  try {
    const body = await req.json();
    const webhookUrl = 'https://zyris.app.n8n.cloud/webhook-test/e2d897bc-c7e5-441b-9e5d-6094e0ad37f8';

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ success: false }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err }), { status: 500 });
  }
} 