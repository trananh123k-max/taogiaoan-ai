import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetStorage = () => {
    try {
      // Clear potentially corrupted lesson plan or cache items
      localStorage.removeItem('khbd_my_firebase_ppct');
      localStorage.removeItem('khbd_active_lesson_plan');
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-rose-200 p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Đã xảy ra lỗi khi tải giao diện
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                {this.state.error && (this.state.error.message?.includes('removeChild') || this.state.error.name === 'NotFoundError') ? (
                  <span className="text-amber-700 font-medium">
                    Sự cố do xung đột dịch tự động của trình duyệt (Google Translate). Vui lòng bấm &quot;Tải lại trang&quot; để tiếp tục sử dụng bình thường.
                  </span>
                ) : (
                  'Hệ thống gặp sự cố không mong muốn khi khởi chạy giao diện. Vui lòng bấm làm mới để tải lại ứng dụng.'
                )}
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left max-h-40 overflow-y-auto text-xs font-mono text-rose-700">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tải lại trang</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetStorage}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-slate-500" />
                <span>Xóa bộ nhớ đệm & Làm mới</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
