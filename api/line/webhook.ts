type RequestLike = {
  method?: string;
  body?: unknown;
};

type ResponseLike = {
  setHeader(name: string, value: string): void;
  status(code: number): {
    json(payload: unknown): unknown;
    send(body: string): unknown;
  };
};

type WebhookBody = {
  destination?: string;
  events?: unknown[];
};

export default function handler(req: RequestLike, res: ResponseLike) {
  const method = req.method || 'GET';

  // LINE Developers console verification (and uptime checks) expect a plain 200 reply
  if (method === 'GET' || method === 'HEAD') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).send('LINE Webhook Endpoint Ready');
  }

  if (method !== 'POST') {
    res.setHeader('Allow', 'GET, HEAD, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body || {}) as WebhookBody;
  const events = Array.isArray(body.events) ? body.events : [];

  console.log(`[LINE Webhook] Received ${events.length} event(s)`);

  return res.status(200).json({ success: true, count: events.length });
}