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
    return res.status(405).json({ status: 'method_not_allowed' });
  }

  return res.status(200).json({
    status: 'ok',
    service: 'ระบบเบิกใช้งานรถยนต์ราชการ - สำนักงานวัฒนธรรมจังหวัดพังงา',
    time: new Date().toISOString()
  });
}