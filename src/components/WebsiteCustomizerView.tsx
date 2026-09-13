import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Layers, 
  Sliders, 
  Type, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Grid, 
  Eye, 
  Monitor, 
  Laptop, 
  Smartphone, 
  Sparkles, 
  LayoutDashboard, 
  Settings, 
  User, 
  Volume2, 
  Info,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { playAppSound } from '../utils/thaiDate';

// Supported style types
export type UiStyleType = 'modern' | 'ribbon' | 'classic' | 'slim_rail' | 'double_panel' | 'eevo_sleek';
export type MenuColorType = 'orange' | 'emerald' | 'indigo' | 'rose' | 'violet';
export type FontSizeCodeType = 'small' | 'medium' | 'large';

interface WebsiteCustomizerViewProps {
  uiStyle: UiStyleType;
  onSetUiStyle: (style: UiStyleType) => void;
  menuButtonColor: MenuColorType;
  onSetMenuButtonColor: (color: MenuColorType) => void;
  iconStyle: 'gradient' | 'neon' | 'flat';
  onSetIconStyle: (style: 'gradient' | 'neon' | 'flat') => void;
  fontSize: FontSizeCodeType;
  onSetFontSize: (size: FontSizeCodeType) => void;
  sidebarOpacity: number;
  onSetSidebarOpacity: (opacity: number) => void;
  soundEnabled?: boolean;
}

