import React from 'react';
import { User, MenuKey } from '../types';
import {
  LayoutDashboard,
  Calendar,
  FilePlus,
  Fuel,
  BarChart3,
  Navigation,
  ShieldCheck,
  X,
  Car,
  ChevronRight,
  Wrench,
  Users,
  Sliders,
  Gauge,
  LogOut,
  Database
} from 'lucide-react';
import { getUserAllowedMenus } from '../data/mockData';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  currentUser,
  onLogout
}) => {
  const allowedMenus = getUserAllowedMenus(currentUser);
  const canAccessDirector = allowedMenus.includes('director');
  const canAccessUsers = allowedMenus.includes('users') || currentUser.role === 'admin';

  const menuItems = [
    {
      id: 'dashboard',
      label: 'หน้าหลักภาพรวม (Dashboard)',
      desc: 'สถานะคำขอและข้อมูลสรุปยานพาหนะ',
      icon: LayoutDashboard,
      color: 'text-orange-400 bg-orange-500/10'
    },
    {
      id: 'calendar',
      label: 'ปฏิทินตารางภารกิจราชการ',
      desc: 'ตารางนัดหมายและการใช้รถประจำวัน',
      icon: Calendar,
      color: 'text-blue-400 bg-blue-500/10'
    },
    {
      id: 'booking',
      label: 'เขียนใบเบิกใช้รถราชการ',
      desc: 'สร้างคำขอใหม่/ร่างใบคำขอขอใช้รถยนต์ส่วนกลาง',
      icon: FilePlus,
      color: 'text-emerald-400 bg-emerald-500/10'
    },
    {
      id: 'driver_mission',
      label: 'ภารกิจคนขับ & ทะเบียนคุม',
      desc: 'เริ่มงาน กรอกไมล์ไป-กลับ ลงคุมพัสดุ',
      icon: Gauge,
      color: 'text-amber-400 bg-amber-500/10'
    },
    {
      id: 'asset_inspection',
      label: 'พัสดุตรวจรับรถเสร็จสิ้นภารกิจ',
      desc: 'ตรวจรับรถ คุมไมล์ ลงลายเซ็นในใบบันทึก',
      icon: ShieldCheck,
      color: 'text-emerald-400 bg-emerald-500/10'
    },
    {
      id: 'fuel',
      label: 'บันทึกไมล์และเชื้อเพลิง',
      desc: 'เลขไมล์ ค่าน้ำมัน ตรวจสภาพรถ',
      icon: Fuel,
      color: 'text-teal-400 bg-teal-500/10'
    },
    {
      id: 'fleet',
      label: 'บำรุงรักษา & งานทะเบียนรถ',
      desc: 'ภาษี พ.ร.บ. ประกันภัย ประวัติซ่อม',
      icon: Wrench,
      color: 'text-cyan-400 bg-cyan-500/10'
    },
    {
      id: 'analytics',
      label: 'รายงานสถิติและส่งออก',
      desc: 'สรุปงบประมาณ สถิติประจำเดือน CSV',
      icon: BarChart3,
      color: 'text-amber-400 bg-amber-500/10'
    },
    {
      id: 'tracking',
      label: 'ติดตาม GPS รถ (Live Fleet)',
      desc: 'จำลองเส้นทางพิกัดและความเร็วรถ',
      icon: Navigation,
      color: 'text-purple-400 bg-purple-500/10'
    },
    {
      id: 'backup',
      label: 'สำรอง & กู้คืนข้อมูล (Backup)',
      desc: 'ดาวน์โหลด JSON และนำเข้ากู้คืนข้อมูล',
      icon: Database,
      color: 'text-sky-400 bg-sky-500/10'
    }
  ].filter((item) => allowedMenus.includes(item.id as MenuKey));

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-80 bg-slate-900 text-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img
              src="/logo_mculture.svg"
              alt="ตรากระทรวงวัฒนธรรม"
              className="w-10 h-12 object-contain drop-shadow-md shrink-0"
            />
            <div>
              <h2 className="font-bold text-sm tracking-wide text-white">สนง.วัฒนธรรมจังหวัดพังงา</h2>
              <p className="text-[11px] text-slate-400">ระบบบริหารยานพาหนะราชการ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current User Card */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[11px] text-orange-400 font-medium truncate">
                {currentUser.roleTitle}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser.department}</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-grow p-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left group ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-md font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-white/20 text-white' : item.color
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium leading-none">{item.label}</div>
                    <div
                      className={`text-[10px] mt-1 ${
                        isActive ? 'text-orange-100' : 'text-slate-400'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 opacity-50 transition-transform ${
                    isActive ? 'opacity-100 translate-x-0.5' : 'group-hover:translate-x-0.5'
                  }`}
                />
              </button>
            );
          })}

          {/* Director Approval Tab (Only if allowed) */}
          {canAccessDirector && (
            <div className="pt-2">
              <div className="text-[10px] font-bold uppercase text-teal-400 px-3 py-1">
                สำหรับผู้บริหาร
              </div>
              <button
                onClick={() => {
                  onSelectTab('director');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left group border ${
                  activeTab === 'director'
                    ? 'bg-teal-700 text-white border-teal-500 shadow-md font-semibold'
                    : 'bg-teal-950/40 text-teal-200 border-teal-800/40 hover:bg-teal-900/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold leading-none">แผงอนุมัติผู้บริหาร</div>
                    <div className="text-[10px] text-teal-300/80 mt-1">
                      พิจารณาลงนามและสั่งการใบเบิก
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* User Management Tab (Only for Admin or users with 'users' menu permission) */}
          {canAccessUsers && (
            <div className="pt-2">
              <div className="text-[10px] font-bold uppercase text-purple-400 px-3 py-1">
                การตั้งค่าระบบและสิทธิ์
              </div>
              <button
                onClick={() => {
                  onSelectTab('users');
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left group border ${
                  activeTab === 'users'
                    ? 'bg-purple-700 text-white border-purple-500 shadow-md font-semibold'
                    : 'bg-purple-950/40 text-purple-200 border-purple-800/40 hover:bg-purple-900/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold leading-none">จัดการผู้ใช้งาน & สิทธิ์</div>
                    <div className="text-[10px] text-purple-300/80 mt-1">
                      เพิ่ม/ลบ/แก้ไข และกำหนดสิทธิ์เมนู
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* User Status & Logout in Sidebar */}
        <div className="p-3 mx-3 my-2 rounded-2xl bg-slate-800/80 border border-slate-700/60">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-1 ring-orange-400/40">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-orange-400 truncate">{currentUser.roleTitle}</div>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-center space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            สำนักงานวัฒนธรรมจังหวัดพังงา
          </div>
          <div className="text-[10px] text-slate-500">
            โทร. 0 7648 1596 | e-Service Platform
          </div>
        </div>
      </aside>
    </>
  );
};
