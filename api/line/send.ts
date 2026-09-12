const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';

type RequestLike = {
  method?: string;
  body?: unknown;
};

type ResponseLike = {
  setHeader(name: string, value: string): void;
  status(code: number): { json(payload: unknown): unknown };
};

type Body = {
  to?: string;
  message?: string;
  title?: string;
  eventType?: string;
  bookingId?: string;
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'LINE_CHANNEL_ACCESS_TOKEN is not configured' });
  }

  const body = (req.body || {}) as Body;
  const to = typeof body.to === 'string' ? body.to.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!to || !message) {
    return res.status(400).json({ error: 'Both to and message are required' });
  }

  try {
    const lineResponse = await fetch(LINE_PUSH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        messages: [{ type: 'text', text: message }]
      })
    });

    if (!lineResponse.ok) {
      const detail = await lineResponse.text();
      console.error('[LINE] Push failed', lineResponse.status, detail);
      return res.status(lineResponse.status >= 400 && lineResponse.status < 500 ? 400 : 502).json({
        error: 'LINE push failed',
        detail: detail.slice(0, 500)
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[LINE] Push request failed', error);
    return res.status(502).json({ error: 'Unable to reach LINE Messaging API' });
  }
}
