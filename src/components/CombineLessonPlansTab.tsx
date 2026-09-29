import React, { useState, useRef } from 'react';
import { LessonPlanOutput, CombineWeekConfig, SavedCombineItem } from '../types';
export type { SavedCombineItem };
import { parseDocxFile } from '../utils/docxParser';
import {
  PRESCHOOL_ACTIVITY_SECTIONS,
  USER_PRESCHOOL_ACTIVITY_SECTIONS,
  WEEK_DAYS_LIST,
  getStandardFixedSectionContent,
  ActivitySectionDef,
} from '../data/preschoolWeekActivities';
import { getPreschoolSectionCHeaderInfo } from '../utils/preschoolUtils';
import {
  Layers,
  FilePlus,
  Upload,
  CheckSquare,
  Square,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  Download,
  Loader2,
  Plus,
  Sparkles,
  FileText,
  AlertCircle,
  ListOrdered,
  ArrowUpDown,
  BookOpen,
  Calendar,
  CalendarDays,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Zap,
  Settings2,
  Edit3,
  X,
  SlidersHorizontal,
  Bookmark,
  CheckCircle2,
  FolderOpen,
  Search,
} from 'lucide-react';

interface CombineLessonPlansTabProps {
  combineList: SavedCombineItem[];
  onUpdateCombineList: (newList: SavedCombineItem[]) => void;
  onAddCurrentPlan: () => void;
  currentPlan: LessonPlanOutput | null;
  onExportMergedDocx: (selectedItems: SavedCombineItem[], customWeekConfig?: CombineWeekConfig) => Promise<boolean>;
  isExporting: boolean;
  onSelectTab: (tab: 'config' | 'result' | 'combine') => void;
  onViewPlanDetails: (plan: LessonPlanOutput) => void;
  weekConfig: CombineWeekConfig;
  onUpdateWeekConfig: (cfg: Partial<CombineWeekConfig>) => void;
}

const VI_WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

const PRESCHOOL_THEME_GROUPS = [
  'BẢN THÂN',
  'TRƯỜNG MẦM NON',
  'GIA ĐÌNH',
  'NGHỀ NGHIỆP',
  'THẾ GIỚI THỰC VẬT',
  'THẾ GIỚI ĐỘNG VẬT',
  'GIAO THÔNG',
  'NƯỚC VÀ HIỆN TƯỢNG TỰ NHIÊN',
  'QUÊ HƯƠNG - ĐẤT NƯỚC - BÁC HỒ',
  'TẾT VÀ MÙA XUÂN',
];

const PRESCHOOL_WEEKS_LIST = Array.from({ length: 35 }, (_, i) => `TUẦN ${i + 1}:`);

const DAY_PRIORITY: Record<string, number> = {
  'Thứ hai': 1,
  'Thứ ba': 2,
  'Thứ tư': 3,
  'Thứ năm': 4,
  'Thứ sáu': 5,
};

