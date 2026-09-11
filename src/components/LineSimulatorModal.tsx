import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Trash2,
  Settings,
  ShieldCheck,
  Sparkles,
  Smartphone,
  X,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Bell
} from 'lucide-react';
import { LineNotificationLog, GlobalLineConfig, User, BookingRequest } from '../types';
import {
  getLineNotificationLogs,
  clearLineNotificationLogs,
  getGlobalLineConfig,
  saveGlobalLineConfig,
  sendLineNotification,
  formatNewBookingMessage,
  formatApprovedBookingMessage,
  formatRejectedBookingMessage,
  formatMissionStartedMessage
} from '../services/lineNotificationService';

interface LineSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  bookings?: BookingRequest[];
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const LineSimulatorModal: React.FC<LineSimulatorModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  bookings = [],
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'logs' | 'config'>('chat');
  const [logs, setLogs] = useState<LineNotificationLog[]>([]);
  const [config, setConfig] = useState<GlobalLineConfig>(getGlobalLineConfig());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load logs on mount and subscribe to dispatched events
  useEffect(() => {
    if (!isOpen) return;
    setLogs(getLineNotificationLogs());
    setConfig(getGlobalLineConfig());

    const handleDispatched = () => {
      setLogs(getLineNotificationLogs());
    };

    window.addEventListener('line-notification-dispatched', handleDispatched);
    return () => {
      window.removeEventListener('line-notification-dispatched', handleDispatched);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const latestLog = logs[0];

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast?.('คัดลอกข้อความ LINE แล้ว', 'info');
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveGlobalLineConfig(config);
    onShowToast?.('บันทึกการตั้งค่า LINE สำเร็จ', 'success');
  };

  const handleClearLogs = () => {
    if (confirm('คุณต้องการล้างประวัติการส่งการแจ้งเตือน LINE ทั้งหมดหรือไม่?')) {
      clearLineNotificationLogs();
      setLogs([]);
      onShowToast?.('ล้างประวัติการแจ้งเตือนแล้ว', 'info');
    }
  };

  // Quick Trigger Simulations
  const handleSimulateEvent = async (type: 'new' | 'approved' | 'rejected' | 'started') => {
    setIsSimulating(true);
    const sampleBooking: BookingRequest = bookings[0] || {
      id: 'CAR-69001',
      memoNo: 'พง ๐๐๓๒(พิเศษ)/ว ๐๑๑',
      date: '2026-09-12',
      startTime: '08:30',
      endTime: '16:30',
      name: currentUser.name,
      username: currentUser.username,
      position: currentUser.position,
      department: currentUser.department,
      purpose: 'ร่วมประชุมคณะกรรมการส่งเสริมศาสนาและวัฒนธรรมประจำจังหวัด',
      destination: 'ศาลากลางจังหวัดพังงา',
      destProvince: 'พังงา',
      destAmphoe: 'เมืองพังงา',
      destTambon: 'ท้ายช้าง',
      destDetail: '',
      carId: 'v-camry',
      carName: 'Toyota Camry (VIP เก๋ง)',
      driverType: 'driver',
      driverName: 'นายศราวุธ เกตุรักษ์',
      status: 'pending'
    };

    let title = '';
    let message = '';
    let eventType: LineNotificationLog['eventType'] = 'test';

    if (type === 'new') {
      title = 'มีคำขอใช้รถยนต์ราชการใหม่';
      message = formatNewBookingMessage(sampleBooking);
      eventType = 'new_booking';
    } else if (type === 'approved') {
      title = 'คำขอใช้รถยนต์ได้รับการอนุมัติแล้ว';
      message = formatApprovedBookingMessage(sampleBooking, 'ผู้อำนวยการสำนักงานวัฒนธรรมจังหวัดพังงา');
      eventType = 'booking_approved';
    } else if (type === 'rejected') {
      title = 'คำขอใช้รถยนต์ไม่ได้รับการอนุมัติ';
      message = formatRejectedBookingMessage(sampleBooking, 'ติดภารกิจผู้ว่าราชการจังหวัดในวันดังกล่าว กรุณาปรับเปลี่ยนเวลา');
      eventType = 'booking_rejected';
    } else if (type === 'started') {
      title = 'พนักงานขับรถเริ่มออกเดินทางแล้ว';
      message = formatMissionStartedMessage({ ...sampleBooking, startMileage: 148520 });
      eventType = 'mission_started';
    }

    await sendLineNotification({
      recipientUserId: currentUser.id,
      recipientName: currentUser.name,
      lineUserId: currentUser.lineUserId || 'U-CURRENT-USER',
      token: currentUser.lineNotifyToken,
      title,
      message,
      eventType,
      bookingId: sampleBooking.id
    });

    setIsSimulating(false);
    onShowToast?.(`จำลองการส่งการแจ้งเตือน LINE "${title}" สำเร็จ`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full overflow-hidden animate-in fade-in duration-200 my-auto flex flex-col max-h-[90vh]">
        
        {/* Header with LINE signature green */}
        <div className="px-6 py-4.5 bg-[#06c755] text-white flex justify-between items-center relative overflow-hidden shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner font-black text-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg leading-tight">ระบบจำลองและประวัติ LINE Notification</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-[11px] font-bold text-white tracking-wide">
                  LINE Messaging API
                </span>
              </div>
              <p className="text-xs text-emerald-50 mt-0.5">
                จำลองการส่งข้อความแจ้งเตือนสถานะคำขอใช้รถยนต์ราชการ สวจ.พังงา
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 px-6 pt-3 border-b border-slate-200 bg-slate-50/70 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center space-x-2 border-b-2 ${
              activeTab === 'chat'
                ? 'border-[#06c755] text-[#06c755] bg-white font-bold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>จำลองแชท LINE (Chat Preview)</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center space-x-2 border-b-2 ${
              activeTab === 'logs'
                ? 'border-[#06c755] text-[#06c755] bg-white font-bold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>ประวัติการส่ง ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 rounded-t-xl transition flex items-center space-x-2 border-b-2 ${
              activeTab === 'config'
                ? 'border-[#06c755] text-[#06c755] bg-white font-bold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>ตั้งค่าระบบ LINE ส่วนกลาง</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/40">
          
          {/* TAB 1: CHAT PREVIEW */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Quick Simulation Controls */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-[#06c755]" />
                    <span>ทดสอบส่งข้อความจำลองด่วน</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    คลิกเพื่อทดสอบจำลองการส่งการแจ้งเตือนในสถานการณ์ต่างๆ และดูการแสดงผลในหน้าจอจำลองด้านขวา
                  </p>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => handleSimulateEvent('new')}
                      disabled={isSimulating}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>1. มีคำขอใช้รถใหม่เข้ามา</span>
                        </div>
                        <div className="text-[11px] text-slate-500">แจ้งเตือน ผอ. / ผู้ดูแลระบบ เพื่อรออนุมัติ</div>
                      </div>
                      <Send className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
                    </button>

                    <button
                      onClick={() => handleSimulateEvent('approved')}
                      disabled={isSimulating}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>2. ผอ. ลงนามอนุมัติคำขอ</span>
                        </div>
                        <div className="text-[11px] text-slate-500">แจ้งผลไปยังผู้ขอใช้รถและคนขับรถ</div>
                      </div>
                      <Send className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
                    </button>

                    <button
                      onClick={() => handleSimulateEvent('rejected')}
                      disabled={isSimulating}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 transition flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span>3. ส่งกลับ / ไม่อนุมัติคำขอ</span>
                        </div>
                        <div className="text-[11px] text-slate-500">แจ้งเหตุผลส่งกลับไปยังผู้ยื่นคำขอ</div>
                      </div>
                      <Send className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
                    </button>

                    <button
                      onClick={() => handleSimulateEvent('started')}
                      disabled={isSimulating}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>4. พนักงานขับรถเริ่มออกเดินทาง</span>
                        </div>
                        <div className="text-[11px] text-slate-500">บันทึกไมล์เริ่มต้นและแจ้งสถานะการเดินทาง</div>
                      </div>
                      <Send className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
                    </button>
                  </div>
                </div>

                {/* Status card */}
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-1.5 text-emerald-900">
                  <div className="flex items-center space-x-2 font-bold text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>ระบบแจ้งเตือนพร้อมทำงาน</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    ระบบจำลองทำงานแบบ Real-time โดยจะเก็บประวัติการส่งและแสดงตัวอย่างข้อความแชทเสมือนได้รับบนแอปพลิเคชัน LINE ทันที
                  </p>
                </div>
              </div>

              {/* Right Column: Realistic LINE Mobile Chat Mockup */}
              <div className="md:col-span-7 flex justify-center">
                <div className="w-full max-w-sm bg-[#849EB5] rounded-[36px] p-3 shadow-2xl border-4 border-slate-800 relative overflow-hidden flex flex-col min-h-[500px]">
                  
                  {/* Phone Notch / Speaker bar */}
                  <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

                  {/* LINE Chat Header */}
                  <div className="bg-[#243342] text-white px-3.5 py-2.5 rounded-2xl flex items-center justify-between mb-3 shadow-sm">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#06c755] flex items-center justify-center text-white font-bold text-xs shadow-inner ring-1 ring-white/30">
                        🏛️
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="font-bold text-xs">รถราชการ สวจ.พังงา</span>
                          <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full text-[9px] flex items-center justify-center font-bold">✓</span>
                        </div>
                        <div className="text-[10px] text-emerald-300">LINE Official Account</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-300 font-mono">11:00</span>
                  </div>

                  {/* LINE Chat Messages Area */}
                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {latestLog ? (
                      <div className="space-y-1">
                        <div className="flex items-end space-x-2">
                          <div className="w-7 h-7 rounded-full bg-[#06c755] flex items-center justify-center text-[11px] text-white shrink-0 shadow-sm">
                            🏛️
                          </div>
                          
                          {/* LINE Chat Bubble */}
                          <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-md border border-slate-100 max-w-[85%] text-slate-800 text-xs space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                              <span className="font-bold text-[#06c755] flex items-center space-x-1">
                                <Bell className="w-3.5 h-3.5" />
                                <span>{latestLog.title}</span>
                              </span>
                              <button
                                onClick={() => handleCopyText(latestLog.message, latestLog.id)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
                                title="คัดลอกข้อความ"
                              >
                                {copiedId === latestLog.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <pre className="font-sans text-[11px] whitespace-pre-wrap leading-relaxed text-slate-700 select-text">
                              {latestLog.message}
                            </pre>

                            <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50">
                              <span>ส่งถึง: {latestLog.recipient}</span>
                              <span className="font-mono">
                                {new Date(latestLog.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mode badge under bubble */}
                        <div className="text-[10px] text-slate-200 text-right px-2">
                          {latestLog.mode === 'simulation' ? '⚡ โหมดจำลอง (Simulator)' : '🌐 ส่งผ่าน API'}
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 flex flex-col items-center justify-center text-white/80 space-y-2 text-center p-4">
                        <MessageSquare className="w-8 h-8 opacity-60" />
                        <p className="text-xs font-semibold">ยังไม่มีข้อความแจ้งเตือน</p>
                        <p className="text-[11px] text-white/60">คลิกปุ่มทดสอบด้านซ้าย เพื่อจำลองการส่งข้อความแรก</p>
                      </div>
                    )}
                  </div>

                  {/* Phone Bottom Pill bar */}
                  <div className="w-24 h-1 bg-white/60 rounded-full mx-auto mt-2" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOGS & HISTORY */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">ประวัติการส่งการแจ้งเตือน LINE ทั้งหมด</h4>
                  <p className="text-xs text-slate-500">บันทึกประวัติการส่งข้อความ 100 รายการล่าสุดในระบบ</p>
                </div>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ล้างประวัติทั้งหมด</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">ยังไม่มีประวัติการส่งข้อความ</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50 transition space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#06c755]" />
                          <span className="font-bold text-xs text-slate-800">{log.title}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono">
                            {log.mode}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString('th-TH')}
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                        <span>ผู้รับ: <strong className="text-slate-800">{log.recipient}</strong></span>
                        {log.lineUserId && (
                          <span>LINE User ID: <code className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded text-[11px]">{log.lineUserId}</code></span>
                        )}
                        {log.details && (
                          <span className="text-[11px] text-slate-400 italic">({log.details})</span>
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-700 whitespace-pre-wrap font-sans border border-slate-100">
                        {log.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GLOBAL CONFIG */}
          {activeTab === 'config' && (
            <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 max-w-2xl mx-auto">
              <div>
                <h4 className="text-sm font-bold text-slate-800">การตั้งค่าเชื่อมต่อ LINE ส่วนกลางของหน่วยงาน</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  กำหนดค่าเริ่มต้นสำหรับ LINE Messaging API หรือ Webhook Proxy (เช่น Google Apps Script) สำหรับระบบส่วนกลาง
                </p>
              </div>

              <div className="space-y-4">
                {/* Channel Access Token */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    LINE Channel Access Token (Long-Lived)
                  </label>
                  <input
                    type="text"
                    value={config.channelAccessToken || ''}
                    onChange={(e) => setConfig({ ...config, channelAccessToken: e.target.value })}
                    placeholder="เช่น eyJhbGciOiJIUzI1NiJ9..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#06c755]"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    สร้างและรับได้จาก LINE Developers Console &gt; Messaging API &gt; Channel access token
                  </span>
                </div>

                {/* Webhook URL (Recommended for browser without CORS issues) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Custom Webhook / GAS Proxy URL (แนะนำสำหรับระบบบนเว็บเบราว์เซอร์)
                  </label>
                  <input
                    type="url"
                    value={config.webhookUrl || ''}
                    onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                    placeholder="เช่น https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#06c755]"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    URL ของ Google Apps Script หรือ Cloud Function ที่ทำหน้าที่รับคำขอและ Push LINE ให้โดยไม่ติด CORS
                  </span>
                </div>

                {/* Simulation Only Toggle */}
                <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.simulationModeOnly}
                    onChange={(e) => setConfig({ ...config, simulationModeOnly: e.target.checked })}
                    className="w-4 h-4 rounded text-[#06c755] focus:ring-[#06c755]"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">บังคับใช้โหมดจำลองเท่านั้น (Simulation Mode Only)</div>
                    <div className="text-[11px] text-slate-500">บันทึกและแสดงในระบบจำลองโดยไม่ยิงคำขอออกไปยังอินเทอร์เน็ตจริง</div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#06c755] hover:bg-[#05b34c] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกการตั้งค่า</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100/80 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#06c755] animate-pulse" />
            <span>โหมดจำลองพร้อมใช้งานตลอดเวลา ไม่จำเป็นต้องมี Token เพื่อทดสอบ</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-semibold transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
