import React, { useState } from 'react';
import {
  Users,
  X,
  FileSpreadsheet,
  AlertCircle,
  Check,
  Plus,
  Trash2,
  Download,
  Info,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { User, UserRole, MenuKey } from '../types';
import { DEPARTMENTS, DEFAULT_ROLE_MENUS } from '../data/mockData';

interface BulkAddUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkAdd: (users: Omit<User, 'id'>[]) => void;
  existingUsers: User[];
}

interface ParsedUserRow {
  username: string;
  name: string;
  password?: string;
  position: string;
  department: string;
  role: UserRole;
  phone?: string;
  email?: string;
  error?: string;
}

const SAMPLE_CSV = `ชื่อ-นามสกุล,ชื่อผู้ใช้ (Username),รหัสผ่าน,ตำแหน่ง,กลุ่มงาน/ฝ่าย,บทบาท (admin/director/officer/driver),เบอร์โทร,อีเมล
นายสมชาย ใจดี,somchai,somchai123,นักวิชาการวัฒนธรรมชำนาญการ,กลุ่มยุทธศาสตร์และเฝ้าระวังทางวัฒนธรรม,officer,0812345678,somchai@culture.go.th
นางสาววันดี มีสุข,wandee,wandee123,นักจัดการงานทั่วไปปฏิบัติการ,กลุ่มอำนวยการ,officer,0898765432,wandee@culture.go.th
นายสุรชัย มั่นคง,surachai,surachai123,พนักงานขับรถยนต์,กลุ่มอำนวยการ,driver,0823456789,driver.surachai@gmail.com`;

