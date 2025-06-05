export async function POST(req: Request) {
  try {
    const body = await req.json();
    const webhookUrl = 'https://zyris.app.n8n.cloud/webhook/9ab1f134-57fc-42f0-979e-786f43c7ef2f';

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