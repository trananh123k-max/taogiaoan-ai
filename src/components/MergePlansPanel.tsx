import React, { useState, useRef } from 'react';
import {
  Layers,
  FileText,
  UploadCloud,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Eye,
  Plus,
  CheckSquare,
  Square,
  Sparkles,
  CheckCircle2,
  FileCode2,
  Loader2,
  BookOpen,
  Info,
  Sliders,
} from 'lucide-react';
import { SavedPlanItem, LessonPlanOutput, ImageSlot } from '../types';
import { exportMultipleMergedLessonPlansToDocx } from '../utils/docxExporter';
import { parseDocxFile } from '../utils/docxParser';

interface MergePlansPanelProps {
  savedItems: SavedPlanItem[];
  onUpdateSavedItems: (items: SavedPlanItem[]) => void;
  currentPlan: LessonPlanOutput | null;
  imageSlots?: ImageSlot[];
  onViewPlanInTab2: (plan: LessonPlanOutput) => void;
  onGoToTab1: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function combineLessonPlans(selectedItems: SavedPlanItem[], customTitle?: string): LessonPlanOutput {
  const activeItems = selectedItems.filter((i) => i.selected);
  if (activeItems.length === 0) {
    throw new Error('Vui lòng chọn ít nhất 1 bài soạn để ghép');
  }

  // Sort by order sequence
  const sorted = [...activeItems].sort((a, b) => a.orderNumber - b.orderNumber);
  const firstPlan = sorted[0].plan;

  const titleList = sorted.map((item, idx) => `Bài ${idx + 1}: ${item.title || item.plan.lessonTitle || 'Bài dạy'}`);
  const combinedTitle = customTitle && customTitle.trim() !== ''
    ? customTitle.trim()
    : titleList.join(' - ');

  const combinedKnowledge: string[] = [];
  const combinedCompetencies: string[] = [];
  const combinedQualities: string[] = [];
  const combinedGeneralCompetencies: string[] = [];
  const combinedDigitalCompetencies: string[] = [];
  const combinedAiCompetencies: string[] = [];
  const combinedStemCompetencies: string[] = [];

  const combinedEquipmentTeacher: string[] = [];
  const combinedEquipmentStudent: string[] = [];

  const combinedActivities: LessonPlanOutput['activities'] = [];

  sorted.forEach((item, itemIdx) => {
    const p = item.plan;
    const prefix = sorted.length > 1 ? `[Bài ${itemIdx + 1}: ${item.title || p.lessonTitle}] ` : '';

    (p.objectives?.knowledge || []).forEach((k) => combinedKnowledge.push(`${prefix}${k}`));
    (p.objectives?.subjectCompetencies || []).forEach((c) => combinedCompetencies.push(`${prefix}${c}`));
    (p.objectives?.qualities || []).forEach((q) => combinedQualities.push(`${prefix}${q}`));
    (p.objectives?.generalCompetencies || []).forEach((g) => combinedGeneralCompetencies.push(`${prefix}${g}`));
    (p.objectives?.digitalCompetencies || []).forEach((d) => combinedDigitalCompetencies.push(`${prefix}${d}`));
    (p.objectives?.aiCompetencies || []).forEach((a) => combinedAiCompetencies.push(`${prefix}${a}`));
    (p.objectives?.stemCompetencies || []).forEach((s) => combinedStemCompetencies.push(`${prefix}${s}`));

    (p.equipment?.teacher || []).forEach((e) => combinedEquipmentTeacher.push(`${prefix}${e}`));
    (p.equipment?.student || []).forEach((e) => combinedEquipmentStudent.push(`${prefix}${e}`));

    (p.activities || []).forEach((act, actIdx) => {
      combinedActivities.push({
        ...act,
        id: `merged-act-${itemIdx + 1}-${actIdx + 1}`,
        name: sorted.length > 1 ? `[Bài ${itemIdx + 1}] ${act.name || `Hoạt động ${actIdx + 1}`}` : (act.name || `Hoạt động ${actIdx + 1}`),
      });
    });
  });

  return {
    ...firstPlan,
    lessonTitle: combinedTitle,
    objectives: {
      knowledge: Array.from(new Set(combinedKnowledge)),
      subjectCompetencies: Array.from(new Set(combinedCompetencies)),
      qualities: Array.from(new Set(combinedQualities)),
      generalCompetencies: Array.from(new Set(combinedGeneralCompetencies)),
      digitalCompetencies: Array.from(new Set(combinedDigitalCompetencies)),
      aiCompetencies: Array.from(new Set(combinedAiCompetencies)),
      stemCompetencies: Array.from(new Set(combinedStemCompetencies)),
    },
    equipment: {
      teacher: Array.from(new Set(combinedEquipmentTeacher)),
      student: Array.from(new Set(combinedEquipmentStudent)),
      digitalAssets: [],
    },
    activities: combinedActivities,
  };
}

export function MergePlansPanel({
  savedItems,
  onUpdateSavedItems,
  currentPlan,
  imageSlots = [],
  onViewPlanInTab2,
  onGoToTab1,
  showToast,
}: MergePlansPanelProps) {
  const [mergedTitle, setMergedTitle] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isUploadingDocx, setIsUploadingDocx] = useState(false);
  const docxFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-sort items by orderNumber
  const sortedItems = [...savedItems].sort((a, b) => a.orderNumber - b.orderNumber);
  const selectedCount = sortedItems.filter((i) => i.selected).length;

