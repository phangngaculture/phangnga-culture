import React, { useState } from 'react';
import { User } from '../types';
import { GarudaIcon } from './GarudaIcon';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Car,
  AlertCircle,
  KeyRound
} from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedUsername = usernameInput.trim().toLowerCase();
    const trimmedPassword = passwordInput.trim();

    if (!trimmedUsername) {
      setErrorMsg('กรุณากรอกชื่อผู้ใช้งาน (Username) หรืออีเมล');
      return;
    }

    if (!trimmedPassword) {
      setErrorMsg('กรุณากรอกรหัสผ่าน');
      return;
    }

    setIsSubmitting(true);

    // Simulate authenticating against registered users
    setTimeout(() => {
      const foundUser = users.find(
        (u) =>
          u.username.toLowerCase() === trimmedUsername ||
          (u.email && u.email.toLowerCase() === trimmedUsername) ||
          (u.phone && u.phone.replace(/[^0-9]/g, '') === trimmedUsername.replace(/[^0-9]/g, ''))
      );

      if (!foundUser) {
        setErrorMsg('ไม่พบบัญชีผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบชื่อผู้ใช้หรือติดต่อแอดมิน');
        setIsSubmitting(false);
        return;
      }

      if (foundUser.status === 'inactive') {
        setErrorMsg('บัญชีผู้ใช้นี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบยานพาหนะ');
        setIsSubmitting(false);
        return;
      }

      // Check password
      const expectedPassword = foundUser.password || 'dekcom2537';
      if (trimmedPassword !== expectedPassword) {
        setErrorMsg('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      onLogin(foundUser);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card Container */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
          
          {/* Top Banner with Garuda & Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 text-center relative border-b border-orange-500/30">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-teal-400" />
            
            {/* Ministry of Culture Official Seal Emblem */}
            <div className="inline-flex items-center justify-center mb-2">
              <img
                src="/logo_mculture.svg"
                alt="ตราสัญลักษณ์กระทรวงวัฒนธรรม"
                className="w-20 h-28 sm:w-24 sm:h-32 object-contain drop-shadow-xl animate-in zoom-in-95 duration-500"
              />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30 mb-1">
                <Car className="w-3 h-3 text-orange-400" />
                <span>e-Service Platform v5.2</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                ระบบเบิกใช้งานรถยนต์ราชการ
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                สำนักงานวัฒนธรรมจังหวัดพังงา กระทรวงวัฒนธรรม
              </p>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="p-6 sm:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-base font-bold text-slate-900 flex items-center justify-center space-x-1.5">
                <Lock className="w-4 h-4 text-orange-600" />
                <span>เข้าสู่ระบบเพื่อใช้งาน</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                กรอกชื่อผู้ใช้งานและรหัสผ่านเพื่อเข้าสู่ระบบงานยานพาหนะ
              </p>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-rose-800 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อผู้ใช้งาน (Username) หรือ อีเมล
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="กรุณาระบุชื่อผู้ใช้งาน"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    รหัสผ่าน (Password)
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="กรุณาระบุรหัสผ่าน"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
                  />
                  <span className="text-xs text-slate-600">จดจำการเข้าสู่ระบบบนอุปกรณ์นี้</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-600/20 hover:shadow-orange-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังตรวจสอบสิทธิ์...</span>
                  </div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบ</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Card Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center justify-center space-x-1 font-medium text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ระบบความปลอดภัยตามระเบียบสำนักนายกรัฐมนตรี</span>
            </div>
            <p className="text-[10px] text-slate-400">
              หากมีข้อสงสัยหรือลืมรหัสผ่าน กรุณาติดต่อฝ่ายบริหารทั่วไป สำนักงานวัฒนธรรมจังหวัดพังงา
            </p>
          </div>
        </div>

        {/* Outer footer text */}
        <div className="text-center mt-4 text-xs text-slate-400">
          © 2569 สำนักงานวัฒนธรรมจังหวัดพังงา • developer by Thon Saengsawang
        </div>
      </div>
    </div>
  );
};

