import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}

export const ToastBanner: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  let icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
  if (type === 'error') {
    icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
  } else if (type === 'info') {
    icon = <Info className="w-5 h-5 text-orange-400 shrink-0" />;
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none">
      <div className="bg-slate-900/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs md:text-sm border border-slate-700 max-w-md backdrop-blur-md">
        {icon}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};
