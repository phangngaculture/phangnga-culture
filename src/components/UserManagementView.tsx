import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  RefreshCw,
  Phone,
  Mail,
  Building,
  UserCheck,
  UserX,
  Sparkles,
  LayoutDashboard,
  Calendar,
  FilePlus,
  Fuel,
  Wrench,
  BarChart3,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Sliders,
  ChevronRight,
  Gauge,
  Camera,
  Database,
  PenTool,
  FileSpreadsheet
} from 'lucide-react';
import { User, UserRole, MenuKey, MenuDefinition } from '../types';
import { APP_MENUS, DEFAULT_ROLE_MENUS, DEPARTMENTS, getUserAllowedMenus } from '../data/mockData';
import { ProfilePhotoModal } from './ProfilePhotoModal';
import { BulkAddUsersModal } from './BulkAddUsersModal';
import { UserSignatureModal } from './UserSignatureModal';

interface UserManagementViewProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onBulkAddUsers?: (newUsers: Omit<User, 'id'>[]) => void;
  onUpdateUser: (id: string, data: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  onSwitchUser?: (user: User) => void;
}

const MENU_ICONS: Record<MenuKey, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  calendar: Calendar,
  booking: FilePlus,
  driver_mission: Gauge,
  asset_register: FileSpreadsheet,
  director: ShieldCheck,
  asset_inspection: ShieldCheck,
  fuel: Fuel,
  fleet: Wrench,
  analytics: BarChart3,
  tracking: Navigation,
  backup: Database,
  users: Users
};