export const WebsiteCustomizerView: React.FC<WebsiteCustomizerViewProps> = ({
  uiStyle,
  onSetUiStyle,
  menuButtonColor,
  onSetMenuButtonColor,
  iconStyle,
  onSetIconStyle,
  fontSize,
  onSetFontSize,
  sidebarOpacity,
  onSetSidebarOpacity,
  soundEnabled = true
}) => {
  // Local playground states for interactive prototype (แบบทดลองตัวโชว์)
  const [localStyle, setLocalStyle] = useState<UiStyleType>(uiStyle);
  const [localColor, setLocalColor] = useState<MenuColorType>(menuButtonColor);
  const [localOpacity, setLocalOpacity] = useState<number>(sidebarOpacity);
  const [localFontSize, setLocalFontSize] = useState<FontSizeCodeType>(fontSize);
  
  // Simulated sidebar interaction states
  const [isActivityExpanded, setIsActivityExpanded] = useState<boolean>(true);
  const [isSystemExpanded, setIsSystemExpanded] = useState<boolean>(true);
  const [selectedSimTab, setSelectedSimTab] = useState<string>('overview');
  
  // Indicator dot colors in simulator
  const [overviewDot, setOverviewDot] = useState<string>('bg-violet-500');
  const [analyticsDot, setAnalyticsDot] = useState<string>('bg-pink-500');
  const [projectsDot, setProjectsDot] = useState<string>('bg-rose-500');

  // Sync props to local states if props change
  useEffect(() => {
    setLocalStyle(uiStyle);
    setLocalColor(menuButtonColor);
    setLocalOpacity(sidebarOpacity);
    setLocalFontSize(fontSize);
  }, [uiStyle, menuButtonColor, sidebarOpacity, fontSize]);

  const styleOptions = [
    {
      id: 'eevo_sleek' as const,
      name: '👑 EEVO Sleek Dark (สไตล์ใหม่ล่าสุด)',
      desc: 'ขอบมุมโค้งมน หน้าต่าง macOS ควบคุมสิทธิ์ ทรงกระจกหรูหราไล่จากทึบไปโปร่งใสได้ (ตามรูปภาพอัปโหลด)',
      badge: 'แนะนำสูงสุด',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
    },
    {
      id: 'modern' as const,
      name: '1. Standard Modern List',
      desc: 'แผงเมนูด้านซ้ายสีเข้ม มีรูปภาพโปรไฟล์ พร้อมแถบเส้นสว่างบอกสถานะฝั่งซ้ายแบบสปอร์ต',
      badge: 'คลาสสิกโมเดิร์น',
      badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    },
    {
      id: 'ribbon' as const,
      name: '2. Curved Inset Ribbon',
      desc: 'ขอบเมนูส่วนโค้งมนเว้าเข้ารูปแบบสามมิติไร้รอยต่อ ปลายเมนูจิกโค้งรับสไตล์หรูหรา',
      badge: '3D เว้าเข้ารูป',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      id: 'slim_rail' as const,
      name: '3. Slim Icon Rail Dock',
      desc: 'แถบข้างผอมพิเศษ ประหยัดพื้นที่การแสดงผลสูงสุด แสดงผลเฉพาะไอคอนขอบมนเรืองแสงสไตล์มินิมอล',
      badge: 'ประหยัดพื้นที่',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    },
    {
      id: 'double_panel' as const,
      name: '4. Double Layer Grid Board',
      desc: 'แถบคู่ไฮเทค: ซีกซ้ายเก็บรูปโปรไฟล์/ผู้ใช้งาน ซีกขวาจัดวางแบบบล็อกตารางไอคอนโมเดิร์นสลับง่าย',
      badge: 'แผงควบคุมคู่',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    },
    {
      id: 'classic' as const,
      name: '5. Classic Thai Office',
      desc: 'สไตล์ราชการดั้งเดิม กรอบเส้นลายคู่ อักษรแบบสารบรรณและขอบสีทองคำอร่ามหรูหราเป็นทางการ',
      badge: 'ลายไทยราชการ',
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    }
  ];

  const colorOptions = [
    { id: 'orange' as const, name: 'ส้มชาไทย (Siam Amber)', colorClass: 'bg-orange-500', hex: '#f97316' },
    { id: 'emerald' as const, name: 'เขียวมรกต (Phangnga Emerald)', colorClass: 'bg-emerald-500', hex: '#10b981' },
    { id: 'indigo' as const, name: 'น้ำเงินหลวง (Royal Blue)', colorClass: 'bg-indigo-500', hex: '#6366f1' },
    { id: 'rose' as const, name: 'ชมพูบัวหลวง (Lotus Rose)', colorClass: 'bg-rose-500', hex: '#f43f5e' },
    { id: 'violet' as const, name: 'ม่วงอัญชัน (Violet Amethyst)', colorClass: 'bg-violet-500', hex: '#8b5cf6' }
  ];

  const fontOptions = [
    { id: 'small' as const, name: 'ตัวอักษรเล็ก (Compact)', desc: 'ขนาดกะทัดรัด (14px) เหมาะสำหรับจอมอนิเตอร์ขนาดเล็กหรือความหนาแน่นสูง' },
    { id: 'medium' as const, name: 'ตัวอักษรกลาง (Standard)', desc: 'ขนาดมาตรฐาน (16px) อ่านง่าย สบายตาทั้งมือถือและคอมพิวเตอร์' },
    { id: 'large' as const, name: 'ตัวอักษรใหญ่ (Accessible)', desc: 'ขนาดใหญ่พิเศษ (18px) คมชัด อ่านง่ายสูงสุดสำหรับการนำเสนอหรือผู้สูงอายุ' }
  ];

  const handleApplyChanges = () => {
    onSetUiStyle(localStyle);
    onSetMenuButtonColor(localColor);
    onSetSidebarOpacity(localOpacity);
    onSetFontSize(localFontSize);
    playAppSound('success', soundEnabled);
    
    // Broadcast message
    alert(`ปรับแต่งตกแต่งระบบเรียบร้อย!\n• สไตล์: ${localStyle}\n• ความโปร่งแสงเมนู: ${(localOpacity * 100).toFixed(0)}%\n• โทนสีปุ่ม: ${localColor}\n• ขนาดตัวอักษร: ${localFontSize}`);
  };

  const getOpacityDescription = (opacity: number) => {
    if (opacity >= 0.95) return 'สีทึบ 100% (Solid Base) — ให้ความคมชัดสูง มีความเป็นระเบียบ น่าเชื่อถือสูงแบบมาตรฐาน';
    if (opacity >= 0.7) return 'โปร่งแสงปานกลาง (Semi-Transparent) — ดีไซน์พรีเมียม สบายตา สามารถมองเห็นพื้นหลังด้านหลังได้สลัวๆ';
    if (opacity >= 0.4) return 'โปร่งแสงระดับสูง (Glassmorphism) — สไตล์กระจกฝ้าสุดล้ำ โมเดิร์นมีมิติสวยงาม เหมาะกับวัยรุ่นยุคใหม่';
    return 'โปร่งใสพิเศษ (High Transparency) — แสดงผลโปร่งใสเห็นพื้นหลังชัดเจน สไตล์ Futuristic ล้ำอนาคต';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* View Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Palette className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">เมนูจัดการและตกแต่งเว็บไซต์ (Website Customizer)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ปรับเปลี่ยนดีไซน์ สไตล์ ความโปร่งแสง และสีกราฟิกต่างๆ ของระบบได้เรียลไทม์ พร้อมแบบจำลองทดลองเล่นด้านล่าง
            </p>
          </div>
        </div>
        <button
          onClick={handleApplyChanges}
          className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-md transition duration-200 cursor-pointer text-xs"
        >
          บันทึกและนำไปใช้ทั่วทั้งแอปพลิเคชัน
        </button>
      </div>

      {/* Main Grid: Playground on Left, Controls on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: The requested Interactive Showcase/Playground (แบบทดลองตัวโชว์) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4 shadow-xs relative overflow-hidden flex flex-col h-[650px]">
            
            {/* Header tab */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">แบบทดลองจำลองตัวโชว์ (Live Sidebar Simulator)</span>
              </div>
              <div className="flex space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 block" />
              </div>
            </div>

            {/* Simulated Desktop Window Frame */}
            <div className="flex-1 bg-slate-950 rounded-xl mt-3 overflow-hidden flex relative border border-slate-800/80">
              
              {/* Simulator Background Pattern - to make transparency visible! */}
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
              
              {/* Dynamic Simulated Sidebar (Matching the eevo.team screenshot style) */}
              <div 
                style={{
                  backgroundColor: `rgba(12, 16, 27, ${localOpacity})`,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
                className={`w-52 h-full border-r border-slate-800/60 flex flex-col justify-between p-3.5 z-10 transition-all duration-300 relative ${
                  localStyle === 'slim_rail' ? 'w-16' : ''
                }`}
              >
                {/* macOS traffic light window controls */}
                <div className="flex items-center justify-between shrink-0 mb-5">
                  <div className="flex space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block cursor-pointer hover:opacity-80" onClick={() => playAppSound('click', soundEnabled)} />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block cursor-pointer hover:opacity-80" onClick={() => playAppSound('click', soundEnabled)} />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block cursor-pointer hover:opacity-80" onClick={() => playAppSound('click', soundEnabled)} />
                  </div>
                  {localStyle !== 'slim_rail' && (
                    <span className="text-[10px] font-extrabold text-slate-500 tracking-wider font-mono">eevo.team</span>
                  )}
                </div>

                {/* Simulated Content Area */}
                {localStyle === 'slim_rail' ? (
                  /* Slim icon rail simulation */
                  <div className="flex-1 flex flex-col items-center space-y-4 pt-4">
                    <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center cursor-pointer shadow-md"><LayoutDashboard className="w-4 h-4" /></div>
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer hover:bg-slate-700"><Settings className="w-4 h-4" /></div>
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer hover:bg-slate-700"><User className="w-4 h-4" /></div>
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer hover:bg-slate-700"><Volume2 className="w-4 h-4" /></div>
                  </div>
                ) : (
                  /* Standard / eevo_sleek simulation */
                  <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar text-left text-slate-300 select-none">
                    
                    {/* Activity Section */}
                    <div className="space-y-1">
                      <button 
                        onClick={() => {
                          setIsActivityExpanded(!isActivityExpanded);
                          playAppSound('click', soundEnabled);
                        }}
                        className="w-full flex items-center justify-between px-1.5 py-1 text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer border-none bg-transparent"
                      >
                        <span>ACTIVITY</span>
                        {isActivityExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>

                      {isActivityExpanded && (
                        <div className="space-y-0.5 pl-1.5">
                          {/* Overview item */}
                          <button
                            onClick={() => {
                              setSelectedSimTab('overview');
                              playAppSound('click', soundEnabled);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-none transition ${
                              selectedSimTab === 'overview'
                                ? 'bg-slate-800/80 text-white'
                                : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${overviewDot} animate-pulse`} />
                              <span>Overview</span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.2 bg-violet-500/15 text-violet-400 rounded-full font-bold border border-violet-500/20">ใหม่</span>
                          </button>

                          {/* Analytics item */}
                          <button
                            onClick={() => {
                              setSelectedSimTab('analytics');
                              playAppSound('click', soundEnabled);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-none transition ${
                              selectedSimTab === 'analytics'
                                ? 'bg-slate-800/80 text-white'
                                : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${analyticsDot}`} />
                              <span>Analytics</span>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.2 bg-pink-500/15 text-pink-400 rounded-full font-bold border border-pink-500/20">สถิติ</span>
                          </button>

                          {/* Projects item */}
                          <button
                            onClick={() => {
                              setSelectedSimTab('projects');
                              playAppSound('click', soundEnabled);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-none transition ${
                              selectedSimTab === 'projects'
                                ? 'bg-slate-800/80 text-white'
                                : 'hover:bg-slate-900/40 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className={`w-2 h-2 rounded-full ${projectsDot}`} />
                              <span>Projects</span>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* System Settings Section */}
                    <div className="space-y-1">
                      <button 
                        onClick={() => {
                          setIsSystemExpanded(!isSystemExpanded);
                          playAppSound('click', soundEnabled);
                        }}
                        className="w-full flex items-center justify-between px-1.5 py-1 text-slate-500 hover:text-slate-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer border-none bg-transparent"
                      >
                        <span>SYSTEM</span>
                        {isSystemExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>

                      {isSystemExpanded && (
                        <div className="space-y-0.5 pl-1.5">
                          <div className="px-2 py-1.5 text-[11px] text-slate-500 flex items-center space-x-2">
                            <Settings className="w-3.5 h-3.5 text-slate-400" />
                            <span>Database: Active</span>
                          </div>
                          <div className="px-2 py-1.5 text-[11px] text-slate-500 flex items-center space-x-2">
                            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Voice Alerts: ON</span>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* Simulated Footer */}
                {localStyle !== 'slim_rail' && (
                  <div className="border-t border-slate-800/40 pt-3 text-center shrink-0">
                    <p className="text-[10px] font-bold text-slate-400">สำนักงานวัฒนธรรมจังหวัด</p>
                    <p className="text-[8px] text-slate-500 mt-0.5">e-Fleet Phangnga</p>
                  </div>
                )}
              </div>

              {/* Simulated Screen Content on Right */}
              <div className="flex-1 flex flex-col p-6 text-slate-100 h-full overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-slate-800 px-2 py-1 rounded-md text-slate-400">Page</span>
                    <span className="text-xs font-bold text-white capitalize">{selectedSimTab}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Online</span>
                </div>

                <div className="mt-5 space-y-4 text-left">
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/40">
                    <h4 className="text-xs font-bold text-slate-300">ทดสอบเปลี่ยนสีกระดุม (Dot Indicators)</h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      คลิกเพื่อทดสอบเปลี่ยนสีจุดกลมเล็กๆ ในเมนูจำลอง เพื่อดีไซน์สีที่คุณถูกใจสูงสุด
                    </p>
                    
                    {/* Dot color controls */}
                    <div className="flex flex-col gap-2 mt-3.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Overview Dot:</span>
                        <div className="flex space-x-1.5">
                          {['bg-violet-500', 'bg-indigo-500', 'bg-orange-500', 'bg-emerald-500', 'bg-rose-500'].map((dot) => (
                            <button 
                              key={dot}
                              onClick={() => { setOverviewDot(dot); playAppSound('click', soundEnabled); }}
                              className={`w-3.5 h-3.5 rounded-full ${dot} border-2 border-transparent hover:scale-110 cursor-pointer ${overviewDot === dot ? 'border-white' : ''}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Analytics Dot:</span>
                        <div className="flex space-x-1.5">
                          {['bg-pink-500', 'bg-purple-500', 'bg-amber-500', 'bg-blue-500', 'bg-teal-500'].map((dot) => (
                            <button 
                              key={dot}
                              onClick={() => { setAnalyticsDot(dot); playAppSound('click', soundEnabled); }}
                              className={`w-3.5 h-3.5 rounded-full ${dot} border-2 border-transparent hover:scale-110 cursor-pointer ${analyticsDot === dot ? 'border-white' : ''}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Projects Dot:</span>
                        <div className="flex space-x-1.5">
                          {['bg-rose-500', 'bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-cyan-500'].map((dot) => (
                            <button 
                              key={dot}
                              onClick={() => { setProjectsDot(dot); playAppSound('click', soundEnabled); }}
                              className={`w-3.5 h-3.5 rounded-full ${dot} border-2 border-transparent hover:scale-110 cursor-pointer ${projectsDot === dot ? 'border-white' : ''}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-800/20 text-center space-y-1">
                    <p className="text-[11px] text-slate-400 font-bold">ผลลัพธ์ของความโปร่งแสงไล่ระดับ</p>
                    <p className="text-[15px] font-bold text-white">{(localOpacity * 100).toFixed(0)}% Opacity</p>
                    <p className="text-[9px] text-slate-500">{getOpacityDescription(localOpacity)}</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Actual Settings & Customizer Options */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Choose Theme & Layout Style */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-orange-500" />
              1. เลือกสไตล์เมนูบาร์ด้านซ้าย (Sidebar Style Template)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {styleOptions.map((opt) => {
                const isSelected = localStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setLocalStyle(opt.id);
                      onSetUiStyle(opt.id);
                      playAppSound('click', soundEnabled);
                    }}
                    className={`p-4 rounded-xl border text-left transition duration-300 relative flex flex-col justify-between cursor-pointer min-h-[110px] ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{opt.name}</h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${opt.badgeColor}`}>
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Opacity Slider (REGULATE OPACITY SOLID TO TRANSPARENT) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-orange-500" />
              2. ปรับระดับความทึบแสง - โปร่งใส (Solid to Transparent Regulator)
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              สอดคล้องกับภาพต้นแบบที่คุณส่งมา คุณสามารถปรับเลื่อนไล่ระดับจากสีทึบสนิท (100%) จนเป็นกระจกโปร่งแสงใส (Glassmorphic) 
              เพื่อให้กลมกลืนกับดีไซน์เว็บที่มีชีวิตชีวา
            </p>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">ระดับความทึบแสง (Opacity Percentage)</span>
                <span className="text-sm font-extrabold text-orange-500">{(localOpacity * 100).toFixed(0)}%</span>
              </div>

              <input
                type="range"
                min="0.10"
                max="1.00"
                step="0.05"
                value={localOpacity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setLocalOpacity(val);
                  onSetSidebarOpacity(val);
                  playAppSound('type', soundEnabled);
                }}
                className="w-full accent-orange-500 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400">
                <span>โปร่งใสสูงสุด (10% Transparent)</span>
                <span>ทึบสีเข้ม (100% Solid Opaque)</span>
              </div>

              <div className="border-t border-slate-200/40 dark:border-slate-800 pt-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  <span className="font-bold text-slate-700 dark:text-slate-200">สถานะปัจจุบัน: </span>
                  {getOpacityDescription(localOpacity)}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Select Menu Hover / Accent Color */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Grid className="w-4.5 h-4.5 text-orange-500" />
              3. สีตกแต่งสำหรับไอคอนและปุ่มกด (Active Menu Theme Color)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {colorOptions.map((opt) => {
                const isSelected = localColor === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setLocalColor(opt.id);
                      onSetMenuButtonColor(opt.id);
                      playAppSound('success', soundEnabled);
                    }}
                    className={`p-3 rounded-xl border flex items-center space-x-2.5 text-left transition duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${opt.colorClass} shrink-0 ring-2 ring-white dark:ring-slate-900 shadow-sm`} />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{opt.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Font Size regulator */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Type className="w-4.5 h-4.5 text-orange-500" />
              4. ขนาดตัวอักษรของระบบ (Font Scale Adjuster)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {fontOptions.map((opt) => {
                const isSelected = localFontSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setLocalFontSize(opt.id);
                      onSetFontSize(opt.id);
                      playAppSound('click', soundEnabled);
                    }}
                    className={`p-4 rounded-xl border text-left transition duration-200 relative flex flex-col justify-between cursor-pointer min-h-[90px] ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{opt.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">ตรวจสอบความเรียบร้อยก่อนบันทึก</h4>
              <p className="text-[10px] text-slate-500 mt-1">
                การกดปุ่มด้านขวาจะทำการปรับแต่งธีม ระบบสี และความโปร่งแสงของเมนูข้างทั่วทั้งเว็บไซต์ทันที
              </p>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  setLocalStyle(uiStyle);
                  setLocalColor(menuButtonColor);
                  setLocalOpacity(sidebarOpacity);
                  setLocalFontSize(fontSize);
                  playAppSound('click', soundEnabled);
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                รีเซ็ตค่ากลับคืน
              </button>
              
              <button
                onClick={handleApplyChanges}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition duration-200 cursor-pointer"
              >
                บันทึกและติดตั้งทั่วทั้งแอป
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