  const handleToggleSelect = (id: string) => {
    const updated = savedItems.map((item) =>
      item.id === id ? { ...item, selected: !item.selected } : item
    );
    onUpdateSavedItems(updated);
  };

  const handleToggleSelectAll = () => {
    const allSelected = sortedItems.length > 0 && sortedItems.every((i) => i.selected);
    const updated = savedItems.map((item) => ({ ...item, selected: !allSelected }));
    onUpdateSavedItems(updated);
  };

  const handleOrderChange = (id: string, newOrder: number) => {
    const targetOrder = Math.max(1, newOrder);
    const updated = savedItems.map((item) =>
      item.id === id ? { ...item, orderNumber: targetOrder } : item
    );
    // Sort again
    onUpdateSavedItems(updated.sort((a, b) => a.orderNumber - b.orderNumber));
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const list = [...sortedItems];
    const tempOrder = list[index].orderNumber;
    list[index].orderNumber = list[index - 1].orderNumber;
    list[index - 1].orderNumber = tempOrder;
    onUpdateSavedItems(list.sort((a, b) => a.orderNumber - b.orderNumber));
  };

  const handleMoveDown = (index: number) => {
    if (index >= sortedItems.length - 1) return;
    const list = [...sortedItems];
    const tempOrder = list[index].orderNumber;
    list[index].orderNumber = list[index + 1].orderNumber;
    list[index + 1].orderNumber = tempOrder;
    onUpdateSavedItems(list.sort((a, b) => a.orderNumber - b.orderNumber));
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    const updated = savedItems.map((item) =>
      item.id === id ? { ...item, title: newTitle, plan: { ...item.plan, lessonTitle: newTitle } } : item
    );
    onUpdateSavedItems(updated);
  };

