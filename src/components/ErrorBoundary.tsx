import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Prevents a runtime error in any child view from unmounting the entire app
 * into a blank white screen. Shows the actual error message and a reload button.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught rendering error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    const { error } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-rose-200 dark:border-rose-900/50 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-600 to-rose-500 text-white p-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-bold">เกิดข้อผิดพลาดในการแสดงผล</h1>
            <p className="text-xs text-rose-100 mt-1">
              ระบบพบข้อผิดพลาด กรุณาแจ้งผู้ดูแลระบบพร้อมข้อมูลด้านล่าง
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 rounded-2xl">
              <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 mb-1">
                รายละเอียดข้อผิดพลาด
              </p>
              <p className="text-xs text-rose-900 dark:text-rose-100 break-words font-mono leading-relaxed">
                {error.message || String(error)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-sm font-semibold transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ลองใหม่อีกครั้ง</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>โหลดหน้าเว็บใหม่</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
