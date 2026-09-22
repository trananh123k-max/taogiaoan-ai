import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookmarkCheck, 
  RotateCcw, 
  Trash2, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Info, 
  Sparkles, 
  Tag, 
  SlidersHorizontal 
} from 'lucide-react';
import { 
  QD388_DOMAINS, 
  getDefaultQD388ForSubject, 
  QD388Indicator 
} from '../data/qd388Data';

interface PreschoolQD388CodesConfigProps {
  subject: string;
  mode?: 'default_388' | 'custom';
  customCodes?: string;
  onChangeMode: (mode: 'default_388' | 'custom') => void;
  onChangeCodes: (codes: string) => void;
}

export const PreschoolQD388CodesConfig: React.FC<PreschoolQD388CodesConfigProps> = ({
  subject,
  mode = 'default_388',
  customCodes = '',
  onChangeMode,
  onChangeCodes,
}) => {
  const [activeDomainTab, setActiveDomainTab] = useState<'TC' | 'TX' | 'NN' | 'NT' | 'NgT'>('NT');
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Lấy bộ mã mặc định chuẩn cho hoạt động này
  const defaultInfo = useMemo(() => getDefaultQD388ForSubject(subject), [subject]);

  // Tự động khởi tạo giá trị ban đầu nếu đang ở mode default_388 và customCodes rỗng
  useEffect(() => {
    if (mode === 'default_388' && defaultInfo && !customCodes.trim()) {
      onChangeCodes(defaultInfo.summary);
    }
  }, [subject, mode, defaultInfo]);

  // Phân tích danh sách mã hiện tại đang có trong ô nhập
  const selectedCodeList = useMemo(() => {
    if (!customCodes) return [];
    return customCodes
      .split(/[,;\n+]+/)
      .map(c => c.trim().replace(/^mã\s*:\s*/i, ''))
      .filter(Boolean);
  }, [customCodes]);

  // Thêm hoặc xóa một mã chỉ báo khi click vào chip
  const toggleIndicator = (ind: QD388Indicator) => {
    const code = ind.code.trim();
    const currentList = [...selectedCodeList];
    const index = currentList.findIndex(c => c.toLowerCase() === code.toLowerCase());

    if (index >= 0) {
      currentList.splice(index, 1);
    } else {
      currentList.push(code);
    }

    const newCodesStr = currentList.join(', ');
    onChangeCodes(newCodesStr);
    if (mode === 'default_388') {
      onChangeMode('custom');
    }
  };

  // Nạp lại mã mặc định
  const handleResetToDefault = () => {
    if (defaultInfo) {
      onChangeCodes(defaultInfo.summary);
      onChangeMode('default_388');
    }
  };

  // Xóa toàn bộ mã
  const handleClearCodes = () => {
    onChangeCodes('');
    onChangeMode('custom');
  };

  // Lọc chỉ báo theo ô tìm kiếm
  const currentDomain = QD388_DOMAINS.find(d => d.id === activeDomainTab) || QD388_DOMAINS[0];
  const filteredIndicators = useMemo(() => {
    if (!searchTerm.trim()) return currentDomain.indicators;
    const term = searchTerm.toLowerCase().trim();
    return currentDomain.indicators.filter(
      ind => ind.code.toLowerCase().includes(term) ||
             ind.title.toLowerCase().includes(term) ||
             ind.description.toLowerCase().includes(term) ||
             (ind.group && ind.group.toLowerCase().includes(term))
    );
  }, [currentDomain, searchTerm]);

  return (
    <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 border border-blue-200/90 text-slate-800 text-xs flex flex-col gap-3 shadow-xs">
      {/* Tiêu đề & Giới thiệu */}
      <div className="flex items-start justify-between gap-2 border-b border-blue-200/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs shrink-0">
            <BookmarkCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-blue-950 text-xs">
                Mã các lĩnh vực phát triển
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-200">
                QĐ 388/QĐ-BGDĐT
              </span>
            </div>
            <p className="text-[11px] text-blue-900/80 leading-snug">
              Chương trình GDMN mới (Thí điểm): Thể chất, Tình cảm – XH, Ngôn ngữ, Nhận thức, Nghệ thuật
            </p>
          </div>
        </div>

        {/* Nút bật/tắt bảng tra cứu */}
        <button
          type="button"
          onClick={() => setIsBrowserOpen(!isBrowserOpen)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer shadow-2xs shrink-0 ${
            isBrowserOpen
              ? 'bg-blue-600 text-white border border-blue-700'
              : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
          }`}
          title="Xem danh mục 5 lĩnh vực và chọn nhanh mã chỉ báo"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>{isBrowserOpen ? 'Đóng tra cứu' : 'Tra cứu mã QĐ 388'}</span>
          {isBrowserOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
        </button>
      </div>

      {/* Chế độ chọn: Mặc định theo QĐ 388 vs Tự do nhập */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Tag className="w-3 h-3 text-blue-600" />
            Phương thức thiết lập mã:
          </label>
          <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg border border-slate-300/80 text-[11px]">
            <button
              type="button"
              onClick={() => {
                onChangeMode('default_388');
                if (defaultInfo) {
                  onChangeCodes(defaultInfo.summary);
                }
              }}
              className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                mode === 'default_388'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mặc định theo QĐ 388
            </button>
            <button
              type="button"
              onClick={() => onChangeMode('custom')}
              className={`px-2.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                mode === 'custom'
                  ? 'bg-white text-amber-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tự do tùy chỉnh mã
            </button>
          </div>
        </div>

        {/* Ô nhập / hiển thị các mã */}
        <div className="relative">
          <textarea
            value={customCodes}
            onChange={(e) => {
              onChangeCodes(e.target.value);
              if (mode === 'default_388') {
                onChangeMode('custom');
              }
            }}
            rows={2}
            placeholder="Nhập hoặc bấm chọn mã (ví dụ: NT 3.1, TX 4.4, TC 1.2, NN 2.2)..."
            className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-2xs"
          />
        </div>

        {/* Dòng điều khiển nhanh: nút nạp mặc định, xóa, gợi ý */}
        <div className="flex items-center justify-between gap-1 flex-wrap text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {defaultInfo && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100/80 hover:bg-blue-200/80 text-blue-800 font-medium transition-colors cursor-pointer border border-blue-200 shadow-2xs"
                title="Khôi phục lại toàn bộ mã chuẩn khuyến nghị theo QĐ 388 cho hoạt động này"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Nạp mã mặc định theo QĐ 388</span>
              </button>
            )}
            {customCodes && (
              <button
                type="button"
                onClick={handleClearCodes}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-medium transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                title="Xóa nhanh toàn bộ mã để nhập mới"
              >
                <Trash2 className="w-2.5 h-2.5" />
                <span>Xóa mã</span>
              </button>
            )}
          </div>

          <span className="text-[10.5px] text-slate-500 italic">
            {selectedCodeList.length > 0 ? `Đã chọn ${selectedCodeList.length} mã chỉ báo` : 'Chưa nhập mã nào'}
          </span>
        </div>

        {/* Chú giải nhanh nội dung của hoạt động theo QĐ 388 */}
        {defaultInfo && mode === 'default_388' && (
          <div className="p-2 rounded-lg bg-white/90 border border-blue-100 text-[11px] flex flex-col gap-1 text-slate-700 leading-relaxed shadow-2xs">
            <div className="flex items-center gap-1 font-bold text-blue-900">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Khuyến nghị chuẩn QĐ 388 cho "{subject}":</span>
            </div>
            <p className="text-[10.5px] text-slate-600">
              {defaultInfo.note}
            </p>
            <div className="grid grid-cols-2 gap-1 mt-0.5 text-[10px] text-slate-600">
              <div><strong className="text-blue-900">Kiến thức:</strong> {defaultInfo.bySection.knowledge}</div>
              <div><strong className="text-blue-900">Kỹ năng:</strong> {defaultInfo.bySection.skills}</div>
              <div><strong className="text-blue-900">Phẩm chất:</strong> {defaultInfo.bySection.qualities}</div>
              <div><strong className="text-blue-900">Năng lực:</strong> {defaultInfo.bySection.competencies}</div>
            </div>
          </div>
        )}
      </div>

      {/* BẢNG TRA CỨU & CHỌN NHANH MÃ CHỈ BÁO THEO 5 LĨNH VỰC CỦA QĐ 388 */}
      {isBrowserOpen && (
        <div className="p-3 bg-white rounded-xl border border-blue-200 flex flex-col gap-2.5 shadow-xs">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              Bảng tra cứu chỉ báo Quyết định 388 (Bấm để thêm/bớt mã):
            </span>
            {/* Search */}
            <div className="relative w-44">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã hoặc từ khóa..."
                className="w-full pl-6 pr-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
            </div>
          </div>

          {/* 5 Tabs Lĩnh vực */}
          <div className="grid grid-cols-5 gap-1">
            {QD388_DOMAINS.map((dom) => {
              const isActive = activeDomainTab === dom.id;
              return (
                <button
                  key={dom.id}
                  type="button"
                  onClick={() => setActiveDomainTab(dom.id)}
                  className={`px-1.5 py-1 text-[11px] rounded-lg font-bold transition-all text-center truncate cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title={dom.name}
                >
                  {dom.codePrefix} - {dom.name.replace('Phát triển ', '')}
                </button>
              );
            })}
          </div>

          {/* Danh sách chỉ báo của Lĩnh vực đang chọn */}
          <div className="max-h-56 overflow-y-auto pr-1 flex flex-col gap-1.5 divide-y divide-slate-100">
            {filteredIndicators.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-[11px]">
                Không tìm thấy chỉ báo phù hợp với từ khóa "{searchTerm}".
              </div>
            ) : (
              filteredIndicators.map((ind) => {
                const isSelected = selectedCodeList.some(
                  c => c.toLowerCase() === ind.code.toLowerCase()
                );
                return (
                  <div
                    key={ind.code}
                    onClick={() => toggleIndicator(ind)}
                    className={`pt-1.5 first:pt-0 p-1.5 rounded-lg transition-all cursor-pointer flex items-start gap-2 ${
                      isSelected
                        ? 'bg-blue-50/90 border border-blue-300 shadow-2xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {ind.code}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-bold text-[11px] ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                          {ind.title}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-700 shrink-0">
                            <Check className="w-3 h-3" /> Đã chọn
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-600 leading-snug line-clamp-2 mt-0.5">
                        {ind.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Thông tin hỗ trợ */}
      <div className="flex items-start gap-1.5 text-[10.5px] text-blue-900/80 bg-blue-100/50 p-2 rounded-lg border border-blue-200/60 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
        <span>
          Các mã chỉ báo trên sẽ tự động được tích hợp chuẩn xác vào <strong>Mục I. Mục đích - yêu cầu</strong> (Kiến thức, Kỹ năng, Phẩm chất, Năng lực) trong giáo án và file Word (.docx) xuất ra.
        </span>
      </div>
    </div>
  );
};