  const handleDeleteItem = (id: string) => {
    const updated = savedItems.filter((item) => item.id !== id);
    // Re-index remaining items 1..N
    const reindexed = updated.map((item, idx) => ({ ...item, orderNumber: idx + 1 }));
    onUpdateSavedItems(reindexed);
    showToast('Đã xóa bài khỏi danh sách ghép', 'info');
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách bài đã lưu không?')) {
      onUpdateSavedItems([]);
      showToast('Đã xóa toàn bộ bài trong Tab 3', 'info');
    }
  };

  const handleAddCurrentPlan = () => {
    if (!currentPlan) {
      showToast('Chưa có bài soạn nào trong Tab 2 để lưu', 'error');
      return;
    }

    const nextOrder = savedItems.length + 1;
    const newItem: SavedPlanItem = {
      id: `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderNumber: nextOrder,
      title: currentPlan.lessonTitle || `Bài soạn ${nextOrder}`,
      subject: currentPlan.subject || 'Môn học',
      schoolLevel: (currentPlan as any).schoolLevel || 'Mầm non',
      grade: currentPlan.grade || 'Lớp',
      createdAt: new Date().toLocaleString('vi-VN', { hour12: false }),
      plan: currentPlan,
      selected: true,
    };

    onUpdateSavedItems([...savedItems, newItem]);
    showToast(`Đã lưu bài "${newItem.title}" vào Tab 3 ở vị trí ${nextOrder}`, 'success');
  };

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDocx(true);
    try {
      const parsedRes = await parseDocxFile(file);
      const parsedText = typeof parsedRes === 'string' ? parsedRes : parsedRes?.textWithSlots || '';
      const nextOrder = savedItems.length + 1;
      const cleanFileName = file.name.replace(/\.[^/.]+$/, '');

      // Build a parsed LessonPlanOutput from the Word document text
      const dummyStep = {
        title: cleanFileName,
        teacherAction: parsedText || 'Nội dung file đính kèm',
        studentAction: '',
        productExpected: '',
      };
      const uploadedPlan: LessonPlanOutput = {
        schoolName: 'Trường học',
        teacherName: 'Giáo viên',
        lessonTitle: cleanFileName,
        subject: 'Môn học',
        grade: 'Lớp',
        periods: 1,
        bookSeries: 'Kết nối tri thức với cuộc sống',
        objectives: {
          knowledge: ['Theo nội dung file Word đính kèm'],
          subjectCompetencies: [],
          qualities: [],
          generalCompetencies: [],
          digitalCompetencies: [],
          aiCompetencies: [],
          stemCompetencies: [],
        },
        equipment: { teacher: [], student: [], digitalAssets: [] },
        activities: [
          {
            id: 'act-upload-1',
            index: 1,
            name: cleanFileName,
            duration: '35 phút',
            objective: cleanFileName,
            content: parsedText,
            productSummary: '',
            step1: dummyStep,
            step2: dummyStep,
            step3: dummyStep,
            step4: dummyStep,
            steps: [dummyStep],
          },
        ],
        competencyMatrix: { nlsItems: [], aiItems: [] },
        appendix: {},
        imageSlotsUsed: [],
        generatedAt: new Date().toISOString(),
      };

      const newItem: SavedPlanItem = {
        id: `plan-file-${Date.now()}`,
        orderNumber: nextOrder,
        title: cleanFileName,
        subject: 'File Word tải lên',
        schoolLevel: 'Mầm non',
        grade: 'Gốc',
        createdAt: new Date().toLocaleString('vi-VN', { hour12: false }),
        plan: uploadedPlan,
        selected: true,
      };

      onUpdateSavedItems([...savedItems, newItem]);
      showToast(`Đã tải & lưu file "${file.name}" vào vị trí ${nextOrder}`, 'success');
    } catch (err: any) {
      showToast(`Lỗi đọc file: ${err.message || 'Không thể đọc file .docx'}`, 'error');
    } finally {
      setIsUploadingDocx(false);
      if (docxFileInputRef.current) docxFileInputRef.current.value = '';
    }
  };

  const handleExportMergedDocx = async () => {
    const selectedPlans = sortedItems.filter((item) => item.selected).map((item) => item.plan);
    if (selectedPlans.length === 0) {
      showToast('Vui lòng tích chọn ít nhất 1 bài soạn để ghép', 'error');
      return;
    }

    setIsExporting(true);
    try {
      const defaultName = mergedTitle.trim() || `Giao_an_ghep_${selectedPlans.length}_bai`;
      const ok = await exportMultipleMergedLessonPlansToDocx(selectedPlans, defaultName, imageSlots, 'two_column');
      if (ok) {
        showToast(`Đã xuất file Word bài ghép thành công!`, 'success');
      }
    } catch (err: any) {
      showToast(`Lỗi xuất file: ${err.message || 'Không thể ghép file'}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreviewMerged = () => {
    const selectedList = sortedItems.filter((i) => i.selected);
    if (selectedList.length === 0) {
      showToast('Vui lòng tích chọn ít nhất 1 bài soạn để xem trước', 'error');
      return;
    }

    try {
      const combined = combineLessonPlans(selectedList, mergedTitle);
      onViewPlanInTab2(combined);
      showToast('Đã chuyển sang Tab 2 để xem bài ghép!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Lỗi ghép bài', 'error');
    }
  };

  return (
    <div className="w-full space-y-5 text-slate-800 pb-32 max-w-[1850px] mx-auto animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-amber-700/50 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider">
            <Layers className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>TAB 3: NÂNG CẤP & GHÉP GIÁO ÁN TỔNG HỢP</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
            GHÉP NHIỀU BÀI DẠY / CHỦ ĐỀ THÀNH 1 BÀI HOÀN CHỈNH
          </h2>
          <p className="text-xs text-amber-100/90 leading-relaxed">
            Các bài đã soạn sẽ được lưu giữ theo thứ tự 1, 2, 3... Thầy/Cô tích chọn các bài cần ghép, tùy chỉnh lại số thứ tự (ví dụ bài 1 lên đầu, bài 2 xuống dưới) để tự động xuất 1 file Word (.docx) chuẩn nét duy nhất.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentPlan && (
            <button
              type="button"
              onClick={handleAddCurrentPlan}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-950" />
              <span>Lưu bài hiện tại (Tab 2) vào đây</span>
            </button>
          )}

          <div>
            <input
              ref={docxFileInputRef}
              type="file"
              accept=".docx,.doc,.txt"
              onChange={handleDocxUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => docxFileInputRef.current?.click()}
              disabled={isUploadingDocx}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              {isUploadingDocx ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Đang tải file...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-amber-300" />
                  <span>Tải file Word (.docx) để ghép</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main List & Controls Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        {/* Table Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors cursor-pointer"
            >
              {sortedItems.length > 0 && sortedItems.every((i) => i.selected) ? (
                <>
                  <CheckSquare className="w-4 h-4 text-amber-700" />
                  <span>Bỏ chọn tất cả</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-amber-700" />
                  <span>Tích chọn tất cả ({sortedItems.length})</span>
                </>
              )}
            </button>

            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
              Đã chọn: <strong className="text-amber-800">{selectedCount}</strong> / {sortedItems.length} bài
            </span>
          </div>

          <div className="flex items-center gap-2">
            {sortedItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa danh sách</span>
              </button>
            )}

            <button
              type="button"
              onClick={onGoToTab1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-700" />
              <span>Quay lại Tab 1 để soạn thêm</span>
            </button>
          </div>
        </div>

        {/* List of Saved Lesson Plans */}
        {sortedItems.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6 text-amber-700" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Chưa có bài soạn nào trong danh sách ghép</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Thầy/Cô hãy soạn bài tại **Tab 1** (rồi bấm nút *Lưu bài*), hoặc bấm nút **"Tải file Word (.docx)"** ở trên để bắt đầu ghép bài!
              </p>
            </div>
            {currentPlan && (
              <button
                type="button"
                onClick={handleAddCurrentPlan}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Lưu bài đang hiển thị ở Tab 2 vào đây ngay</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-amber-900/90 text-white font-bold text-[11.5px] uppercase tracking-wider">
                  <th className="p-3 text-center w-12">Chọn</th>
                  <th className="p-3 text-center w-28">Thứ tự ghép</th>
                  <th className="p-3 min-w-[220px]">Tên bài soạn / Chủ đề</th>
                  <th className="p-3 min-w-[140px]">Môn / Độ tuổi</th>
                  <th className="p-3 text-center w-36">Thời gian lưu</th>
                  <th className="p-3 text-center w-40">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white font-medium text-slate-800">
                {sortedItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.selected ? 'bg-amber-50/40 hover:bg-amber-100/50' : 'bg-slate-50/30 hover:bg-slate-100/60 opacity-60'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                    </td>

                    {/* Order Number & Up/Down Arrows */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={sortedItems.length}
                          value={item.orderNumber}
                          onChange={(e) => handleOrderChange(item.id, parseInt(e.target.value, 10) || 1)}
                          className="w-12 text-center h-8 font-extrabold text-amber-900 bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs text-xs"
                          title="Gõ số thứ tự ghép (1 = đầu tiên)"
                        />
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveUp(idx)}
                            className="p-1 hover:bg-amber-200 text-amber-900 rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                            title="Lên 1 thứ tự"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sortedItems.length - 1}
                            onClick={() => handleMoveDown(idx)}
                            className="p-1 hover:bg-amber-200 text-amber-900 rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                            title="Xuống 1 thứ tự"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Title (Editable) */}
                    <td className="p-3">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleTitleChange(item.id, e.target.value)}
                        className="w-full bg-white border border-slate-300 focus:border-amber-600 rounded-md px-2.5 py-1.5 font-bold text-slate-900 text-xs focus:outline-none shadow-2xs"
                        placeholder="Tên bài soạn..."
                      />
                    </td>

                    {/* Subject / Grade */}
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{item.subject}</div>
                      <div className="text-[11px] text-amber-800 font-semibold">{item.grade} • {item.schoolLevel}</div>
                    </td>

                    {/* Time */}
                    <td className="p-3 text-center text-[11px] text-slate-500 font-mono">
                      {item.createdAt}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewPlanInTab2(item.plan)}
                          className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Xem bài này ở Tab 2"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-800" />
                          <span>Xem</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Xóa bài này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Merged Config & Action Panel */}
        {sortedItems.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3 pt-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Custom Title Input */}
              <div className="md:col-span-6 space-y-1">
                <label className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <span>Tên file / Tiêu đề bài giáo án ghép chung:</span>
                </label>
                <input
                  type="text"
                  value={mergedTitle}
                  onChange={(e) => setMergedTitle(e.target.value)}
                  placeholder="Ví dụ: Kế hoạch bài dạy ghép Chủ đề Mầm non tuần 1-2..."
                  className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-6 flex flex-wrap items-center justify-end gap-2 pt-2 md:pt-0">
                <button
                  type="button"
                  onClick={handlePreviewMerged}
                  disabled={selectedCount === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-100 text-amber-950 font-bold text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                >
                  <Eye className="w-4 h-4 text-amber-700" />
                  <span>Xem trước bài ghép (Tab 2)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportMergedDocx}
                  disabled={selectedCount === 0 || isExporting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                      <span>Đang tạo file Word ghép...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4.5 h-4.5 text-amber-200" />
                      <span>XUẤT FILE WORD TỔNG HỢP (.DOCX)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
