import React, { useMemo, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { getDefaultQD388ForSubject } from '../data/qd388Data';

interface PreschoolQD388CodesConfigProps {
  subject: string;
  mode?: 'default_388' | 'custom';
  customCodes?: string;
  showInPreview?: boolean;
  onChangeMode: (mode: 'default_388' | 'custom') => void;
  onChangeCodes: (codes: string) => void;
  onChangeShowInPreview?: (show: boolean) => void;
}

export const PreschoolQD388CodesConfig: React.FC<PreschoolQD388CodesConfigProps> = ({
  subject,
  mode = 'default_388',
  customCodes = '',
  showInPreview = false,
  onChangeMode,
  onChangeCodes,
  onChangeShowInPreview,
}) => {
  // Lấy bộ mã mặc định chuẩn cho hoạt động này
  const defaultInfo = useMemo(() => getDefaultQD388ForSubject(subject), [subject]);

  // Tự động khởi tạo giá trị ban đầu nếu đang ở mode default_388 và customCodes rỗng
  useEffect(() => {
    if (mode === 'default_388' && defaultInfo && !customCodes.trim()) {
      onChangeCodes(defaultInfo.summary);
    }
  }, [subject, mode, defaultInfo]);

  return (
    <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-blue-50/40 border border-blue-200/70 text-xs">
      {/* 2 Chế độ linh hoạt: Mặc định theo QĐ 388 vs Tự do tùy chỉnh mã */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-800">
          Mã lĩnh vực phát triển
        </label>
        <div className="inline-flex p-0.5 rounded-lg bg-slate-200/80 border border-slate-300 text-[11px]">
          <button
            type="button"
            onClick={() => {
              onChangeMode('default_388');
              if (defaultInfo) {
                onChangeCodes(defaultInfo.summary);
              }
            }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              mode === 'default_388'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mặc định theo QĐ 388
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('custom')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              mode === 'custom'
                ? 'bg-white text-amber-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tự do tùy chỉnh mã
          </button>
        </div>
      </div>

      {/* Ô nhập/hiển thị mã */}
      <textarea
        value={customCodes}
        onChange={(e) => {
          onChangeCodes(e.target.value);
          if (mode === 'default_388') {
            onChangeMode('custom');
          }
        }}
        rows={2}
        placeholder={mode === 'default_388' ? 'Mã mặc định theo QĐ 388...' : 'Nhập mã tự do (ví dụ: NT 3.1, TC 1.2, TX 4.4)...'}
        className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs resize-y"
      />

      {/* Ô tích chọn hiển thị bảng tra cứu & chọn mã ở khung xem trước */}
      {onChangeShowInPreview && (
        <label className="flex items-center gap-2 cursor-pointer pt-0.5 select-none group">
          <input
            type="checkbox"
            checked={showInPreview}
            onChange={(e) => onChangeShowInPreview(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <span className="text-xs font-semibold text-blue-700 group-hover:text-blue-900 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Hiển thị bảng tra cứu & chọn mã QĐ 388 ở phía dưới</span>
          </span>
        </label>
      )}
    </div>
  );
};
