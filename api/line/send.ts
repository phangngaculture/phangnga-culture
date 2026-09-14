const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';
const LINE_NOTIFY_URL = 'https://notify-api.line.me/api/notify';

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
  token?: string;
  eventType?: string;
  bookingId?: string;
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (req.body || {}) as Body;
  const token = (body.token && body.token.trim()) || process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
  if (!token) {
    return res.status(503).json({ error: 'LINE token is not configured' });
  }

  const to = typeof body.to === 'string' ? body.to.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // If token is a LINE Notify token (shorter or doesn't look like Bot Channel Access Token) or no 'to' user ID provided, use LINE Notify API
  const isLineNotify = token.length < 100 || !to.startsWith('U');

  try {
    if (isLineNotify || !to) {
      const fullMessage = title ? `${title}\n\n${message}` : message;
      const params = new URLSearchParams();
      params.append('message', fullMessage);

      const notifyResponse = await fetch(LINE_NOTIFY_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!notifyResponse.ok) {
        const detail = await notifyResponse.text();
        console.error('[LINE] Notify failed', notifyResponse.status, detail);
        return res.status(400).json({ error: 'LINE Notify failed', detail: detail.slice(0, 500) });
      }

      return res.status(200).json({ success: true, mode: 'line_notify' });
    } else {
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
        return res.status(400).json({ error: 'LINE push failed', detail: detail.slice(0, 500) });
      }

      return res.status(200).json({ success: true, mode: 'messaging_api' });
    }
  } catch (error) {
    console.error('[LINE] Request failed', error);
    return res.status(502).json({ error: 'Unable to reach LINE API' });
  }
}
