import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, Sparkles, BookOpen, X, Layers } from 'lucide-react';
import { MAM_NON_NEW_ACTIVITIES, MAM_NON_TRADITIONAL_DOMAINS } from '../data/curriculumData';

interface CustomSubjectSelectProps {
  value: string;
  onChange: (newValue: string) => void;
  subjects: string[];
  schoolLevel: string;
}

export const CustomSubjectSelect: React.FC<CustomSubjectSelectProps> = ({
  value,
  onChange,
  subjects,
  schoolLevel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activePreschoolTab, setActivePreschoolTab] = useState<'all' | 'traditional' | 'new388'>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const isSelectedNewActivity = schoolLevel === 'Mầm non' && MAM_NON_NEW_ACTIVITIES.includes(value);

  // Filter subjects based on search term
  const filteredSubjects = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return subjects;
    return subjects.filter((s) => s.toLowerCase().includes(term));
  }, [subjects, searchTerm]);

  // For preschool, group items into Traditional vs New QĐ 388
  const { traditionalPreschool, newPreschool } = useMemo(() => {
    if (schoolLevel !== 'Mầm non') {
      return { traditionalPreschool: [], newPreschool: [] };
    }
    const trad: string[] = [];
    const nw: string[] = [];
    filteredSubjects.forEach((s) => {
      if (MAM_NON_NEW_ACTIVITIES.includes(s)) {
        nw.push(s);
      } else {
        trad.push(s);
      }
    });
    return { traditionalPreschool: trad, newPreschool: nw };
  }, [filteredSubjects, schoolLevel]);

  const handleSelect = (subj: string) => {
    onChange(subj);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer shadow-xs transition-all text-left ${
          isSelectedNewActivity
            ? 'bg-blue-50/60 border-blue-300 text-blue-800 font-bold hover:bg-blue-50 ring-1 ring-blue-200'
            : 'bg-[#f8fafc] border-slate-300 text-slate-900 hover:bg-white focus:bg-white hover:border-slate-400'
        } ${isOpen ? 'ring-2 ring-amber-500 border-amber-500 bg-white' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate flex-1 pr-2">
          {value ? (
            <span className="flex items-center gap-1.5 flex-wrap">
              {isSelectedNewActivity ? (
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase shrink-0 flex items-center gap-0.5 border border-blue-200">
                  <Sparkles className="w-2.5 h-2.5" />
                  QĐ 388
                </span>
              ) : schoolLevel === 'Mầm non' ? (
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase shrink-0 flex items-center gap-0.5 border border-emerald-200">
                  <BookOpen className="w-2.5 h-2.5" />
                  Lĩnh vực
                </span>
              ) : null}
              <span className={isSelectedNewActivity ? 'font-bold text-blue-900' : 'text-slate-900'}>
                {value}
              </span>
            </span>
          ) : (
            <span className="text-slate-400 font-normal">-- Chọn môn học / lĩnh vực --</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-600' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu with scrollbar */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-[100] bg-white rounded-xl border border-slate-300 shadow-2xl ring-1 ring-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ minWidth: '100%' }}
        >
          {/* Quick Search Header */}
          <div className="p-2 border-b border-slate-200 bg-slate-50/80 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm nhanh môn / lĩnh vực..."
              className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 cursor-pointer shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick tab filter if Preschool */}
          {schoolLevel === 'Mầm non' && (
            <div className="p-1.5 bg-amber-50/50 border-b border-amber-100 flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setActivePreschoolTab('all')}
                className={`px-2 py-1 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                  activePreschoolTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setActivePreschoolTab('traditional')}
                className={`px-2 py-1 rounded-md text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activePreschoolTab === 'traditional'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Lĩnh vực mầm non</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePreschoolTab('new388')}
                className={`px-2 py-1 rounded-md text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activePreschoolTab === 'new388'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-blue-800 hover:bg-blue-50'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>8 Hoạt động mới (QĐ 388)</span>
              </button>
            </div>
          )}

          {/* Scrollable list container */}
          <div className="max-h-48 sm:max-h-56 overflow-y-auto scrollbar-thin p-1.5 space-y-2">
            {schoolLevel === 'Mầm non' ? (
              <>
                {/* 1. Traditional Preschool Domains */}
                {(activePreschoolTab === 'all' || activePreschoolTab === 'traditional') && traditionalPreschool.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 rounded-md flex items-center gap-1.5 mb-1 border border-emerald-100">
                      <BookOpen className="w-3 h-3 text-emerald-600" />
                      <span>Lĩnh vực phát triển mầm non</span>
                    </div>
                    <div className="space-y-0.5">
                      {traditionalPreschool.map((subj) => {
                        const isSelected = value === subj;
                        return (
                          <button
                            key={subj}
                            type="button"
                            onClick={() => handleSelect(subj)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-emerald-100 text-emerald-950 font-bold ring-1 ring-emerald-300'
                                : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950'
                            }`}
                          >
                            <span className="truncate">{subj}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. New Activities under QD 388 */}
                {(activePreschoolTab === 'all' || activePreschoolTab === 'new388') && newPreschool.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[11px] font-bold text-blue-800 uppercase tracking-wider bg-blue-50 rounded-md flex items-center gap-1.5 mb-1 mt-1 border border-blue-100">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>8 Hoạt động phát triển mới (Theo QĐ 388)</span>
                    </div>
                    <div className="space-y-0.5">
                      {newPreschool.map((subj) => {
                        const isSelected = value === subj;
                        return (
                          <button
                            key={subj}
                            type="button"
                            onClick={() => handleSelect(subj)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-blue-100 text-blue-950 font-bold ring-1 ring-blue-300'
                                : 'text-blue-900 hover:bg-blue-50/80'
                            }`}
                          >
                            <span className="truncate">{subj}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {traditionalPreschool.length === 0 && newPreschool.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Không tìm thấy môn học / lĩnh vực phù hợp
                  </div>
                )}
              </>
            ) : (
              /* Non-preschool subjects (Primary, Lower Sec, Upper Sec) */
              <>
                {filteredSubjects.length > 0 ? (
                  <div className="space-y-0.5">
                    {filteredSubjects.map((subj) => {
                      const isSelected = value === subj;
                      return (
                        <button
                          key={subj}
                          type="button"
                          onClick={() => handleSelect(subj)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-amber-100/80 text-amber-950 font-bold'
                              : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950'
                          }`}
                        >
                          <span className="truncate">{subj}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Không tìm thấy môn học phù hợp
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
