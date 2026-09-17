type RequestLike = {
  method?: string;
};

type ResponseLike = {
  setHeader(name: string, value: string): void;
  status(code: number): { json(payload: unknown): unknown };
};

export default function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ configured: false, message: 'Method not allowed' });
  }

  const hasEnvToken = Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim());
  const hasSecret = Boolean(process.env.LINE_CHANNEL_SECRET?.trim());

  return res.status(200).json({
    configured: hasEnvToken,
    hasEnvToken,
    hasSecret,
    message: hasEnvToken
      ? 'LINE Channel Access Token พร้อมใช้งานบนเซิร์ฟเวอร์'
      : 'ยังไม่ได้ระบุ LINE_CHANNEL_ACCESS_TOKEN ในตัวแปรสภาพแวดล้อม (สามารถกรอกในหน้าตั้งค่าได้)'
  });
}