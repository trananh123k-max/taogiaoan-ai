import React, { useState } from 'react';
import {
  ActivityDetail,
  ImageSlot,
  StepDetail,
} from '../types';
import {
  Sparkles,
  Edit3,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { repairAnswerLineBreaks, dedupeAnswers, stripNlsIntegrationTags } from '../utils/docxExporter';

interface PedagogicalTableProps {
  activity: ActivityDetail;
  imageSlots: ImageSlot[];
  onRefineActivity: (activity: ActivityDetail, instruction: string) => void;
  onManualEditActivity?: (activity: ActivityDetail) => void;
  isRefining?: boolean;
  isPreschool?: boolean;
  tableLayout?: 'two_column' | 'standard_row' | 'math_4_column';
}

export const PedagogicalTable: React.FC<PedagogicalTableProps> = ({
  activity,
  imageSlots,
  onRefineActivity,
  onManualEditActivity,
  isRefining = false,
  isPreschool = false,
  tableLayout = 'two_column',
}) => {
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedActivity, setEditedActivity] = useState<ActivityDetail>(activity || ({} as any));

  React.useEffect(() => {
    if (activity) setEditedActivity(activity);
  }, [activity]);

  if (!activity) return null;

  const slotMap = new Map<string, ImageSlot>();
  (imageSlots || []).forEach((slot) => {
    if (slot?.slotTag) {
      slotMap.set(slot.slotTag.trim(), slot);
    }
  });

  const handleApplyRefine = () => {
    if (!refinePrompt.trim()) return;
    onRefineActivity(activity, refinePrompt);
    setShowRefineInput(false);
    setRefinePrompt('');
  };

  const handleSaveEdit = () => {
    if (onManualEditActivity) {
      onManualEditActivity(editedActivity);
    }
    setIsEditing(false);
  };

  const steps: { key: 'step1'|'step2'|'step3'|'step4'; detail: StepDetail; number: number; label: string }[] = [
    {
      key: 'step1',
      detail: isEditing ? editedActivity.step1 : activity.step1,
      number: 1,
      label: 'Bước 1: Chuyển giao nhiệm vụ học tập',
    },
    {
      key: 'step2',
      detail: isEditing ? editedActivity.step2 : activity.step2,
      number: 2,
      label: 'Bước 2: Thực hiện nhiệm vụ học tập',
    },
    {
      key: 'step3',
      detail: isEditing ? editedActivity.step3 : activity.step3,
      number: 3,
      label: 'Bước 3: Báo cáo kết quả và thảo luận',
    },
    {
      key: 'step4',
      detail: isEditing ? editedActivity.step4 : activity.step4,
      number: 4,
      label: 'Bước 4: Kết luận, nhận định',
    },
  ];

  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-xs overflow-hidden mb-6 transition-all">
      {/* Activity Header Bar (Clean White Background, No Ink Waste) */}
      <div className="bg-white border-b border-slate-300 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-slate-900">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 border border-slate-300 text-slate-900">
              HĐ {activity.index}
            </span>
            {isEditing ? (
              <input
                type="text"
                value={editedActivity.name}
                onChange={(e) => setEditedActivity({ ...editedActivity, name: e.target.value })}
                className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase bg-slate-50 border border-slate-300 rounded px-2 w-full max-w-lg"
              />
            ) : (
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase">
                {activity.name}
              </h3>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action button to edit this specific activity */}
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Sửa thủ công</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditedActivity(activity); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 transition-all cursor-pointer shadow-2xs"
              >
                <span>Hủy</span>
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 transition-all cursor-pointer shadow-2xs"
              >
                <span>Lưu thay đổi</span>
              </button>
            </>
          )}

          {/* Action button to refine this specific activity */}
          <button
            type="button"
            onClick={() => setShowRefineInput(!showRefineInput)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>{showRefineInput ? 'Đóng gợi ý' : 'Tinh chỉnh AI'}</span>
          </button>
        </div>
      </div>

      {/* Refinement input drawer */}
      {showRefineInput && (
        <div className="p-4 bg-white border-b border-slate-200 text-slate-800">
          <label className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-amber-700" />
            <span>Yêu cầu AI nâng cấp hoạt động này:</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyRefine()}
              placeholder="Ví dụ: Bổ sung câu hỏi gợi mở, cập nhật bài tập thực tế..."
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 shadow-2xs"
            />
            <button
              type="button"
              onClick={handleApplyRefine}
              disabled={isRefining || !refinePrompt.trim()}
              className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              {isRefining ? 'Đang tinh chỉnh...' : 'Cập nhật'}
            </button>
          </div>
        </div>
      )}


      {tableLayout === 'math_4_column' ? (
        <div className="overflow-x-auto w-full mb-2">
          <table className="w-full text-left border-collapse bg-white text-[14pt]">
            <thead>
              <tr className="bg-blue-800 text-white font-bold border border-slate-300">
                <th className="w-[45%] p-3 border border-slate-300 text-center">
                  <div className="uppercase font-bold text-[13pt]">HOẠT ĐỘNG CỦA GIÁO VIÊN VÀ HỌC SINH</div>
                  <div className="font-normal text-[11pt]">(GV làm gì, HS làm gì...)</div>
                </th>
                <th className="w-[35%] p-3 border border-slate-300 text-center">
                  <div className="uppercase font-bold text-[13pt]">SẢN PHẨM DỰ KIẾN</div>
                  <div className="font-normal text-[11pt]">(YCCĐ của hoạt động với HS)</div>
                </th>
                <th className="w-[10%] p-2 border border-slate-300 text-center leading-tight">
                  <div className="font-bold text-[12pt]">Năng<br/>lực số</div>
                </th>
                <th className="w-[10%] p-2 border border-slate-300 text-center leading-tight">
                  <div className="font-bold text-[12pt]">Giáo<br/>dục AI</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="p-3 border border-slate-300 align-top space-y-3 text-justify text-[13pt]">
                  <div><span className="font-bold">Mục tiêu:</span> <MathRenderer text={stripNlsIntegrationTags(activity.objective)} slotMap={slotMap} className="inline" suppressNlsTags /></div>
                  <div><span className="font-bold">Nội dung:</span> <MathRenderer text={stripNlsIntegrationTags(activity.content)} slotMap={slotMap} className="inline" suppressNlsTags /></div>
                  <div className="font-bold">Tổ chức thực hiện:</div>
                  <div className="space-y-3">
                    {steps.map(({ key, detail, label }) => {
                      if (!detail) return null;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="font-bold">{detail.title || label}</div>
                          {detail.teacherAction && detail.teacherAction.trim() && (
                            <div className="pl-1">
                              {(!(/^(-|\*)?\s*(GV|Giáo viên)\b/i.test(detail.teacherAction.trim())) && !(/^\*\s*(GV|HS)/i.test(detail.title || ''))) && (
                                <span className="font-bold">- Giáo viên: </span>
                              )}
                              <MathRenderer text={stripNlsIntegrationTags(detail.teacherAction)} slotMap={slotMap} className="inline" suppressNlsTags />
                            </div>
                          )}
                          {detail.studentAction && detail.studentAction.trim() && (
                            <div className="pl-1">
                              {(!(/^(-|\*)?\s*(HS|Học sinh)\b/i.test(detail.studentAction.trim())) && !(/^\*\s*(GV|HS)/i.test(detail.title || ''))) && (
                                <span className="font-bold">- Học sinh: </span>
                              )}
                              <MathRenderer text={stripNlsIntegrationTags(detail.studentAction)} slotMap={slotMap} className="inline" suppressNlsTags />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="p-3 border border-slate-300 align-top space-y-2 text-justify text-[13pt]">
                  <div className="font-bold italic">Dự kiến sản phẩm:</div>
                  {getProductContents(steps, activity).map((content, idx) => (
                    <div key={idx} className="whitespace-pre-line">
                      <MathRenderer text={stripNlsIntegrationTags(formatDashBulletText(content))} slotMap={slotMap} suppressNlsTags />
                    </div>
                  ))}
                </td>
                <td className="p-2 border border-slate-300 align-top text-center text-red-700 font-bold whitespace-pre-line text-[11pt]">
                  {(activity.nlsFocus || '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean).map((nls, i) => (
                    <div key={i}>{nls}</div>
                  ))}
                </td>
                <td className="p-2 border border-slate-300 align-top text-center text-blue-700 font-bold whitespace-pre-line text-[11pt]">
                  {(activity.aiFocus || '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean).map((ai, i) => (
                    <div key={i}>{ai}</div>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <>
      {/* Activity Objectives & Core Content Box (Strict CV 5512 Format) */}
      {!isPreschool && (
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 space-y-2 text-[13pt] text-slate-800 leading-relaxed text-justify">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <span className="font-bold text-slate-900 block mb-1">a) Mục tiêu: </span>
                <textarea
                  value={editedActivity.objective}
                  onChange={(e) => setEditedActivity({ ...editedActivity, objective: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-blue-500"
                  rows={2}
                />
              </div>
              <div>
                <span className="font-bold text-slate-900 block mb-1">b) Nội dung: </span>
                <textarea
                  value={editedActivity.content}
                  onChange={(e) => setEditedActivity({ ...editedActivity, content: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-blue-500"
                  rows={2}
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <span className="font-bold text-slate-900">a) Mục tiêu: </span>
                <MathRenderer text={activity.objective} slotMap={slotMap} className="inline" />
              </div>
              <div>
                <span className="font-bold text-slate-900">b) Nội dung: </span>
                <MathRenderer text={activity.content} slotMap={slotMap} className="inline" />
              </div>
            </>
          )}
        </div>
      )}

      {/* THE 2-COLUMN TABLE (Single continuous box without dividing lines between Steps 1,2,3,4) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse bg-white text-[14pt]">
          <thead>
            <tr className="bg-white text-slate-900 text-[14pt] font-bold border-y-2 border-slate-300">
              <th className="w-7/12 p-3.5 sm:p-4 border-r border-slate-300 text-center font-bold text-[14pt]">
                <span>{isPreschool ? 'Hoạt động của giáo viên' : 'Hoạt động của GV và HS'}</span>
              </th>
              <th className="w-5/12 p-3.5 sm:p-4 text-center font-bold text-[14pt]">
                <span>{isPreschool ? 'Hoạt động của trẻ' : 'Sản phẩm'}</span>
              </th>
            </tr>
          </thead>
          <tbody className="text-[14pt]">
            <tr className="bg-white">
              {/* Left Column: All 4 Steps continuous without horizontal table row divisions */}
              <td className="p-4 sm:p-5 border-r border-slate-300 align-top space-y-6 bg-white text-slate-900 text-justify text-[14pt]">
                {steps.map(({ key, detail, label }) => {
                  if (!detail || (isPreschool && !detail.teacherAction)) return null;
                  return (
                  <div key={key} className="space-y-2.5">
                    {!isPreschool && (
                      <div className="font-bold text-slate-900 text-[14pt]">
                        {detail.title || label}
                      </div>
                    )}
                    {detail.teacherAction && detail.teacherAction.trim() && (
                      <div className="space-y-1">
                        {(!isPreschool && !(/^(-|\*)?\s*(GV|Giáo viên)\b/i.test(detail.teacherAction.trim())) && !(/^\*\s*(GV|HS)/i.test(detail.title || ''))) && (
                          <div className="font-bold text-slate-900 text-[14pt]">
                            - Giáo viên:
                          </div>
                        )}
                        <div className="text-slate-800 leading-relaxed whitespace-pre-line text-justify text-[14pt]">
                        {isEditing ? (
                          <textarea
                            value={detail.teacherAction}
                            onChange={(e) => {
                              const newAct = { ...editedActivity };
                              newAct[key] = { ...newAct[key], teacherAction: e.target.value };
                              setEditedActivity(newAct);
                            }}
                            className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-blue-500 mt-1"
                            rows={3}
                          />
                        ) : (
                          <MathRenderer
                            text={formatDashBulletText(detail.teacherAction)}
                            slotMap={slotMap}
                          />
                        )}
                        </div>
                      </div>
                    )}
                    {!isPreschool && detail.studentAction && detail.studentAction.trim() && (
                      <div className="space-y-1">
                        {!(/^(-|\*)?\s*(HS|Học sinh)\b/i.test(detail.studentAction.trim())) && !(/^\*\s*(GV|HS)/i.test(detail.title || '')) && (
                          <div className="font-bold text-slate-900 text-[14pt]">
                            - Học sinh:
                          </div>
                        )}
                        <div className="text-slate-800 leading-relaxed whitespace-pre-line text-justify text-[14pt]">
                          {isEditing ? (
                            <textarea
                              value={detail.studentAction}
                              onChange={(e) => {
                                const newAct = { ...editedActivity };
                                newAct[key] = { ...newAct[key], studentAction: e.target.value };
                                setEditedActivity(newAct);
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-blue-500 mt-1"
                              rows={3}
                            />
                          ) : (
                            <MathRenderer
                              text={formatDashBulletText(detail.studentAction)}
                              slotMap={slotMap}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )})}
              </td>

              {/* Right Column: Sản phẩm học tập / Kết quả thực hiện & Kiến thức cần ghi nhớ */}
              <td className="p-4 sm:p-5 align-top bg-white text-slate-900 leading-relaxed text-justify space-y-4 text-[14pt]">
                {isPreschool ? (
                  <div className="space-y-6">
                    {steps.map(({ key, detail }) => {
                      if (!detail || !detail.studentAction) return null;
                      return (
                        <div key={key} className="text-slate-800 leading-relaxed text-justify whitespace-pre-line text-[14pt]">
                          {isEditing ? (
                            <textarea
                              value={detail.studentAction}
                              onChange={(e) => {
                                const newAct = { ...editedActivity };
                                newAct[key] = { ...newAct[key], studentAction: e.target.value };
                                setEditedActivity(newAct);
                              }}
                              className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-blue-500 mt-1"
                              rows={3}
                            />
                          ) : (
                            <MathRenderer
                              text={formatDashBulletText(detail.studentAction)}
                              slotMap={slotMap}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : isEditing ? (
                  <div className="space-y-4">
                    {steps.map(({ key, detail, label }) => (
                      <div key={key} className="space-y-1">
                        <div className="font-bold text-slate-700 text-sm">{label} - Sản phẩm:</div>
                        <textarea
                          value={detail.productExpected || ''}
                          onChange={(e) => {
                            const newAct = { ...editedActivity };
                            newAct[key] = { ...newAct[key], productExpected: e.target.value };
                            setEditedActivity(newAct);
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded p-2 focus:outline-none focus:border-blue-500 text-[14pt]"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  getProductContents(steps, activity).map((content, idx) => (
                    <div key={idx} className="text-slate-800 leading-relaxed text-justify whitespace-pre-line text-[14pt]">
                      <MathRenderer
                        text={formatDashBulletText(content)}
                        slotMap={slotMap}
                      />
                    </div>
                  ))
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
};

/**
 * Extracts and cleans the actual learning products, exercise solutions, and notebook content
 * without artificial 'Bước 1, 2, 3, 4' labels.
 */
function getProductContents(
  steps: Array<{ detail: StepDetail }>,
  activity: ActivityDetail
): string[] {
  const rawResults: string[] = [];

  steps.forEach(({ detail }) => {
    if (detail && detail.productExpected && detail.productExpected.trim()) {
      const cleaned = cleanProductContent(detail.productExpected);
      if (cleaned.trim() && !rawResults.includes(cleaned.trim())) {
        rawResults.push(cleaned.trim());
      }
    }
  });

  // Check if any product item has substantial textbook content (like "1. ", "2. ", definitions, etc.)
  const hasRichKnowledge = rawResults.some(r => /(?:^|\s)\d+\.\s+[A-ZÀ-Ỵ]/m.test(r) || r.length > 70);

  // Filter out generic procedural empty phrases if richer content exists
  const results = hasRichKnowledge
    ? rawResults.filter(r => {
        const isGeneric = /^(học sinh|hs|các nhóm|nội dung|kết quả)\s+(tiếp nhận|nắm rõ|hiểu rõ|lắng nghe|ổn định|bắt đầu|chuẩn bị|báo cáo|thực hiện|ghi chép|ghi vở|thảo luận)\b/i.test(r.trim()) && r.length < 90 && !/(?:^|\s)\d+\.\s+[A-ZÀ-Ỵ]/m.test(r);
        return !isGeneric;
      })
    : rawResults;

  // If no step products found, fallback to activity productSummary
  if (results.length === 0 && activity.productSummary && activity.productSummary.trim()) {
    results.push(cleanProductContent(activity.productSummary));
  }

  return results.length > 0 ? results : ['Học sinh hoàn thành câu hỏi, bài tập và ghi chép nội dung kiến thức trọng tâm vào vở.'];
}

/**
 * Cleans out any artificial '* Bước 1:', 'Bước 2:' label prefixes from product text
 */
function cleanProductContent(text: string): string {
  if (!text) return '';
  const repaired = repairAnswerLineBreaks(text);
  const deduped = dedupeAnswers(repaired);
  return deduped
    .split('\n')
    .map((line) => {
      let l = line.trim();
      if (!l) return '';
      // Remove placeholder text like "[Vị trí ảnh minh họa:...]" but PRESERVE {{IMAGE_SLOT_X}} tags
      l = l.replace(/\[\s*Vị trí ảnh[^\]]*\]/gi, '').trim();
      // Remove lines that are only "* Bước 1:", "Bước 1:", "Bước 2:"
      if (/^(\*|-)?\s*bước\s*\d+\s*[:\-–\.]?\s*$/i.test(l)) {
        return '';
      }
      // Remove leading "* Bước 1: " from start of sentence
      l = l.replace(/^(\*|-)?\s*bước\s*\d+\s*[:\-–\.]\s*/i, '');
      return l;
    })
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

/**
 * Ensures list items are prefixed with dash (-) instead of bullet dot or star,
 * while preserving numbered headings like "1. Thế giới kĩ thuật số", "2. ...", "a) ..."
 * and expanding any squashed inline numbers or bullets into distinct lines.
 */
function formatDashBulletText(text: string): string {
  if (!text) return '';
  let expandedText = repairAnswerLineBreaks(text);

  // 1. Separate squashed Roman numeral or numbered sections: e.g. "... II. TẦM QUAN TRỌNG..." or "... 2. Hỏi để có thông tin..."
  // DO NOT split if preceded by prefix words like "Câu", "Bài", "Mục", "Hình", "Ví dụ", "Bảng", "Bước", "Phần", "Hoạt động", "Nhiệm vụ", "Tiết", "Tuần", "HĐ", "NV"
  expandedText = expandedText.replace(/(?<!\b(?:Câu|Bài|Mục|Hình|Ví dụ|Bảng|Bước|Phần|Hoạt động|Nhiệm vụ|Tiết|Tuần|HĐ|NV)\s*)(?<=[.?!;:]|[a-zà-ỹA-ZÀ-Ỵ0-9])\s+([IVXLCDM]+\.\s+[A-ZÀ-Ỵ0-9])/g, '\n\n$1');
  expandedText = expandedText.replace(/(?<!\b(?:Câu|Bài|Mục|Hình|Ví dụ|Bảng|Bước|Phần|Hoạt động|Nhiệm vụ|Tiết|Tuần|HĐ|NV)\s*)(?<=[.?!;:]|[a-zà-ỹA-ZÀ-Ỵ0-9])\s+(\d+\.\s+[A-ZÀ-Ỵ0-9\?])/g, '\n\n$1');
  expandedText = expandedText.replace(/(?<!\b(?:Câu|Bài|Mục|Hình|Ví dụ|Bảng|Bước|Phần|Hoạt động|Nhiệm vụ|Tiết|Tuần|HĐ|NV)\s*)(?<=[.?!;:]|[a-zà-ỹA-ZÀ-Ỵ0-9])\s+(Câu\s+\d+[\.:\)])/gi, '\n\n$1');

  // 2. Separate squashed bullet points or sub-items:
  expandedText = expandedText.replace(/([.?!;])\s+(- |\* |• )/g, '$1\n$2');
  expandedText = expandedText.replace(/([.?!;])\s+([a-e]\)\s+)/g, '$1\n$2');

  // 3. Separate header from body if written on single line like "1. Thông tin và dữ liệu: Dữ liệu là nguyên liệu..."
  // or "I. THÔNG TIN VÀ DỮ LIỆU: 1. Thấy gì? Biết gì ?"
  expandedText = expandedText
    .split('\n')
    .map((line) => {
      // If Roman numeral + Numbered heading on same line:
      const romanNumberedMatch = line.match(/^(\s*[IVXLCDM]+\.\s+[^:\n]+:?)\s+(\d+\.\s+.+)$/);
      if (romanNumberedMatch) {
        return `${romanNumberedMatch[1].trim()}\n${romanNumberedMatch[2].trim()}`;
      }

      const match = line.match(/^(\s*(?:[IVXLCDM]+\.|\d+\.)\s+[^:\n]+:)\s+(.+)$/);
      if (match) {
        const header = match[1].trim();
        const body = match[2].trim();
        if (body) {
          const bodyWithDash = (/^[-•*]/.test(body) || /^\d+\./.test(body) || /^[IVXLCDM]+\./.test(body)) ? body : `- ${body}`;
          return `${header}\n${bodyWithDash}`;
        }
      }
      return line;
    })
    .join('\n');

  return expandedText
    .split('\n')
    .map((line) => {
      let trimmed = line.trim();
      if (!trimmed) return '';
      // Clean bracketed placeholders but PRESERVE {{IMAGE_SLOT_X}} tags
      trimmed = trimmed.replace(/\[\s*Vị trí ảnh[^\]]*\]/gi, '').trim();
      if (!trimmed || trimmed === '-' || trimmed === '•' || trimmed === '*') return '';
      
      // If line is already an image slot, a Roman numeral, numbered heading, [Tích hợp NLS], [Tích hợp AI], or NLS/AI indicator line, preserve as-is
      if (/^\{\{IMAGE_SLOT_\d+\}\}$/i.test(trimmed) || /^\s*(?:[IVXLCDM]+\.|\d+\.|\b[a-e]\)|\bNhiệm vụ\s+\d+:|\bMục\s+\d+:|\bCâu\s+\d+[:\.])/i.test(trimmed) || /^[IVXLCDM]+\.\s+/i.test(trimmed) || /\[Tích hợp [^\]]+\]/i.test(trimmed) || /\((?:NLS|AI)\s+[0-9a-zA-Z\.]+\)/i.test(trimmed)) {
        return trimmed;
      }

      // If starts with • or * or ., convert to -
      if (/^[•*]\s*/.test(trimmed)) {
        return '- ' + trimmed.replace(/^[•*]\s*/, '');
      }
      return trimmed;
    })
    .filter(Boolean)
    .join('\n');
}
