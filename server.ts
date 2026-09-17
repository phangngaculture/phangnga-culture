import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const LINE_PUSH_URL = 'https://api.line.me/v2/bot/message/push';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // In-memory rate limiting map for API endpoints
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  const apiRateLimiter: express.RequestHandler = (req, res, next) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 60; // 60 requests per minute

    const record = rateLimitMap.get(clientIp);
    if (!record || now > record.resetTime) {
      rateLimitMap.set(clientIp, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'rate_limit_exceeded',
        message: 'คำขอถี่เกินไป กรุณารอสักครู่ก่อนทำรายการใหม่'
      });
    }

    record.count += 1;
    next();
  };

  // =========================================================================
  // API ROUTES
  // =========================================================================

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Check LINE integration status
  app.get('/api/line/status', apiRateLimiter, (_req, res) => {
    const hasEnvToken = Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim());
    const hasSecret = Boolean(process.env.LINE_CHANNEL_SECRET?.trim());

    res.json({
      configured: hasEnvToken,
      hasEnvToken,
      hasSecret,
      message: hasEnvToken
        ? 'LINE Channel Access Token พร้อมใช้งานบนเซิร์ฟเวอร์'
        : 'ยังไม่ได้ระบุ LINE_CHANNEL_ACCESS_TOKEN ในตัวแปรสภาพแวดล้อม (สามารถกรอกในหน้าตั้งค่าได้)'
    });
  });

  // Send LINE Push Notification (Text or Flex Message)
  app.post('/api/line/send', apiRateLimiter, async (req, res) => {
    const { to, message, flex, title, token: clientToken } = req.body || {};

    const targetTo = typeof to === 'string' ? to.trim() : '';
    const fallbackMessage = typeof message === 'string' ? message.trim().slice(0, 5000) : '';
    const activeToken = (typeof clientToken === 'string' && clientToken.trim()) || process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() || '';

    if (!targetTo || targetTo.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'target_required',
        message: 'กรุณาระบุ LINE User ID ที่ถูกต้อง'
      });
    }

    if (!activeToken) {
      return res.status(400).json({
        success: false,
        error: 'token_missing',
        message: 'ไม่พบ LINE Channel Access Token ทั้งบนเซิร์ฟเวอร์และในคำขอ'
      });
    }

    // Build LINE messages array
    const messages: unknown[] = [];

    if (flex && typeof flex === 'object') {
      messages.push({
        type: 'flex',
        altText: title || fallbackMessage || 'แจ้งเตือนระบบงานยานพาหนะ สวจ.พังงา',
        contents: flex
      });
    } else if (fallbackMessage) {
      messages.push({
        type: 'text',
        text: fallbackMessage
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'content_required',
        message: 'กรุณาระบุข้อความหรือข้อมูล Flex Message'
      });
    }

    try {
      const lineRes = await fetch(LINE_PUSH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: targetTo,
          messages
        })
      });

      if (!lineRes.ok) {
        const errorText = await lineRes.text();
        console.error('[LINE Push Error]', lineRes.status, errorText);

        let parsedError: { message?: string } | null = null;
        try {
          parsedError = JSON.parse(errorText);
        } catch {
          // keep as raw text
        }

        let userFriendlyMessage = parsedError?.message || errorText || 'เกิดข้อผิดพลาดในการส่งข้อความผ่าน LINE API';
        if (lineRes.status === 401) {
          userFriendlyMessage = 'LINE Channel Access Token ไม่ถูกต้องหรือหมดอายุ (Error 401 Unauthorized) กรุณาตรวจสอบหรืออัปเดต Token ใน LINE Developers Console';
        } else if (lineRes.status === 400) {
          userFriendlyMessage = `ข้อมูลไม่ถูกต้อง (Error 400): ${parsedError?.message || 'รูปแบบ LINE User ID หรือข้อความไม่ถูกต้อง'}`;
        }

        return res.status(lineRes.status >= 400 && lineRes.status < 500 ? 400 : 502).json({
          success: false,
          status: lineRes.status,
          error: lineRes.status === 401 ? 'unauthorized' : 'line_api_error',
          message: userFriendlyMessage
        });
      }

      return res.json({
        success: true,
        mode: 'messaging_api',
        message: 'ส่งการแจ้งเตือนไปยัง LINE สำเร็จแล้ว'
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[LINE Network Error]', errorMessage);
      return res.status(502).json({
        success: false,
        error: 'network_error',
        message: `ไม่สามารถติดต่อเซิร์ฟเวอร์ LINE ได้: ${errorMessage}`
      });
    }
  });

  // LINE Webhook Endpoint (for LINE Developers console verification & incoming events)
  app.all('/api/line/webhook', (req, res) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return res.status(200).send('LINE Webhook Endpoint Ready');
    }
    // Handle POST webhook events
    const events = req.body?.events || [];
    console.log(`[LINE Webhook] Received ${events.length} event(s)`);
    return res.status(200).json({ success: true, count: events.length });
  });

  // =========================================================================
  // VITE OR STATIC SERVING
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