const ROLE_LABELS: Record<UserRole, { label: string; title: string; color: string; bg: string; border: string }> = {
  admin: {
    label: 'ผู้ดูแลระบบ (Admin)',
    title: 'ผู้ดูแลระบบและยานพาหนะ (Admin)',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-300'
  },
  director: {
    label: 'ผู้บริหาร (Director)',
    title: 'ผู้อำนวยการสำนักงาน (Director)',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-300'
  },
  officer: {
    label: 'เจ้าหน้าที่ (Officer)',
    title: 'เจ้าหน้าที่ผู้ขอใช้รถ',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-300'
  },
  driver: {
    label: 'พนักงานขับรถ (Driver)',
    title: 'พนักงานขับรถราชการประจำคัน',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-300'
  }
};

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  currentUser,
  onAddUser,
  onBulkAddUsers,
  onUpdateUser,
  onDeleteUser,
  onSwitchUser
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [permissionTargetUser, setPermissionTargetUser] = useState<User | null>(null);
  const [photoModalUser, setPhotoModalUser] = useState<User | null>(null);
  const [signatureModalUser, setSignatureModalUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    position: '',
    department: DEPARTMENTS[0],
    role: 'officer' as UserRole,
    phone: '',
    email: '',
    avatarUrl: '',
    status: 'active' as 'active' | 'inactive',
    allowedMenus: ['dashboard', 'calendar', 'booking', 'tracking'] as MenuKey[]
  });

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery));

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || (u.status || 'active') === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Role Counts
  const stats = useMemo(() => {
    return {
      total: users.length,
      admin: users.filter((u) => u.role === 'admin').length,
      director: users.filter((u) => u.role === 'director').length,
      officer: users.filter((u) => u.role === 'officer').length,
      driver: users.filter((u) => u.role === 'driver').length,
      active: users.filter((u) => (u.status || 'active') === 'active').length
    };
  }, [users]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      position: 'นักวิชาการวัฒนธรรมปฏิบัติการ',
      department: DEPARTMENTS[0],
      role: 'officer',
      phone: '',
      email: '',
      avatarUrl: '',
      status: 'active',
      allowedMenus: [...DEFAULT_ROLE_MENUS.officer]
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: User) => {
    setEditingUserId(user.id);
    const userMenus = getUserAllowedMenus(user);
    setFormData({
      username: user.username,
      password: user.password || (user.username === 'admin' ? 'dekcom2537' : `${user.username}123`),
      name: user.name,
      position: user.position,
      department: user.department,
      role: user.role,
      phone: user.phone || '',
      email: user.email || '',
      avatarUrl: user.avatarUrl || '',
      status: user.status || 'active',
      allowedMenus: [...userMenus]
    });
    setIsAddEditModalOpen(true);
  };

  // Open Quick Permission Modal
  const handleOpenPermissionModal = (user: User) => {
    setPermissionTargetUser(user);
  };

  // Form Role Change -> Apply default role preset
  const handleRoleChange = (newRole: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      allowedMenus: [...(DEFAULT_ROLE_MENUS[newRole] || ['dashboard', 'booking'])]
    }));
  };

  // Toggle Menu in Add/Edit Form
  const handleToggleMenu = (menuId: MenuKey) => {
    setFormData((prev) => {
      const exists = prev.allowedMenus.includes(menuId);
      if (exists) {
        return {
          ...prev,
          allowedMenus: prev.allowedMenus.filter((m) => m !== menuId)
        };
      } else {
        return {
          ...prev,
          allowedMenus: [...prev.allowedMenus, menuId]
        };
      }
    });
  };

  // Save Add/Edit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุล และชื่อผู้ใช้งาน (Username)');
      return;
    }

    const roleInfo = ROLE_LABELS[formData.role];

    if (editingUserId) {
      onUpdateUser(editingUserId, {
        username: formData.username.trim(),
        password: formData.password.trim() || (formData.username.trim() === 'admin' ? 'dekcom2537' : `${formData.username.trim()}123`),
        name: formData.name.trim(),
        position: formData.position.trim(),
        department: formData.department,
        role: formData.role,
        roleTitle: roleInfo.title,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        avatarUrl: formData.avatarUrl,
        status: formData.status,
        allowedMenus: formData.allowedMenus
      });
    } else {
      // Check username duplicate
      const duplicate = users.some((u) => u.username.toLowerCase() === formData.username.trim().toLowerCase());
      if (duplicate) {
        alert(`ชื่อผู้ใช้งาน "${formData.username.trim()}" มีอยู่ในระบบแล้ว กรุณาเลือกชื่ออื่น`);
        return;
      }

      onAddUser({
        username: formData.username.trim(),
        password: formData.password.trim() || `${formData.username.trim()}123`,
        name: formData.name.trim(),
        position: formData.position.trim(),
        department: formData.department,
        role: formData.role,
        roleTitle: roleInfo.title,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        avatarUrl: formData.avatarUrl,
        status: formData.status,
        allowedMenus: formData.allowedMenus
      });
    }

    setIsAddEditModalOpen(false);
  };

  // Toggle Menu for Quick Permission Modal
  const handleToggleQuickPermission = (menuId: MenuKey) => {
    if (!permissionTargetUser) return;
    const currentMenus = getUserAllowedMenus(permissionTargetUser);
    const exists = currentMenus.includes(menuId);
    let updated: MenuKey[];
    if (exists) {
      updated = currentMenus.filter((m) => m !== menuId);
    } else {
      updated = [...currentMenus, menuId];
    }
    onUpdateUser(permissionTargetUser.id, { allowedMenus: updated });
    setPermissionTargetUser((prev) => (prev ? { ...prev, allowedMenus: updated } : null));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-purple-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30">
              <Shield className="w-3.5 h-3.5" />
              <span>การบริหารสิทธิ์ระดับผู้ดูแลระบบ (Admin Role & Permissions)</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              จัดการผู้ใช้งาน & กำหนดสิทธิ์เข้าถึงเมนู
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ผู้ดูแลระบบสามารถ เพิ่ม ลบ แก้ไข ข้อมูลผู้ใช้งาน และเลือกติ๊กกำหนดสิทธิ์การมองเห็น/ใช้งานแต่ละเมนูให้แก่เจ้าหน้าที่แต่ละรายได้อย่างอิสระ
            </p>
          </div>

          <div className="self-start md:self-center flex items-center space-x-2.5 flex-wrap gap-y-2">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-98 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center space-x-2 transition cursor-pointer backdrop-blur-xs shadow-xs"
              title="นำเข้าผู้ใช้งานจาก Excel / CSV หรือกรอกทีละหลายคน"
            >
              <Users className="w-4 h-4 text-purple-200" />
              <span>เพิ่มทีละหลายคน (Excel/CSV)</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center space-x-2 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มผู้ใช้งานใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>ผู้ใช้ทั้งหมด</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5">{stats.total}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">เปิดใช้งาน {stats.active} ท่าน</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 text-xs font-medium">
            <span>ผู้ดูแลระบบ</span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-900 mt-1.5">{stats.admin}</div>
          <div className="text-[11px] text-purple-500 mt-0.5">Admin Full Access</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-xs">
          <div className="flex items-center justify-between text-teal-600 text-xs font-medium">
            <span>ผู้บริหาร</span>
            <ShieldCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-xl font-bold text-teal-900 mt-1.5">{stats.director}</div>
          <div className="text-[11px] text-teal-600 mt-0.5">ผู้อำนวยการ สวจ.</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-xs">
          <div className="flex items-center justify-between text-orange-600 text-xs font-medium">
            <span>เจ้าหน้าที่</span>
            <UserCheck className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-bold text-orange-900 mt-1.5">{stats.officer}</div>
          <div className="text-[11px] text-orange-600 mt-0.5">ผู้ขอใช้รถราชการ</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 text-xs font-medium">
            <span>พนักงานขับรถ</span>
            <Fuel className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-900 mt-1.5">{stats.driver}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">บันทึกไมล์/น้ำมัน</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>เมนูในระบบ</span>
            <Sliders className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1.5">{APP_MENUS.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">กำหนดสิทธิ์ได้อิสระ</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, ชื่อผู้ใช้, ตำแหน่ง, ฝ่าย หรือเบอร์โทร..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">ทุกบทบาทหน้าที่</option>
            <option value="admin">ผู้ดูแลระบบ (Admin)</option>
            <option value="director">ผู้บริหาร (Director)</option>
            <option value="officer">เจ้าหน้าที่ (Officer)</option>
            <option value="driver">พนักงานขับรถ (Driver)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">ใช้งานปกติ (Active)</option>
            <option value="inactive">ระงับการใช้งาน (Inactive)</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
              setStatusFilter('all');
            }}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            title="รีเซ็ตตัวกรอง"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users List Table / Card Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
          <div className="text-xs font-bold text-slate-700 flex items-center space-x-2">
            <span>รายชื่อบุคลากรและสิทธิ์การใช้งาน ({filteredUsers.length} ท่าน)</span>
          </div>
          <span className="text-[11px] text-slate-400">คลิกที่ปุ่ม &quot;กำหนดสิทธิ์&quot; เพื่อปรับเมนูของแต่ละคน</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <UserX className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium">ไม่พบผู้ใช้งานตามเงื่อนไขที่ค้นหา</p>
              <p className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหา หรือกดล้างตัวกรอง</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const roleMeta = ROLE_LABELS[user.role] || ROLE_LABELS.officer;
              const allowedMenus = getUserAllowedMenus(user);
              const isCurrent = user.id === currentUser.id;
              const isStatusActive = (user.status || 'active') === 'active';

              return (
                <div
                  key={user.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Avatar & Basic Info */}
                  <div className="flex items-start space-x-3.5 min-w-[260px]">
                    <div className="relative flex-shrink-0">
                      <div
                        onClick={() => setPhotoModalUser(user)}
                        className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm cursor-pointer group relative ring-2 ring-purple-100 hover:ring-purple-400 transition"
                        title="คลิกเพื่อแก้ไข/เพิ่มรูปโปรไฟล์ให้ผู้ใช้งานนี้"
                      >
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Camera className="w-4 h-4" />
                        </div>
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          isStatusActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                        title={isStatusActive ? 'ใช้งานปกติ' : 'ระงับการใช้งาน'}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{user.name}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-bold border border-orange-200">
                            บัญชีที่คุณกำลังใช้งาน
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                          @{user.username}
                        </span>
                        <span>•</span>
                        <span>{user.position}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                        <span className="flex items-center space-x-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{user.department}</span>
                        </span>
                        {user.phone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{user.phone}</span>
                            </span>
                          </>
                        )}
                        {user.email && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{user.email}</span>
                            </span>
                          </>
                        )}
                      </div>

                      {/* User Digital Signature Status Badge */}
                      <div className="pt-1 flex items-center gap-2">
                        {user.signatureUrl ? (
                          <button
                            type="button"
                            onClick={() => setSignatureModalUser(user)}
                            className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold hover:bg-emerald-100 transition cursor-pointer"
                            title="คลิกเพื่อดูหรือแก้ไขลายมือชื่อดิจิทัล"
                          >
                            <PenTool className="w-3 h-3 text-emerald-600" />
                            <span>มีลายเซ็นในระบบแล้ว</span>
                            <span className="text-[10px] text-emerald-600 font-normal">
                              ({user.signatureType === 'draw' ? 'วาดสด' : user.signatureType === 'image' ? 'ภาพ' : 'ดิจิทัล'})
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSignatureModalUser(user)}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-dashed border-slate-300 text-[11px] hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 transition cursor-pointer"
                            title="คลิกเพื่อเพิ่มลายมือชื่อ"
                          >
                            <PenTool className="w-3 h-3 text-slate-400" />
                            <span>ยังไม่มีลายเซ็น (คลิกเพื่อเพิ่ม)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Role & Allowed Menus Badges */}
                  <div className="flex-1 lg:px-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleMeta.bg} ${roleMeta.color} ${roleMeta.border}`}
                      >
                        {roleMeta.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        ได้รับสิทธิ์เข้าใช้งาน <strong className="text-slate-800 font-semibold">{allowedMenus.length}</strong> จาก {APP_MENUS.length} เมนู
                      </span>
                    </div>

                    {/* Menu Badges List */}
                    <div className="flex flex-wrap gap-1.5">
                      {APP_MENUS.map((menu) => {
                        const hasAccess = allowedMenus.includes(menu.id);
                        const Icon = MENU_ICONS[menu.id] || LayoutDashboard;

                        return (
                          <span
                            key={menu.id}
                            title={`${menu.label}: ${hasAccess ? 'อนุญาตให้เข้าใช้งานได้' : 'ไม่อนุญาต/ซ่อนเมนู'}`}
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition ${
                              hasAccess
                                ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                : 'bg-slate-50 text-slate-300 line-through border border-dashed border-slate-200'
                            }`}
                          >
                            <Icon className={`w-3 h-3 ${hasAccess ? 'text-slate-700' : 'text-slate-300'}`} />
                            <span>{menu.label}</span>
                            {hasAccess ? (
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <X className="w-2.5 h-2.5 text-slate-300" />
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 self-end lg:self-center">
                    {/* Quick Permission Trigger */}
                    <button
                      onClick={() => handleOpenPermissionModal(user)}
                      className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition"
                      title="กำหนดสิทธิ์การมองเห็นเมนู"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>กำหนดสิทธิ์</span>
                    </button>

                    {/* Edit Profile Photo */}
                    <button
                      onClick={() => setPhotoModalUser(user)}
                      className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition"
                      title="แก้ไข/เปลี่ยนรูปภาพโปรไฟล์"
                    >
                      <Camera className="w-4 h-4" />
                    </button>

                    {/* Manage Digital Signature */}
                    <button
                      onClick={() => setSignatureModalUser(user)}
                      className={`p-1.5 rounded-xl transition cursor-pointer ${
                        user.signatureUrl
                          ? 'text-emerald-700 hover:bg-emerald-100 bg-emerald-50 border border-emerald-200'
                          : 'text-slate-600 hover:text-orange-700 hover:bg-orange-50'
                      }`}
                      title={user.signatureUrl ? 'จัดการ/แก้ไขลายมือชื่อดิจิทัล' : 'เพิ่มลายมือชื่อดิจิทัล'}
                    >
                      <PenTool className="w-4 h-4" />
                    </button>

                    {/* Edit User */}
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      title="แก้ไขข้อมูลผู้ใช้งาน"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete User */}
                    <button
                      onClick={() => {
                        if (user.id === currentUser.id) {
                          alert('ไม่สามารถลบบัญชีที่คุณกำลังใช้งานอยู่ในขณะนี้ได้');
                          return;
                        }
                        if (user.role === 'admin' && users.filter((u) => u.role === 'admin').length <= 1) {
                          alert('ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้ ระบบต้องมี Admin อย่างน้อย 1 ท่าน');
                          return;
                        }
                        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน "${user.name}" (${user.username})?`)) {
                          onDeleteUser(user.id);
                        }
                      }}
                      disabled={isCurrent || (user.role === 'admin' && users.filter((u) => u.role === 'admin').length <= 1)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition disabled:opacity-30 disabled:pointer-events-none"
                      title="ลบผู้ใช้งาน"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT USER MODAL                                                     */}
      {/* ========================================================================= */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden animate-in fade-in duration-200 my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  {editingUserId ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {editingUserId ? 'แก้ไขข้อมูลผู้ใช้งานและกำหนดสิทธิ์' : 'เพิ่มผู้ใช้งานใหม่เข้าสู่ระบบ'}
                  </h3>
                  <p className="text-xs text-purple-100">
                    สำนักงานวัฒนธรรมจังหวัดพังงา
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Personal Info Grid */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b pb-1.5">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>ข้อมูลพื้นฐานผู้ใช้งาน</span>
                </div>

                {/* Profile Photo Uploader Section */}
                <div className="flex items-center space-x-4 p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs ring-2 ring-purple-200 shrink-0">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      formData.name ? formData.name.charAt(0) : <Camera className="w-6 h-6" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">รูปภาพประจำตัว (Profile Photo)</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition">
                        <Camera className="w-3.5 h-3.5 text-purple-600" />
                        <span>เลือกรูปจากเครื่อง</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (ev.target?.result) {
                                setFormData({ ...formData, avatarUrl: ev.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {formData.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, avatarUrl: '' })}
                          className="text-xs text-rose-600 hover:underline font-medium"
                        >
                          ลบรูปภาพ
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block">รองรับไฟล์ภาพ JPG, PNG (หรือคลิกที่รูปผู้ใช้งานในตารางเพื่อเลือกภาพสำเร็จรูป)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      ชื่อ-นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น นายมานะ รักวัฒนธรรม"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      ชื่อผู้ใช้งาน (Username) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="เช่น mana.r"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700">
                        รหัสผ่าน (Password) <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, password: `${formData.username || 'user'}123` })}
                        className="text-[10px] text-purple-600 hover:text-purple-800 underline"
                      >
                        สุ่มรหัสเริ่มต้น
                      </button>
                    </div>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="เช่น user123 หรือ 1234"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>

                  {/* Position */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">ตำแหน่ง</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="เช่น นักวิชาการวัฒนธรรมปฏิบัติการ"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">ฝ่าย / กลุ่มงาน</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">เบอร์โทรศัพท์ติดต่อ</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="เช่น 081-234-5678"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">อีเมลทางการ</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="เช่น user@m-culture.go.th"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Role */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      บทบาทหลักในระบบ (Role) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-purple-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="officer">เจ้าหน้าที่ทั่วไป (Officer - ผู้ขอใช้รถ)</option>
                      <option value="director">ผู้บริหาร (Director - พิจารณาอนุมัติ)</option>
                      <option value="driver">พนักงานขับรถ (Driver - บันทึกไมล์/น้ำมัน)</option>
                      <option value="admin">ผู้ดูแลระบบ (Admin - จัดการระบบทั้งหมด)</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">สถานะการใช้งาน</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="active">ใช้งานปกติ (Active)</option>
                      <option value="inactive">ระงับการใช้งานชั่วคราว (Inactive)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Menu Permissions Allocation Section */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-1.5">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sliders className="w-4 h-4 text-purple-600" />
                    <span>กำหนดสิทธิ์เข้าใช้งานแต่ละเมนู (Menu Permissions)</span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allowedMenus: APP_MENUS.map((m) => m.id) })}
                      className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-semibold rounded-lg transition"
                    >
                      เลือกทั้งหมด
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, allowedMenus: ['dashboard'] })}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold rounded-lg transition"
                    >
                      ล้างทั้งหมด
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRoleChange(formData.role)}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-lg transition"
                    >
                      คืนค่าตามบทบาท
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  เลือกติ๊กเพื่ออนุญาตให้ผู้ใช้นี้เข้าถึงและมองเห็นเมนูที่กำหนด หากไม่ติ๊ก เมนูนั้นจะถูกซ่อนจากแถบเมนูด้านข้างและแถบนำทาง
                </p>

                {/* Menus Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {APP_MENUS.map((menu) => {
                    const isChecked = formData.allowedMenus.includes(menu.id);
                    const Icon = MENU_ICONS[menu.id] || LayoutDashboard;

                    return (
                      <div
                        key={menu.id}
                        onClick={() => handleToggleMenu(menu.id)}
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-start space-x-3 select-none ${
                          isChecked
                            ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-300 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-400'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 transition ${
                            isChecked ? 'bg-purple-600 text-white' : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <Icon
                              className={`w-4 h-4 ${isChecked ? 'text-purple-600' : 'text-slate-400'}`}
                            />
                            <span
                              className={`text-xs font-bold leading-tight ${
                                isChecked ? 'text-slate-900' : 'text-slate-500'
                              }`}
                            >
                              {menu.label}
                            </span>
                          </div>
                          <p
                            className={`text-[10px] mt-0.5 line-clamp-1 ${
                              isChecked ? 'text-purple-900/70' : 'text-slate-400'
                            }`}
                          >
                            {menu.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Digital Signature Management Section */}
              {editingUserId && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                        <PenTool className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">ลายมือชื่อดิจิทัล (สำหรับลงนามในใบคำขอ)</h4>
                        <p className="text-[10px] text-slate-500">ใช้สำหรับลงลายมือชื่อในใบบันทึกข้อความขอใช้รถราชการ</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const target = users.find((u) => u.id === editingUserId);
                        if (target) setSignatureModalUser(target);
                      }}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>{users.find((u) => u.id === editingUserId)?.signatureUrl ? 'จัดการ/แก้ไขลายเซ็น' : 'วาดหรือเพิ่มลายเซ็น'}</span>
                    </button>
                  </div>

                  {/* Thumbnail if user already has a signature */}
                  {users.find((u) => u.id === editingUserId)?.signatureUrl && (
                    <div className="mt-2 p-2 bg-white rounded-xl border border-slate-200 flex items-center space-x-3">
                      <div className="h-10 px-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-center">
                        <img
                          src={users.find((u) => u.id === editingUserId)?.signatureUrl}
                          alt="Signature thumbnail"
                          className="max-h-8 max-w-[120px] object-contain"
                        />
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium">
                        ✓ บันทึกลายมือชื่อดิจิทัลแล้ว (พร้อมประทับลงในใบคำขออัตโนมัติ)
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Buttons */}
              <div className="pt-4 border-t flex justify-end items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  {editingUserId ? 'บันทึกการเปลี่ยนแปลง' : 'ยืนยันเพิ่มผู้ใช้งาน'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK MENU PERMISSION MODAL                                               */}
      {/* ========================================================================= */}
      {permissionTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    กำหนดสิทธิ์การเข้าถึงเมนู
                  </h3>
                  <p className="text-xs text-purple-100">
                    {permissionTargetUser.name} (@{permissionTargetUser.username})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPermissionTargetUser(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-purple-900">{permissionTargetUser.name}</div>
                  <div className="text-[11px] text-purple-700">
                    {permissionTargetUser.roleTitle} • {permissionTargetUser.department}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-purple-800 border border-purple-200">
                  {getUserAllowedMenus(permissionTargetUser).length} / {APP_MENUS.length} เมนู
                </span>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">คลิกที่เมนูเพื่อเปิด/ปิดสิทธิ์:</span>
                <div className="space-x-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateUser(permissionTargetUser.id, {
                        allowedMenus: APP_MENUS.map((m) => m.id)
                      });
                      setPermissionTargetUser({
                        ...permissionTargetUser,
                        allowedMenus: APP_MENUS.map((m) => m.id)
                      });
                    }}
                    className="text-[10px] text-purple-600 hover:text-purple-800 font-semibold"
                  >
                    เปิดทุกเมนู
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => {
                      const defaults = DEFAULT_ROLE_MENUS[permissionTargetUser.role] || ['dashboard'];
                      onUpdateUser(permissionTargetUser.id, {
                        allowedMenus: defaults
                      });
                      setPermissionTargetUser({
                        ...permissionTargetUser,
                        allowedMenus: defaults
                      });
                    }}
                    className="text-[10px] text-amber-600 hover:text-amber-800 font-semibold"
                  >
                    คืนค่าเริ่มต้นตามบทบาท
                  </button>
                </div>
              </div>

              {/* Menu items list */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {APP_MENUS.map((menu) => {
                  const allowedMenus = getUserAllowedMenus(permissionTargetUser);
                  const isChecked = allowedMenus.includes(menu.id);
                  const Icon = MENU_ICONS[menu.id] || LayoutDashboard;

                  return (
                    <div
                      key={menu.id}
                      onClick={() => handleToggleQuickPermission(menu.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between select-none ${
                        isChecked
                          ? 'bg-purple-50/80 border-purple-300 text-slate-900'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isChecked ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`text-xs font-bold leading-tight ${isChecked ? 'text-slate-900' : 'text-slate-500'}`}>
                            {menu.label}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{menu.desc}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isChecked
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isChecked ? 'อนุญาต' : 'ปิดกั้น'}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center ${
                            isChecked ? 'bg-purple-600 text-white' : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked ? <Check className="w-3.5 h-3.5" /> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPermissionTargetUser(null)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                เรียบร้อย
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Bulk Add Users Modal */}
      <BulkAddUsersModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        existingUsers={users}
        onBulkAdd={(newUsers) => {
          if (onBulkAddUsers) {
            onBulkAddUsers(newUsers);
          } else {
            newUsers.forEach((u) => onAddUser(u));
          }
        }}
      />

      {/* Profile Photo Modal */}
      <ProfilePhotoModal
        isOpen={!!photoModalUser}
        user={photoModalUser}
        onClose={() => setPhotoModalUser(null)}
        onSave={(userId, newAvatarUrl) => {
          onUpdateUser(userId, { avatarUrl: newAvatarUrl });
        }}
      />

      {/* User Digital Signature Modal */}
      {signatureModalUser && (
        <UserSignatureModal
          isOpen={!!signatureModalUser}
          user={signatureModalUser}
          onClose={() => setSignatureModalUser(null)}
          onSaveSignature={(userId, sigUrl, sigType) => {
            onUpdateUser(userId, {
              signatureUrl: sigUrl,
              signatureType: sigType,
              signatureUpdatedAt: new Date().toISOString()
            });
            setSignatureModalUser(null);
          }}
          onDeleteSignature={(userId) => {
            onUpdateUser(userId, {
              signatureUrl: undefined,
              signatureType: undefined,
              signatureUpdatedAt: undefined
            });
            setSignatureModalUser(null);
          }}
        />
      )}

    </div>
  );
};
