import React, { useState, useMemo } from 'react';
import { 
  BookMarked, 
  RotateCcw, 
  Trash2, 
  Search, 
  Check, 
  SlidersHorizontal, 
  Info, 
  Sparkles,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { QD388_DOMAINS, getDefaultQD388ForSubject } from '../data/qd388Data';

interface PreschoolQD388FullViewerProps {
  subject: string;
  customCodes: string;
  mode: 'default_388' | 'custom';
  onChangeCodes: (codes: string) => void;
  onChangeMode: (mode: 'default_388' | 'custom') => void;
  onClose?: () => void;
}

export const PreschoolQD388FullViewer: React.FC<PreschoolQD388FullViewerProps> = ({
  subject,
  customCodes,
  mode,
  onChangeCodes,
  onChangeMode,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState<string>('all');
  const [isBrowserOpen, setIsBrowserOpen] = useState(true);

  // Lấy bộ mã mặc định theo hoạt động
  const defaultInfo = useMemo(() => getDefaultQD388ForSubject(subject), [subject]);

  // Phân tích các mã đang chọn trong customCodes
  const currentSelectedCodes = useMemo(() => {
    if (!customCodes) return [];
    return customCodes
      .split(/[,;\n]+/)
      .map((c) => c.trim())
      .filter(Boolean);
  }, [customCodes]);

  // Bật/tắt 1 mã chỉ báo
  const toggleCode = (code: string) => {
    let nextCodes: string[];
    if (currentSelectedCodes.includes(code)) {
      nextCodes = currentSelectedCodes.filter((c) => c !== code);
    } else {
      nextCodes = [...currentSelectedCodes, code];
    }
    onChangeCodes(nextCodes.join(', '));
    onChangeMode('custom');
  };

  // Nạp mã mặc định
  const handleResetDefault = () => {
    if (defaultInfo) {
      onChangeCodes(defaultInfo.summary);
      onChangeMode('default_388');
    }
  };

  // Xóa trắng mã
  const handleClearCodes = () => {
    onChangeCodes('');
    onChangeMode('custom');
  };

  // Lọc chỉ báo theo tìm kiếm và lĩnh vực
  const filteredDomains = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return QD388_DOMAINS.map((domain) => {
      if (selectedDomainId !== 'all' && domain.id !== selectedDomainId) {
        return null;
      }
      const matchedIndicators = domain.indicators.filter((ind) => {
        if (!q) return true;
        return (
          ind.code.toLowerCase().includes(q) ||
          ind.title.toLowerCase().includes(q) ||
          ind.description.toLowerCase().includes(q)
        );
      });
      return {
        ...domain,
        indicators: matchedIndicators,
      };
    }).filter(Boolean);
  }, [searchQuery, selectedDomainId]);

  return (
    <div className="w-full bg-white rounded-xl border-2 border-blue-300 shadow-md p-4 sm:p-5 mb-5 animate-in fade-in slide-in-from-top-3 duration-300">
      {/* 1. Tiêu đề dài, biểu tượng lớn, huy hiệu QĐ 388 và nút đóng */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <BookMarked className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Mã các lĩnh vực phát triển theo Quyết định 388/QĐ-BGDĐT
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                QĐ 388/QĐ-BGDĐT
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Chương trình GDMN mới (Thí điểm): <span className="font-semibold text-slate-800">Thể chất, Tình cảm – XH, Ngôn ngữ, Nhận thức, Nghệ thuật</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-start">
          <button
            type="button"
            onClick={() => setIsBrowserOpen(!isBrowserOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Tra cứu mã QĐ 388</span>
            {isBrowserOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Đóng bảng tra cứu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Chế độ và Ô nhập / xem danh sách mã */}
      <div className="pt-3 pb-2 flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Mã lĩnh vực phát triển đưa vào giáo án:
            </span>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-300 text-[11px]">
              <button
                type="button"
                onClick={handleResetDefault}
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefault}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nạp mã mặc định</span>
            </button>

            <button
              type="button"
              onClick={handleClearCodes}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 transition-colors shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa mã</span>
            </button>
          </div>
        </div>

        {/* Ô hiển thị và sửa mã trực tiếp */}
        <textarea
          value={customCodes}
          onChange={(e) => {
            onChangeCodes(e.target.value);
            if (mode === 'default_388') {
              onChangeMode('custom');
            }
          }}
          rows={2}
          placeholder="Mã lĩnh vực phát triển (ví dụ: NT 3.1, TX 3.2, TX 4.3, TX 4.4, NN 2.2)... Có thể nhập trực tiếp hoặc nhấp chọn trong bảng chỉ báo bên dưới."
          className="w-full bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs transition-colors"
        />

        <div className="text-xs text-slate-600 italic flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Đã chọn <strong className="font-bold text-blue-700">{currentSelectedCodes.length}</strong> mã chỉ báo:</span>
          <span className="font-semibold text-slate-800 not-italic ml-1">
            {currentSelectedCodes.length > 0 ? currentSelectedCodes.join(', ') : '(Chưa chọn mã nào)'}
          </span>
        </div>
      </div>

      {/* 3. Bảng tra cứu & chọn mã chi tiết cho người dùng xem và lựa chọn */}
      {isBrowserOpen && (
        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
          {/* Thanh tìm kiếm & bộ lọc lĩnh vực */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã hoặc nội dung chỉ báo (ví dụ: TC 1.1, vận động, nhận thức, chữ cái, đếm)..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tabs chọn lĩnh vực */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedDomainId('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedDomainId === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Tất cả (5 lĩnh vực)
              </button>
              {QD388_DOMAINS.map((domain) => (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() => setSelectedDomainId(domain.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    selectedDomainId === domain.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {domain.codePrefix} - {domain.name}
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách các chỉ báo có thể bấm trực tiếp để chọn/bỏ chọn */}
          <div className="max-h-72 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin">
            {filteredDomains && filteredDomains.length > 0 ? (
              filteredDomains.map((domain: any) => (
                <div key={domain.id} className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-extrabold">
                        {domain.codePrefix}
                      </span>
                      {domain.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {domain.indicators.length} chỉ báo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {domain.indicators.map((ind: any) => {
                      const isSelected = currentSelectedCodes.includes(ind.code);
                      return (
                        <button
                          key={ind.code}
                          type="button"
                          onClick={() => toggleCode(ind.code)}
                          className={`text-left p-2 rounded-lg border transition-all cursor-pointer flex items-start gap-2 ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-400 text-blue-950 ring-1 ring-blue-400 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50/80'
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded shrink-0 flex items-center justify-center border text-[10px] font-bold ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-blue-700">{ind.code}</span>
                              <span className="text-[11px] font-semibold text-slate-800 truncate">{ind.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                              {ind.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Không tìm thấy mã chỉ báo nào khớp với "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Khung thông báo chú thích màu xanh ở cuối */}
      <div className="mt-3 p-3 rounded-lg bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Các mã chỉ báo trên sẽ tự động được tích hợp chuẩn xác vào <strong className="font-bold text-blue-950">Mục I. Mục đích - yêu cầu</strong> (Kiến thức, Kỹ năng, Phẩm chất, Năng lực) trong giáo án và file Word (.docx) xuất ra.
        </p>
      </div>
    </div>
  );
};
