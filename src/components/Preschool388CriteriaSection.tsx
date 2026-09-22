import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Sparkles,
  Search,
  BookOpen,
  ClipboardPaste,
  SlidersHorizontal,
  X,
  Plus,
  Info,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  CRITERIA_388_DATABASE,
  DEFAULT_CRITERIA_BY_ACTIVITY,
  Criterion388,
  getCriteria388ByCode,
  getDefaultCriteriaForActivity
} from '../data/preschool388Criteria';
import { LessonPlanConfig } from '../types';

interface Preschool388CriteriaSectionProps {
  config: LessonPlanConfig;
  onChangeConfig: (updates: Partial<LessonPlanConfig>) => void;
}

export const Preschool388CriteriaSection: React.FC<Preschool388CriteriaSectionProps> = ({
  config,
  onChangeConfig
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'bank' | 'custom'>('preset');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('ALL');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFullDetailModal, setShowFullDetailModal] = useState(false);

  // Danh sách mã tiêu chí chuẩn mặc định cho hoạt động này
  const defaultCodes = useMemo(() => {
    return getDefaultCriteriaForActivity(config.subject);
  }, [config.subject]);

  // Khởi tạo các tiêu chí đã chọn nếu chưa có
  useEffect(() => {
    if (
      config.selected388CriteriaCodes === undefined ||
      config.selected388CriteriaCodes.length === 0
    ) {
      if (defaultCodes.length > 0) {
        onChangeConfig({
          selected388CriteriaCodes: defaultCodes,
          enablePreschool388Criteria: true
        });
      }
    }
  }, [config.subject, defaultCodes]);

  const selectedCodes = config.selected388CriteriaCodes || [];

  // Toggle một mã tiêu chí
  const toggleCode = (code: string) => {
    const isSelected = selectedCodes.includes(code);
    let updated: string[];
    if (isSelected) {
      updated = selectedCodes.filter(c => c !== code);
    } else {
      updated = [...selectedCodes, code];
    }
    onChangeConfig({
      selected388CriteriaCodes: updated,
      enablePreschool388Criteria: updated.length > 0 || !!config.custom388CriteriaText
    });
  };

  // Chọn toàn bộ tiêu chí gợi ý chuẩn
  const handleSelectAllPreset = () => {
    const merged = Array.from(new Set([...selectedCodes, ...defaultCodes]));
    onChangeConfig({
      selected388CriteriaCodes: merged,
      enablePreschool388Criteria: true
    });
  };

  // Đặt lại về mặc định
  const handleResetToDefault = () => {
    onChangeConfig({
      selected388CriteriaCodes: [...defaultCodes],
      enablePreschool388Criteria: true
    });
  };

  // Xóa toàn bộ tiêu chí đã chọn
  const handleClearAll = () => {
    onChangeConfig({
      selected388CriteriaCodes: [],
      custom388CriteriaText: '',
      enablePreschool388Criteria: false
    });
  };

  // Lọc danh sách ngân hàng tiêu chí
  const filteredBank = useMemo(() => {
    return CRITERIA_388_DATABASE.filter(item => {
      // Lọc theo lĩnh vực
      if (selectedDomainFilter !== 'ALL' && item.domain !== selectedDomainFilter) {
        return false;
      }
      // Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = item.code.toLowerCase().includes(q);
        const matchContent = item.content.toLowerCase().includes(q);
        const matchGroup = item.group?.toLowerCase().includes(q) || false;
        const matchDomain = item.domainName.toLowerCase().includes(q);
        return matchCode || matchContent || matchGroup || matchDomain;
      }
      return true;
    });
  }, [selectedDomainFilter, searchQuery]);

  // Màu sắc theo lĩnh vực
  const getDomainBadgeColor = (domain: string) => {
    switch (domain) {
      case 'TC':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'TX':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'NN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'NT':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'NgT':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-50/90 via-indigo-50/70 to-slate-50 border-2 border-blue-300 text-slate-900 shadow-sm flex flex-col gap-3 transition-all">
      {/* HEADER SECTION */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            388
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                Tiêu chí theo QĐ 388/QĐ-BGDĐT
              </h3>
              <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-md shadow-2xs">
                Mới
              </span>
            </div>
            <p className="text-[11px] text-blue-800/90 font-medium leading-tight">
              Yêu cầu cần đạt cho 8 lĩnh vực mới thí điểm 2026 - 2027
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-md text-blue-700 hover:bg-blue-200/60 transition-colors"
          title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 pt-1 border-t border-blue-200/80">
          {/* TÓM TẮT TIÊU CHÍ ĐÃ CHỌN */}
          <div className="bg-white/95 p-2.5 rounded-lg border border-blue-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Tiêu chí đã gắn vào bài ({selectedCodes.length}):</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-[10px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-0.5 hover:underline"
                  title="Khôi phục các tiêu chí chuẩn theo hoạt động đang chọn"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Chuẩn mẫu</span>
                </button>
                {selectedCodes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold hover:underline"
                  >
                    Xóa hết
                  </button>
                )}
              </div>
            </div>

            {selectedCodes.length === 0 && !config.custom388CriteriaText ? (
              <p className="text-[11px] text-slate-500 italic py-1">
                Chưa có tiêu chí nào. Vui lòng chọn bên dưới để AI gắn đúng mã chỉ báo vào Mục tiêu bài dạy.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {selectedCodes.map(code => {
                  const crit = getCriteria388ByCode(code);
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100/90 text-blue-900 border border-blue-300 shadow-2xs group hover:bg-blue-200 transition-colors"
                      title={crit ? `${crit.code}: ${crit.content}` : code}
                    >
                      <span className="font-bold text-blue-800">{code}</span>
                      {crit && (
                        <span className="max-w-[120px] truncate text-slate-600 font-normal">
                          {crit.content}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleCode(code)}
                        className="hover:text-rose-600 p-0.5 rounded-full"
                        title="Xóa tiêu chí này"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {config.custom388CriteriaText && (
              <div className="text-[10px] bg-amber-50 p-1.5 rounded border border-amber-200 text-amber-900 font-medium">
                <span className="font-bold">✍️ Tiêu chí tự dán:</span> {config.custom388CriteriaText.substring(0, 80)}...
              </div>
            )}
          </div>

          {/* 3 CHẾ ĐỘ THÊM TIÊU CHÍ */}
          <div className="grid grid-cols-3 gap-1 bg-blue-100/80 p-1 rounded-lg border border-blue-200">
            <button
              type="button"
              onClick={() => setActiveTab('preset')}
              className={`py-1.5 px-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === 'preset'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-900 hover:bg-blue-200/70'
              }`}
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>Gợi ý chuẩn</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bank')}
              className={`py-1.5 px-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === 'bank'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-900 hover:bg-blue-200/70'
              }`}
            >
              <BookOpen className="w-3 h-3 shrink-0" />
              <span>Ngân hàng 388</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`py-1.5 px-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                activeTab === 'custom'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-900 hover:bg-blue-200/70'
              }`}
            >
              <ClipboardPaste className="w-3 h-3 shrink-0" />
              <span>Tự nhập / Dán</span>
            </button>
          </div>

          {/* TAB 1: GỢI Ý CHUẨN THEO HOẠT ĐỘNG */}
          {activeTab === 'preset' && (
            <div className="space-y-2 bg-white/90 p-2.5 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-800">
                  Tiêu chí chuẩn cho "{config.subject}":
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllPreset}
                  className="text-[10px] text-blue-700 hover:text-blue-900 font-bold hover:underline"
                >
                  Chọn tất cả
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {defaultCodes.map(code => {
                  const crit = getCriteria388ByCode(code);
                  const isChecked = selectedCodes.includes(code);
                  return (
                    <div
                      key={code}
                      onClick={() => toggleCode(code)}
                      className={`p-2 rounded-lg border text-[11px] cursor-pointer transition-all flex items-start gap-2 ${
                        isChecked
                          ? 'bg-blue-50/90 border-blue-400 text-blue-950 font-medium'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 text-blue-700">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 leading-snug">
                        <span className="font-bold text-blue-800 mr-1.5">[{code}]</span>
                        <span className="text-slate-800">{crit ? crit.content : code}</span>
                        {crit && (
                          <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">
                            {crit.domainName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: NGÂN HÀNG TIÊU CHÍ TOÀN DIỆN (TRA CỨU & TÍCH CHỌN) */}
          {activeTab === 'bank' && (
            <div className="space-y-2 bg-white/90 p-2.5 rounded-lg border border-blue-200">
              {/* Ô TÌM KIẾM */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã (NT 3.1, TC 1.1...) hoặc từ khóa..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* BỘ LỌC 5 LĨNH VỰC */}
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'TC', label: 'Thể chất (TC)' },
                  { id: 'TX', label: 'Tình cảm - XH (TX)' },
                  { id: 'NN', label: 'Ngôn ngữ (NN)' },
                  { id: 'NT', label: 'Nhận thức (NT)' },
                  { id: 'NgT', label: 'Nghệ thuật (NgT)' }
                ].map(domain => (
                  <button
                    key={domain.id}
                    type="button"
                    onClick={() => setSelectedDomainFilter(domain.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      selectedDomainFilter === domain.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {domain.label}
                  </button>
                ))}
              </div>

              {/* DANH SÁCH TIÊU CHÍ */}
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                {filteredBank.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-3 italic">
                    Không tìm thấy tiêu chí phù hợp với "{searchQuery}"
                  </p>
                ) : (
                  filteredBank.map(item => {
                    const isChecked = selectedCodes.includes(item.code);
                    return (
                      <div
                        key={item.code}
                        onClick={() => toggleCode(item.code)}
                        className={`p-2 rounded-lg border text-[11px] cursor-pointer transition-all flex items-start gap-2 ${
                          isChecked
                            ? 'bg-blue-50/90 border-blue-400 text-blue-950 font-medium'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0 text-blue-700">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 leading-snug">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-bold text-blue-800">[{item.code}]</span>
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded border font-semibold ${getDomainBadgeColor(
                                item.domain
                              )}`}
                            >
                              {item.domainName}
                            </span>
                            {item.targetType && (
                              <span className="text-[9px] text-slate-400">
                                ({item.targetType === 'knowledge' ? 'Kiến thức' : item.targetType === 'skill' ? 'Kỹ năng' : 'Thái độ/Phẩm chất'})
                              </span>
                            )}
                          </div>
                          <p className="text-slate-800 text-[11px]">{item.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DÁN HOẶC NHẬP TIÊU CHÍ TỰ DO */}
          {activeTab === 'custom' && (
            <div className="space-y-2 bg-white/90 p-2.5 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-900 flex items-center gap-1">
                  <ClipboardPaste className="w-3 h-3 text-blue-600" />
                  <span>Dán tiêu chí theo QĐ 388 từ bên ngoài:</span>
                </span>
                {config.custom388CriteriaText && (
                  <button
                    type="button"
                    onClick={() => onChangeConfig({ custom388CriteriaText: '' })}
                    className="text-[9px] text-rose-600 hover:underline font-semibold"
                  >
                    Xóa
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                value={config.custom388CriteriaText || ''}
                onChange={e =>
                  onChangeConfig({
                    custom388CriteriaText: e.target.value,
                    enablePreschool388Criteria: true
                  })
                }
                placeholder="Dán hoặc gõ tiêu chí yêu cầu cần đạt (kèm mã nếu có)...&#10;Ví dụ:&#10;- NT 3.1: Mô tả đặc điểm đồ chơi và nguyên vật liệu tạo hình.&#10;- TX 4.4: Hợp tác chia sẻ đồ chơi cùng bạn bè."
                className="w-full text-xs p-2 bg-slate-50 rounded-lg border border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800 placeholder:text-slate-400 resize-y leading-snug"
              />
              <p className="text-[10px] text-slate-500 italic">
                AI sẽ tích hợp chính xác các tiêu chí này vào phần Kiến thức & Kỹ năng trong Mục tiêu bài dạy.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
