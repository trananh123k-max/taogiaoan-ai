import React, { useState } from 'react';
import {
  LessonPlanOutput,
  ImageSlot,
  ActivityDetail,
  MathFormulaFormatType,
  LessonPlanConfig,
} from '../types';
import {
  Download,
  BookOpen,
  BookMarked,
  FileText,
  Award,
  Clock,
  Maximize2,
  Minimize2,
  Loader2,
  CheckCircle2,
  Sparkles,
  Layers,
  XCircle,
  Presentation,
  Sliders,
} from 'lucide-react';
import { PedagogicalTable } from './PedagogicalTable';
import { PreschoolSingleTable } from './PreschoolSingleTable';
import { CompetencyMatrixView } from './CompetencyMatrixView';
import { exportLessonPlanToDocx, getPreschoolHeaderInfo, formatHomeworkText, formatMathPeriodHeader, parseMathLessonHeader } from '../utils/docxExporter';
import { exportLessonPlanToPptx } from '../utils/pptxExporter';
import { formatPreschoolActivities, formatPreschoolMusicActivities, isPreschoolPlan, sanitizeStandardActivity, isPreschoolNew8Activity, stripPreschoolCodes, getPreschoolPreparation } from '../utils/preschoolUtils';
import { MAM_NON_NEW_ACTIVITIES } from '../data/curriculumData';
import { MathRenderer } from './MathRenderer';
import { WorksheetRenderer } from './WorksheetRenderer';
import { StepProgress } from '../App';

interface RightResultEditorProps {
  plan: LessonPlanOutput | null;
  config?: LessonPlanConfig;
  onChangeConfig?: (newConfig: Partial<LessonPlanConfig>) => void;
  imageSlots: ImageSlot[];
  onOpenAiSuggestions: () => void;
  onRefineActivity: (activity: ActivityDetail, instruction: string) => void;
  onManualEditActivity?: (activity: ActivityDetail) => void;
  isRefiningActivity?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isGenerating?: boolean;
  elapsedSeconds?: number;
  progress?: Record<number, StepProgress>;
  onReset?: () => void;
  onCancelGenerate?: () => void;
  tableLayout?: 'two_column' | 'standard_row' | 'math_4_column';
  mathFormulaFormat?: MathFormulaFormatType;
  onMathFormulaFormatChange?: (format: MathFormulaFormatType) => void;
  onBackToConfig?: () => void;
}

const cleanItem = (text: string) => {
  if (!text) return '';
  return text
    .replace(/^[-•*]\s*/, '')
    .replace(/\*+/g, '')
    .replace(/\{\{IMAGE_SLOT_\d+\}\}/gi, '')
    .replace(/\{\{IMAGESLOT\d*\}\}/gi, '')
    .replace(/\[\s*Vị trí ảnh minh họa:[^\]]*\]/gi, '')
    .replace(/\[\s*Ảnh minh họa:[^\]]*\]/gi, '')
    .trim();
};

const renderGeneralCompetencyItem = (text: string) => {
  const clean = text.replace(/^[-•*]\s*/, '').trim();
  const match = clean.match(/^(Năng lực\s+)?(tự chủ và tự học|giao tiếp và hợp tác|giải quyết vấn đề và sáng tạo)[:\s–-]*(.*)$/i);
  if (match) {
    const titleName = match[2].trim();
    let standardTitle = '';
    if (/tự chủ/i.test(titleName)) standardTitle = 'Năng lực tự chủ và tự học:';
    else if (/giao tiếp/i.test(titleName)) standardTitle = 'Năng lực giao tiếp và hợp tác:';
    else if (/giải quyết/i.test(titleName)) standardTitle = 'Năng lực giải quyết vấn đề và sáng tạo:';
    else standardTitle = `Năng lực ${titleName}:`;

    const rest = match[3]?.trim() || '';
    return (
      <span>
        <strong className="font-bold text-slate-900">{standardTitle} </strong>
        <MathRenderer text={rest} />
      </span>
    );
  }
  return <MathRenderer text={cleanItem(text)} />;
};

const renderSubjectCompetencyItem = (text: string) => {
  const clean = text.replace(/^[-•*]\s*/, '').trim();

  // Pattern 1: Standard Năng lực [A-E] (NL[a-e]):
  const stdMatch = clean.match(/^(Năng lực\s+[A-E]\s*\((?:NL[a-e]|NLA|NLB|NLC|NLD|NLE)\))[:\s–-]*(.*)$/i);
  if (stdMatch) {
    const prefix = stdMatch[1].trim() + ':';
    const rest = stdMatch[2]?.trim() || '';
    return (
      <span>
        <strong className="font-bold text-slate-900">{prefix} </strong>
        <MathRenderer text={rest} />
      </span>
    );
  }

  // Pattern 2: Legacy format containing (NLa), (NLb), (NLc), (NLd), (NLe) anywhere
  const legacyMatch = clean.match(/^(?:[-•*]\s*)?(.*?)\s*\((NLa|NLb|NLc|NLd|NLe)\)[:\s–-]*(.*)$/i);
  if (legacyMatch) {
    const code = legacyMatch[2].toLowerCase();
    const letter = code.charAt(2).toUpperCase();
    const standardPrefix = `Năng lực ${letter} (NL${letter.toLowerCase()}):`;
    let stdTitle = '';
    if (letter === 'A') stdTitle = 'Phát triển năng lực sử dụng và quản lý các phương tiện công nghệ thông tin và truyền thông.';
    else if (letter === 'B') stdTitle = 'Phát triển năng lực ứng xử phù hợp trong môi trường số.';
    else if (letter === 'C') stdTitle = 'Phát triển năng lực nhận biết và hình thành nhu cầu tìm kiếm thông tin từ nguồn dữ liệu số khi giải quyết công việc.';
    else if (letter === 'D') stdTitle = 'Năng lực ứng dụng công nghệ thông tin và truyền thông trong học và tự học.';
    else if (letter === 'E') stdTitle = 'Năng lực hợp tác trong môi trường số.';

    let rest = legacyMatch[3]?.trim() || '';
    if (!rest) rest = legacyMatch[1]?.trim() || '';
    let fullText = rest;
    if (stdTitle && !fullText.toLowerCase().includes(stdTitle.substring(0, 20).toLowerCase())) {
      fullText = `${stdTitle} ${fullText}`.trim();
    }
    return (
      <span>
        <strong className="font-bold text-slate-900">{standardPrefix} </strong>
        <MathRenderer text={fullText} />
      </span>
    );
  }

  // Pattern 3: General Subject Competency (e.g. Năng lực tư duy toán học:)
  const generalMatch = clean.match(/^(Năng lực\s+[^:]+)[:\s–-]+(.*)$/i);
  if (generalMatch) {
    const prefix = generalMatch[1].trim() + ':';
    const rest = generalMatch[2]?.trim() || '';
    return (
      <span>
        <strong className="font-bold text-slate-900">{prefix} </strong>
        <MathRenderer text={rest} />
      </span>
    );
  }

  return <MathRenderer text={cleanItem(text)} />;
};

