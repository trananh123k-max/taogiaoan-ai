import React, { useState } from 'react';
import { ActivityDetail, ImageSlot } from '../types';
import { MathRenderer } from './MathRenderer';
import { parseActivityPairs, cleanPreschoolBulletLine } from '../utils/preschoolUtils';
import { Edit3, Sparkles, Check, X, Loader2, Wand2 } from 'lucide-react';

interface PreschoolSingleTableProps {
  activities: ActivityDetail[];
  imageSlots: ImageSlot[];
  onRefineActivity?: (activity: ActivityDetail, instruction: string) => void;
  onManualEditActivity?: (activity: ActivityDetail) => void;
  isRefining?: boolean;
}

export const PreschoolSingleTable: React.FC<PreschoolSingleTableProps> = ({
  activities = [],
  imageSlots = [],
  onRefineActivity,
  onManualEditActivity,
  isRefining = false,
}) => {
  const slotMap = new Map<string, ImageSlot>();
  (imageSlots || []).forEach((slot) => {
    if (slot && slot.slotTag) slotMap.set(slot.slotTag.trim(), slot);
  });
  const safeActivities = Array.isArray(activities) ? activities : [];

  // State for which activity is being manually edited or refined
  const [editingActIdx, setEditingActIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editTeacherAction, setEditTeacherAction] = useState('');
  const [editStudentAction, setEditStudentAction] = useState('');

  const [refiningActIdx, setRefiningActIdx] = useState<number | null>(null);
  const [refinePrompt, setRefinePrompt] = useState('');

  const handleStartEdit = (act: ActivityDetail, idx: number) => {
    setEditingActIdx(idx);
    setRefiningActIdx(null);
    setEditName(act.name || '');
    setEditTeacherAction(act.step1?.teacherAction || '');
    setEditStudentAction(act.step1?.studentAction || '');
  };

  const handleSaveEdit = (originalAct: ActivityDetail) => {
    if (!onManualEditActivity) return;
    const updatedAct: ActivityDetail = {
      ...originalAct,
      name: editName.trim() || originalAct.name,
      step1: {
        ...(originalAct.step1 || {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: '',
          studentAction: '',
          productExpected: '',
        }),
        teacherAction: editTeacherAction.trim(),
        studentAction: editStudentAction.trim(),
      },
    };
    onManualEditActivity(updatedAct);
    setEditingActIdx(null);
  };

  const handleCancelEdit = () => {
    setEditingActIdx(null);
  };

  const handleStartRefine = (idx: number) => {
    setRefiningActIdx(refiningActIdx === idx ? null : idx);
    setEditingActIdx(null);
    setRefinePrompt('');
  };

  const handleApplyRefine = (act: ActivityDetail) => {
    if (!refinePrompt.trim() || !onRefineActivity) return;
    onRefineActivity(act, refinePrompt.trim());
    setRefiningActIdx(null);
    setRefinePrompt('');
  };

  const refineSuggestions = [
    'Thêm trò chơi vận động gây hứng thú',
    'Tăng câu hỏi tương tác và gợi mở cho trẻ',
    'Bổ sung tình huống thực tế sinh động',
    'Tích hợp âm nhạc, vỗ tay và nhún nhảy',
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="bg-white border-2 border-slate-400 rounded-xl shadow-xs overflow-hidden transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse bg-white text-[14pt]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 text-[14pt] font-bold border-b-2 border-slate-400">
                <th className="w-7/12 p-3.5 sm:p-4 border-r-2 border-slate-400 text-center font-bold text-[14pt]">
                  <span>Hoạt động của Cô</span>
                </th>
                <th className="w-5/12 p-3.5 sm:p-4 text-center font-bold text-[14pt]">
                  <span>Hoạt động của Trẻ</span>
                </th>
              </tr>
            </thead>
            <tbody className="text-[14pt]">
              {safeActivities.map((act, actIdx) => {
                const isCurrentEditing = editingActIdx === actIdx;
                const isCurrentRefining = refiningActIdx === actIdx;
                const pairRows = parseActivityPairs(act);

                return (
                  <React.Fragment key={act.id || `act-block-${actIdx}`}>
                    {/* Activity Toolbar Bar */}
                    <tr className="bg-amber-50/70 border-t-2 border-b border-amber-200">
                      <td colSpan={2} className="px-3.5 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-xs font-black bg-amber-600 text-white shadow-2xs">
                              HĐ {act.index || actIdx + 1}
                            </span>
                            <span className="font-bold text-amber-950 text-sm sm:text-base">
                              {act.name || `Hoạt động ${act.index || actIdx + 1}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 print:hidden">
                            {onManualEditActivity && !isCurrentEditing && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(act, actIdx)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-amber-500 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                title="Chỉnh sửa nội dung hoạt động của Cô và Trẻ thủ công"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                <span>Sửa thủ công</span>
                              </button>
                            )}

                            {onRefineActivity && !isCurrentEditing && (
                              <button
                                type="button"
                                onClick={() => handleStartRefine(actIdx)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                  isCurrentRefining
                                    ? 'bg-amber-600 border-amber-600 text-white'
                                    : 'bg-white border-slate-300 hover:border-amber-500 hover:bg-amber-50 text-slate-700 hover:text-amber-800'
                                }`}
                                title="Dùng AI tinh chỉnh nâng cao hoạt động mầm non này"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>Tinh chỉnh AI</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* AI Refine Bar Dropdown */}
                        {isCurrentRefining && (
                          <div className="mt-3 p-3 bg-white border border-amber-300 rounded-xl shadow-xs space-y-2.5 animate-fadeIn print:hidden">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <Wand2 className="w-4 h-4 text-amber-600" />
                                Tinh chỉnh Hoạt động {act.index || actIdx + 1} bằng AI:
                              </span>
                              <button
                                type="button"
                                onClick={() => setRefiningActIdx(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Quick Suggestion Chips */}
                            <div className="flex flex-wrap gap-1.5">
                              {refineSuggestions.map((sug, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => setRefinePrompt(sug)}
                                  className="text-[11px] font-medium px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                                >
                                  + {sug}
                                </button>
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={refinePrompt}
                                onChange={(e) => setRefinePrompt(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleApplyRefine(act);
                                  }
                                }}
                                placeholder="Nhập yêu cầu điều chỉnh (ví dụ: bổ sung trò chơi, tăng câu hỏi gợi mở...)"
                                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleApplyRefine(act)}
                                disabled={isRefining || !refinePrompt.trim()}
                                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
                              >
                                {isRefining ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Đang xử lý...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Áp dụng AI</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Manual Editing Mode Rows */}
                    {isCurrentEditing ? (
                      <tr className="bg-amber-50/30 border-b-2 border-slate-300">
                        <td colSpan={2} className="p-4 space-y-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Tên hoạt động:</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-700">Hoạt động của Cô (mỗi dòng một ý, dùng dấu - hoặc +):</label>
                              <textarea
                                rows={8}
                                value={editTeacherAction}
                                onChange={(e) => setEditTeacherAction(e.target.value)}
                                placeholder="- Cô giới thiệu bài...\n- Cô hát mẫu kết hợp cử chỉ..."
                                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-700">Hoạt động của Trẻ (mỗi dòng một ý, dùng dấu - hoặc +):</label>
                              <textarea
                                rows={8}
                                value={editStudentAction}
                                onChange={(e) => setEditStudentAction(e.target.value)}
                                placeholder="- Trẻ quan sát cô...\n- Trẻ hưởng ứng nhún nhảy..."
                                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Hủy</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(act)}
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Lưu thay đổi</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      /* Standard Display Rows */
                      pairRows.map((row, rIdx) => {
                        const rowKey = `act-${actIdx}-row-${rIdx}`;
                        if (row.type === 'title') {
                          return (
                            <tr key={rowKey} className="border-b-0">
                              <td className="w-7/12 p-3 sm:p-3.5 border-r border-slate-300 align-top font-bold text-slate-900 text-[14pt] text-left">
                                {row.teacherText}
                              </td>
                              <td className="w-5/12 p-3 sm:p-3.5 align-top text-slate-900 text-[14pt]"></td>
                            </tr>
                          );
                        }

                        if (row.type === 'subheader') {
                          return (
                            <tr key={rowKey} className="border-b-0">
                              <td className="w-7/12 p-2 sm:p-2.5 pl-5 border-r border-slate-300 align-top font-bold text-slate-800 text-[14pt] text-left">
                                <MathRenderer text={row.teacherText} slotMap={slotMap} />
                              </td>
                              <td className="w-5/12 p-2 sm:p-2.5 align-top text-slate-900 text-[14pt]"></td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={rowKey} className="border-b-0">
                            <td className="w-7/12 p-2.5 sm:p-3 border-r border-slate-300 align-top text-slate-900 text-justify text-[14pt] leading-relaxed">
                              {row.teacherText ? (
                                <MathRenderer text={cleanPreschoolBulletLine(row.teacherText)} slotMap={slotMap} />
                              ) : null}
                            </td>
                            <td className="w-5/12 p-2.5 sm:p-3 align-top text-slate-900 text-justify text-[14pt] leading-relaxed">
                              {row.studentText ? (
                                <MathRenderer text={cleanPreschoolBulletLine(row.studentText)} slotMap={slotMap} />
                              ) : null}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