export const BulkAddUsersModal: React.FC<BulkAddUsersModalProps> = ({
  isOpen,
  onClose,
  onBulkAdd,
  existingUsers
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'manual'>('text');
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  // Manual grid entry rows
  const [manualRows, setManualRows] = useState<ParsedUserRow[]>([
    {
      name: '',
      username: '',
      password: '',
      position: 'นักวิชาการวัฒนธรรมปฏิบัติการ',
      department: DEPARTMENTS[0],
      role: 'officer',
      phone: '',
      email: ''
    },
    {
      name: '',
      username: '',
      password: '',
      position: 'พนักงานขับรถยนต์',
      department: 'กลุ่มอำนวยการ',
      role: 'driver',
      phone: '',
      email: ''
    }
  ]);

  if (!isOpen) return null;

  // Map text role to valid UserRole
  const normalizeRole = (r: string): UserRole => {
    const clean = (r || '').trim().toLowerCase();
    if (clean.includes('admin') || clean.includes('แอดมิน') || clean.includes('ผู้ดูแล')) return 'admin';
    if (clean.includes('director') || clean.includes('ผอ') || clean.includes('ผู้บริหาร')) return 'director';
    if (clean.includes('driver') || clean.includes('ขับรถ') || clean.includes('คนขับ')) return 'driver';
    return 'officer';
  };

  const normalizeDepartment = (d: string): string => {
    const clean = (d || '').trim();
    const found = DEPARTMENTS.find((dep) => dep.includes(clean) || clean.includes(dep));
    return found || clean || DEPARTMENTS[0];
  };

  // Parse CSV or Tab-separated text (from Excel)
  const handleParseText = () => {
    if (!rawText.trim()) return;

    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const existingUsernames = new Set(existingUsers.map((u) => u.username.toLowerCase()));
    const seenUsernames = new Set<string>();

    const rows: ParsedUserRow[] = [];

    lines.forEach((line, index) => {
      // Skip header line if detected
      if (
        index === 0 &&
        (line.includes('ชื่อ-นามสกุล') ||
          line.includes('Username') ||
          line.includes('ชื่อผู้ใช้') ||
          line.includes('บทบาท'))
      ) {
        return;
      }

      // Detect separator: Tab, comma, or semicolon
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(',')) {
        parts = line.split(',');
      } else if (line.includes(';')) {
        parts = line.split(';');
      } else {
        // Space separated fallback
        parts = line.split(/\s{2,}/);
      }

      parts = parts.map((p) => p.trim().replace(/^["']|["']$/g, ''));

      if (parts.length < 2) return;

      const name = parts[0] || '';
      let username = (parts[1] || '').trim();

      // Auto-generate username from name or prefix if empty
      if (!username && name) {
        username = `user_${Date.now().toString().slice(-4)}_${index}`;
      }

      const password = parts[2] || `${username}123`;
      const position = parts[3] || 'นักวิชาการวัฒนธรรมปฏิบัติการ';
      const department = normalizeDepartment(parts[4] || '');
      const role = normalizeRole(parts[5] || '');
      const phone = parts[6] || '';
      const email = parts[7] || '';

      let error = '';
      if (!name) {
        error = 'กรุณาระบุชื่อ-นามสกุล';
      } else if (!username) {
        error = 'กรุณาระบุชื่อผู้ใช้ (Username)';
      } else if (existingUsernames.has(username.toLowerCase())) {
        error = `ชื่อผู้ใช้ "${username}" มีอยู่ในระบบแล้ว`;
      } else if (seenUsernames.has(username.toLowerCase())) {
        error = `ชื่อผู้ใช้ "${username}" ซ้ำกันในรายการ`;
      }

      if (username) seenUsernames.add(username.toLowerCase());

      rows.push({
        name,
        username,
        password,
        position,
        department,
        role,
        phone,
        email,
        error
      });
    });

    setParsedRows(rows);
    setHasParsed(true);
  };

  // Add row to manual grid
  const handleAddManualRow = () => {
    setManualRows((prev) => [
      ...prev,
      {
        name: '',
        username: '',
        password: '',
        position: 'นักวิชาการวัฒนธรรมปฏิบัติการ',
        department: DEPARTMENTS[0],
        role: 'officer',
        phone: '',
        email: ''
      }
    ]);
  };

  // Remove row from manual grid
  const handleRemoveManualRow = (index: number) => {
    setManualRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Update field in manual row
  const handleUpdateManualRow = (index: number, field: keyof ParsedUserRow, value: any) => {
    setManualRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated = { ...row, [field]: value };
        // If name changes and username is empty, suggest username
        if (field === 'name' && !row.username && value) {
          const suggested = (value as string)
            .replace(/^(นาย|นางสาว|นาง|ดร\.)\s*/, '')
            .trim()
            .split(' ')[0]
            .toLowerCase();
          if (/^[a-zA-Z0-9_]+$/.test(suggested)) {
            updated.username = suggested;
          }
        }
        return updated;
      })
    );
  };

  // Submit bulk creation
  const handleSubmit = () => {
    const sourceRows = activeTab === 'text' ? parsedRows : manualRows;
    const validRows = sourceRows.filter((r) => r.name.trim() && r.username.trim() && !r.error);

    if (validRows.length === 0) {
      alert('ไม่พบข้อมูลผู้ใช้งานที่ถูกต้อง กรุณาตรวจสอบชื่อและชื่อผู้ใช้');
      return;
    }

    const newUsers: Omit<User, 'id'>[] = validRows.map((r) => {
      const allowedMenus = [...(DEFAULT_ROLE_MENUS[r.role] || DEFAULT_ROLE_MENUS.officer)];
      return {
        name: r.name.trim(),
        username: r.username.trim().toLowerCase(),
        password: r.password?.trim() || `${r.username.trim().toLowerCase()}123`,
        position: r.position.trim() || 'นักวิชาการวัฒนธรรมปฏิบัติการ',
        department: r.department || DEPARTMENTS[0],
        role: r.role,
        roleTitle: r.role === 'admin' ? 'ผู้ดูแลระบบและยานพาหนะ (Admin)' : r.role === 'director' ? 'ผู้อำนวยการสำนักงาน' : r.role === 'driver' ? 'พนักงานขับรถยนต์' : 'เจ้าหน้าที่ผู้ขอใช้รถ',
        phone: r.phone?.trim() || '',
        email: r.email?.trim() || '',
        status: 'active',
        allowedMenus
      };
    });

    onBulkAdd(newUsers);
    onClose();
  };

  // Download template
  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_users_mculture_phangnga.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validCount = (activeTab === 'text' ? parsedRows : manualRows).filter(
    (r) => r.name.trim() && r.username.trim() && !r.error
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Users className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold">เพิ่มผู้ใช้งานหลายคนพร้อมกัน (Bulk Import)</h3>
              <p className="text-xs text-purple-200">
                นำเข้าข้อมูลจาก Excel / CSV หรือกรอกลงในตารางทีละหลายคนได้อย่างรวดเร็ว
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/80">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'text'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>วางจาก Excel / CSV</span>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'manual'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>กรอกในตาราง ({manualRows.length} รายการ)</span>
            </button>
          </div>

          <button
            onClick={handleDownloadSample}
            className="text-xs text-purple-700 hover:text-purple-800 font-medium flex items-center space-x-1 hover:underline cursor-pointer"
            title="ดาวน์โหลดไฟล์ตัวอย่าง CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลดไฟล์ตัวอย่าง (.csv)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'text' ? (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <span className="font-bold">วิธีใช้งาน:</span>
                  <p>
                    คัดลอก (Copy) ข้อมูลจากไฟล์ Excel หรือ Google Sheets แล้วนำมาวาง (Paste) ลงในช่องด้านล่างได้ทันที โดยจัดเรียงคอลัมน์ตามลำดับ:
                  </p>
                  <code className="block bg-amber-100/70 px-2 py-1 rounded text-amber-950 font-mono text-[11px]">
                    ชื่อ-นามสกุล [Tab] ชื่อผู้ใช้ (Username) [Tab] รหัสผ่าน [Tab] ตำแหน่ง [Tab] กลุ่มงาน [Tab] บทบาท (officer/driver/director/admin) [Tab] เบอร์โทร [Tab] อีเมล
                  </code>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">วางข้อความจาก Excel / CSV ที่นี่:</label>
                  <button
                    onClick={() => setRawText(SAMPLE_CSV)}
                    className="text-[11px] text-purple-600 hover:text-purple-700 font-semibold hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>ใช้ข้อมูลตัวอย่างทดสอบ</span>
                  </button>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    setHasParsed(false);
                  }}
                  placeholder="วางข้อมูลจาก Excel ที่คัดลอกมาที่นี่..."
                  rows={6}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-start">
                <button
                  onClick={handleParseText}
                  disabled={!rawText.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>ตรวจสอบและประมวลผลข้อมูล</span>
                </button>
              </div>

              {/* Parsed Preview Table */}
              {hasParsed && (
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <span>ผลการตรวจสอบข้อมูล ({parsedRows.length} รายการ)</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                        ผ่าน {validCount} รายการ
                      </span>
                    </h4>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">ชื่อ-นามสกุล</th>
                          <th className="py-2 px-3">Username</th>
                          <th className="py-2 px-3">ตำแหน่ง</th>
                          <th className="py-2 px-3">กลุ่มงาน</th>
                          <th className="py-2 px-3">บทบาท</th>
                          <th className="py-2 px-3">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((r, i) => (
                          <tr key={i} className={r.error ? 'bg-rose-50/70' : 'hover:bg-slate-50'}>
                            <td className="py-2 px-3 text-slate-400 text-[11px]">{i + 1}</td>
                            <td className="py-2 px-3 font-medium text-slate-900">{r.name}</td>
                            <td className="py-2 px-3 font-mono text-purple-700">{r.username}</td>
                            <td className="py-2 px-3 text-slate-600">{r.position}</td>
                            <td className="py-2 px-3 text-slate-600 truncate max-w-[150px]">{r.department}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-800 uppercase">
                                {r.role}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {r.error ? (
                                <span className="text-[11px] text-rose-600 flex items-center space-x-1 font-medium">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  <span>{r.error}</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-emerald-600 flex items-center space-x-1 font-medium">
                                  <Check className="w-3 h-3" />
                                  <span>พร้อมนำเข้า</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Manual Grid Entry */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  กรอกข้อมูลผู้ใช้งานลงในแต่ละแถวได้พร้อมกันหลายราย:
                </p>
                <button
                  onClick={handleAddManualRow}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มแถวใหม่</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3 min-w-[160px]">ชื่อ-นามสกุล *</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Username *</th>
                      <th className="py-2.5 px-3 min-w-[120px]">รหัสผ่าน</th>
                      <th className="py-2.5 px-3 min-w-[150px]">ตำแหน่ง</th>
                      <th className="py-2.5 px-3 min-w-[180px]">กลุ่มงาน/ฝ่าย</th>
                      <th className="py-2.5 px-3 min-w-[110px]">บทบาท</th>
                      <th className="py-2.5 px-3 min-w-[110px]">เบอร์โทร</th>
                      <th className="py-2.5 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {manualRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 text-slate-400 text-[11px]">{i + 1}</td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleUpdateManualRow(i, 'name', e.target.value)}
                            placeholder="นาย..."
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={row.username}
                            onChange={(e) => handleUpdateManualRow(i, 'username', e.target.value)}
                            placeholder="username"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono focus:ring-1 focus:ring-purple-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={row.password}
                            onChange={(e) => handleUpdateManualRow(i, 'password', e.target.value)}
                            placeholder="เว้นว่างใช้ค่าเริ่ม"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={row.position}
                            onChange={(e) => handleUpdateManualRow(i, 'position', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={row.department}
                            onChange={(e) => handleUpdateManualRow(i, 'department', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                          >
                            {DEPARTMENTS.map((dept) => (
                              <option key={dept} value={dept}>
                                {dept}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={row.role}
                            onChange={(e) => handleUpdateManualRow(i, 'role', e.target.value as UserRole)}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white font-medium"
                          >
                            <option value="officer">เจ้าหน้าที่</option>
                            <option value="driver">คนขับรถ</option>
                            <option value="director">ผู้บริหาร</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={row.phone || ''}
                            onChange={(e) => handleUpdateManualRow(i, 'phone', e.target.value)}
                            placeholder="08X-XXX-XXXX"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          {manualRows.length > 1 && (
                            <button
                              onClick={() => handleRemoveManualRow(i)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer rounded"
                              title="ลบแถวนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {validCount > 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>พร้อมนำเข้าทั้งหมด {validCount} ท่าน</span>
              </span>
            ) : (
              <span>ระบุข้อมูลให้ถูกต้องก่อนกดยืนยัน</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={validCount === 0}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-purple-600/20 flex items-center space-x-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>บันทึกเพิ่มผู้ใช้งานทั้งหมด ({validCount} คน)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