function formatDateToDDMMYYYY(val?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split('-');
    return `${String(parseInt(parts[2], 10)).padStart(2, '0')}/${String(parseInt(parts[1], 10)).padStart(2, '0')}/${parts[0]}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    return `${String(parseInt(parts[0], 10)).padStart(2, '0')}/${String(parseInt(parts[1], 10)).padStart(2, '0')}/${parts[2]}`;
  }
  return trimmed;
}

// Helper lấy danh sách các thứ mà bài được gán (hỗ trợ 1 bài gán nhiều thứ)
export function getItemDays(item?: { dayOfWeek?: string; daysOfWeek?: string[] } | null): string[] {
  if (!item) return [];
  if (Array.isArray(item.daysOfWeek) && item.daysOfWeek.length > 0) {
    return item.daysOfWeek;
  }
  if (item.dayOfWeek) {
    return [item.dayOfWeek];
  }
  return [];
}

// Helper chuẩn hóa hiển thị các thứ dạng số rõ ràng: "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"
export function formatDayToNumbered(dayName: string): string {
  if (!dayName) return '';
  const map: Record<string, string> = {
    'Thứ hai': 'Thứ 2',
    'Thứ ba': 'Thứ 3',
    'Thứ tư': 'Thứ 4',
    'Thứ năm': 'Thứ 5',
    'Thứ sáu': 'Thứ 6',
    'Thứ bảy': 'Thứ 7',
    'Chủ nhật': 'Chủ nhật',
    'thứ hai': 'Thứ 2',
    'thứ ba': 'Thứ 3',
    'thứ tư': 'Thứ 4',
    'thứ năm': 'Thứ 5',
    'thứ sáu': 'Thứ 6',
    'thứ bảy': 'Thứ 7',
    'chủ nhật': 'Chủ nhật',
  };
  return map[dayName] || dayName;
}

// Helper định dạng chuỗi hiển thị các thứ được gán (ví dụ: "Thứ 2, Thứ 3" hoặc "Cả tuần (Thứ 2 - Thứ 6)")
export function formatAssignedDays(days: string[]): string {
  if (!days || days.length === 0) return 'Chưa phân ngày';
  const weekdays5 = WEEK_DAYS_LIST.slice(0, 5);
  if (weekdays5.every((d) => days.includes(d)) && days.length === 5) {
    return 'Cả tuần (Thứ 2 - Thứ 6)';
  }
  if (days.length === 7) {
    return 'Cả tuần (Thứ 2 - Chủ nhật)';
  }
  return days.map((d) => formatDayToNumbered(d)).join(', ');
}

export const CombineLessonPlansTab: React.FC<CombineLessonPlansTabProps> = ({
  combineList,
  onUpdateCombineList,
  onAddCurrentPlan,
  currentPlan,
  onExportMergedDocx,
  isExporting,
  onSelectTab,
  onViewPlanDetails,
  weekConfig,
  onUpdateWeekConfig,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [previewPlanModal, setPreviewPlanModal] = useState<LessonPlanOutput | null>(null);
  const [isWeekConfigOpen, setIsWeekConfigOpen] = useState(true);
  const [showLiveDocPreview, setShowLiveDocPreview] = useState(false);
  const [editingRowDateId, setEditingRowDateId] = useState<string | null>(null);

  // Tab chọn thứ hiện tại: 'Thứ hai' | 'Thứ ba' | 'Thứ tư' | 'Thứ năm' | 'Thứ sáu' | 'all'
  const [activeDayTab, setActiveDayTab] = useState<string>('Thứ hai');
  const [rightWarehouseSearch, setRightWarehouseSearch] = useState<string>('');

  // Modal chọn bài từ kho vào một thứ cụ thể
  const [isSelectFilesModalOpen, setIsSelectFilesModalOpen] = useState(false);
  const [modalTargetDay, setModalTargetDay] = useState<string>('Thứ hai');
  const [modalSelectedIds, setModalSelectedIds] = useState<string[]>([]);
  const [modalSearchKeyword, setModalSearchKeyword] = useState<string>('');

  // Selected items sorted by Day of Week then by mergeOrder
  const selectedItems = combineList
    .filter((item) => item.selected && getItemDays(item).length > 0)
    .sort((a, b) => {
      const dayA = getItemDays(a)[0] ? DAY_PRIORITY[getItemDays(a)[0]] || 99 : 99;
      const dayB = getItemDays(b)[0] ? DAY_PRIORITY[getItemDays(b)[0]] || 99 : 99;
      if (dayA !== dayB) return dayA - dayB;
      return a.mergeOrder - b.mergeOrder;
    });

  // Lấy cấu hình ngày soạn và ngày dạy của từng Thứ
  const getDaySchedule = (day: string) => {
    if (weekConfig.daySchedules && weekConfig.daySchedules[day]) {
      return weekConfig.daySchedules[day];
    }
    const defaultSchedules: Record<string, { prepDate: string; teachDate: string }> = {
      'Thứ hai': { prepDate: '26/9/2026', teachDate: 'Thứ hai ngày 28/9/2026' },
      'Thứ ba': { prepDate: '27/9/2026', teachDate: 'Thứ ba, ngày 29/9/2026' },
      'Thứ tư': { prepDate: '28/9/2026', teachDate: 'Thứ tư, ngày 30/9/2026' },
      'Thứ năm': { prepDate: '29/9/2026', teachDate: 'Thứ năm, ngày 01/10/2026' },
      'Thứ sáu': { prepDate: '30/9/2026', teachDate: 'Thứ sáu, ngày 02/10/2026' },
    };
    return defaultSchedules[day] || { prepDate: '', teachDate: '' };
  };

  // Cập nhật Ngày soạn hoặc Ngày dạy của một Thứ cụ thể
  const handleUpdateDaySchedule = (day: string, field: 'prepDate' | 'teachDate', value: string) => {
    const current = getDaySchedule(day);
    const updatedDay = { ...current, [field]: value };
    const newSchedules = { ...(weekConfig.daySchedules || {}), [day]: updatedDay };
    onUpdateWeekConfig({ daySchedules: newSchedules });

    // Đồng bộ ngay sang tất cả các bài thuộc Thứ này
    const updatedList = combineList.map((item) => {
      if (getItemDays(item).includes(day)) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onUpdateCombineList(updatedList);
  };

  // Toggle selection for a single item
  const handleToggleSelect = (id: string) => {
    const updated = combineList.map((item) => {
      if (item.id === id) {
        const nextSel = !item.selected;
        return {
          ...item,
          selected: nextSel,
          daysOfWeek: nextSel && getItemDays(item).length === 0 ? [activeDayTab === 'all' ? 'Thứ hai' : activeDayTab] : item.daysOfWeek,
          dayOfWeek: nextSel && !item.dayOfWeek ? (activeDayTab === 'all' ? 'Thứ hai' : activeDayTab) : item.dayOfWeek,
        };
      }
      return item;
    });
    onUpdateCombineList(updated);
  };

  // Toggle select all
  const allSelected = combineList.length > 0 && combineList.every((item) => item.selected);
  const handleToggleSelectAll = () => {
    const nextVal = !allSelected;
    const updated = combineList.map((item) => ({
      ...item,
      selected: nextVal,
      daysOfWeek: nextVal && getItemDays(item).length === 0 ? ['Thứ hai'] : item.daysOfWeek,
      dayOfWeek: nextVal && !item.dayOfWeek ? 'Thứ hai' : item.dayOfWeek,
    }));
    onUpdateCombineList(updated);
  };

  // Delete an item
  const handleDeleteItem = (id: string) => {
    const updated = combineList
      .filter((item) => item.id !== id)
      .map((item, idx) => ({ ...item, autoIndex: idx + 1 }));
    onUpdateCombineList(updated);
  };

  // Delete all selected items
  const handleDeleteSelected = () => {
    const updated = combineList
      .filter((item) => !item.selected)
      .map((item, idx) => ({ ...item, autoIndex: idx + 1 }));
    onUpdateCombineList(updated);
  };

  // Bật/tắt 1 Thứ cụ thể cho 1 bài (cho phép 1 bài gán đồng thời nhiều thứ: Thứ 2, 3, 4, 5, 6)
  const handleToggleDayForItem = (itemId: string, dayToToggle: string) => {
    const sched = getDaySchedule(dayToToggle);
    const defaultCodes = ['C', 'D', 'E'];
    const countInDay = combineList.filter((i) => i.selected && getItemDays(i).includes(dayToToggle)).length;

    const updated = combineList.map((item) => {
      if (item.id === itemId) {
        const currentDays = getItemDays(item);
        let nextDays: string[];
        if (currentDays.includes(dayToToggle)) {
          // Gỡ thứ này ra
          nextDays = currentDays.filter((d) => d !== dayToToggle);
        } else {
          // Thêm thứ này vào
          nextDays = [...currentDays, dayToToggle];
        }

        const isSelected = nextDays.length > 0;
        const secCode = item.activitySection || defaultCodes[countInDay % defaultCodes.length];
        const secDef = PRESCHOOL_ACTIVITY_SECTIONS.find((s) => s.code === secCode);

        return {
          ...item,
          daysOfWeek: nextDays,
          dayOfWeek: nextDays[0] || '',
          selected: isSelected,
          prepDate: item.prepDate || sched.prepDate || '',
          teachDate: item.teachDate || sched.teachDate || '',
          activitySection: secCode,
          activitySectionTitle: secDef?.title || `${secCode}. HOẠT ĐỘNG`,
        };
      }
      return item;
    });

    onUpdateCombineList(updated);

    // Đồng bộ nếu modal đang mở
    if (isSelectFilesModalOpen && dayToToggle === modalTargetDay) {
      if (modalSelectedIds.includes(itemId)) {
        setModalSelectedIds(modalSelectedIds.filter((id) => id !== itemId));
      } else {
        setModalSelectedIds([...modalSelectedIds, itemId]);
      }
    }
  };

  // Gán hoặc gỡ cả tuần (Thứ 2 đến Thứ 6) cho 1 bài
  const handleToggleAllWeekdaysForItem = (itemId: string) => {
    const allWeekdays = WEEK_DAYS_LIST.slice(0, 5); // ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu']
    const updated = combineList.map((item) => {
      if (item.id === itemId) {
        const currentDays = getItemDays(item);
        const hasAllWeekdays = allWeekdays.every((d) => currentDays.includes(d));
        let nextDays: string[];
        if (hasAllWeekdays) {
          // Nếu đã chọn cả tuần -> gỡ hết 5 ngày trong tuần
          nextDays = currentDays.filter((d) => !allWeekdays.includes(d));
        } else {
          // Thêm toàn bộ các ngày Thứ 2..Thứ 6 vào
          const set = new Set([...currentDays, ...allWeekdays]);
          nextDays = Array.from(set);
        }

        const isSelected = nextDays.length > 0;
        const secCode = item.activitySection || 'C';
        const secDef = PRESCHOOL_ACTIVITY_SECTIONS.find((s) => s.code === secCode);

        return {
          ...item,
          daysOfWeek: nextDays,
          dayOfWeek: nextDays[0] || '',
          selected: isSelected,
          activitySection: secCode,
          activitySectionTitle: secDef?.title || `${secCode}. HOẠT ĐỘNG`,
        };
      }
      return item;
    });

    onUpdateCombineList(updated);
  };

  // Gán / Bật tắt nhanh 1 thứ cho 1 bài
  const handleQuickAssignItemToDay = (itemId: string, targetDay: string) => {
    handleToggleDayForItem(itemId, targetDay);
  };

  // Gán bài vào một Thứ cụ thể (thay thế hoặc thêm vào)
  const handleAssignItemToDay = (itemId: string, targetDay: string) => {
    const sched = getDaySchedule(targetDay);
    const updated = combineList.map((item) => {
      if (item.id === itemId) {
        const currentDays = getItemDays(item);
        const nextDays = currentDays.includes(targetDay) ? currentDays : [...currentDays, targetDay];
        return {
          ...item,
          daysOfWeek: nextDays,
          dayOfWeek: targetDay,
          selected: true,
          prepDate: sched.prepDate || item.prepDate || '',
          teachDate: sched.teachDate || item.teachDate || '',
        };
      }
      return item;
    });
    onUpdateCombineList(updated);
  };

  // Gán mục hoạt động (A, B, C, D, E, F, H, K) cho bài
  const handleSetItemSection = (itemId: string, secCode: string) => {
    const secDef = PRESCHOOL_ACTIVITY_SECTIONS.find((s) => s.code === secCode);
    const updated = combineList.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          activitySection: secCode,
          activitySectionTitle: secDef?.title || `${secCode}. HOẠT ĐỘNG`,
        };
      }
      return item;
    });
    onUpdateCombineList(updated);
  };

  // Di chuyển thứ tự các bài trong cùng 1 ngày
  const handleMoveItemWithinDay = (day: string, indexInDay: number, direction: 'up' | 'down') => {
    const dayItems = combineList.filter((item) => getItemDays(item).includes(day));
    if (direction === 'up' && indexInDay === 0) return;
    if (direction === 'down' && indexInDay === dayItems.length - 1) return;

    const targetIdxInDay = direction === 'up' ? indexInDay - 1 : indexInDay + 1;
    const itemA = dayItems[indexInDay];
    const itemB = dayItems[targetIdxInDay];

    // Hoán đổi mergeOrder giữa 2 item
    const updated = combineList.map((item) => {
      if (item.id === itemA.id) return { ...item, mergeOrder: itemB.mergeOrder };
      if (item.id === itemB.id) return { ...item, mergeOrder: itemA.mergeOrder };
      return item;
    });

    onUpdateCombineList(updated);
  };

  // Thêm nhanh một mục mẫu chuẩn cố định (A, B, F, H, K...) vào Thứ được chọn
  const handleAddFixedSectionToDay = (secCode: string, targetDay: string) => {
    const fixedPlan = getStandardFixedSectionContent(secCode, targetDay);
    const secDef = PRESCHOOL_ACTIVITY_SECTIONS.find((s) => s.code === secCode);
    const sched = getDaySchedule(targetDay);

    const nextMergeOrder = combineList.length + 1;
    const newItem: SavedCombineItem = {
      id: `fixed-${secCode.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      autoIndex: nextMergeOrder,
      mergeOrder: nextMergeOrder,
      selected: true,
      title: secDef?.title || fixedPlan.lessonTitle,
      schoolLevel: 'Mầm non',
      grade: 'Lớp Lá',
      subject: 'Mầm non',
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      source: 'generated',
      dayOfWeek: targetDay,
      daysOfWeek: [targetDay],
      prepDate: sched.prepDate || '',
      teachDate: sched.teachDate || '',
      activitySection: secCode,
      activitySectionTitle: secDef?.title || `${secCode}. HOẠT ĐỘNG`,
      plan: fixedPlan,
    };

    onUpdateCombineList([...combineList, newItem]);
  };

  // Mở hộp thoại chọn bài/file từ kho vào ngày
  const handleOpenSelectFilesModal = (targetDay: string) => {
    setModalTargetDay(targetDay);
    // Mặc định chọn các bài đã gán vào ngày đó
    const currentlyInDay = combineList
      .filter((i) => i.selected && getItemDays(i).includes(targetDay))
      .map((i) => i.id);
    setModalSelectedIds(currentlyInDay);
    setModalSearchKeyword('');
    setIsSelectFilesModalOpen(true);
  };

  // Chuyển đổi thứ mục tiêu trong modal chọn bài
  const handleSwitchModalTargetDay = (newDay: string) => {
    setModalTargetDay(newDay);
    const currentlyInNewDay = combineList
      .filter((i) => i.selected && getItemDays(i).includes(newDay))
      .map((i) => i.id);
    setModalSelectedIds(currentlyInNewDay);
  };

  // Xác nhận gán các bài đã chọn từ kho vào ngày
  const handleConfirmSelectFilesForDay = () => {
    const sched = getDaySchedule(modalTargetDay);
    const defaultCodes = ['C', 'D', 'E'];

    let countAssigned = 0;
    const updated = combineList.map((item) => {
      const isSelectedInModal = modalSelectedIds.includes(item.id);
      const currentDays = getItemDays(item);

      let nextDays = [...currentDays];
      if (isSelectedInModal) {
        if (!nextDays.includes(modalTargetDay)) {
          nextDays.push(modalTargetDay);
        }
      } else {
        nextDays = nextDays.filter((d) => d !== modalTargetDay);
      }

      if (isSelectedInModal) {
        countAssigned++;
        const currentCode = item.activitySection || defaultCodes[(countAssigned - 1) % defaultCodes.length];
        const secDef = PRESCHOOL_ACTIVITY_SECTIONS.find((s) => s.code === currentCode);
        return {
          ...item,
          daysOfWeek: nextDays,
          dayOfWeek: nextDays[0] || modalTargetDay,
          prepDate: item.prepDate || sched.prepDate || '',
          teachDate: item.teachDate || sched.teachDate || '',
          selected: nextDays.length > 0,
          activitySection: currentCode,
          activitySectionTitle: secDef?.title || `${currentCode}. HOẠT ĐỘNG`,
        };
      } else {
        return {
          ...item,
          daysOfWeek: nextDays,
          dayOfWeek: nextDays[0] || '',
          selected: nextDays.length > 0,
        };
      }
    });

    onUpdateCombineList(updated);
    setIsSelectFilesModalOpen(false);
  };

  // Tích chọn trực tiếp một bài từ kho đưa vào Thứ đang chọn
  const handleToggleItemInActiveDay = (item: SavedCombineItem) => {
    const targetDay = activeDayTab === 'all' ? 'Thứ hai' : activeDayTab;
    handleToggleDayForItem(item.id, targetDay);
  };

  // Tự động gán mã mục C, D, E tuần tự cho các bài trong ngày
  const handleAutoAssignSectionsForDay = (day: string) => {
    const defaultCodes = ['C', 'D', 'E'];
    let idx = 0;
    const updated = combineList.map((item) => {
      if (getItemDays(item).includes(day)) {
        const code = defaultCodes[idx % defaultCodes.length];
        const secDef = PRESCHOOL_ACTIVITY_SECTIONS.find((s) => s.code === code);
        idx++;
        return {
          ...item,
          activitySection: code,
          activitySectionTitle: secDef?.title || `${code}. HOẠT ĐỘNG`,
        };
      }
      return item;
    });
    onUpdateCombineList(updated);
  };

  // Handle uploading external Word .docx files into Tab 3
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingDoc(true);
    try {
      const newItems: SavedCombineItem[] = [];
      let nextIdx = combineList.length + 1;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const parseRes = await parseDocxFile(file);
        const titleWithoutExt = file.name.replace(/\.[^/.]+$/, '');

        const dummyStep = {
          title: 'Chi tiết nội dung file ' + file.name,
          teacherAction: parseRes.textWithSlots || 'Không có văn bản',
          studentAction: '',
          productExpected: '',
        };
        const createdPlan: LessonPlanOutput = {
          schoolName: 'Trường Mầm non',
          teacherName: 'Giáo viên',
          lessonTitle: titleWithoutExt,
          schoolLevel: 'Mầm non',
          grade: 'Mẫu giáo',
          subject: 'Kế hoạch bài dạy (File Word đính kèm)',
          bookSeries: 'Mầm non chuẩn',
          periods: 1,
          objectives: {
            knowledge: ['Nội dung được trích xuất từ file Word ' + file.name],
            generalCompetencies: [],
            subjectCompetencies: [],
            digitalCompetencies: [],
            aiCompetencies: [],
            qualities: [],
          },
          equipment: { teacher: [], student: [], digitalAssets: [] },
          activities: [
            {
              id: `act-file-${Date.now()}-${i}`,
              index: 1,
              name: titleWithoutExt,
              duration: '35 phút',
              objective: 'Nội dung file Word gốc',
              content: parseRes.textWithSlots || '',
              productSummary: 'Sản phẩm trích xuất',
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

        // Gán mặc định vào activeDayTab hiện tại hoặc Thứ hai
        const targetDay = activeDayTab === 'all' ? 'Thứ hai' : activeDayTab;
        const sched = getDaySchedule(targetDay);

        newItems.push({
          id: 'combine-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          autoIndex: nextIdx,
          mergeOrder: nextIdx,
          selected: true,
          title: titleWithoutExt,
          schoolLevel: 'Mầm non',
          grade: 'Mẫu giáo',
          subject: 'File Word đính kèm',
          createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          source: 'uploaded',
          fileName: file.name,
          dayOfWeek: targetDay,
          prepDate: sched.prepDate || '',
          teachDate: sched.teachDate || '',
          activitySection: 'C',
          activitySectionTitle: 'C. HOẠT ĐỘNG HỌC',
          plan: createdPlan,
        });

        nextIdx++;
      }

      onUpdateCombineList([...combineList, ...newItems]);
    } catch (err) {
      console.error('Error parsing uploaded docx into combine list:', err);
    } finally {
      setIsUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Tự động tính toàn bộ lịch 5 thứ trong tuần (T2 - T6) khi chọn Ngày dạy bắt đầu hoặc Ngày soạn
  const computeAndApplyWeekSchedules = (
    startTeachYMD: string,
    startPrepYMD?: string,
    customEndYMD?: string
  ) => {
    if (!startTeachYMD) {
      onUpdateWeekConfig({
        startDate: '',
        endDate: '',
        dateRangeText: '',
        daySchedules: {},
      });
      return;
    }

    const [sy, sm, sd] = startTeachYMD.split('-').map(Number);
    const startTeach = new Date(sy, sm - 1, sd);

    let startPrep: Date;
    let finalPrepYMD = startPrepYMD || weekConfig.startPrepDate || '';
    if (finalPrepYMD && finalPrepYMD.includes('-')) {
      const [py, pm, pd] = finalPrepYMD.split('-').map(Number);
      startPrep = new Date(py, pm - 1, pd);
    } else {
      startPrep = new Date(sy, sm - 1, sd);
      startPrep.setDate(startPrep.getDate() - 2); // Mặc định Thứ 7 (2 ngày trước Thứ 2)
      finalPrepYMD = `${startPrep.getFullYear()}-${String(startPrep.getMonth() + 1).padStart(2, '0')}-${String(startPrep.getDate()).padStart(2, '0')}`;
    }

    let endTeach: Date;
    let finalEndYMD = customEndYMD || weekConfig.endDate || '';
    if (finalEndYMD && finalEndYMD.includes('-')) {
      const [ey, em, ed] = finalEndYMD.split('-').map(Number);
      endTeach = new Date(ey, em - 1, ed);
    } else {
      endTeach = new Date(sy, sm - 1, sd);
      endTeach.setDate(startTeach.getDate() + 4); // Thứ 6 (4 ngày sau Thứ 2)
      finalEndYMD = `${endTeach.getFullYear()}-${String(endTeach.getMonth() + 1).padStart(2, '0')}-${String(endTeach.getDate()).padStart(2, '0')}`;
    }

    const sampleDays = [
      { day: 'Thứ hai', offset: 0, pOffset: 0 },
      { day: 'Thứ ba', offset: 1, pOffset: 1 },
      { day: 'Thứ tư', offset: 2, pOffset: 2 },
      { day: 'Thứ năm', offset: 3, pOffset: 3 },
      { day: 'Thứ sáu', offset: 4, pOffset: 4 },
    ];

    const newDaySchedules: Record<string, { prepDate: string; teachDate: string }> = {};

    sampleDays.forEach((sdItem) => {
      const tD = new Date(startTeach);
      tD.setDate(startTeach.getDate() + sdItem.offset);
      const pD = new Date(startPrep);
      pD.setDate(startPrep.getDate() + sdItem.pOffset);

      const tDay = String(tD.getDate()).padStart(2, '0');
      const tMon = String(tD.getMonth() + 1).padStart(2, '0');
      const tYear = tD.getFullYear();

      const pDay = String(pD.getDate()).padStart(2, '0');
      const pMon = String(pD.getMonth() + 1).padStart(2, '0');
      const pYear = pD.getFullYear();

      const comma = sdItem.offset === 0 ? '' : ',';
      const teachStr = `${sdItem.day}${comma} ngày ${tDay}/${tMon}/${tYear}`;
      const prepStr = `${pDay}/${pMon}/${pYear}`;
      newDaySchedules[sdItem.day] = { prepDate: prepStr, teachDate: teachStr };
    });

    const sStr = formatDateToDDMMYYYY(startTeachYMD);
    const eStr = formatDateToDDMMYYYY(finalEndYMD);
    const rangeText = `(Thực hiện từ ngày  ${sStr}-${eStr})`;

    onUpdateWeekConfig({
      startDate: startTeachYMD,
      endDate: finalEndYMD,
      startPrepDate: finalPrepYMD,
      dateRangeText: rangeText,
      daySchedules: newDaySchedules,
    });

    // Tự động đồng bộ Ngày soạn & Ngày dạy sang các bài đã gán theo Thứ
    const updatedList = combineList.map((item) => {
      const day = item.dayOfWeek || 'Thứ hai';
      if (newDaySchedules[day]) {
        return {
          ...item,
          prepDate: newDaySchedules[day].prepDate,
          teachDate: newDaySchedules[day].teachDate,
        };
      }
      return item;
    });

    onUpdateCombineList(updatedList);
  };

  // Tự động tính ngày và gán lịch cho 5 ngày trong tuần khi bấm nút làm mới
  const handleAutoAssignWeekDates = () => {
    const s = weekConfig.startDate || '2026-09-28';
    const p = weekConfig.startPrepDate || '2026-09-26';
    computeAndApplyWeekSchedules(s, p);
  };

  // Xóa toàn bộ ngày đã ghép
  const handleClearAllDates = () => {
    const updated = combineList.map((item) => ({
      ...item,
      prepDate: '',
      teachDate: '',
    }));
    onUpdateCombineList(updated);

    onUpdateWeekConfig({
      startPrepDate: '',
      startDate: '',
      endDate: '',
      dateRangeText: '',
      daySchedules: {},
    });
  };

  // Chọn ngày bắt đầu (Từ ngày / Ngày dạy bắt đầu) -> Tự động tính hết T2-T6
  const handleStartDateChange = (val: string) => {
    if (!val) {
      onUpdateWeekConfig({ startDate: '', endDate: '', dateRangeText: '' });
      return;
    }
    computeAndApplyWeekSchedules(val, weekConfig.startPrepDate, weekConfig.endDate);
  };

  // Chọn ngày soạn -> Tự động cập nhật ngày soạn T2-T6
  const handleStartPrepDateChange = (val: string) => {
    if (!val) {
      onUpdateWeekConfig({ startPrepDate: '' });
      return;
    }
    if (weekConfig.startDate) {
      computeAndApplyWeekSchedules(weekConfig.startDate, val, weekConfig.endDate);
    } else {
      onUpdateWeekConfig({ startPrepDate: val });
    }
  };

  // Chọn ngày kết thúc (Đến ngày)
  const handleEndDateChange = (val: string) => {
    if (!val) {
      const sStr = formatDateToDDMMYYYY(weekConfig.startDate);
      const newRange = sStr ? `(Thực hiện từ ngày  ${sStr}-xx/xx/xxxx)` : '';
      onUpdateWeekConfig({ endDate: '', dateRangeText: newRange });
      return;
    }

    const sStr = formatDateToDDMMYYYY(weekConfig.startDate);
    const eStr = formatDateToDDMMYYYY(val);
    const newRange = `(Thực hiện từ ngày  ${sStr || 'xx/xx/xxxx'}-${eStr})`;

    onUpdateWeekConfig({
      endDate: val,
      dateRangeText: newRange,
    });
  };

  // Lọc danh sách bài theo ngày tab hiện tại (hỗ trợ 1 bài gán nhiều thứ)
  const itemsInActiveDay = combineList
    .filter((item) =>
      activeDayTab === 'all'
        ? true
        : item.selected && getItemDays(item).includes(activeDayTab)
    )
    .sort((a, b) => a.mergeOrder - b.mergeOrder);

  const currentDaySchedule = getDaySchedule(activeDayTab);

  return (
    <div className="w-full space-y-3 sm:space-y-4 text-slate-800">
      {/* TOOLBAR CONTROLS (CỐ ĐỊNH CỨNG KHÔNG NHÚC NHÍCH KHI CUỘN) */}
      <div className="sticky top-[108px] z-30 bg-white/98 backdrop-blur-md border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-md flex flex-wrap items-center justify-between gap-2.5 -mt-2 sm:-mt-4 mb-3 sm:mb-4">
        {/* Left Toolbar: Add buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick stats badges */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-950">
            <Layers className="w-3.5 h-3.5 text-amber-700" />
            <span>Kho: {combineList.length} bài</span>
            {selectedItems.length > 0 && (
              <>
                <span className="text-amber-300">•</span>
                <span className="text-emerald-700">Đã chọn: {selectedItems.length} bài</span>
              </>
            )}
          </div>
          {/* Button 1: Add current active generated plan */}
          <button
            type="button"
            onClick={onAddCurrentPlan}
            disabled={!currentPlan}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              currentPlan
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 active:scale-95'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
            }`}
            title={currentPlan ? 'Thêm giáo án đang hiển thị ở Tab 2 vào Tab 3 để ghép' : 'Chưa có giáo án ở Tab 2'}
          >
            <Plus className="w-4 h-4" />
            <span>Lưu bài vừa tạo vào Tab 3</span>
          </button>

          {/* Button 2: Upload Word File .docx */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingDoc}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              {isUploadingDoc ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-700" />
                  <span>Đang đọc file Word...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-indigo-700" />
                  <span>Tải file Word (.docx) vào Tab 3</span>
                </>
              )}
            </button>
          </div>

          {/* Button 3: Create new plan shortcut */}
          <button
            type="button"
            onClick={() => onSelectTab('config')}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FilePlus className="w-4 h-4 text-emerald-700" />
            <span>+ Soạn thêm bài mới (Tab 1)</span>
          </button>

          {/* Button 4: Live Print Preview */}
          <button
            type="button"
            onClick={() => setShowLiveDocPreview(!showLiveDocPreview)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
              showLiveDocPreview
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Mô phỏng bản in Word</span>
          </button>
        </div>

        {/* Right Toolbar: Batch actions & sort & Quick Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-amber-700" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
            <span>{allSelected ? 'Bỏ chọn' : 'Chọn tất cả'}</span>
          </button>

          {combineList.some((i) => i.selected) && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa ({combineList.filter((i) => i.selected).length})</span>
            </button>
          )}

          {/* Main sticky Export button */}
          <button
            type="button"
            onClick={() => onExportMergedDocx(selectedItems, weekConfig)}
            disabled={isExporting || selectedItems.length === 0}
            className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0 ${
              selectedItems.length === 0 || isExporting
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
                : 'bg-gradient-to-r from-emerald-600 via-teal-700 to-amber-700 hover:from-emerald-700 hover:to-amber-800 text-white shadow-emerald-700/25 hover:scale-[1.02] active:scale-[0.98]'
            }`}
            title="Ghép Tuần Học và tải file Word"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-200" />
                <span>Đang ghép tuần học...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>GHÉP TUẦN HỌC ({selectedItems.length} BÀI)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KHU VỰC CẤU HÌNH TIÊU ĐỀ TUẦN (LUÔN LUÔN GIỮ NGUYÊN Ở ĐẦU TRANG 1) */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-amber-300 rounded-2xl shadow-sm overflow-hidden transition-all">
        <div className="bg-gradient-to-r from-amber-50 via-orange-50/60 to-yellow-50/80 p-3.5 sm:p-4 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 text-white flex items-center justify-center shadow-xs">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                CẤU HÌNH TIÊU ĐỀ TUẦN & CHỦ ĐIỂM
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoAssignWeekDates}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-amber-100/80 text-amber-950 border border-amber-300 shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              title="Tự động tính ngày cho 5 ngày trong tuần theo Ngày bắt đầu"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              <span>Ghép ngày tự động</span>
            </button>

            <button
              type="button"
              onClick={handleClearAllDates}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
              title="Xóa toàn bộ ngày đã ghép và các ô ngày bắt đầu"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa ngày</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 space-y-3 bg-gradient-to-b from-white to-amber-50/20">
          {/* CÙNG 1 HÀNG: CÁC Ô NGÀY & TUẦN ĐƯỢC CO NGẮN, Ô CHỦ ĐỀ ĐƯỢC MỞ RỘNG */}
          <div className="flex flex-wrap lg:flex-nowrap items-start gap-2 sm:gap-2.5">
            {/* 1. CHỌN TUẦN: CO NGẮN */}
            <div className="space-y-1 w-full sm:w-28 lg:w-28 shrink-0">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <span>TUẦN:</span>
                <span className="text-rose-500">*</span>
              </label>
              <select
                value={weekConfig.weekTitle || 'TUẦN 1:'}
                onChange={(e) => onUpdateWeekConfig({ weekTitle: e.target.value })}
                className="w-full h-8.5 bg-white border border-amber-300 rounded-xl px-2 text-xs font-extrabold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer truncate"
              >
                <option value="">-- Chọn --</option>
                {PRESCHOOL_WEEKS_LIST.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. TỪ NGÀY: CO NGẮN */}
            <div className="space-y-1 w-full sm:w-32 lg:w-32 shrink-0">
              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-0.5">
                  <span>TỪ NGÀY:</span>
                  <span className="text-rose-500">*</span>
                </span>
                {weekConfig.startDate && (
                  <button
                    type="button"
                    onClick={() => handleStartDateChange('')}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                    title="Xóa từ ngày"
                  >
                    Xóa
                  </button>
                )}
              </label>
              <input
                type="date"
                value={weekConfig.startDate || ''}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full h-8.5 bg-white border border-amber-300 rounded-xl px-1.5 text-xs font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 font-semibold truncate">
                {weekConfig.startDate ? formatDateToDDMMYYYY(weekConfig.startDate) : '28/09/2026'}
              </div>
            </div>

            {/* 3. ĐẾN NGÀY: CO NGẮN */}
            <div className="space-y-1 w-full sm:w-32 lg:w-32 shrink-0">
              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-0.5">
                  <span>ĐẾN NGÀY:</span>
                  <span className="text-rose-500">*</span>
                </span>
                {weekConfig.endDate && (
                  <button
                    type="button"
                    onClick={() => handleEndDateChange('')}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                    title="Xóa đến ngày"
                  >
                    Xóa
                  </button>
                )}
              </label>
              <input
                type="date"
                value={weekConfig.endDate || ''}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full h-8.5 bg-white border border-amber-300 rounded-xl px-1.5 text-xs font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 font-semibold truncate">
                {weekConfig.endDate ? formatDateToDDMMYYYY(weekConfig.endDate) : '02/10/2026'}
              </div>
            </div>

            {/* 4. NGÀY SOẠN: CO NGẮN */}
            <div className="space-y-1 w-full sm:w-32 lg:w-32 shrink-0">
              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>NGÀY SOẠN:</span>
                {weekConfig.startPrepDate && (
                  <button
                    type="button"
                    onClick={() => handleStartPrepDateChange('')}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                    title="Xóa ngày soạn"
                  >
                    Xóa
                  </button>
                )}
              </label>
              <input
                type="date"
                value={weekConfig.startPrepDate || ''}
                onChange={(e) => handleStartPrepDateChange(e.target.value)}
                className="w-full h-8.5 bg-white border border-amber-300 rounded-xl px-1.5 text-xs font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 font-semibold truncate">
                {weekConfig.startPrepDate ? formatDateToDDMMYYYY(weekConfig.startPrepDate) : '26/09/2026'}
              </div>
            </div>

            {/* 5. NGÀY DẠY: CO NGẮN */}
            <div className="space-y-1 w-full sm:w-32 lg:w-32 shrink-0">
              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>NGÀY DẠY:</span>
                {weekConfig.startDate && (
                  <button
                    type="button"
                    onClick={() => handleStartDateChange('')}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                    title="Xóa ngày dạy"
                  >
                    Xóa
                  </button>
                )}
              </label>
              <input
                type="date"
                value={weekConfig.startDate || ''}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full h-8.5 bg-white border border-amber-300 rounded-xl px-1.5 text-xs font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 font-semibold truncate">
                {weekConfig.startDate ? formatDateToDDMMYYYY(weekConfig.startDate) : '28/09/2026'}
              </div>
            </div>

            {/* 6. CHỦ ĐỀ: MỞ RỘNG */}
            <div className="space-y-1 w-full sm:flex-1 min-w-[190px]">
              <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>CHỦ ĐỀ:</span>
                  <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-amber-700 font-semibold">Mở rộng</span>
              </label>
              <input
                type="text"
                value={weekConfig.subTheme || ''}
                onChange={(e) => onUpdateWeekConfig({ subTheme: e.target.value })}
                placeholder="Ví dụ: TÔI LÀ AI? / BÉ VÀ CÁC BẠN..."
                className="w-full h-8.5 bg-white border border-amber-300 rounded-xl px-2.5 text-xs font-extrabold text-amber-950 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
              />
              <div className="text-[10px] text-slate-500 font-semibold truncate">
                {weekConfig.subTheme ? `Chủ đề: ${weekConfig.subTheme.toUpperCase()}` : 'Nhập chủ đề nhánh'}
              </div>
            </div>

            {/* 7. CHỦ ĐIỂM: ĐỘ RỘNG VỪA VẶN */}
            <div className="space-y-1 w-full sm:w-44 lg:w-48 shrink-0">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <span>CHỦ ĐIỂM:</span>
                <span className="text-rose-500">*</span>
              </label>
              <select
                value={weekConfig.themeGroup || 'BẢN THÂN'}
                onChange={(e) => onUpdateWeekConfig({ themeGroup: e.target.value })}
                className="w-full h-8.5 bg-white border border-amber-300 rounded-xl px-2 text-xs font-extrabold text-amber-950 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer truncate"
              >
                <option value="">-- Chọn Chủ điểm --</option>
                {PRESCHOOL_THEME_GROUPS.map((tg) => (
                  <option key={tg} value={tg}>
                    {tg}
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-slate-500 font-semibold truncate">
                10 chủ điểm Mầm non
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* KHU VỰC CHÍNH (CÙNG 1 HÀNG): BÊN TRÁI LÀ TỜ LỊCH THU GỌN, BÊN PHẢI LÀ KHU VỰC CHỌN BÀI MỞ RỘNG */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* ===================================================================== */}
        {/* BÊN TRÁI: 1 TỜ LỊCH DỒN CÁC THỨ T2 -> T6 (THU NHỎ LẠI, ƯU TIÊN DIỆN TÍCH CHO BÊN PHẢI) */}
        {/* ===================================================================== */}
        <div className="lg:col-span-3 xl:col-span-2.5 bg-white border-2 border-amber-300 rounded-2xl shadow-sm overflow-hidden sticky top-[175px]">
          {/* ĐẦU TỜ LỊCH (PHONG CÁCH TỜ LỊCH TREO TƯỜNG TRUYỀN THỐNG NHỎ GỌN) */}
          <div className="relative bg-gradient-to-r from-red-600 via-rose-700 to-amber-800 text-white p-2.5 text-center shadow-inner">
            {/* 2 khuyên treo lịch */}
            <div className="absolute top-1 left-0 right-0 flex justify-between px-4 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-black/40 border border-white/40 shadow-inner" />
              <span className="w-2 h-2 rounded-full bg-black/40 border border-white/40 shadow-inner" />
            </div>

            <div className="pt-0.5 space-y-0.5">
              <div className="text-[9.5px] uppercase font-black tracking-widest text-amber-200">
                TỜ LỊCH TUẦN HỌC
              </div>
              <div className="text-xs sm:text-sm font-black tracking-wide flex items-center justify-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-amber-200" />
                <span>{weekConfig.weekTitle || 'TUẦN HỌC'}</span>
              </div>
              {weekConfig.dateRangeText && (
                <div className="text-[9.5px] text-amber-100 font-semibold italic truncate">
                  {weekConfig.dateRangeText}
                </div>
              )}
            </div>
          </div>

          {/* CÁC THỨ DỒN VÀO TỜ LỊCH */}
          <div className="p-2 sm:p-2.5 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/20 space-y-1.5">
            <div className="flex items-center justify-between text-[10.5px] font-bold text-amber-950 pb-1 border-b border-amber-200/70">
              <span className="flex items-center gap-1">
                <span>TÍCH CHỌN THỨ</span>
              </span>
              <span className="text-[9.5px] text-emerald-700 font-extrabold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                Tự điền ngày
              </span>
            </div>

            {/* DANH SÁCH CÁC THỨ T2, T3, T4, T5, T6 (ĐÃ BỎ KÝ TỰ A, B, C, D, E) */}
            <div className="space-y-1.5">
              {WEEK_DAYS_LIST.map((day, dIdx) => {
                const sched = getDaySchedule(day);
                const countInDay = combineList.filter((i) => i.selected && getItemDays(i).includes(day)).length;
                const shortDay = formatDayToNumbered(day);
                const isSelected = activeDayTab === day;

                const match = (sched.teachDate || '').match(/ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
                const dayNum = match ? match[1].padStart(2, '0') : ['28', '29', '30', '01', '02'][dIdx];
                const monthStr = match ? `${match[2].padStart(2, '0')}` : '09';

                return (
                  <div
                    key={day}
                    onClick={() => {
                      setActiveDayTab(day);
                    }}
                    role="button"
                    tabIndex={0}
                    className={`group w-full p-2 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-amber-100/90 border-amber-600 ring-2 ring-amber-400/80 shadow-xs'
                        : 'bg-white hover:bg-amber-50/70 border-slate-200 hover:border-amber-300'
                    }`}
                    title={`Tích chọn để mở khu vực chọn bài cho ${day}`}
                  >
                    {/* Tên thứ & Ngày dạy */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`px-2 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-transform ${
                          isSelected
                            ? 'bg-amber-700 text-white shadow-2xs scale-105'
                            : 'bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-amber-50 group-hover:border-amber-300 group-hover:text-amber-900'
                        }`}
                      >
                        {shortDay}
                      </div>

                      <div className="min-w-0 text-left">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-amber-950 truncate">
                          {day}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1">
                          <span>📅 {dayNum}/{monthStr}</span>
                        </div>
                      </div>
                    </div>

                    {/* Số bài đã chọn */}
                    <div className="shrink-0 flex items-center">
                      {countInDay > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{countInDay} bài</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-400">
                          0 bài
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Lựa chọn xem tổng hợp cả tuần */}
              <div
                onClick={() => setActiveDayTab('all')}
                role="button"
                tabIndex={0}
                className={`w-full p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                  activeDayTab === 'all'
                    ? 'bg-amber-800 text-white border-amber-900 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-dashed border-slate-300'
                }`}
                title="Xem danh sách bài của cả 5 thứ trong tuần"
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-extrabold truncate">Tổng hợp cả tuần</span>
                </div>
                <span
                  className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                    activeDayTab === 'all' ? 'bg-amber-900 text-amber-100' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {combineList.length} bài
                </span>
              </div>
            </div>

            {/* CÁC NÚT THAO TÁC TRÊN LỊCH */}
            <div className="pt-1.5 border-t border-amber-200/80 flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={handleAutoAssignWeekDates}
                className="flex-1 py-1 px-1.5 rounded-lg text-[10.5px] font-bold bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="Tự động tính ngày soạn & ngày dạy cho cả 5 thứ"
              >
                <RefreshCw className="w-3 h-3 text-amber-700" />
                <span>Tính lại</span>
              </button>

              <button
                type="button"
                onClick={handleClearAllDates}
                className="py-1 px-1.5 rounded-lg text-[10.5px] font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="Xóa tất cả ngày"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa</span>
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* BÊN PHẢI: KHU VỰC CHỌN BÀI MỞ RỘNG (ƯU TIÊN DIỆN TÍCH TỐI ĐA) */}
        {/* ===================================================================== */}
        <div className="lg:col-span-9 xl:col-span-9.5 bg-white border-2 border-amber-400 rounded-2xl shadow-sm overflow-hidden min-w-0">
          {activeDayTab !== 'all' ? (
            <div className="p-3.5 sm:p-5 space-y-3.5">
              {/* HEADER KHU VỰC CHỌN BÀI CHO THỨ HIỆN TẠI */}
              <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-amber-950 uppercase flex items-center gap-2">
                    <span>KHU VỰC CHỌN BÀI: {activeDayTab}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-amber-200/80 text-amber-900 border border-amber-300">
                      {itemsInActiveDay.length} bài đã ghép
                    </span>
                  </h4>
                </div>

                {/* NGÀY SOẠN VÀ NGÀY DẠY NHANH CỦA THỨ NÀY */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <label className="text-[11px] font-bold text-slate-700 whitespace-nowrap">Soạn:</label>
                    <input
                      type="text"
                      value={currentDaySchedule.prepDate || ''}
                      onChange={(e) => handleUpdateDaySchedule(activeDayTab, 'prepDate', e.target.value)}
                      placeholder="VD: 26/9/2026"
                      className="h-7.5 w-28 px-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[11px] font-bold text-slate-700 whitespace-nowrap">Dạy:</label>
                    <input
                      type="text"
                      value={currentDaySchedule.teachDate || ''}
                      onChange={(e) => handleUpdateDaySchedule(activeDayTab, 'teachDate', e.target.value)}
                      placeholder={`VD: ${activeDayTab} ngày ...`}
                      className="h-7.5 w-48 px-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* ACTION TOOLBAR: TÌM KIẾM BÀI TRONG KHO */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Ô tìm kiếm bài trong kho */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={rightWarehouseSearch}
                      onChange={(e) => setRightWarehouseSearch(e.target.value)}
                      placeholder="Tìm bài theo tên trong kho..."
                      className="w-full h-8.5 pl-8.5 pr-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {itemsInActiveDay.length > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAutoAssignSectionsForDay(activeDayTab)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                        title="Đánh dấu tuần tự: bài 1 thành mục A, bài 2 thành B, bài 3 thành C..."
                      >
                        <ListOrdered className="w-3.5 h-3.5 text-amber-700" />
                        <span>Gán mục A, B, C...</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* NỘI DUNG HIỂN THỊ CÁC BÀI CÓ Ở KHO */}
              {combineList.length === 0 ? (
                /* KHI KHO HOÀN TOÀN TRỐNG */
                <div className="p-8 bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Kho bài hiện đang trống</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Khu vực này dùng để hiển thị và chọn các bài có trong kho đưa vào {activeDayTab}. Thầy/Cô vui lòng tải file Word (.docx) ở thanh công cụ phía trên.
                  </p>
                </div>
              ) : (
                /* KHI KHO ĐÃ CÓ BÀI: HIỂN THỊ DANH SÁCH BÀI CÓ THỂ TÍCH CHỌN VÀ CẤU HÌNH TRỰC TIẾP */
                <div className="space-y-4">
                  {/* PHẦN 1: BÀI ĐÃ CHỌN CHO THỨ HIỆN TẠI (NẾU CÓ) */}
                  {itemsInActiveDay.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-amber-950 uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>BÀI ĐÃ GÁN CHO {activeDayTab} ({itemsInActiveDay.length} bài)</span>
                        </span>
                        <span className="text-[11px] text-amber-900 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ⚡ Mục A, B và F, H, K là dập khuôn tự động • Thầy/Cô chỉ chọn mục C, D, E
                        </span>
                      </div>

                      <div className="bg-white border-2 border-emerald-300/80 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-emerald-50/80 text-emerald-950 text-[11px] font-bold uppercase tracking-wider border-b border-emerald-200">
                            <tr>
                              <th className="p-2.5 w-16 text-center">Thứ tự</th>
                              <th className="p-2.5 w-56">Hoạt động (C, D, E)</th>
                              <th className="p-2.5 min-w-[200px]">Tên bài dạy / File</th>
                              <th className="p-2.5 min-w-[200px]">Các thứ gán bài (T2..T6)</th>
                              <th className="p-2.5 w-24 text-center">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-100/60">
                            {itemsInActiveDay.map((item, idx) => {
                              const itemDays = getItemDays(item);
                              return (
                                <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                                  <td className="p-2.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-900 font-black text-xs flex items-center justify-center">
                                        #{idx + 1}
                                      </span>
                                      <div className="flex flex-col">
                                        <button
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={() => handleMoveItemWithinDay(activeDayTab, idx, 'up')}
                                          className="p-0.5 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-20 cursor-pointer"
                                          title="Đẩy lên trước"
                                        >
                                          <MoveUp className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={idx === itemsInActiveDay.length - 1}
                                          onClick={() => handleMoveItemWithinDay(activeDayTab, idx, 'down')}
                                          className="p-0.5 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-20 cursor-pointer"
                                          title="Đẩy xuống sau"
                                        >
                                          <MoveDown className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="p-2.5">
                                    <select
                                      value={item.activitySection || 'C'}
                                      onChange={(e) => handleSetItemSection(item.id, e.target.value)}
                                      className="w-full h-8 px-2 bg-white border border-amber-400 rounded-lg text-xs font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
                                    >
                                      {PRESCHOOL_ACTIVITY_SECTIONS.map((sec) => (
                                        <option key={sec.code} value={sec.code}>
                                          {sec.title}
                                        </option>
                                      ))}
                                    </select>
                                  </td>

                                  <td className="p-2.5 font-bold text-slate-800">
                                    <div className="truncate max-w-[240px]" title={item.title}>
                                      {item.title}
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5 pt-0.5">
                                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                                        {item.source === 'uploaded' ? 'File Word' : 'Soạn AI'}
                                      </span>
                                      <span>• {item.subject || 'Mầm non'}</span>
                                    </div>
                                  </td>

                                  <td className="p-2.5">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 flex-wrap">
                                        {WEEK_DAYS_LIST.slice(0, 5).map((d) => {
                                          const isThisDay = item.selected && itemDays.includes(d);
                                          return (
                                            <button
                                              key={d}
                                              type="button"
                                              onClick={() => handleToggleDayForItem(item.id, d)}
                                              className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                                                isThisDay
                                                  ? 'bg-emerald-600 text-white shadow-2xs scale-105 ring-1 ring-emerald-400'
                                                  : 'text-slate-600 hover:bg-white hover:text-amber-900 border border-transparent hover:border-slate-200'
                                              }`}
                                              title={`Tích / Bỏ tích ${formatDayToNumbered(d)} cho bài này`}
                                            >
                                              {formatDayToNumbered(d)}
                                            </button>
                                          );
                                        })}
                                        <button
                                          type="button"
                                          onClick={() => handleToggleAllWeekdaysForItem(item.id)}
                                          className={`px-1.5 py-0.5 rounded text-[9.5px] font-extrabold transition-all cursor-pointer ${
                                            WEEK_DAYS_LIST.slice(0, 5).every((d) => itemDays.includes(d)) && item.selected
                                              ? 'bg-amber-800 text-white shadow-2xs'
                                              : 'text-slate-500 hover:bg-white hover:text-amber-900'
                                          }`}
                                          title="Tích bài này cho cả tuần (Thứ 2 đến Thứ 6)"
                                        >
                                          Cả tuần
                                        </button>
                                      </div>
                                      <div className="text-[10px] text-emerald-800 font-bold">
                                        📍 {formatAssignedDays(itemDays)}
                                      </div>
                                    </div>
                                  </td>

                                  <td className="p-2.5 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewPlanModal(item.plan)}
                                        className="p-1 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 transition-colors cursor-pointer"
                                        title="Xem nhanh nội dung bài"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleItemInActiveDay(item)}
                                        className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                                        title={`Gỡ bài này khỏi ${activeDayTab}`}
                                      >
                                        Gỡ ra
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* PHẦN 2: DANH SÁCH BÀI TRONG KHO (TÍCH CHỌN HOẶC GÁN LIÊN TỤC VÀO CÁC THỨ) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-950 uppercase flex items-center gap-1.5">
                        <FolderOpen className="w-4 h-4 text-amber-700" />
                        <span>KHO BÀI SẴN CÓ (Tích chọn hoặc bấm gán nhanh vào Thứ 2, 3, 4, 5, 6...)</span>
                      </span>
                      <span className="text-[11px] text-amber-800 font-semibold">
                        {combineList.length} bài trong kho
                      </span>
                    </div>

                    <div className="border border-amber-300/80 rounded-xl divide-y divide-slate-100 max-h-80 overflow-y-auto bg-white shadow-2xs">
                      {combineList
                        .filter((item) =>
                          !rightWarehouseSearch.trim() ||
                          item.title.toLowerCase().includes(rightWarehouseSearch.toLowerCase()) ||
                          (item.subject && item.subject.toLowerCase().includes(rightWarehouseSearch.toLowerCase()))
                        )
                        .map((item) => {
                          const itemDays = getItemDays(item);
                          const isInActiveDay = item.selected && itemDays.includes(activeDayTab);
                          const hasAssignedDays = item.selected && itemDays.length > 0;
                          return (
                            <div
                              key={item.id}
                              className={`p-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-colors ${
                                isInActiveDay ? 'bg-amber-100/70' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div
                                onClick={() => handleToggleItemInActiveDay(item)}
                                role="button"
                                tabIndex={0}
                                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                              >
                                <div className="text-amber-700 shrink-0">
                                  {isInActiveDay ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-700" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-800 truncate" title={item.title}>
                                    {item.title}
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-0.5 flex-wrap">
                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                                      {item.source === 'uploaded' ? 'File Word' : 'Soạn AI'}
                                    </span>
                                    <span>• {item.subject || 'Mầm non'}</span>
                                    {hasAssignedDays ? (
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                          isInActiveDay
                                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                            : 'bg-amber-100 text-amber-950 border-amber-300'
                                        }`}
                                      >
                                        📍 Đang gán: {formatAssignedDays(itemDays)}
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                        ⚪ Chưa phân ngày
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* CÁC NÚT TÍCH NHANH CẢ TUẦN T2..T6 */}
                              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                  {WEEK_DAYS_LIST.slice(0, 5).map((d) => {
                                    const isAssigned = item.selected && itemDays.includes(d);
                                    return (
                                      <button
                                        key={d}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleDayForItem(item.id, d);
                                        }}
                                        className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                                          isAssigned
                                            ? 'bg-emerald-600 text-white shadow-2xs scale-105 ring-1 ring-emerald-400'
                                            : 'text-slate-600 hover:bg-white hover:text-amber-900'
                                        }`}
                                        title={`Tích / Bỏ tích ${formatDayToNumbered(d)} cho bài này`}
                                      >
                                        {formatDayToNumbered(d)}
                                      </button>
                                    );
                                  })}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleAllWeekdaysForItem(item.id);
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-extrabold transition-all cursor-pointer ${
                                      WEEK_DAYS_LIST.slice(0, 5).every((d) => itemDays.includes(d)) && item.selected
                                        ? 'bg-amber-800 text-white shadow-2xs'
                                        : 'text-slate-500 hover:bg-white hover:text-amber-900'
                                    }`}
                                    title="Tích bài này cho cả tuần (Thứ 2 đến Thứ 6)"
                                  >
                                    Cả tuần
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewPlanModal(item.plan);
                                  }}
                                  className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
                                  title="Xem nhanh nội dung bài"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(item.id);
                                  }}
                                  className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-700 cursor-pointer"
                                  title="Xóa khỏi kho"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB TẤT CẢ BÀI TRONG KHO (KHI CHỌN XEM CẢ TUẦN) */
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-extrabold text-amber-950 uppercase">
                    TẤT CẢ CÁC BÀI TRONG TUẦN ({combineList.length} BÀI)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 cursor-pointer transition-colors"
                  >
                    Xóa các bài đã tích
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-80 overflow-y-auto border border-amber-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <button
                          type="button"
                          onClick={handleToggleSelectAll}
                          className="cursor-pointer text-slate-600 hover:text-amber-900"
                        >
                          {allSelected ? <CheckSquare className="w-4 h-4 text-amber-700" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </button>
                      </th>
                      <th className="p-2.5 w-14 text-center">STT</th>
                      <th className="p-2.5 w-32">Thứ trong tuần</th>
                      <th className="p-2.5 w-56">Mục bài (A..K)</th>
                      <th className="p-2.5 min-w-[200px]">Tên bài dạy / File</th>
                      <th className="p-2.5 min-w-[150px]">Ngày soạn</th>
                      <th className="p-2.5 min-w-[220px]">Ngày dạy</th>
                      <th className="p-2.5 w-24 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {combineList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(item.id)}
                            className="cursor-pointer text-slate-600 hover:text-amber-900"
                          >
                            {item.selected ? <CheckSquare className="w-4 h-4 text-amber-700" /> : <Square className="w-4 h-4 text-slate-300" />}
                          </button>
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-700">#{idx + 1}</td>
                        <td className="p-2.5">
                          {(() => {
                            const itemDays = getItemDays(item);
                            return (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 flex-wrap">
                                  {WEEK_DAYS_LIST.slice(0, 5).map((d) => {
                                    const isThisDay = item.selected && itemDays.includes(d);
                                    return (
                                      <button
                                        key={d}
                                        type="button"
                                        onClick={() => handleToggleDayForItem(item.id, d)}
                                        className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                                          isThisDay
                                            ? 'bg-emerald-600 text-white shadow-2xs scale-105 ring-1 ring-emerald-400'
                                            : 'text-slate-600 hover:bg-white hover:text-amber-900 border border-transparent hover:border-slate-200'
                                        }`}
                                        title={`Tích / Bỏ tích ${formatDayToNumbered(d)} cho bài này`}
                                      >
                                        {formatDayToNumbered(d)}
                                      </button>
                                    );
                                  })}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAllWeekdaysForItem(item.id)}
                                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-extrabold transition-all cursor-pointer ${
                                      WEEK_DAYS_LIST.slice(0, 5).every((d) => itemDays.includes(d)) && item.selected
                                        ? 'bg-amber-800 text-white shadow-2xs'
                                        : 'text-slate-500 hover:bg-white hover:text-amber-900'
                                    }`}
                                    title="Tích bài này cho cả tuần (Thứ 2 đến Thứ 6)"
                                  >
                                    Cả tuần
                                  </button>
                                </div>
                                <div className="text-[10px] text-emerald-800 font-bold">
                                  📍 {formatAssignedDays(itemDays)}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-2.5">
                          <select
                            value={item.activitySection || 'C'}
                            onChange={(e) => handleSetItemSection(item.id, e.target.value)}
                            className="w-full h-7 px-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800"
                          >
                            {PRESCHOOL_ACTIVITY_SECTIONS.map((sec) => (
                              <option key={sec.code} value={sec.code}>
                                {sec.title}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">
                          <div className="truncate max-w-[200px]" title={item.title}>
                            {item.title}
                          </div>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.prepDate || ''}
                            onChange={(e) => {
                              const updated = combineList.map((i) =>
                                i.id === item.id ? { ...i, prepDate: e.target.value } : i
                              );
                              onUpdateCombineList(updated);
                            }}
                            placeholder="26/9/2026"
                            className="w-full h-7 px-2 bg-slate-50 border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={item.teachDate || ''}
                            onChange={(e) => {
                              const updated = combineList.map((i) =>
                                i.id === item.id ? { ...i, teachDate: e.target.value } : i
                              );
                              onUpdateCombineList(updated);
                            }}
                            placeholder="Thứ hai ngày 28/9/2026"
                            className="w-full h-7 px-2 bg-slate-50 border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewPlanModal(item.plan)}
                              className="p-1 rounded bg-slate-100 hover:bg-amber-100 text-slate-700"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-700"
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
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MÔ PHỎNG BẢN IN GIÁO ÁN TUẦN TRÊN FILE WORD (LIVE PRINT PREVIEW) */}
      {/* ========================================================================= */}
      {showLiveDocPreview && (
        <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-2 border-b border-slate-200">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              MÔ PHỎNG NỘI DUNG XUẤT FILE WORD (THEO CHUẨN MẪU GIÁO ÁN TUẦN 4.PDF)
            </span>
            <span className="text-[11px] font-normal text-slate-500 italic">
              Tiêu đề tuần ở đầu trang 1 • Các ngày tiếp theo chỉ có Ngày soạn/Ngày dạy
            </span>
          </div>

          <div className="bg-white border border-slate-300 p-6 sm:p-8 rounded-xl shadow-sm font-['Times_New_Roman',serif] text-slate-900 space-y-5 max-w-3xl mx-auto">
            {/* WEEK HEADER (CHỈ Ở ĐẦU TRANG 1 - LUÔN LUÔN GIỮ NGUYÊN) */}
            <div className="text-center space-y-1 pb-2 border-b border-slate-100">
              <div className="font-bold text-base tracking-wide uppercase">{weekConfig.weekTitle || 'TUẦN 1:'}</div>
              <div className="font-bold text-base uppercase">CHỦ ĐIỂM: {weekConfig.themeGroup || 'BẢN THÂN'}</div>
              <div className="font-bold text-base uppercase">CHỦ ĐỀ: {weekConfig.subTheme || 'TÔI LÀ AI?'}</div>
              {weekConfig.dateRangeText && (
                <div className="italic text-sm text-slate-700">{weekConfig.dateRangeText}</div>
              )}
            </div>

            {/* DANH SÁCH TỪNG NGÀY */}
            {(() => {
              const activeDays = WEEK_DAYS_LIST.filter((dayName) =>
                selectedItems.some((i) => getItemDays(i).includes(dayName))
              );
              return activeDays.map((dayName, activeIdx) => {
                const dayItems = selectedItems.filter((i) => getItemDays(i).includes(dayName));
                if (dayItems.length === 0) return null;

                const sched = getDaySchedule(dayName);
                const prepStr = dayItems[0]?.prepDate || sched.prepDate || '';
                const teachStr = dayItems[0]?.teachDate || sched.teachDate || '';

                return (
                  <div key={dayName} className="space-y-3 pt-2">
                    {/* Dấu sao kẻ ngang CHỈ xuất hiện khi sang ngày tiếp theo (Thứ 3, Thứ 4, Thứ 5, Thứ 6...) */}
                    {activeIdx > 0 && (
                      <div className="text-center font-bold text-slate-700 tracking-widest py-2 select-none">
                        *********************************************************
                      </div>
                    )}

                    {/* Ngày soạn & Ngày dạy (Căn phải) */}
                    <div className="text-right space-y-0.5 italic text-sm text-slate-800">
                      {prepStr && <div>{prepStr.startsWith('Ngày soạn:') ? prepStr : `Ngày soạn: ${prepStr}`}</div>}
                      {teachStr && <div>{teachStr.startsWith('Ngày dạy:') ? teachStr : `Ngày dạy: ${teachStr}`}</div>}
                    </div>

                    {/* Các mục của ngày đó (Thứ tự chuẩn A -> B -> C -> D -> E -> F -> H -> K) */}
                    <div className="space-y-3 pt-1">
                      {['A', 'B', 'C', 'D', 'E', 'F', 'H', 'K'].map((secCode) => {
                        const userItems = dayItems.filter((i) => (i.activitySection || 'C') === secCode);

                        // 1. Nếu người dùng có nạp bài cho mục này
                        if (userItems.length > 0) {
                          if (secCode === 'C') {
                            return userItems.map((item) => {
                              const hInfo = getPreschoolSectionCHeaderInfo(item);
                              return (
                                <div key={item.id} className="text-xs space-y-1.5 pl-3 border-l-2 border-emerald-500 bg-emerald-50/50 p-3 rounded-r-lg">
                                  <div className="font-bold text-slate-900 uppercase text-sm">
                                    C. HOẠT ĐỘNG HỌC
                                  </div>
                                  <div className="text-center space-y-0.5 py-1">
                                    <div className="font-bold text-slate-900 uppercase text-xs sm:text-sm">
                                      LĨNH VỰC PHÁT TRIỂN: {hInfo.domain}
                                    </div>
                                    <div className="font-bold text-slate-900 uppercase text-xs sm:text-sm">
                                      HOẠT ĐỘNG: {hInfo.activity}
                                    </div>
                                    <div className="font-bold text-slate-900 uppercase text-xs sm:text-sm">
                                      ĐỀ TÀI: {hInfo.topic}
                                    </div>
                                  </div>
                                  <div className="text-[11px] text-slate-600 pl-2">
                                    [I. Mục đích - yêu cầu • II. Chuẩn bị • III. Tiến trình tổ chức hoạt động]
                                  </div>
                                </div>
                              );
                            });
                          }

                          // Các mục khác (A, B, D, E, F, H, K) do người dùng chọn/tải
                          return userItems.map((item) => {
                            const secDef = PRESCHOOL_ACTIVITY_SECTIONS.find((s) => s.code === secCode);
                            return (
                              <div key={item.id} className="text-xs space-y-1 pl-3 border-l-2 border-emerald-500 bg-emerald-50/40 p-2.5 rounded-r-lg">
                                <div className="font-bold text-emerald-950 uppercase text-sm flex items-center justify-between">
                                  <span>{item.activitySectionTitle || secDef?.title || `${secCode}. HOẠT ĐỘNG`}</span>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">Mẫu giáo viên nạp</span>
                                </div>
                                {item.title && (
                                  <div className="font-semibold italic text-slate-800">
                                    - Đề tài / Tên bài: {item.title}
                                  </div>
                                )}
                                <div className="text-[11px] text-slate-600 pl-2">
                                  [Nội dung hoạt động cắt lấy theo mẫu bài nạp: Mục đích, Chuẩn bị, Tiến trình]
                                </div>
                              </div>
                            );
                          });
                        }

                        // 2. Nếu người dùng chưa nạp bài cho các mục cố định -> Hiển thị dập khuôn tự có
                        if (secCode === 'A') {
                          return (
                            <div key="auto-A" className="text-xs space-y-1 pl-2 border-l-2 border-amber-300">
                              <div className="font-bold text-slate-900 uppercase text-sm flex items-center gap-2">
                                <span>A. ĐÓN TRẺ, TRÒ CHUYỆN SÁNG</span>
                                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">Dập khuôn tự có</span>
                              </div>
                              <div className="text-[11px] text-slate-600 pl-3">
                                1. Đón trẻ • 2. Trò chuyện sáng • 3. Điểm danh, báo ăn
                              </div>
                            </div>
                          );
                        }

                        if (secCode === 'B') {
                          return (
                            <div key="auto-B" className="text-xs space-y-1 pl-2 border-l-2 border-amber-300">
                              <div className="font-bold text-slate-900 uppercase text-sm flex items-center gap-2">
                                <span>B. THỂ DỤC SÁNG</span>
                                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">Dập khuôn tự có</span>
                              </div>
                              <div className="text-[11px] text-slate-600 pl-3">
                                1. Khởi động • 2. Trọng động (Bài tập phát triển chung) • 3. Hồi tĩnh
                              </div>
                            </div>
                          );
                        }

                        if (secCode === 'F') {
                          return (
                            <div key="auto-F" className="text-xs space-y-1 pl-2 border-l-2 border-amber-300">
                              <div className="font-bold text-slate-900 uppercase text-sm flex items-center gap-2">
                                <span>F. VỆ SINH, ĂN, NGỦ TRƯA</span>
                                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">Dập khuôn tự có</span>
                              </div>
                              <div className="text-[11px] text-slate-600 pl-3">
                                1. Vệ sinh trước khi ăn • 2. Giờ ăn trưa • 3. Giờ ngủ trưa
                              </div>
                            </div>
                          );
                        }

                        if (secCode === 'H') {
                          return (
                            <div key="auto-H" className="text-xs space-y-1 pl-2 border-l-2 border-amber-300">
                              <div className="font-bold text-slate-900 uppercase text-sm flex items-center gap-2">
                                <span>H. NÊU GƯƠNG CẮM CỜ , VỆ SINH TRẢ TRẺ</span>
                                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">Dập khuôn tự có</span>
                              </div>
                              <div className="text-[11px] text-slate-600 pl-3">
                                1. Hoạt động chiều • 2. Nêu gương cắm cờ • 3. Vệ sinh, trả trẻ
                              </div>
                            </div>
                          );
                        }

                        if (secCode === 'K') {
                          return (
                            <div key="auto-K" className="text-xs space-y-1 pl-2 border-l-2 border-amber-300">
                              <div className="font-bold text-slate-900 uppercase text-sm flex items-center gap-2">
                                <span>K. NHẬN XÉT CUỐI NGÀY</span>
                                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">Dập khuôn tự có</span>
                              </div>
                              <div className="text-[11px] text-slate-600 pl-3">
                                Sĩ số, tình trạng sức khỏe, thái độ và cảm xúc của trẻ trong ngày
                              </div>
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHỌN BÀI / FILE TỪ KHO GHÉP VÀO LỊCH TUẦN LIÊN TỤC */}
      {/* ========================================================================= */}
      {isSelectFilesModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* MODAL HEADER */}
            <div className="p-3.5 bg-amber-900 text-white flex items-center justify-between border-b border-amber-800">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm sm:text-base text-amber-100">
                  PHÂN BÀI TỪ KHO VÀO LỊCH TUẦN: <span className="text-amber-300 uppercase">{modalTargetDay}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectFilesModalOpen(false)}
                className="text-amber-200 hover:text-white p-1 rounded hover:bg-amber-800 text-xs font-bold cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            {/* TAB CHUYỂN NHANH CÁC THỨ TRONG TUẦN LIÊN TỤC TRONG MODAL */}
            <div className="bg-amber-50 px-3 py-2 border-b border-amber-200 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-extrabold text-amber-900 shrink-0 mr-1 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>CHỌN THỨ:</span>
              </span>
              {WEEK_DAYS_LIST.slice(0, 5).map((day) => {
                const countInThisDay = combineList.filter((i) => i.selected && getItemDays(i).includes(day)).length;
                const isCurrentModalDay = modalTargetDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSwitchModalTargetDay(day)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isCurrentModalDay
                        ? 'bg-amber-800 text-white shadow-xs'
                        : countInThisDay > 0
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300'
                        : 'bg-white hover:bg-amber-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{day}</span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black ${
                        isCurrentModalDay
                          ? 'bg-amber-950 text-amber-200'
                          : countInThisDay > 0
                          ? 'bg-emerald-200 text-emerald-950'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {countInThisDay} bài
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap text-slate-600 text-xs">
                <span>
                  Tích chọn để thêm vào <strong>{modalTargetDay}</strong> hoặc bấm các nút <strong>[T2] [T3] [T4] [T5] [T6]</strong> để phân bài nhanh cho cả tuần:
                </span>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                  Đang chọn cho: {modalTargetDay} ({modalSelectedIds.length} bài)
                </span>
              </div>

              {/* Ô tìm kiếm */}
              <input
                type="text"
                value={modalSearchKeyword}
                onChange={(e) => setModalSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm theo tên bài dạy hoặc môn học..."
                className="w-full h-8.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              {/* Danh sách các bài trong kho */}
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-80 overflow-y-auto bg-white shadow-2xs">
                {combineList.length === 0 ? (
                  <div className="p-6 text-center space-y-3">
                    <p className="font-bold text-slate-800 text-sm">Kho bài hiện chưa có bài dạy nào!</p>
                    <p className="text-slate-500 text-xs max-w-md mx-auto">
                      Thầy/Cô có thể tải các file Word giáo án có sẵn trên máy tính lên kho hoặc đưa bài vừa soạn vào để gán cho {modalTargetDay}.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải file Word (.docx) lên kho</span>
                      </button>
                      {currentPlan && (
                        <button
                          type="button"
                          onClick={() => {
                            onAddCurrentPlan();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Đưa bài vừa soạn vào kho</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          handleAddFixedSectionToDay('C', modalTargetDay);
                          setIsSelectFilesModalOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs cursor-pointer"
                      >
                        + Tạo nhanh Hoạt động học (C)
                      </button>
                    </div>
                  </div>
                ) : combineList.filter((item) => {
                    if (!modalSearchKeyword) return true;
                    return (
                      item.title.toLowerCase().includes(modalSearchKeyword.toLowerCase()) ||
                      (item.subject || '').toLowerCase().includes(modalSearchKeyword.toLowerCase())
                    );
                  }).length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    Không tìm thấy bài nào khớp với từ khóa "<strong>{modalSearchKeyword}</strong>".
                  </div>
                ) : (
                  combineList
                    .filter((item) => {
                      if (!modalSearchKeyword) return true;
                      return (
                        item.title.toLowerCase().includes(modalSearchKeyword.toLowerCase()) ||
                        (item.subject || '').toLowerCase().includes(modalSearchKeyword.toLowerCase())
                      );
                    })
                    .map((item) => {
                      const itemDays = getItemDays(item);
                      const isChecked = modalSelectedIds.includes(item.id) || (item.selected && itemDays.includes(modalTargetDay));
                      const isAssignedToThisDay = item.selected && itemDays.includes(modalTargetDay);
                      const hasAssignedDays = item.selected && itemDays.length > 0;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-colors ${
                            isChecked ? 'bg-amber-50/80 hover:bg-amber-100/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div
                            onClick={() => {
                              if (isChecked) {
                                setModalSelectedIds(modalSelectedIds.filter((id) => id !== item.id));
                              } else {
                                setModalSelectedIds([...modalSelectedIds, item.id]);
                              }
                            }}
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          >
                            <div className="shrink-0">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-700" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate" title={item.title}>
                                {item.title}
                              </div>
                              <div className="text-[10.5px] text-slate-500 flex items-center gap-1.5 pt-0.5 flex-wrap">
                                <span className="font-semibold text-amber-900">{item.subject || 'Mầm non'}</span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold text-[9.5px]">
                                  {item.source === 'uploaded' ? 'Word' : 'AI'}
                                </span>
                                
                                {/* THÔNG BÁO VỊ TRÍ BÀI Ở CÁC THỨ */}
                                {hasAssignedDays ? (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    isAssignedToThisDay
                                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                      : 'bg-amber-100 text-amber-950 border-amber-300'
                                  }`}>
                                    📍 Đang gán: {formatAssignedDays(itemDays)}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                    ⚪ Chưa phân ngày
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* CÁC NÚT TÍCH NHANH CẢ TUẦN T2..T6 TRONG MODAL */}
                          <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex-wrap">
                            {WEEK_DAYS_LIST.slice(0, 5).map((d) => {
                              const isThisDay = item.selected && itemDays.includes(d);
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleDayForItem(item.id, d);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                                    isThisDay
                                      ? 'bg-emerald-600 text-white shadow-2xs scale-105 ring-1 ring-emerald-400'
                                      : 'text-slate-600 hover:bg-white hover:text-amber-900'
                                  }`}
                                  title={`Tích / Bỏ tích ${formatDayToNumbered(d)} cho bài này`}
                                >
                                  {formatDayToNumbered(d)}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAllWeekdaysForItem(item.id);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[9.5px] font-extrabold transition-all cursor-pointer ${
                                WEEK_DAYS_LIST.slice(0, 5).every((d) => itemDays.includes(d)) && item.selected
                                  ? 'bg-amber-800 text-white shadow-2xs'
                                  : 'text-slate-500 hover:bg-white hover:text-amber-900'
                              }`}
                              title="Tích bài này cho cả tuần (Thứ 2 đến Thứ 6)"
                            >
                              Cả tuần
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600 font-medium">
                Đã chọn <strong>{modalSelectedIds.length}</strong> bài cho <strong>{modalTargetDay}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSelectFilesModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSelectFilesForDay}
                  className="px-4 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Xác nhận gán vào {modalTargetDay}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PREVIEW MODAL */}
      {previewPlanModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-amber-900 text-white flex items-center justify-between border-b border-amber-800">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-amber-300 shrink-0" />
                <h3 className="font-bold text-sm sm:text-base text-amber-100 truncate">
                  {previewPlanModal.lessonTitle || 'Xem nhanh bài soạn'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPlanModal(null)}
                className="text-amber-200 hover:text-white p-1 rounded hover:bg-amber-800 text-xs font-bold cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-800 flex-1">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1 text-slate-800">
                <p><strong>Cấp học:</strong> {previewPlanModal.schoolLevel || 'Mầm non'}</p>
                <p><strong>Khối lớp / Độ tuổi:</strong> {previewPlanModal.grade || 'Mẫu giáo'}</p>
                <p><strong>Môn học / Lĩnh vực:</strong> {previewPlanModal.subject || 'Chưa cập nhật'}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-amber-900 uppercase tracking-wide">
                  Các hoạt động dạy học ({previewPlanModal.activities?.length || 0}):
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {previewPlanModal.activities?.map((act, i) => (
                    <div key={i} className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                      <div className="font-bold text-amber-900">{act.name}</div>
                      {act.objective && <p className="text-[11px] text-slate-600"><strong>Mục tiêu:</strong> {act.objective}</p>}
                      {(act.steps || [act.step1, act.step2, act.step3, act.step4].filter(Boolean))?.map((step, sIdx) => (
                        <div key={sIdx} className="text-[11px] pl-2 border-l-2 border-amber-400 mt-1">
                          <div className="font-semibold text-slate-800">{step?.title}</div>
                          {step?.teacherAction && <p className="text-slate-600 whitespace-pre-wrap">{step.teacherAction}</p>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPlanModal(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