export const RightResultEditor: React.FC<RightResultEditorProps> = ({
  plan,
  config,
  onChangeConfig,
  imageSlots,
  onOpenAiSuggestions,
  onRefineActivity,
  onManualEditActivity,
  isRefiningActivity = false,
  isExpanded = false,
  onToggleExpand,
  isGenerating = false,
  elapsedSeconds = 0,
  progress,
  onReset,
  onCancelGenerate,
  tableLayout = 'two_column',
  mathFormulaFormat = 'word_equation',
  onMathFormulaFormatChange,
  onBackToConfig,
}) => {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);

  const currentSubject = config?.subject || plan?.subject || '';
  const currentTitle = config?.lessonTitle || plan?.lessonTitle || '';
  const isPreschoolActivity = (config?.schoolLevel === 'Mầm non' || (plan as any)?.schoolLevel === 'Mầm non') && (
    MAM_NON_NEW_ACTIVITIES.includes(currentSubject) ||
    isPreschoolNew8Activity(currentSubject, currentTitle)
  );

  // Calculate dynamic progress
  const completedStepsCount = Object.values(progress || {}).filter((s) => s === 'done').length;
  
  // Progress percentage calculation based on actual completed parts and elapsed time
  const progressPercent = Math.min(
    99,
    Math.max(
      completedStepsCount * 24 + 5,
      Math.min(95, Math.floor((elapsedSeconds / 30) * 90) + 10)
    )
  );

  const getDynamicStatusText = () => {
    if (completedStepsCount === 4) return 'Đang hoàn tất và đồng bộ Kế hoạch bài dạy...';
    if (elapsedSeconds < 5) return 'Đang phân tích nội dung bài học và trích xuất chuẩn kiến thức...';
    if (elapsedSeconds < 12) return 'Đang xây dựng chuỗi hoạt động sư phạm chuẩn 4 bước...';
    if (elapsedSeconds < 20) return 'Đang thiết kế Phiếu học tập kẻ bảng, Ma trận NLS/AI...';
    return 'Đang tối ưu hóa định dạng và chuẩn bị hiển thị giáo án hoàn chỉnh...';
  };

  const renderStep = (
    stepNumber: number,
    title: string,
    subtitle: string,
    pingColorClass: string
  ) => {
    const status = progress?.[stepNumber] || 'pending';
    
    let icon;
    let badge;
    if (status === 'done') {
      icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-in zoom-in duration-300" />;
      badge = <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Hoàn thành</span>;
    } else if (status === 'start') {
      icon = <Loader2 className={`w-5 h-5 animate-spin ${pingColorClass}`} />;
      badge = <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 animate-pulse">Đang xử lý...</span>;
    } else {
      icon = <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white" />;
      badge = <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Đang chờ</span>;
    }

    return (
      <div className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all ${
        status === 'start'
          ? 'bg-white shadow-md border-amber-300 scale-[1.01]'
          : status === 'done'
          ? 'bg-emerald-50/50 border-emerald-200'
          : 'bg-slate-50/60 border-slate-200 opacity-80'
      }`}>
        <div className="flex items-start gap-3">
          <div className="w-6 flex items-center justify-center flex-shrink-0 mt-0.5">
            {icon}
          </div>
          <div>
            <div className={`text-sm ${status === 'done' ? 'text-slate-900 font-bold' : status === 'start' ? 'text-amber-900 font-bold' : 'text-slate-700 font-medium'}`}>
              <span className="text-xs opacity-75 mr-1 font-semibold uppercase">Phần {stepNumber}:</span>
              {title}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtitle}</p>
          </div>
        </div>
        <div className="flex-shrink-0">{badge}</div>
      </div>
    );
  };

    

  if (isGenerating) {
    const formatMinSec = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}s`;
    };

    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 text-center text-slate-700 flex flex-col items-center justify-center min-h-[calc(100vh-180px)] w-full shadow-xs">
        {/* Animated Icon & Badge */}
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <BookOpen className="w-8 h-8 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1 tracking-tight">
          Đang biên soạn Kế hoạch bài dạy
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mb-6 leading-relaxed">
          Hệ thống đang tự động trích xuất nội dung bài học, thiết kế chuỗi hoạt động sư phạm chuẩn 4 bước và tích hợp Năng lực số / AI.
        </p>

        {/* Live Timer & Progress Cards (No remaining time estimation) */}
        <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-center shadow-2xs">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block mb-0.5">
              ⏱️ Thời gian đã chạy
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-900 font-mono">
              {formatMinSec(elapsedSeconds)}
            </span>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 text-center shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block mb-0.5">
              ⚡ Tiến độ xử lý
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full max-w-xl mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              {getDynamicStatusText()}
            </span>
            <span className="font-mono text-slate-700 font-bold">{completedStepsCount}/4 phần</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-500 rounded-full transition-all duration-500 shadow-inner"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 4 Multi-Threaded Step Cards */}
        <div className="w-full max-w-xl text-left flex flex-col gap-2.5 mb-6">
          {renderStep(
            1,
            'Mục tiêu bài dạy & Thiết bị dạy học',
            'Chuẩn phẩm chất, năng lực, chỉ báo NLS/AI và học liệu',
            'text-amber-500'
          )}
          {renderStep(
            2,
            'Hoạt động 1 (Khởi động) & Hoạt động 2 (Hình thành kiến thức)',
            'Quy chuẩn 4 bước sư phạm (Chuyển giao, Thực hiện, Báo cáo, Kết luận) & nội dung ghi bảng',
            'text-indigo-500'
          )}
          {renderStep(
            3,
            'Hoạt động 3 (Luyện tập) & Hoạt động 4 (Vận dụng & Dặn dò)',
            'Hệ thống bài tập củng cố, tình huống thực tế và hướng dẫn chuẩn bị bài tiếp theo',
            'text-blue-500'
          )}
          {renderStep(
            4,
            'Hồ sơ dạy học & Ma trận Năng lực số / AI',
            'Phiếu học tập kẻ bảng chi tiết và bảng ma trận 4 cột',
            'text-rose-500'
          )}
        </div>

        {/* Quick Cancel Button */}
        {onCancelGenerate && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onCancelGenerate}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Hủy soạn bài ngay</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-white border border-slate-300 rounded-xl p-6 sm:p-10 text-center shadow-xs text-slate-500 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] w-full">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          Chưa có Giáo án được soạn
        </h3>
        <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
          Khu vực xem trước đang trống. Hệ thống sẽ hiển thị nội dung quá trình soạn giáo án tại đây sau khi bạn bấm <strong>"SOẠN BÀI DẠY"</strong> ở thanh tiêu đề phía trên hoặc tab Cấu hình soạn bài.
        </p>
        {onBackToConfig && (
          <button
            type="button"
            onClick={onBackToConfig}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-amber-200" />
            <span>Mở Cấu hình soạn bài dạy (Tab 1)</span>
          </button>
        )}
      </div>
    );
  }

  // Export to DOCX
  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      await exportLessonPlanToDocx(plan, imageSlots, tableLayout, mathFormulaFormat);
    } catch (err) {
      console.error('Error exporting DOCX:', err);
      alert('Không thể xuất file Word: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Export to PowerPoint (PPTX)
  const handleExportPptx = async () => {
    setIsExportingPptx(true);
    try {
      await exportLessonPlanToPptx(plan, imageSlots);
    } catch (err) {
      console.error('Error exporting PPTX:', err);
      alert('Không thể xuất bài giảng PowerPoint: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExportingPptx(false);
    }
  };

  const isPreschool = (plan as any)?.schoolLevel === 'Mầm non';
  const isNew8 = isPreschoolNew8Activity(plan.subject, plan.lessonTitle);
  const cleanItem = (text: string) => {
    let t = text.replace(/^[-•*]\s*/, '');
    if (isPreschool && !isNew8) {
      t = stripPreschoolCodes(t);
    }
    return t;
  };

  const isMath = /toán|math/i.test(plan.subject || '') || /toán|math/i.test(plan.lessonTitle || '');
  const mathHeader = parseMathLessonHeader(plan.lessonTitle);

  const formatPeriodSequence = (periods: number) => {
    if (!periods || periods <= 1) return 'Tiết 1';
    return 'Tiết ' + Array.from({ length: periods }, (_, i) => i + 1).join(' + ');
  };

  return (
    <div className="bg-white border border-slate-300 rounded-xl shadow-xs flex flex-col text-slate-900 w-full min-h-[calc(100vh-160px)] relative">
      {/* Main Content Area - Full Standard Times New Roman 13pt & Justified */}
      <div
        className="p-4 sm:p-7 lg:p-9 bg-[#f8fafc] text-slate-900 print:bg-white print:text-black font-['Times_New_Roman',_Times,_serif] flex-1 flex flex-col rounded-xl"
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
      >
        <div className={`mx-auto space-y-8 text-justify leading-relaxed text-[13pt] w-full ${isExpanded ? 'max-w-6xl' : 'max-w-5xl'}`}>
          {/* Document Standard Header */}
          {(plan as any)?.schoolLevel === 'Mầm non' ? (() => {
            const preschoolInfo = getPreschoolHeaderInfo(plan);
            return preschoolInfo.isMusic ? (
              <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-xs text-left space-y-4">
                <div>
                  <span className="bg-[#00FF00] text-black font-bold text-base sm:text-lg px-3.5 py-1 rounded inline-block tracking-wide">
                    {preschoolInfo.mainHeader}
                  </span>
                </div>
                {preschoolInfo.lessonTitle && (
                  <div className="text-center font-bold text-[15pt] sm:text-[16pt] text-slate-900 uppercase pt-1 pb-1 tracking-wide">
                    {preschoolInfo.lessonTitle}
                  </div>
                )}
                <div className="pl-4 sm:pl-8 space-y-1.5 text-[13.5pt] font-normal text-slate-900 leading-relaxed">
                  {preschoolInfo.contentLines.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                  <div>{preschoolInfo.domainLine}</div>
                  {preschoolInfo.themeLine && <div>{preschoolInfo.themeLine}</div>}
                  <div>{preschoolInfo.gradeLine}</div>
                  {preschoolInfo.classSizeLine && <div>{preschoolInfo.classSizeLine}</div>}
                  {preschoolInfo.timeLine && <div>{preschoolInfo.timeLine}</div>}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-xs text-center space-y-3">
                <div>
                  <span className="bg-[#00FF00] text-black font-bold text-base sm:text-lg px-3.5 py-1 rounded inline-block tracking-wide">
                    {preschoolInfo.mainHeader}
                  </span>
                </div>
                {preschoolInfo.lessonTitle && (
                  <div className="font-bold text-[14.5pt] sm:text-[15.5pt] text-slate-900 pt-1">
                    {preschoolInfo.lessonTitle}
                  </div>
                )}
                {preschoolInfo.domainLine && (
                  <div className="font-bold text-[13.5pt] text-slate-900">
                    {preschoolInfo.domainLine}
                  </div>
                )}
                {preschoolInfo.themeLine && (
                  <div className="font-bold text-[13.5pt] text-slate-900">
                    {preschoolInfo.themeLine}
                  </div>
                )}
                {preschoolInfo.gradeLine && (
                  <div className="font-bold text-[13.5pt] text-slate-900">
                    {preschoolInfo.gradeLine}
                  </div>
                )}
                {preschoolInfo.classSizeLine && (
                  <div className="font-bold text-[13.5pt] text-slate-900">
                    {preschoolInfo.classSizeLine}
                  </div>
                )}
                {preschoolInfo.timeLine && (
                  <div className="font-bold text-[13.5pt] text-slate-900">
                    {preschoolInfo.timeLine}
                  </div>
                )}
                {preschoolInfo.contentLines.map((line, idx) => (
                  <div key={idx} className="text-[13pt] text-slate-800">{line}</div>
                ))}
              </div>
            );
          })() : isMath ? (
            <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-xs text-center space-y-2">
              <div className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">
                {formatMathPeriodHeader(plan.periods, (plan as any).targetPeriodDetail)}
              </div>
              {mathHeader.chapter && (
                <div className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide">
                  {mathHeader.chapter}
                </div>
              )}
              <h3 className="text-[16pt] sm:text-[17pt] leading-tight font-extrabold text-slate-900 uppercase">
                {mathHeader.lessonTitle}
              </h3>
              <p className="text-sm sm:text-base font-medium text-slate-700">
                Thời gian thực hiện: {String(plan.periods).padStart(2, '0')} tiết
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-xs text-center space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-wider uppercase">
                KẾ HOẠCH BÀI DẠY (GIÁO ÁN)
              </h2>
              <div className="text-sm sm:text-base font-bold text-slate-900">
                {formatPeriodSequence(plan.periods)}
              </div>
              <h3 className="text-[16pt] leading-tight font-extrabold text-slate-900 uppercase">
                {plan.lessonTitle}
              </h3>
              <p className="text-[13pt] text-slate-800">
                Thời lượng: {plan.periods} tiết
              </p>
            </div>
          )}

          {/* I. MỤC TIÊU (Standard CV 5512: Knowledge, General & Subject Competencies, Qualities) */}
          <section className="bg-white border border-slate-300 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-base text-slate-900 uppercase tracking-wider">
                {(plan as any)?.schoolLevel === 'Mầm non' ? 'I. Mục đích - yêu cầu' : 'I. Mục tiêu bài dạy'}
              </h3>
            </div>

            {(plan as any)?.schoolLevel === 'Mầm non' ? (
              <>
                {/* 1. Kiến thức */}
                <div className="space-y-1.5 text-[13pt]">
                  <h4 className="font-bold text-slate-900">1. Kiến thức:</h4>
                  <ul className="space-y-1.5 pl-3 leading-relaxed">
                    {plan.objectives.knowledge.map((k, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(k)} /></span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* 2. Kỹ năng */}
                <div className="space-y-1.5 text-[13pt] pt-2">
                  <h4 className="font-bold text-slate-900">2. Kỹ năng:</h4>
                  <ul className="space-y-1.5 pl-3 leading-relaxed">
                    {plan.objectives.subjectCompetencies.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Phẩm chất */}
                <div className="space-y-1.5 text-[13pt] pt-2">
                  <h4 className="font-bold text-slate-900">3. Phẩm chất:</h4>
                  <ul className="space-y-1.5 pl-3 leading-relaxed">
                    {plan.objectives.qualities.map((q, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(q)} /></span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Năng lực */}
                <div className="space-y-1.5 text-[13pt] pt-2">
                  <h4 className="font-bold text-slate-900">4. Năng lực:</h4>
                  <ul className="space-y-1.5 pl-3 leading-relaxed">
                    {plan.objectives.generalCompetencies.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 5. Tích hợp Năng lực số (NLS) và 6. Tích hợp Trí tuệ nhân tạo (AI) nếu người dùng chọn tích hợp */}
                {(() => {
                  const hasNLS = (plan.objectives.digitalCompetencies || []).length > 0;
                  const hasAI = (plan.objectives.aiCompetencies || []).length > 0;
                  const hasSTEM = (plan.objectives.stemCompetencies || []).length > 0;

                  if (hasNLS || hasAI) {
                    const nlsNumber = 5;
                    const aiNumber = hasNLS ? 6 : 5;
                    return (
                      <>
                        {hasNLS && (
                          <div className="space-y-1.5 text-[13pt] pt-2">
                            <h4 className="font-bold text-slate-900">{nlsNumber}. Tích hợp Năng lực số (NLS):</h4>
                            <ul className="space-y-1.5 pl-3 leading-relaxed">
                              {plan.objectives.digitalCompetencies.map((c, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                                  <span className="font-bold text-slate-900 shrink-0">-</span>
                                  <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {hasAI && (
                          <div className="space-y-1.5 text-[13pt] pt-2">
                            <h4 className="font-bold text-slate-900">{aiNumber}. Tích hợp Trí tuệ nhân tạo (AI):</h4>
                            <ul className="space-y-1.5 pl-3 leading-relaxed">
                              {plan.objectives.aiCompetencies.map((c, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                                  <span className="font-bold text-slate-900 shrink-0">-</span>
                                  <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {hasSTEM && (
                          <div className="space-y-1.5 text-[13pt] pt-2">
                            <h4 className="font-bold text-slate-900">{hasNLS && hasAI ? 7 : 6}. Tích hợp STEM / Khác:</h4>
                            <ul className="space-y-1.5 pl-3 leading-relaxed">
                              {plan.objectives.stemCompetencies.map((c, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                                  <span className="font-bold text-slate-900 shrink-0">-</span>
                                  <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  }

                  if (hasSTEM) {
                    return (
                      <div className="space-y-1.5 text-[13pt] pt-2">
                        <h4 className="font-bold text-slate-900">5. Tích hợp:</h4>
                        <ul className="space-y-1.5 pl-3 leading-relaxed">
                          {plan.objectives.stemCompetencies.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                              <span className="font-bold text-slate-900 shrink-0">-</span>
                              <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }

                  return null;
                })()}
              </>
            ) : (
              <>
                {/* 1. Kiến thức */}
                <div className="space-y-1.5 text-[13pt]">
                  <h4 className="font-bold text-slate-900">1. Về kiến thức:</h4>
                  <ul className="space-y-1.5 pl-3 leading-relaxed">
                    {plan.objectives.knowledge.map((k, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(k)} /></span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Năng lực */}
                <div className="space-y-2.5 text-[13pt] pt-2">
                  <h4 className="font-bold text-slate-900">2. Về năng lực:</h4>
                  <div className="space-y-2.5">
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">
                        a) Năng lực chung:
                      </span>
                      <ul className="space-y-1.5 pl-3 leading-relaxed">
                        {plan.objectives.generalCompetencies.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                            <span className="font-bold text-slate-900 shrink-0">-</span>
                            <span className="flex-1">{renderGeneralCompetencyItem(c)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-bold text-slate-900 block mb-1">
                        b) Năng lực đặc thù môn học:
                      </span>
                      <ul className="space-y-1.5 pl-3 leading-relaxed">
                        {plan.objectives.subjectCompetencies.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                            <span className="font-bold text-slate-900 shrink-0">-</span>
                            <span className="flex-1">{renderSubjectCompetencyItem(c)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {plan.objectives.digitalCompetencies && plan.objectives.digitalCompetencies.length > 0 && (
                      <div>
                        <span className={`font-bold ${isMath ? 'text-red-600' : 'text-[#0066CC]'} block mb-1`}>
                          c) Các Năng lực số (NLS) được phát triển:
                        </span>
                        <ul className="space-y-1.5 pl-3 leading-relaxed">
                          {plan.objectives.digitalCompetencies.map((c, i) => (
                            <li key={i} className={`flex items-start gap-1.5 ${isMath ? 'text-red-600' : 'text-[#0066CC]'} font-medium text-justify`}>
                              <span className={`font-bold ${isMath ? 'text-red-600' : 'text-[#0066CC]'} shrink-0`}>-</span>
                              <span className="flex-1"><MathRenderer text={cleanItem(c)} nlsRed={isMath} /></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {plan.objectives.aiCompetencies && plan.objectives.aiCompetencies.length > 0 && (
                      <div>
                        <span className="font-bold text-[#0066CC] block mb-1">
                          {(plan.objectives.digitalCompetencies?.length || 0) > 0
                            ? 'd) Năng lực trí tuệ nhân tạo (AI):'
                            : 'c) Năng lực trí tuệ nhân tạo (AI):'}
                        </span>
                        <ul className="space-y-1.5 pl-3 leading-relaxed">
                          {plan.objectives.aiCompetencies.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[#0066CC] font-medium text-justify">
                              <span className="font-bold text-[#0066CC] shrink-0">-</span>
                              <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {plan.objectives.stemCompetencies && plan.objectives.stemCompetencies.length > 0 && (
                      <div>
                        <span className="font-bold text-[#0066CC] block mb-1">
                          {(plan.objectives.digitalCompetencies?.length || 0) > 0 && (plan.objectives.aiCompetencies?.length || 0) > 0
                            ? 'e) Năng lực giáo dục STEM:'
                            : (plan.objectives.digitalCompetencies?.length || 0) > 0 || (plan.objectives.aiCompetencies?.length || 0) > 0
                            ? 'd) Năng lực giáo dục STEM:'
                            : 'c) Năng lực giáo dục STEM:'}
                        </span>
                        <ul className="space-y-1.5 pl-3 leading-relaxed">
                          {plan.objectives.stemCompetencies.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[#0066CC] font-medium text-justify">
                              <span className="font-bold text-[#0066CC] shrink-0">-</span>
                              <span className="flex-1"><MathRenderer text={cleanItem(c)} /></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Phẩm chất */}
                <div className="space-y-1.5 text-[13pt] pt-2">
                  <h4 className="font-bold text-slate-900">3. Về phẩm chất:</h4>
                  <ul className="space-y-1.5 pl-3 leading-relaxed">
                    {plan.objectives.qualities.map((q, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                        <span className="font-bold text-slate-900 shrink-0">-</span>
                        <span className="flex-1"><MathRenderer text={cleanItem(q)} /></span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </section>

          {/* II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU / CHUẨN BỊ */}
          <section className="bg-white border border-slate-300 rounded-xl p-5 sm:p-6 shadow-xs space-y-3">
            <div className="border-b border-slate-200 pb-2.5">
              <h3 className="font-bold text-base text-slate-900 uppercase tracking-wider">
                {(isPreschoolPlan(plan) || (plan as any)?.schoolLevel === 'Mầm non') ? 'II. Chuẩn bị:' : 'II. Thiết bị dạy học và học liệu'}
              </h3>
            </div>

            {(isPreschoolPlan(plan) || (plan as any)?.schoolLevel === 'Mầm non') ? (
              (() => {
                const prep = getPreschoolPreparation(plan.equipment);
                return (
                  <div className="space-y-4 text-[13pt]">
                    {/* 1. Chuẩn bị của cô */}
                    <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 text-left">
                        1. Chuẩn bị của cô:
                      </h4>
                      <ul className="space-y-1.5 pl-1">
                        {prep.teacherEnvironment.map((e, i) => (
                          <li key={`env-${i}`} className="flex items-start gap-1.5 text-slate-800 text-justify">
                            <span className="font-bold text-slate-900 shrink-0">-</span>
                            <span className="flex-1">
                              <span className="font-bold text-slate-900">Môi trường: </span>
                              <MathRenderer text={cleanItem(e.replace(/^môi trường\s*:\s*/i, ''))} />
                            </span>
                          </li>
                        ))}
                        {prep.teacherTools.map((e, i) => (
                          <li key={`tool-${i}`} className="flex items-start gap-1.5 text-slate-800 text-justify">
                            <span className="font-bold text-slate-900 shrink-0">-</span>
                            <span className="flex-1">
                              <span className="font-bold text-slate-900">Đồ dùng của cô: </span>
                              <MathRenderer text={cleanItem(e.replace(/^đồ dùng của cô\s*:\s*/i, ''))} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 2. Chuẩn bị của trẻ */}
                    <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 text-left">
                        2. Chuẩn bị của trẻ:
                      </h4>
                      <ul className="space-y-1.5 pl-1">
                        {prep.studentCostume.map((e, i) => (
                          <li key={`cos-${i}`} className="flex items-start gap-1.5 text-slate-800 text-justify">
                            <span className="font-bold text-slate-900 shrink-0">-</span>
                            <span className="flex-1">
                              <span className="font-bold text-slate-900">Trang phục: </span>
                              <MathRenderer text={cleanItem(e.replace(/^trang phục\s*:\s*/i, ''))} />
                            </span>
                          </li>
                        ))}
                        {prep.studentTools.map((e, i) => (
                          <li key={`stool-${i}`} className="flex items-start gap-1.5 text-slate-800 text-justify">
                            <span className="font-bold text-slate-900 shrink-0">-</span>
                            <span className="flex-1">
                              <span className="font-bold text-slate-900">Đồ dùng của trẻ: </span>
                              <MathRenderer text={cleanItem(e.replace(/^đồ dùng của trẻ\s*:\s*/i, ''))} />
                            </span>
                          </li>
                        ))}
                        {prep.studentPsychology.map((e, i) => (
                          <li key={`psy-${i}`} className="flex items-start gap-1.5 text-slate-800 text-justify">
                            <span className="font-bold text-slate-900 shrink-0">-</span>
                            <span className="flex-1">
                              <span className="font-bold text-slate-900">Tâm sinh lý của trẻ: </span>
                              <MathRenderer text={cleanItem(e.replace(/^(tâm sinh lý của trẻ|tâm sinh lý|tâm thế)\s*:\s*/i, ''))} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 3. Phối hợp với phụ huynh */}
                    <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200">
                      <h4 className="font-bold text-slate-900 text-left">
                        3. Phối hợp với phụ huynh:
                      </h4>
                      <ul className="space-y-1.5 pl-1">
                        {prep.parentCollaboration.map((e, i) => (
                          <li key={`parent-${i}`} className="flex items-start gap-1.5 text-slate-800 text-justify">
                            <span className="font-bold text-slate-900 shrink-0">-</span>
                            <span className="flex-1">
                              <MathRenderer text={cleanItem(e.replace(/^phối hợp với phụ huynh\s*:\s*/i, ''))} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13pt]">
                  <div className="space-y-1 bg-white p-3.5 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-slate-900">
                      1. Giáo viên:
                    </h4>
                    <ul className="space-y-1 pl-1">
                      {plan.equipment.teacher.map((e, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                          <span className="font-bold text-slate-900 shrink-0">-</span>
                          <span className="flex-1"><MathRenderer text={cleanItem(e)} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1 bg-white p-3.5 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-slate-900">
                      2. Học sinh:
                    </h4>
                    <ul className="space-y-1 pl-1">
                      {plan.equipment.student.map((e, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                          <span className="font-bold text-slate-900 shrink-0">-</span>
                          <span className="flex-1"><MathRenderer text={cleanItem(e)} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {((plan.equipment as any)?.space && (plan.equipment as any).space.length > 0) && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-[13pt]">
                    <h4 className="font-bold text-slate-900 mb-1">
                      3. Không gian:
                    </h4>
                    <ul className="space-y-1 pl-1">
                      {(plan.equipment as any).space.map((spaceItem: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                          <span className="font-bold text-slate-900 shrink-0">-</span>
                          <span className="flex-1"><MathRenderer text={cleanItem(spaceItem)} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.equipment.digitalAssets && plan.equipment.digitalAssets.length > 0 && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-[13pt]">
                    <h4 className="font-bold text-slate-900 mb-1">
                      3. Học liệu và thiết bị phụ trợ:
                    </h4>
                    <ul className="space-y-1 pl-1">
                      {plan.equipment.digitalAssets.map((asset, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                          <span className="font-bold text-slate-900 shrink-0">-</span>
                          <span className="flex-1"><MathRenderer text={cleanItem(asset)} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.equipment.stemMaterials && plan.equipment.stemMaterials.length > 0 && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-[13pt]">
                    <h4 className="font-bold text-slate-900 mb-1">
                      4. Thiết bị, dụng cụ và vật liệu thực hành STEM:
                    </h4>
                    <ul className="space-y-1 pl-1">
                      {plan.equipment.stemMaterials.map((mat, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                          <span className="font-bold text-slate-900 shrink-0">-</span>
                          <span className="flex-1"><MathRenderer text={cleanItem(mat)} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>

          {/* DEDICATED SECTION: TÍCH HỢP NỘI DUNG GIÁO DỤC STEM */}
          {plan.stemIntegration && (
            <section className="bg-white border border-slate-300 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 uppercase tracking-wider">
                  NỘI DUNG TÍCH HỢP GIÁO DỤC STEM: {plan.stemIntegration.topicTitle}
                </h3>
              </div>

              <div className="space-y-3 text-[13pt]">
                <div>
                  <h4 className="font-bold text-slate-900">1. Tên chủ đề STEM:</h4>
                  <p className="pl-2 text-slate-800 font-semibold">{plan.stemIntegration.topicTitle}</p>
                </div>

                {plan.stemIntegration.stemGoals && plan.stemIntegration.stemGoals.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900">2. Mục tiêu giáo dục STEM (S-T-E-M):</h4>
                    <ul className="space-y-1 pl-2">
                      {plan.stemIntegration.stemGoals.map((g, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                          <span className="font-bold text-slate-900 shrink-0">-</span>
                          <span className="flex-1"><MathRenderer text={cleanItem(g)} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.stemIntegration.stemMaterials && plan.stemIntegration.stemMaterials.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900">3. Dụng cụ và vật liệu chuẩn bị:</h4>
                    <ul className="space-y-1 pl-2">
                      {plan.stemIntegration.stemMaterials.map((m, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                          <span className="font-bold text-slate-900 shrink-0">-</span>
                          <span className="flex-1"><MathRenderer text={cleanItem(m)} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.stemIntegration.stemProcess && plan.stemIntegration.stemProcess.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900">4. Tiến trình hoạt động trải nghiệm / thiết kế kỹ thuật STEM:</h4>
                    <ul className="space-y-1 pl-2">
                      {plan.stemIntegration.stemProcess.map((p, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-800 text-justify">
                          <span className="font-bold text-slate-900 shrink-0">-</span>
                          <span className="flex-1"><MathRenderer text={cleanItem(p)} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.stemIntegration.expectedProduct && (
                  <div>
                    <h4 className="font-bold text-slate-900">5. Sản phẩm học tập STEM dự kiến:</h4>
                    <p className="pl-2 text-slate-800 text-justify"><MathRenderer text={cleanItem(plan.stemIntegration.expectedProduct)} /></p>
                  </div>
                )}

                {plan.stemIntegration.evaluationCriteria && (
                  <div>
                    <h4 className="font-bold text-slate-900">6. Tiêu chí đánh giá & nghiệm thu sản phẩm STEM:</h4>
                    <p className="pl-2 text-slate-800 text-justify"><MathRenderer text={cleanItem(plan.stemIntegration.evaluationCriteria)} /></p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* III. TIẾN TRÌNH HOẠT ĐỘNG / DẠY HỌC (THE ACTIVITIES WITH 2-COLUMN TABLES) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <h3 className="font-bold text-base text-slate-900 uppercase tracking-wider">
                {(isPreschoolPlan(plan) || (plan as any)?.schoolLevel === 'Mầm non') ? 'III. Tiến trình hoạt động' : 'III. Tiến trình dạy học'}
              </h3>
              <span className="text-xs text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-300">
                {((isPreschoolPlan(plan) || (plan as any)?.schoolLevel === 'Mầm non')
                  ? formatPreschoolActivities(plan.activities || [], plan.lessonTitle || '', plan.subject || '', (plan as any).oldPlanContent || '').length
                  : (plan.activities || []).length)} Hoạt động
              </span>
            </div>

            {(isPreschoolPlan(plan) || (plan as any)?.schoolLevel === 'Mầm non') ? (
              <PreschoolSingleTable
                activities={formatPreschoolActivities(plan.activities || [], plan.lessonTitle || '', plan.subject || '', (plan as any).oldPlanContent || '')}
                imageSlots={imageSlots}
                onRefineActivity={onRefineActivity}
                onManualEditActivity={onManualEditActivity}
                isRefining={isRefiningActivity}
              />
            ) : (
              (plan.activities || []).map((activity, actIdx) => (
                <React.Fragment key={`activity-block-${actIdx}-${activity.id || 'no-id'}`}>
                  {plan.periods >= 2 && activity.index === 1 && (
                    <div className="flex items-center gap-2 py-2 px-3.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-bold text-sm uppercase tracking-wide my-3">
                      <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>[TIẾT 1] KHỞI ĐỘNG VÀ HÌNH THÀNH KIẾN THỨC MỚI</span>
                    </div>
                  )}
                  {plan.periods >= 2 && activity.index === 3 && (
                    <div className="flex items-center gap-2 py-2 px-3.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 font-bold text-sm uppercase tracking-wide mt-6 mb-3">
                      <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>[TIẾT 2] LUYỆN TẬP VÀ VẬN DỤNG</span>
                    </div>
                  )}
                  <PedagogicalTable
                    activity={sanitizeStandardActivity({...activity, name: activity.name?.replace(/\[TIẾT\s*\d+\]\s*/i, '')}, actIdx)}
                    imageSlots={imageSlots}
                    onRefineActivity={onRefineActivity}
                    onManualEditActivity={onManualEditActivity}
                    isRefining={isRefiningActivity}
                    isPreschool={false}
                    tableLayout={tableLayout}
                  />
                </React.Fragment>
              ))
            )}

            {/* 3. Hướng dẫn tự học & Nhiệm vụ về nhà (Chỉ dành cho Tiểu học, THCS, THPT, không có ở Mầm non) */}
            {!isPreschoolPlan(plan) && (plan as any)?.schoolLevel !== 'Mầm non' && plan.appendix?.assignmentPrompt && plan.appendix.assignmentPrompt.trim() !== '' && (
              <div className="bg-white border border-slate-300 rounded-xl p-5 sm:p-6 shadow-xs space-y-3 mt-4">
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2 uppercase tracking-wide">
                  <Clock className="w-4 h-4 text-slate-700" />
                  <span>3. Hướng dẫn tự học & Nhiệm vụ về nhà</span>
                </h4>
                <div className="bg-white p-4 rounded-lg border border-slate-200 text-[13pt] text-slate-800 leading-relaxed text-justify">
                  <HomeworkRenderer text={plan.appendix.assignmentPrompt} />
                </div>
              </div>
            )}
          </section>

          {/* IV. PHIẾU HỌC TẬP & PHỤ LỤC */}
          {((plan as any)?.schoolLevel !== 'Mầm non') && plan.appendix && plan.appendix.worksheetContent && (
            <section className="space-y-4">
              <div className="border-b border-slate-300 pb-2">
                <h3 className="font-bold text-base text-slate-900 uppercase tracking-wider">
                  IV. Hồ sơ dạy học & Phụ lục
                </h3>
              </div>
              <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-xs space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <FileText className="w-4 h-4 text-slate-700" />
                    <span>1. Phiếu học tập / Hướng dẫn thực hành</span>
                  </h4>
                  <div className="bg-slate-50/40 p-4 sm:p-5 rounded-xl border border-slate-300 shadow-2xs">
                    <WorksheetRenderer
                      content={plan.appendix.worksheetContent}
                      type="worksheet"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* V. BẢNG PHÂN TÍCH PHÁT TRIỂN NĂNG LỰC SỐ (NLS) VÀ/HOẶC TRÍ TUỆ NHÂN TẠO (AI) CHO HỌC SINH (CUỐI CÙNG - MÔN TOÁN BỎ) */}
          {(plan as any).schoolLevel !== 'Mầm non' && !isMath && ((plan.competencyMatrix?.nlsItems?.length || 0) + (plan.competencyMatrix?.aiItems?.length || 0) > 0) && (
            <section className="space-y-4">
              <div className="border-b border-slate-300 pb-2">
                <h3 className="font-bold text-base text-slate-900 uppercase tracking-wider">
                  {(plan.competencyMatrix?.nlsItems?.length || 0) > 0 && (plan.competencyMatrix?.aiItems?.length || 0) > 0
                    ? 'V. BẢNG PHÂN TÍCH PHÁT TRIỂN NĂNG LỰC SỐ (NLS) VÀ TRÍ TUỆ NHÂN TẠO (AI) CHO HỌC SINH'
                    : (plan.competencyMatrix?.nlsItems?.length || 0) > 0
                    ? 'V. BẢNG PHÂN TÍCH PHÁT TRIỂN NĂNG LỰC SỐ (NLS) CHO HỌC SINH'
                    : 'V. BẢNG PHÂN TÍCH PHÁT TRIỂN NĂNG LỰC TRÍ TUỆ NHÂN TẠO (AI) CHO HỌC SINH'}
                </h3>
              </div>
              <CompetencyMatrixView matrix={plan.competencyMatrix} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

function HomeworkRenderer({ text }: { text: string }) {
  if (!text) return null;

  const formatted = formatHomeworkText(text);
  const lines = formatted.split('\n');

  return (
    <>
      {lines.map((line, index) => {
        // 2. Bold text before and including colon for a), b), c) or standard headers
        const match =
          line.match(/^([-•*]?\s*(?:[a-eA-E]\)|Hướng dẫn tự học|Nhiệm vụ về nhà|Bài học tiếp theo|Nhiệm vụ\s*\d*)[^:]*:)(.*)$/iu) ||
          line.match(/^([-•*]?\s*[a-eA-E]\)[^:]+:)(.*)$/);
        
        if (match) {
          const [, boldPart, rest] = match;
          return (
            <div key={index} className="mb-2">
              <span className="font-bold">{boldPart}</span>
              {highlightLessonName(rest)}
            </div>
          );
        } else {
          return <div key={index} className="mb-2">{highlightLessonName(line)}</div>;
        }
      })}
    </>
  );
}

function highlightLessonName(text: string) {
  // Regex to match 'Bài X: Name' or "Bài X: Name"
  const lessonRegex = /(['"]Bài\s+\d+[^'"]+['"])/g;
  const parts = text.split(lessonRegex);
  return (
    <>
      {parts.map((p, i) => {
        if (lessonRegex.test(p)) {
          return <span key={i} className="font-bold">{p}</span>;
        }
        return <MathRenderer key={i} text={p} className="inline" />;
      })}
    </>
  );
}
