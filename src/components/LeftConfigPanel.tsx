import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  UploadCloud,
  Sparkles,
  BookOpen,
  CheckSquare,
  Square,
  ChevronDown,
  FileCode2,
  CheckCircle2,
  Trash2,
  Loader2,
  XCircle,
  ClipboardPaste,
  Wand2,
  Lock,
  AlertTriangle,
  Clock,
  PhoneCall,
  Key,
  FileText,
  Layers,
} from 'lucide-react';
import {
  LessonPlanConfig,
  CustomUploadedBook,
} from '../types';
import {
  SUBJECTS_LIST,
  MAM_NON_SUBJECTS_LIST,
  MAM_NON_TRADITIONAL_DOMAINS,
  MAM_NON_NEW_ACTIVITIES,
  MAM_NON_MAIN_THEMES,
  getVerifiedLessons,
  TIEU_HOC_SUBJECTS_LIST,
  THCS_SUBJECTS_LIST,
  THPT_SUBJECTS_LIST
} from '../data/curriculumData';
import { SEED_SAMPLE_PPCT } from '../data/seedData';
import { findMatchInPPCTList } from '../utils/ppctMatcher';
import { parseDocxFile } from '../utils/docxParser';
import { extractTextFromPDF } from '../utils/pdfExtractor';
import { getApiHeaders } from '../utils/apiKeyManager';
import { saveTextbookToFirestore, ManagedUserAccount } from '../utils/firebase';
import { getUserAccessStatus } from '../utils/userAccess';
import { PreschoolQD388FullViewer } from './PreschoolQD388FullViewer';
import { CustomSubjectSelect } from './CustomSubjectSelect';
import { isPreschoolNew8Activity } from '../utils/preschoolUtils';
import { getDefaultQD388ForSubject } from '../data/qd388Data';

interface LeftConfigPanelProps {
  config: LessonPlanConfig;
  onChangeConfig: (newConfig: Partial<LessonPlanConfig>) => void;
  onGenerate: () => void;
  onCancelGenerate?: () => void;
  isGenerating: boolean;
  elapsedSeconds?: number;
  onOpenCloudStorage: () => void;
  uploadedBooks?: CustomUploadedBook[];
  uploadedPPCTs?: any[];
  userRole?: 'admin' | 'teacher';
  currentUser?: ManagedUserAccount | null;
  onRequestContactAdmin?: () => void;
  onOpenApiKeyModal?: () => void;
  onBooksUpdated?: (books: CustomUploadedBook[]) => void;
  onViewResult?: () => void;
  hasPlan?: boolean;
}

export const LeftConfigPanel: React.FC<LeftConfigPanelProps> = ({
  config,
  onChangeConfig,
  onGenerate,
  onCancelGenerate,
  isGenerating,
  elapsedSeconds = 0,
  uploadedBooks = [],
  currentUser,
  onRequestContactAdmin,
  onOpenApiKeyModal,
  onBooksUpdated,
  onViewResult,
  hasPlan = false,
}) => {
  const accessStatus = getUserAccessStatus(currentUser);
  // State for Textbook Upload
  const [isUploadingBook, setIsUploadingBook] = useState(false);
  const [bookUploadMsg, setBookUploadMsg] = useState<string | null>(null);
  const [activeUploadedBook, setActiveUploadedBook] = useState<CustomUploadedBook | null>(null);
  const textbookInputRef = useRef<HTMLInputElement>(null);

  // State for Lesson Title & Custom Input
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectText, setCustomSubjectText] = useState('');
  const [isCustomGrade, setIsCustomGrade] = useState(false);
  const [customGradeText, setCustomGradeText] = useState('');
  const [isCustomLessonInput, setIsCustomLessonInput] = useState(false);

  // State for DOCX Sample Upload
  const [isParsingDocx, setIsParsingDocx] = useState(false);
  const [docxFileName, setDocxFileName] = useState<string | null>(null);
  const [docxStatusMsg, setDocxStatusMsg] = useState<string | null>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);

  // State for PPCT Upload
  const [isUploadingPPCT, setIsUploadingPPCT] = useState(false);
  const [ppctFileName, setPpctFileName] = useState<string | null>(null);
  const [ppctStatusMsg, setPpctStatusMsg] = useState<string | null>(null);
  const ppctInputRef = useRef<HTMLInputElement>(null);

  const handlePPCTUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPPCT(true);
    setPpctFileName(file.name);
    setPpctStatusMsg('Đang trích xuất...');

    try {
      let fileBase64 = '';
      if (file.name.endsWith('.pdf')) {
        const result = await extractTextFromPDF(file, 20);
        onChangeConfig({ ppctContent: result.extractedText });
        setPpctStatusMsg('Đã lưu (PDF)');
      } else {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
        });
        reader.readAsDataURL(file);
        fileBase64 = await base64Promise;

        const res = await fetch('/api/extract-ppct', {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            subject: config.subject,
            grade: config.grade,
            fileName: file.name,
            fileBase64,
            mimeType: file.type,
          }),
        });
        if (!res.ok) throw new Error('Failed to extract PPCT');
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          onChangeConfig({ ppctContent: JSON.stringify(data.results, null, 2) });
          setPpctStatusMsg(`Đã lưu ${data.results.length} khối lớp`);
        } else {
          setPpctStatusMsg('Không tìm thấy dữ liệu PPCT');
        }
      }
    } catch (err: any) {
      console.error('Error parsing PPCT:', err);
      setPpctStatusMsg('Lỗi đọc file PPCT');
    } finally {
      setIsUploadingPPCT(false);
    }
  };

  const handleClearPPCT = () => {
    setPpctFileName(null);
    setPpctStatusMsg(null);
    onChangeConfig({ ppctContent: '' });
    if (ppctInputRef.current) ppctInputRef.current.value = '';
  };

  // Matching books for currently selected subject
  const matchingBooksForSubject = useMemo(() => {
    return uploadedBooks.filter(
      (b) => b.subject?.toLowerCase().trim() === config.subject?.toLowerCase().trim()
    );
  }, [uploadedBooks, config.subject]);

  const allGrades = useMemo(() => {
    if (config.schoolLevel === 'Mầm non') {
      return [
        'Nhà trẻ (24-36 tháng)',
        'Mẫu giáo bé (3-4 tuổi)',
        'Mẫu giáo nhỡ (4-5 tuổi)',
        'Mẫu giáo lớn (5-6 tuổi)',
        'Lớp ghép (3 - 4 - 5 tuổi)',
        'Lớp ghép (4 - 5 tuổi)',
      ];
    }
    if (config.schoolLevel === 'Tiểu học') {
      return ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'];
    }
    if (config.schoolLevel === 'THCS') {
      return ['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'];
    }
    if (config.schoolLevel === 'THPT') {
      return ['Lớp 10', 'Lớp 11', 'Lớp 12'];
    }
    return [
      'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
      'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12',
    ];
  }, [config.schoolLevel]);

  // Lessons list extracted from active uploaded book OR verified curriculum
  const availableLessons = useMemo(() => {
    // 1. If currently uploaded textbook is active
    if (activeUploadedBook && activeUploadedBook.lessons && activeUploadedBook.lessons.length > 0) {
      return activeUploadedBook.lessons;
    }

    // 2. Matching from uploaded books database
    const matchedBook = matchingBooksForSubject.find(
      (b) => b.grade?.toLowerCase().trim() === config.grade?.toLowerCase().trim()
    );
    if (matchedBook && matchedBook.lessons && matchedBook.lessons.length > 0) {
      return matchedBook.lessons;
    }

    // 3. Verified standard curriculum
    const verified = getVerifiedLessons(config.subject, config.grade);
    if (verified && verified.lessons && verified.lessons.length > 0) {
      return verified.lessons;
    }

    return [];
  }, [activeUploadedBook, matchingBooksForSubject, config.subject, config.grade]);

  // Match lesson configuration from PPCT (NLS, AI, STEM, Periods)
  const matchedPPCTLesson = useMemo(() => {
    if (!config.lessonTitle || !config.subject || !config.grade) return null;

    let userMatch = null;
    try {
      const savedPPCT = localStorage.getItem('khbd_my_firebase_ppct');
      if (savedPPCT) {
        const parsed = JSON.parse(savedPPCT);
        if (Array.isArray(parsed) && parsed.length > 0) {
          userMatch = findMatchInPPCTList(parsed, config.subject, config.grade, config.lessonTitle);
        }
      }
    } catch (e) {}

    if (userMatch && userMatch.integratedNLS && userMatch.integratedNLS.length > 0) {
      return userMatch;
    }

    const seedMatch = findMatchInPPCTList(SEED_SAMPLE_PPCT, config.subject, config.grade, config.lessonTitle);
    return seedMatch || userMatch;
  }, [config.subject, config.grade, config.lessonTitle]);

  // Auto-sync periods and STEM topic from matched PPCT
  useEffect(() => {
    if (matchedPPCTLesson) {
      const updates: Partial<LessonPlanConfig> = {};
      if (matchedPPCTLesson.periods && matchedPPCTLesson.periods !== config.periods) {
        updates.periods = matchedPPCTLesson.periods;
      }
      if (matchedPPCTLesson.periodDetail && (!config.targetPeriodDetail || config.targetPeriodDetail.startsWith('Tiết 1') || config.targetPeriodDetail === '1' || config.targetPeriodDetail === '1+2' || config.targetPeriodDetail.startsWith('1-'))) {
        updates.targetPeriodDetail = matchedPPCTLesson.periodDetail;
      }
      if (matchedPPCTLesson.hasStemIntegration) {
        updates.enableSTEM = true;
        updates.hasStemFromPPCT = true;
        if (matchedPPCTLesson.stemTopic && !config.stemTopic) {
          updates.stemTopic = matchedPPCTLesson.stemTopic;
        }
      }
      if (Object.keys(updates).length > 0) {
        onChangeConfig(updates);
      }
    }
  }, [matchedPPCTLesson]);

  // Auto-set lessonTitle if empty or not in availableLessons
  useEffect(() => {
    if (availableLessons.length > 0 && (!config.lessonTitle || !availableLessons.includes(config.lessonTitle))) {
      if (!isCustomLessonInput) {
        onChangeConfig({ lessonTitle: availableLessons[0] });
      }
    }
  }, [availableLessons, config.lessonTitle, isCustomLessonInput]);

  // Handler: Upload Textbook File (PDF / DOCX / TXT)
  const handleTextbookUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBook(true);
    setBookUploadMsg(`Đang đọc tệp...`);

    try {
      let extractedTextSnippet = '';
      let detectedGrade = config.grade;
      let detectedSubject = config.subject;

      // Extract text
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        try {
          const pdfInfo = await extractTextFromPDF(file);
          extractedTextSnippet = pdfInfo.extractedText || '';
          if (pdfInfo.detectedGrade) detectedGrade = pdfInfo.detectedGrade;
          if (pdfInfo.detectedSubject) detectedSubject = pdfInfo.detectedSubject;
        } catch (pdfErr) {
          console.warn('PDF parser notice:', pdfErr);
        }
      } else {
        try {
          const text = await file.text();
          extractedTextSnippet = text.substring(0, 10000);
        } catch (e) {}
      }

      setBookUploadMsg(`AI đang quét mục lục...`);

      let lessonsResult: string[] = [];

      try {
        const res = await fetch('/api/extract-textbook-toc', {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            subject: detectedSubject,
            grade: detectedGrade,
            bookSeries: config.bookSeries || 'Kết nối tri thức với cuộc sống',
            volume: 'Cả năm / Không phân tập',
            fileName: file.name,
            fileTextSnippet: extractedTextSnippet || `Sách giáo khoa môn ${detectedSubject} ${detectedGrade}`,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.lessons && Array.isArray(data.lessons) && data.lessons.length > 0) {
            lessonsResult = data.lessons;
          }
        }
      } catch (apiErr) {
        console.warn('API TOC extract warning:', apiErr);
      }

      // Fallback if needed
      if (lessonsResult.length === 0) {
        const verified = getVerifiedLessons(detectedSubject, detectedGrade);
        if (verified && verified.lessons.length > 0) {
          lessonsResult = verified.lessons;
        }
      }

      if (lessonsResult.length === 0) {
        lessonsResult = [
          `Bài 1: Khởi động và Khám phá kiến thức cốt lõi`,
          `Bài 2: Kiến thức trọng tâm & Kỹ năng ứng dụng`,
          `Bài 3: Thực hành và Luyện tập chuyên sâu`,
          `Bài 4: Vận dụng thực tiễn & Đánh giá năng lực`,
        ];
      }

      const bookTitle = `SGK ${detectedSubject} ${detectedGrade} - ${file.name}`;
      const newBook: CustomUploadedBook = {
        id: `sgk_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        title: bookTitle,
        subject: detectedSubject,
        grade: detectedGrade,
        bookSeries: config.bookSeries || 'Kết nối tri thức với cuộc sống',
        volume: 'Cả năm / Không phân tập',
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadedAt: new Date().toLocaleDateString('vi-VN'),
        summary: `Sách giáo khoa ${detectedSubject} ${detectedGrade} gồm ${lessonsResult.length} bài học.`,
        lessons: lessonsResult,
      };

      await saveTextbookToFirestore(newBook);

      // Update state
      setActiveUploadedBook(newBook);
      setBookUploadMsg(null);

      // Update local storage and notify
      const currentSaved = localStorage.getItem('khbd_my_firebase_books');
      let allBooks: CustomUploadedBook[] = [newBook];
      if (currentSaved) {
        try {
          const parsed = JSON.parse(currentSaved);
          if (Array.isArray(parsed)) {
            allBooks = [newBook, ...parsed.filter((b: any) => b.id !== newBook.id)];
          }
        } catch (e) {}
      }
      onBooksUpdated?.(allBooks);

      // Auto update config
      onChangeConfig({
        subject: detectedSubject,
        grade: detectedGrade,
        lessonTitle: lessonsResult[0] || config.lessonTitle,
      });

    } catch (err: any) {
      console.error('Book upload error:', err);
      setBookUploadMsg(`Lỗi khi đọc file: ${err.message || 'Không thể đọc tệp'}`);
    } finally {
      setIsUploadingBook(false);
    }
  };

  // Handler: Upload DOCX Lesson Plan Sample (Optional)
  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingDocx(true);
    setDocxFileName(file.name);
    setDocxStatusMsg(null);

    try {
      const result = await parseDocxFile(file);
      onChangeConfig({
        oldPlanContent: result.textWithSlots,
        imageSlots: result.imageSlots,
      });
      setDocxStatusMsg(
        result.imageSlots.length > 0 ? `Đã lưu ${result.imageSlots.length} ảnh gốc` : null
      );
    } catch (err: any) {
      console.error('Error parsing docx:', err);
      setDocxStatusMsg(`Lỗi đọc file`);
    } finally {
      setIsParsingDocx(false);
    }
  };

  const handleClearDocx = () => {
    setDocxFileName(null);
    setDocxStatusMsg(null);
    onChangeConfig({
      oldPlanContent: '',
      imageSlots: [],
    });
    if (docxInputRef.current) docxInputRef.current.value = '';
  };

  const handleClearBook = () => {
    setActiveUploadedBook(null);
    setBookUploadMsg(null);
    if (textbookInputRef.current) textbookInputRef.current.value = '';
  };

  return (
    <div className="w-full space-y-4 text-slate-800 min-h-[650px] pb-32">
      {/* Panel Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-4.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
            <BookOpen className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-amber-900 tracking-tight uppercase">
              CẤU HÌNH SOẠN BÀI DẠY
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Thiết lập thông tin bài học, môn học, chuẩn NLS (TT 02/2025), AI (QĐ 2422), STEM và tiến trình dạy học
            </p>
          </div>
        </div>

        {onViewResult && (
          <button
            type="button"
            onClick={onViewResult}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-xs transition-all cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-amber-700" />
            <span>Xem bài soạn {hasPlan ? '✓' : ''}</span>
          </button>
        )}
      </div>

      {/* Main 2-Column Responsive Layout - Co cột bên trái nhỏ gọn */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
        {/* ========================================================================= */}
        {/* CỘT 1: TÀI LIỆU HỌC LIỆU & THÔNG TIN BÀI DẠY CƠ BẢN (GỌN GÀNG) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 min-h-[480px]">
          {/* 1. KHỐI TẢI FILE: TẢI FILE SGK, MẪU VÀ PPCT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-amber-700" />
                <span>Tài liệu & Học liệu đính kèm</span>
              </span>
              <span className="text-[10.5px] text-slate-400 font-medium">Tự động trích xuất nội dung</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* 1. Nút Tải File SGK */}
              <div>
                <input
                  ref={textbookInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleTextbookUpload}
                  className="hidden"
                />
                {activeUploadedBook ? (
                  <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-300 flex items-center justify-between gap-1 shadow-2xs h-full">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate">
                          {activeUploadedBook.fileName || activeUploadedBook.title}
                        </p>
                        <p className="text-[10px] text-amber-800 font-medium whitespace-nowrap truncate">
                          {activeUploadedBook.lessons?.length || 0} bài học
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearBook}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer shrink-0"
                      title="Xóa file SGK"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => textbookInputRef.current?.click()}
                    disabled={isUploadingBook}
                    className="w-full h-full py-2 px-1.5 sm:px-2 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100/70 text-amber-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs group active:scale-[0.99] whitespace-nowrap"
                  >
                    {isUploadingBook ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700 shrink-0" />
                        <span className="truncate">{bookUploadMsg || 'Đang quét...'}</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-3.5 h-3.5 text-amber-700 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="whitespace-nowrap">Tải SGK</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 2. Nút Tải File Giáo Án Mẫu */}
              <div>
                <input
                  ref={docxInputRef}
                  type="file"
                  accept=".docx"
                  onChange={handleDocxUpload}
                  className="hidden"
                />
                {docxFileName ? (
                  <div className="p-2 rounded-xl bg-indigo-50/80 border border-indigo-300 flex items-center justify-between gap-1 shadow-2xs h-full">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate">
                          {docxFileName}
                        </p>
                        {docxStatusMsg && (
                          <p className="text-[10px] text-indigo-700 font-medium whitespace-nowrap truncate">
                            {docxStatusMsg}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearDocx}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer shrink-0"
                      title="Xóa file giáo án mẫu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => docxInputRef.current?.click()}
                    disabled={isParsingDocx}
                    className="w-full h-full py-2 px-1.5 sm:px-2 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-100/60 text-indigo-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs group active:scale-[0.99] whitespace-nowrap"
                  >
                    {isParsingDocx ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-700 shrink-0" />
                        <span className="truncate">Đang đọc...</span>
                      </>
                    ) : (
                      <>
                        <FileCode2 className="w-3.5 h-3.5 text-indigo-700 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="whitespace-nowrap">Giáo án mẫu</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* 3. Nút Tải File PPCT */}
              <div>
                <input
                  ref={ppctInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,.docx,image/*"
                  onChange={handlePPCTUpload}
                  className="hidden"
                />
                {ppctFileName ? (
                  <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-300 flex items-center justify-between gap-1 shadow-2xs h-full">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate">
                          {ppctFileName}
                        </p>
                        {ppctStatusMsg && (
                          <p className="text-[10px] text-emerald-700 font-medium whitespace-nowrap truncate">
                            {ppctStatusMsg}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearPPCT}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer shrink-0"
                      title="Xóa file PPCT"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => ppctInputRef.current?.click()}
                    disabled={isUploadingPPCT}
                    className="w-full h-full py-2 px-1.5 sm:px-2 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/60 text-emerald-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs group active:scale-[0.99] whitespace-nowrap"
                  >
                    {isUploadingPPCT ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700 shrink-0" />
                        <span className="truncate">{ppctStatusMsg || 'Đang đọc...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="whitespace-nowrap">Tải PPCT</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. CẤU HÌNH BÀI DẠY TRỌNG TÂM */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-3.5 relative z-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                <span>Thông tin bài dạy trọng tâm</span>
              </span>
            </div>

            <div className="space-y-3">
        {/* 1. CẤP HỌC & 2. ĐỘ TUỔI / KHỐI LỚP (TRÊN CÙNG 1 HÀNG - CÂN BẰNG SONG SONG) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          {/* CẤP HỌC */}
          <div className="form-group flex flex-col gap-1.5">
            <div className="flex items-center justify-between min-h-[26px]">
              <label className="text-xs font-bold text-red-600 flex items-center gap-1">
                <span>1. Cấp học <span className="text-rose-500">*</span></span>
              </label>
            </div>
            <div className="relative">
              <select
                value={config.schoolLevel}
                onChange={(e) => {
                  const newLevel = e.target.value as any;
                  let newGrade = config.grade;
                  let newSubject = config.subject;

                  if (newLevel === 'Mầm non') {
                    setIsCustomGrade(false);
                    setCustomGradeText('');
                    newGrade = 'Mẫu giáo lớn (5-6 tuổi)';
                    if (!MAM_NON_SUBJECTS_LIST.includes(newSubject || '')) {
                      newSubject = MAM_NON_TRADITIONAL_DOMAINS[0];
                    }
                    onChangeConfig({
                      schoolLevel: newLevel,
                      grade: newGrade,
                      subject: newSubject,
                      lessonTitle: '',
                      enableNLS: false,
                      enableAI: true,
                    });
                  } else {
                    setIsCustomGrade(false);
                    setCustomGradeText('');
                    if (newLevel === 'Tiểu học') newGrade = 'Lớp 5';
                    if (newLevel === 'THCS') newGrade = 'Lớp 6';
                    if (newLevel === 'THPT') newGrade = 'Lớp 10';
                    
                    const activeList = newLevel === 'Tiểu học' ? TIEU_HOC_SUBJECTS_LIST : newLevel === 'THCS' ? THCS_SUBJECTS_LIST : THPT_SUBJECTS_LIST;
                    if (!activeList.includes(newSubject || '')) {
                      newSubject = activeList[0];
                    }
                    
                    onChangeConfig({
                      schoolLevel: newLevel,
                      grade: newGrade,
                      subject: newSubject,
                      lessonTitle: '',
                      enableNLS: true,
                      enableAI: true,
                    });
                  }
                }}
                className="w-full h-[38px] bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 appearance-none focus:bg-white focus:outline-none focus:border-amber-600 cursor-pointer pr-8 shadow-xs"
              >
                {['Mầm non', 'Tiểu học', 'THCS', 'THPT'].map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-white text-slate-800">
                    {lvl}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* ĐỘ TUỔI / KHỐI LỚP */}
          <div className="form-group flex flex-col gap-1.5">
            <div className="flex items-center justify-between min-h-[26px]">
              <label className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                <span>2. {config.schoolLevel === 'Mầm non' ? 'Độ tuổi' : 'Độ tuổi / Khối lớp'} <span className="text-rose-500">*</span></span>
              </label>
              <button
                type="button"
                id="custom-age-grade-btn"
                onClick={() => {
                  if (!isCustomGrade) {
                    setIsCustomGrade(true);
                    const initialText = config.grade && !allGrades.includes(config.grade) ? config.grade : '';
                    setCustomGradeText(initialText);
                    onChangeConfig({ grade: initialText, lessonTitle: '' });
                  } else {
                    setIsCustomGrade(false);
                    const defaultGrade = allGrades[0] || (config.schoolLevel === 'Mầm non' ? 'Mẫu giáo lớn (5-6 tuổi)' : 'Lớp 1');
                    setCustomGradeText('');
                    onChangeConfig({ grade: defaultGrade, lessonTitle: '' });
                  }
                }}
                className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 font-medium cursor-pointer transition-colors shadow-2xs"
              >
                {isCustomGrade
                  ? (config.schoolLevel === 'Mầm non' ? '← Chọn tuổi' : '← Chọn lớp')
                  : (config.schoolLevel === 'Mầm non' ? '✍️ Khác...' : '✍️ Khác...')}
              </button>
            </div>

            {isCustomGrade ? (
              <input
                type="text"
                value={customGradeText}
                onChange={(e) => {
                  setCustomGradeText(e.target.value);
                  onChangeConfig({ grade: e.target.value, lessonTitle: '' });
                }}
                placeholder={config.schoolLevel === 'Mầm non' ? "Nhập độ tuổi (ví dụ: Mẫu giáo 3-4 tuổi...)" : "Nhập khối lớp..."}
                className="w-full h-[38px] bg-[#f8fafc] border border-amber-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            ) : (
              <div className="relative">
                <select
                  value={config.grade}
                  onChange={(e) => {
                    if (e.target.value === '__custom_grade__') {
                      setIsCustomGrade(true);
                      setCustomGradeText('');
                      onChangeConfig({ grade: '', lessonTitle: '' });
                    } else {
                      onChangeConfig({ grade: e.target.value, lessonTitle: '' });
                    }
                  }}
                  className="w-full h-[38px] bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 appearance-none focus:bg-white focus:outline-none focus:border-amber-600 cursor-pointer pr-8 shadow-xs"
                >
                  {allGrades.map((gr) => (
                    <option key={gr} value={gr} className="bg-white text-slate-800">
                      {gr}
                    </option>
                  ))}
                  <option value="__custom_grade__" className="bg-amber-50 text-amber-900 font-semibold">
                    ✍️ {config.schoolLevel === 'Mầm non' ? 'Độ tuổi khác...' : 'Khối lớp khác...'}
                  </option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* 3. MÔN HỌC / LĨNH VỰC HOẠT ĐỘNG */}
        {config.schoolLevel === 'Mầm non' ? (
          /* MẦM NON: PHÂN TÁCH RÕ RÀNG GIỮA "LĨNH VỰC PHÁT TRIỂN" VÀ "8 HOẠT ĐỘNG PHÁT TRIỂN MỚI (QĐ 388)" */
          <div className="form-group flex flex-col gap-2 p-3 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 border border-amber-200/80 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                <span>3. Lĩnh vực / Hoạt động mầm non <span className="text-rose-500">*</span></span>
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!isCustomSubject) {
                    setIsCustomSubject(true);
                    setCustomSubjectText('');
                    onChangeConfig({ subject: '', lessonTitle: '' });
                  } else {
                    setIsCustomSubject(false);
                    const defaultSubj = MAM_NON_TRADITIONAL_DOMAINS[0];
                    setCustomSubjectText('');
                    onChangeConfig({ subject: defaultSubj, lessonTitle: '' });
                  }
                }}
                className="text-[11px] text-amber-800 hover:underline font-semibold cursor-pointer"
              >
                {isCustomSubject ? '← Chọn hoạt động có sẵn' : '✍️ Nhập hoạt động khác...'}
              </button>
            </div>

            {/* Segmented Category Buttons for Preschool: 3 options */}
            {!isCustomSubject && (() => {
              const currentPreschoolMode: 'traditional' | 'new_8' | 'theme' = 
                config.preschoolCategoryMode || 
                (MAM_NON_NEW_ACTIVITIES.includes(config.subject) ? 'new_8' : 'traditional');

              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Option 1: Lĩnh vực phát triển */}
                  <button
                    type="button"
                    onClick={() => {
                      const newSubj = MAM_NON_TRADITIONAL_DOMAINS.includes(config.subject) ? config.subject : MAM_NON_TRADITIONAL_DOMAINS[0];
                      onChangeConfig({
                        preschoolCategoryMode: 'traditional',
                        subject: newSubj,
                        lessonTitle: '',
                      });
                    }}
                    className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer flex items-start gap-2 ${
                      currentPreschoolMode === 'traditional'
                        ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/30 text-emerald-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md shrink-0 mt-0.5 ${currentPreschoolMode === 'traditional' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight">Lĩnh vực phát triển</div>
                      <div className="text-[10.5px] text-slate-500 leading-tight mt-0.5 truncate">Văn học, Âm nhạc...</div>
                    </div>
                  </button>

                  {/* Option 2: 8 Hoạt động phát triển mới */}
                  <button
                    type="button"
                    onClick={() => {
                      const newSubj = MAM_NON_NEW_ACTIVITIES.includes(config.subject) ? config.subject : MAM_NON_NEW_ACTIVITIES[0];
                      const defaultCodes = getDefaultQD388ForSubject(newSubj);
                      onChangeConfig({
                        preschoolCategoryMode: 'new_8',
                        subject: newSubj,
                        lessonTitle: '',
                        ...(defaultCodes && config.preschoolIndicatorMode !== 'custom'
                          ? { preschoolIndicatorMode: 'default_388', preschoolCustomCodes: defaultCodes.summary }
                          : {}),
                      });
                    }}
                    className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer flex items-start gap-2 ${
                      currentPreschoolMode === 'new_8'
                        ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/30 text-blue-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md shrink-0 mt-0.5 ${currentPreschoolMode === 'new_8' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center gap-1">
                        <span>8 HĐ mới</span>
                        <span className="px-1 py-0.2 rounded bg-blue-100 text-blue-800 text-[8.5px] font-extrabold uppercase border border-blue-200">QĐ 388</span>
                      </div>
                      <div className="text-[10.5px] text-slate-500 leading-tight mt-0.5 truncate">Vui chơi, Ngoài trời...</div>
                    </div>
                  </button>

                  {/* Option 3: Chủ đề */}
                  <button
                    type="button"
                    onClick={() => {
                      const defaultTheme = config.preschoolMainTheme || MAM_NON_MAIN_THEMES[0];
                      const defaultSubject = MAM_NON_TRADITIONAL_DOMAINS.includes(config.subject) ? config.subject : MAM_NON_TRADITIONAL_DOMAINS[0];
                      onChangeConfig({
                        preschoolCategoryMode: 'theme',
                        preschoolMainTheme: defaultTheme,
                        preschoolSubTheme: config.preschoolSubTheme || '',
                        subject: defaultSubject,
                      });
                    }}
                    className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer flex items-start gap-2 ${
                      currentPreschoolMode === 'theme'
                        ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-500/30 text-amber-950 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md shrink-0 mt-0.5 ${currentPreschoolMode === 'theme' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight flex items-center gap-1">
                        <span>Chủ đề</span>
                        <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-800 text-[8.5px] font-extrabold uppercase border border-amber-200">Mới</span>
                      </div>
                      <div className="text-[10.5px] text-slate-500 leading-tight mt-0.5 truncate">Trường MN, Bản thân...</div>
                    </div>
                  </button>
                </div>
              );
            })()}

            {/* Selector or input */}
            {isCustomSubject ? (
              <input
                type="text"
                value={customSubjectText}
                onChange={(e) => {
                  setCustomSubjectText(e.target.value);
                  onChangeConfig({ subject: e.target.value, lessonTitle: '' });
                }}
                placeholder="Nhập tên lĩnh vực / hoạt động..."
                className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            ) : (() => {
              const currentPreschoolMode: 'traditional' | 'new_8' | 'theme' = 
                config.preschoolCategoryMode || 
                (MAM_NON_NEW_ACTIVITIES.includes(config.subject) ? 'new_8' : 'traditional');

              if (currentPreschoolMode === 'theme') {
                return (
                  <div className="space-y-3 pt-1">
                    {/* Dòng 1: Dropdown Chủ đề lớn */}
                    <div className="space-y-1">
                      <label className="text-[11.5px] font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>🌸 Chủ đề lớn:</span>
                          <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-[10.5px] text-amber-800 font-medium">9 chủ đề chuẩn mầm non</span>
                      </label>
                      <div className="relative">
                        <select
                          value={config.preschoolMainTheme || MAM_NON_MAIN_THEMES[0]}
                          onChange={(e) => {
                            onChangeConfig({ preschoolMainTheme: e.target.value });
                          }}
                          className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs cursor-pointer appearance-none"
                        >
                          {MAM_NON_MAIN_THEMES.map((theme) => (
                            <option key={theme} value={theme}>
                              {theme}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Dòng 2: Ô input Chủ đề nhỏ (tự do nhập 1 dòng) */}
                    <div className="space-y-1">
                      <label className="text-[11.5px] font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>🌿 Chủ đề nhỏ (Chủ đề nhánh / sự kiện):</span>
                        </span>
                        <span className="text-[10.5px] text-slate-500 font-normal italic">(Cô tự do gõ tên chủ đề nhỏ)</span>
                      </label>
                      <input
                        type="text"
                        value={config.preschoolSubTheme || ''}
                        onChange={(e) => {
                          onChangeConfig({ preschoolSubTheme: e.target.value });
                        }}
                        placeholder="Ví dụ: Một số loại hoa đẹp quanh bé, Gia đình thân yêu của bé, Các loại quả..."
                        className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                      />
                    </div>

                    {/* Dòng 3: Hoạt động / Lĩnh vực bài dạy của chủ đề */}
                    <div className="space-y-1">
                      <label className="text-[11.5px] font-bold text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>📚 Hoạt động / Phân môn theo chủ đề:</span>
                          <span className="text-rose-500">*</span>
                        </span>
                      </label>
                      <CustomSubjectSelect
                        value={config.subject || MAM_NON_TRADITIONAL_DOMAINS[0]}
                        onChange={(newSubj) => {
                          onChangeConfig({
                            subject: newSubj,
                            lessonTitle: '',
                          });
                        }}
                        subjects={MAM_NON_TRADITIONAL_DOMAINS}
                        schoolLevel={config.schoolLevel}
                      />
                    </div>
                  </div>
                );
              }

              // Mode traditional or new_8
              const isCurrentNew = currentPreschoolMode === 'new_8';
              const activeList = isCurrentNew ? MAM_NON_NEW_ACTIVITIES : MAM_NON_TRADITIONAL_DOMAINS;

              const handleSubjectChange = (newSubj: string) => {
                let preschoolCodeUpdate: Partial<LessonPlanConfig> = {};
                const defaultCodes = getDefaultQD388ForSubject(newSubj);
                if (defaultCodes) {
                  if (config.preschoolIndicatorMode !== 'custom') {
                    preschoolCodeUpdate = {
                      preschoolIndicatorMode: 'default_388',
                      preschoolCustomCodes: defaultCodes.summary,
                    };
                  }
                }
                onChangeConfig({
                  subject: newSubj,
                  lessonTitle: '',
                  ...preschoolCodeUpdate,
                });
              };

              return (
                <div className="relative">
                  <CustomSubjectSelect
                    value={config.subject}
                    onChange={handleSubjectChange}
                    subjects={activeList}
                    schoolLevel={config.schoolLevel}
                  />
                </div>
              );
            })()}
          </div>
        ) : (
          /* CẤP TIỂU HỌC / THCS / THPT */
          <div className="form-group flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-red-600 flex items-center gap-1">
                <span>3. Môn học / Lĩnh vực <span className="text-rose-500">*</span></span>
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!isCustomSubject) {
                    setIsCustomSubject(true);
                    setCustomSubjectText('');
                    onChangeConfig({ subject: '', lessonTitle: '' });
                  } else {
                    setIsCustomSubject(false);
                    const activeList = config.schoolLevel === 'Tiểu học' ? TIEU_HOC_SUBJECTS_LIST : config.schoolLevel === 'THCS' ? THCS_SUBJECTS_LIST : THPT_SUBJECTS_LIST;
                    const defaultSubj = activeList[0] || '';
                    setCustomSubjectText('');
                    onChangeConfig({ subject: defaultSubj, lessonTitle: '' });
                  }
                }}
                className="text-[11px] text-amber-800 hover:underline font-semibold cursor-pointer"
              >
                {isCustomSubject ? '← Chọn môn có sẵn' : '✍️ Nhập môn khác...'}
              </button>
            </div>

            {isCustomSubject ? (
              <input
                type="text"
                value={customSubjectText}
                onChange={(e) => {
                  setCustomSubjectText(e.target.value);
                  onChangeConfig({ subject: e.target.value, lessonTitle: '' });
                }}
                placeholder="Nhập tên môn học..."
                className="w-full bg-[#f8fafc] border border-amber-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
              />
            ) : (
              <div className="relative">
                {(() => {
                  const currentSubjects = config.schoolLevel === 'Tiểu học'
                    ? TIEU_HOC_SUBJECTS_LIST
                    : config.schoolLevel === 'THCS'
                    ? THCS_SUBJECTS_LIST
                    : THPT_SUBJECTS_LIST;

                  const handleSubjectChange = (newSubj: string) => {
                    const isNewHDTN = newSubj.toLowerCase().includes('hoạt động trải nghiệm') || newSubj.toLowerCase().includes('hđtn');
                    onChangeConfig({
                      subject: newSubj,
                      lessonTitle: '',
                      ...(isNewHDTN ? { enableAI: false, enableNLS: false, enableSTEM: false } : {}),
                    });
                  };

                  return (
                    <CustomSubjectSelect
                      value={config.subject}
                      onChange={handleSubjectChange}
                      subjects={currentSubjects}
                      schoolLevel={config.schoolLevel}
                    />
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* 4. TÊN BÀI HỌC / CHỦ ĐỀ */}
        <div className="form-group flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-red-600">
              4. Tên bài học / Chủ đề <span className="text-rose-500">*</span>
            </label>
            {availableLessons.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (!isCustomLessonInput) {
                    setIsCustomLessonInput(true);
                    onChangeConfig({ lessonTitle: '' });
                  } else {
                    setIsCustomLessonInput(false);
                    onChangeConfig({ lessonTitle: availableLessons[0] || '' });
                  }
                }}
                className="text-[11px] text-amber-800 hover:underline font-semibold cursor-pointer"
              >
                {isCustomLessonInput ? 'Chọn bài từ SGK' : '✍️ Tự nhập tên bài'}
              </button>
            )}
          </div>

          {availableLessons.length > 0 && !isCustomLessonInput ? (
            <div className="relative">
              <select
                value={config.lessonTitle}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomLessonInput(true);
                    onChangeConfig({ lessonTitle: '' });
                  } else {
                    onChangeConfig({ lessonTitle: e.target.value });
                  }
                }}
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 appearance-none focus:bg-white focus:outline-none focus:border-amber-600 cursor-pointer pr-8 shadow-xs"
              >
                <option value="" disabled>-- Chọn bài học từ danh mục SGK --</option>
                {availableLessons.map((les, idx) => (
                  <option key={idx} value={les} className="bg-white text-slate-900 py-1">
                    {les}
                  </option>
                ))}
                <option value="__custom__">✍️ Nhập tên bài học khác...</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          ) : (
            <input
              type="text"
              value={config.lessonTitle}
              onChange={(e) => onChangeConfig({ lessonTitle: e.target.value })}
              placeholder="Nhập tên bài học / chủ đề..."
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-600 shadow-xs"
            />
          )}
        </div>

        {/* THÔNG BÁO GỌN CHO MẦM NON KHI CHỌN 8 HOẠT ĐỘNG MỚI */}
        {config.schoolLevel === 'Mầm non' && (MAM_NON_NEW_ACTIVITIES.includes(config.subject) || isPreschoolNew8Activity(config.subject, config.lessonTitle)) && (
          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs flex items-center justify-between gap-2">
            <span className="font-semibold text-blue-900 flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 animate-pulse" />
              <span>Mã QĐ 388: <strong className="text-blue-700">{config.preschoolCustomCodes || getDefaultQD388ForSubject(config.subject)?.summary || 'NT, TX...'}</strong></span>
            </span>
            <span className="text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shrink-0">
              Đang mở ở dưới 👇
            </span>
          </div>
        )}

        {/* 5 & 6. SỐ TIẾT & TIẾT PPCT (ẨN KHI LÀ MẦM NON) - CÙNG HÀNG SONG SONG */}
        {config.schoolLevel !== 'Mầm non' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              {/* 5. SỐ TIẾT CẦN SOẠN */}
              <div className="form-group flex flex-col gap-1.5">
                <div className="flex items-center justify-between min-h-[26px]">
                  <label className="text-xs font-bold text-red-600 flex items-center gap-1">
                    <span>5. Số tiết cần soạn <span className="text-rose-500">*</span></span>
                  </label>
                </div>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={config.periods || ''}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    if (rawVal === '') {
                      onChangeConfig({ periods: 1, targetPeriodDetail: '1' });
                      return;
                    }
                    const val = parseInt(rawVal, 10);
                    if (!isNaN(val) && val > 0) {
                      onChangeConfig({ 
                        periods: val,
                        targetPeriodDetail: val === 2 ? '1+2' : val === 1 ? '1' : `1-${val}`
                      });
                    }
                  }}
                  placeholder="Nhập số tiết..."
                  className="w-full h-[38px] bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 shadow-xs"
                />
              </div>

              {/* 6. TIẾT CỦA BÀI (PPCT) */}
              <div className="form-group flex flex-col gap-1.5">
                <div className="flex items-center justify-between min-h-[26px]">
                  <label className="text-xs font-bold text-red-600 flex items-center gap-1">
                    <span>6. Tiết của bài (PPCT)</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={config.targetPeriodDetail || ''}
                  onChange={(e) => onChangeConfig({ targetPeriodDetail: e.target.value })}
                  placeholder="Ví dụ: 1+2 (hoặc 1, 19+20, 1-2...)"
                  className="w-full h-[38px] bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-600 shadow-xs"
                />
              </div>
            </div>

            {/* 7. MẪU BẢNG GIÁO ÁN */}
            <div className="form-group flex flex-col gap-1.5">
              <label className="text-xs font-bold text-red-600">
                7. Mẫu bảng giáo án
              </label>
              <div className="relative">
                <select
                  value={config.tableLayout || 'two_column'}
                  onChange={(e) => onChangeConfig({ tableLayout: e.target.value as any })}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 appearance-none focus:bg-white focus:outline-none focus:border-amber-600 cursor-pointer pr-8 shadow-xs"
                >
                  <option value="two_column">Mẫu 2 cột (Mặc định)</option>
                  <option value="math_4_column">Mẫu Toán học (4 cột: GV/HS, Sản phẩm, NLS, AI)</option>
                  <option value="standard_row">Mẫu ngang từng hàng</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 8. ĐỊNH DẠNG CÔNG THỨC TOÁN TRONG WORD */}
            <div className="form-group flex flex-col gap-1.5">
              <label className="text-xs font-bold text-red-600 flex items-center justify-between">
                <span>8. Công thức Toán trong Word</span>
                <span className="text-[10px] font-normal text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Mới</span>
              </label>
              <div className="relative">
                <select
                  value={config.mathFormulaFormat || 'word_equation'}
                  onChange={(e) => onChangeConfig({ mathFormulaFormat: e.target.value as any })}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 appearance-none focus:bg-white focus:outline-none focus:border-amber-600 cursor-pointer pr-8 shadow-xs"
                >
                  <option value="word_equation">Phương án 2: Chuẩn Word Equation (Tự động - Khuyên dùng)</option>
                  <option value="mathtype_latex">Phương án 1: Giữ mã LaTeX (Dành cho MathType Alt+\)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-500 italic leading-snug">
                {config.mathFormulaFormat === 'mathtype_latex' 
                  ? '• Phương án 1: Giữ nguyên mã $công_thức$ để thầy/cô quét chọn và bấm Alt + \\ trong MathType.'
                  : '• Phương án 2: Tự động chuyển đổi thành công thức chuẩn Word Equation (OMML). Mở Word xem được ngay, không cần cài MathType.'}
              </p>
            </div>
          </>
        )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CỘT 2: TÙY CHỌN TÍCH HỢP (NLS, AI, STEM, QĐ 388, GHI CHÚ) & THAO TÁC */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Tùy chọn tích hợp chuyên sâu (NLS, AI, STEM)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 items-start">
              {/* Checkbox 1: TÍCH HỢP (NLS) */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              config.enableNLS
                ? 'bg-amber-50/70 border-amber-300 text-slate-900 shadow-2xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div
              onClick={() => onChangeConfig({ enableNLS: !config.enableNLS })}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="text-amber-700">
                {config.enableNLS ? (
                  <CheckSquare className="w-5 h-5 text-amber-700" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">
                  Tích hợp Năng lực số (NLS)
                </h3>
                {matchedPPCTLesson?.integratedNLS && matchedPPCTLesson.integratedNLS.length > 0 && (
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                    PPCT: {matchedPPCTLesson.integratedNLS.length} chỉ báo
                  </span>
                )}
              </div>
            </div>

            {config.enableNLS && (
              <div className="mt-3 pt-2.5 border-t border-amber-200/70 space-y-2.5">
                {/* 3-Mode Selector */}
                <div>
                  <label className="text-[11px] font-bold text-amber-900 flex items-center justify-between mb-1.5">
                    <span>Nguồn tích hợp Năng lực số:</span>
                    <span className="text-[10px] font-normal text-amber-700">
                      {config.nlsMode === 'custom' ? 'Dán tùy chọn' : config.nlsMode === 'ai_generated' ? 'AI tự thiết kế' : 'Theo PPCT'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-amber-100/70 p-1 rounded-lg border border-amber-200">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onChangeConfig({ nlsMode: 'ppct' }); }}
                      className={`py-1.5 px-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                        (config.nlsMode === 'ppct' || !config.nlsMode)
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-800 hover:bg-amber-200/60'
                      }`}
                      title="Lấy theo Phân phối chương trình chuẩn hoặc TT 02/2025"
                    >
                      <BookOpen className="w-3 h-3 shrink-0" />
                      <span>Theo PPCT</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onChangeConfig({ nlsMode: 'custom' }); }}
                      className={`py-1.5 px-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                        config.nlsMode === 'custom'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-800 hover:bg-amber-200/60'
                      }`}
                      title="Dán năng lực số tùy chọn từ bên ngoài vào giáo án"
                    >
                      <ClipboardPaste className="w-3 h-3 shrink-0" />
                      <span>Dán tự chọn</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onChangeConfig({ nlsMode: 'ai_generated' }); }}
                      className={`py-1.5 px-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                        config.nlsMode === 'ai_generated'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-800 hover:bg-amber-200/60'
                      }`}
                      title="AI tự động phân tích và tạo NLS sáng tạo phù hợp với bài học"
                    >
                      <Wand2 className="w-3 h-3 shrink-0" />
                      <span>AI tự tạo</span>
                    </button>
                  </div>
                </div>

                {/* Content of Mode 1: PPCT */}
                {(config.nlsMode === 'ppct' || !config.nlsMode) && (
                  <div className="space-y-1.5">
                    {matchedPPCTLesson?.integratedNLS && matchedPPCTLesson.integratedNLS.length > 0 ? (
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        <p className="text-[10px] font-bold text-amber-900">Chỉ báo NLS từ PPCT bài dạy ({matchedPPCTLesson.integratedNLS.length}):</p>
                        {matchedPPCTLesson.integratedNLS.map((nls: string, i: number) => (
                          <div key={i} className="text-[10px] bg-white/90 p-1.5 rounded-lg border border-amber-200 text-slate-700 leading-tight shadow-2xs">
                            <span className="font-bold text-amber-800">{nls.split(':')[0]}:</span> {nls.split(':').slice(1).join(':')}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 bg-amber-100/50 rounded-lg border border-amber-200/80 text-[10px] text-amber-900 leading-relaxed">
                        <span className="font-bold">Khung NLS chuẩn:</span> Tự động trích xuất các chỉ báo chuẩn TT 02/2025/TT-BGDĐT & Công văn 3456 phù hợp với khối lớp {config.grade}.
                      </div>
                    )}
                  </div>
                )}

                {/* Content of Mode 2: Dán tùy chọn (Custom) */}
                {config.nlsMode === 'custom' && (
                  <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                        <ClipboardPaste className="w-3 h-3 text-amber-700" />
                        <span>Nội dung NLS tự chọn (dán từ ngoài vào):</span>
                      </span>
                      {config.customNLS && (
                        <button
                          type="button"
                          onClick={() => onChangeConfig({ customNLS: '' })}
                          className="text-[9px] text-red-600 hover:text-red-700 font-semibold underline"
                        >
                          Xóa nhanh
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={4}
                      value={config.customNLS || ''}
                      onChange={(e) => onChangeConfig({ customNLS: e.target.value })}
                      placeholder="Dán các chỉ báo / yêu cầu Năng lực số vào đây (mỗi chỉ báo một dòng)...&#10;Ví dụ:&#10;- 1.2.TC2a: Tìm kiếm và đối chiếu tư liệu trên môi trường số an toàn.&#10;- 3.1.TC1a: Sử dụng phần mềm trình chiếu hoặc sơ đồ tư duy."
                      className="w-full text-[11px] p-2 bg-white rounded-lg border border-amber-300 focus:ring-1 focus:ring-amber-500 focus:outline-none text-slate-800 placeholder:text-slate-400 shadow-inner resize-y leading-snug"
                    />
                    <div className="flex items-center justify-between text-[9px] text-amber-800">
                      <span>💡 AI sẽ tự động phân tích và gắn các năng lực này vào từng hoạt động dạy học.</span>
                      {!config.customNLS && (
                        <button
                          type="button"
                          onClick={() => onChangeConfig({
                            customNLS: '- 1.2.TC2a: Khai thác, tìm kiếm và đối chiếu dữ liệu học tập qua nguồn học liệu số an toàn.\n- 3.1.TC1a: Tạo lập và chỉnh sửa sản phẩm học tập trên phần mềm chuyên ngành/bài giảng số.\n- 5.1.TC1b: Vận dụng công cụ kỹ thuật số giải quyết nhiệm vụ bài học.'
                          })}
                          className="text-amber-700 font-bold hover:underline shrink-0 ml-1"
                        >
                          + Chèn ví dụ mẫu
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Content of Mode 3: AI Tự tạo */}
                {config.nlsMode === 'ai_generated' && (
                  <div className="p-2.5 bg-white/90 rounded-lg border border-amber-300 text-[10px] text-slate-700 leading-relaxed shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                      <Wand2 className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      <span>AI tự động phân tích & sáng tạo NLS:</span>
                    </div>
                    <p className="text-slate-600">
                      AI sẽ tự động đọc bài dạy <strong className="text-slate-800">{config.lessonTitle || 'bài học'}</strong> để thiết kế, sáng tạo các năng lực số thực tế, phù hợp và hiệu quả nhất cho học sinh mà không bị giới hạn bởi kho có sẵn hay nội dung dán bên ngoài.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checkbox 2: TÍCH HỢP (AI) */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              config.enableAI
                ? 'bg-purple-50/70 border-purple-300 text-slate-900 shadow-2xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div
              onClick={() => onChangeConfig({ enableAI: !config.enableAI })}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="text-purple-700">
                {config.enableAI ? (
                  <CheckSquare className="w-5 h-5 text-purple-700" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">
                  Tích hợp Trí tuệ nhân tạo (AI)
                </h3>
                {matchedPPCTLesson?.integratedAI && matchedPPCTLesson.integratedAI.length > 0 && (
                  <span className="text-[10px] bg-purple-200/80 text-purple-900 font-bold px-1.5 py-0.5 rounded">
                    PPCT: {matchedPPCTLesson.integratedAI.length} chỉ báo
                  </span>
                )}
              </div>
            </div>

            {config.enableAI && (
              <div className="mt-3 pt-2.5 border-t border-purple-200/70 space-y-2.5">
                {/* 3-Mode Selector */}
                <div>
                  <label className="text-[11px] font-bold text-purple-900 flex items-center justify-between mb-1.5">
                    <span>Nguồn tích hợp Giáo dục AI:</span>
                    <span className="text-[10px] font-normal text-purple-700">
                      {config.aiMode === 'custom' ? 'Dán tùy chọn' : config.aiMode === 'ai_generated' ? 'AI tự thiết kế' : 'Theo PPCT'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-purple-100/70 p-1 rounded-lg border border-purple-200">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onChangeConfig({ aiMode: 'ppct' }); }}
                      className={`py-1.5 px-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                        (config.aiMode === 'ppct' || !config.aiMode)
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-800 hover:bg-purple-200/60'
                      }`}
                      title="Lấy theo Phân phối chương trình chuẩn hoặc QĐ 2422"
                    >
                      <BookOpen className="w-3 h-3 shrink-0" />
                      <span>Theo PPCT</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onChangeConfig({ aiMode: 'custom' }); }}
                      className={`py-1.5 px-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                        config.aiMode === 'custom'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-800 hover:bg-purple-200/60'
                      }`}
                      title="Dán năng lực AI tùy chọn từ bên ngoài vào giáo án"
                    >
                      <ClipboardPaste className="w-3 h-3 shrink-0" />
                      <span>Dán tự chọn</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onChangeConfig({ aiMode: 'ai_generated' }); }}
                      className={`py-1.5 px-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                        config.aiMode === 'ai_generated'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-800 hover:bg-purple-200/60'
                      }`}
                      title="AI tự động phân tích và tạo chỉ báo AI sáng tạo phù hợp với bài học"
                    >
                      <Wand2 className="w-3 h-3 shrink-0" />
                      <span>AI tự tạo</span>
                    </button>
                  </div>
                </div>

                {/* Content of Mode 1: PPCT */}
                {(config.aiMode === 'ppct' || !config.aiMode) && (
                  <div className="space-y-1.5">
                    {matchedPPCTLesson?.integratedAI && matchedPPCTLesson.integratedAI.length > 0 ? (
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        <p className="text-[10px] font-bold text-purple-900">Chỉ báo AI từ PPCT bài dạy ({matchedPPCTLesson.integratedAI.length}):</p>
                        {matchedPPCTLesson.integratedAI.map((ai: string, i: number) => (
                          <div key={i} className="text-[10px] bg-white/90 p-1.5 rounded-lg border border-purple-200 text-slate-700 leading-tight shadow-2xs">
                            <span className="font-bold text-purple-800">{ai.split(':')[0]}:</span> {ai.split(':').slice(1).join(':')}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 bg-purple-100/50 rounded-lg border border-purple-200/80 text-[10px] text-purple-900 leading-relaxed">
                        <span className="font-bold">Khung Giáo dục AI chuẩn:</span> Tự động trích xuất các chỉ báo chuẩn Quyết định 2422/QĐ-BGDĐT phù hợp với khối lớp {config.grade}.
                      </div>
                    )}
                  </div>
                )}

                {/* Content of Mode 2: Dán tùy chọn (Custom) */}
                {config.aiMode === 'custom' && (
                  <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-900 flex items-center gap-1">
                        <ClipboardPaste className="w-3 h-3 text-purple-700" />
                        <span>Nội dung Giáo dục AI tự chọn (dán từ ngoài vào):</span>
                      </span>
                      {config.customAI && (
                        <button
                          type="button"
                          onClick={() => onChangeConfig({ customAI: '' })}
                          className="text-[9px] text-red-600 hover:text-red-700 font-semibold underline"
                        >
                          Xóa nhanh
                        </button>
                      )}
                    </div>
                    <textarea
                      rows={4}
                      value={config.customAI || ''}
                      onChange={(e) => onChangeConfig({ customAI: e.target.value })}
                      placeholder="Dán các chỉ báo / yêu cầu năng lực AI vào đây (mỗi chỉ báo một dòng)...&#10;Ví dụ:&#10;- 10.C3.1: Mô tả được các yêu cầu để đưa ra prompt phù hợp với mục tiêu cụ thể.&#10;- 10.C3.2: Thực hành đặt prompt giải quyết vấn đề hiệu quả."
                      className="w-full text-[11px] p-2 bg-white rounded-lg border border-purple-300 focus:ring-1 focus:ring-purple-500 focus:outline-none text-slate-800 placeholder:text-slate-400 shadow-inner resize-y leading-snug"
                    />
                    <div className="flex items-center justify-between text-[9px] text-purple-800">
                      <span>💡 AI sẽ tự động phân tích và gắn các năng lực này vào từng hoạt động dạy học.</span>
                      {!config.customAI && (
                        <button
                          type="button"
                          onClick={() => onChangeConfig({
                            customAI: '- 10.C3.1: Mô tả được các yêu cầu để đưa ra prompt phù hợp với mục tiêu cụ thể.\n- 10.C3.2: Thực hành đặt prompt giải quyết vấn đề bài học hiệu quả.\n- 10.B2.1: Tuân thủ các nguyên tắc đạo đức và an toàn khi sử dụng AI.'
                          })}
                          className="text-purple-700 font-bold hover:underline shrink-0 ml-1"
                        >
                          + Chèn ví dụ mẫu
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Content of Mode 3: AI Tự tạo */}
                {config.aiMode === 'ai_generated' && (
                  <div className="p-2.5 bg-white/90 rounded-lg border border-purple-300 text-[10px] text-slate-700 leading-relaxed shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-purple-800 font-bold">
                      <Wand2 className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                      <span>AI tự động phân tích & sáng tạo chỉ báo AI:</span>
                    </div>
                    <p className="text-slate-600">
                      AI sẽ tự động đọc bài dạy <strong className="text-slate-800">{config.lessonTitle || 'bài học'}</strong> để thiết kế, sáng tạo các nội dung và chỉ báo AI thực tế, phù hợp nhất theo tinh thần Quyết định 2422/QĐ-BGDĐT.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checkbox 3: TÍCH HỢP NỘI DUNG GIÁO DỤC STEM */}
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              config.enableSTEM
                ? 'bg-emerald-50/80 border-emerald-300 text-slate-900 shadow-2xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div
              onClick={() => onChangeConfig({ enableSTEM: !config.enableSTEM })}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="text-emerald-700">
                  {config.enableSTEM ? (
                    <CheckSquare className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Tích hợp nội dung STEM
                  </h3>
                </div>
              </div>
            </div>

            {config.enableSTEM && (
              <div className="mt-2 pt-2 border-t border-emerald-200/60 space-y-1.5">
                <label className="block text-[11px] font-bold text-emerald-900">
                  Tên chủ đề STEM tích hợp:
                </label>
                <input
                  type="text"
                  value={config.stemTopic || ''}
                  onChange={(e) => onChangeConfig({ stemTopic: e.target.value })}
                  placeholder="Ví dụ: Thiết kế hệ thống lọc nước đơn giản..."
                  className="w-full bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>
            )}
          </div>
          </div>
          </div>

          {/* Additional Pedagogical Notes Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-2">
            <label className="block text-xs font-bold text-red-600">
              Ghi chú & Yêu cầu bổ sung (nếu có):
            </label>
            <textarea
              value={config.additionalRequirements || ''}
              onChange={(e) => onChangeConfig({ additionalRequirements: e.target.value })}
              placeholder="Ví dụ: Tăng cường hoạt động nhóm, liên hệ tình huống thực tế, lồng ghép trò chơi khởi động sôi nổi..."
              rows={2}
              className="w-full bg-[#f8fafc] border border-slate-200 rounded-lg p-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>

          {/* Account Status Alerts (only when trial/expired/custom key applies) */}
          {!accessStatus.isAdmin && (accessStatus.requiresCustomApiKey || accessStatus.isTrial || accessStatus.isExpired) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-4.5 shadow-xs space-y-3">
              <div className="space-y-1">
                {accessStatus.requiresCustomApiKey && (
                  <div
                    onClick={onOpenApiKeyModal}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs cursor-pointer hover:bg-amber-100 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11.5px] text-amber-900">
                      <Key className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Yêu cầu nhập API Key cá nhân ({accessStatus.expiresAt})</span>
                    </div>
                    <p className="text-[10.5px] text-amber-800 font-medium mt-1">
                      Tài khoản có thời hạn bắt buộc phải sử dụng API Key Gemini cá nhân (miễn phí từ Google AI Studio) để soạn bài.
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold text-amber-900 underline">
                      <span>👉 Nhấp vào đây để nhập mã khóa API</span>
                      <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-[10px] no-underline">Nhập Key</span>
                    </div>
                  </div>
                )}

                {accessStatus.isTrial && (
                  <div
                    onClick={accessStatus.isOutOfTrials ? (onRequestContactAdmin || onGenerate) : undefined}
                    className={`p-2.5 rounded-xl border text-xs transition-all ${
                      accessStatus.isOutOfTrials
                        ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-xs cursor-pointer hover:bg-rose-100'
                        : 'bg-amber-50/80 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                      <span className="flex items-center gap-1.5">
                        {accessStatus.isOutOfTrials ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>
                          {accessStatus.isOutOfTrials
                            ? 'Hết lượt dùng thử'
                            : `Dùng thử: Còn ${accessStatus.remainingTrials} lượt`}
                        </span>
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Đã tạo {accessStatus.usedTrials}/{accessStatus.maxTrials} bài
                      </span>
                    </div>

                    {/* Visual Quota Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          accessStatus.isOutOfTrials
                            ? 'bg-rose-600 w-full'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600'
                        }`}
                        style={{
                          width: accessStatus.isOutOfTrials
                            ? '100%'
                            : `${Math.min(100, Math.round((accessStatus.usedTrials / accessStatus.maxTrials) * 100))}%`,
                        }}
                      />
                    </div>

                    {accessStatus.isOutOfTrials && (
                      <p className="text-[10.5px] text-rose-700 font-semibold mt-1.5 flex items-center justify-between">
                        <span>⚠️ Nhấp để liên hệ Admin cấp quyền soạn giáo án</span>
                        <span className="text-[10px] underline">Liên hệ</span>
                      </p>
                    )}
                  </div>
                )}

                {accessStatus.isExpired && (
                  <div
                    onClick={onRequestContactAdmin || onGenerate}
                    className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs cursor-pointer hover:bg-rose-100 transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[11.5px] text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Tài khoản đã hết hạn ({accessStatus.expiresAt})</span>
                    </div>
                    <p className="text-[10.5px] text-rose-700 font-semibold mt-1 flex items-center justify-between">
                      <span>Nhấp để liên hệ Admin gia hạn tài khoản</span>
                      <span className="text-[10px] underline">Gia hạn</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BẢNG TRA CỨU & CHỌN MÃ QĐ 388 MỞ RỘNG TOÀN BỘ CHIỀU RỘNG Ở PHÍA DƯỚI CÙNG */}
      {/* ========================================================================= */}
      {config.schoolLevel === 'Mầm non' && (MAM_NON_NEW_ACTIVITIES.includes(config.subject) || isPreschoolNew8Activity(config.subject, config.lessonTitle)) && (
        <div className="w-full pt-1 animate-in fade-in slide-in-from-top-3 duration-300">
          <PreschoolQD388FullViewer
            subject={config.subject}
            customCodes={config.preschoolCustomCodes !== undefined ? config.preschoolCustomCodes : (getDefaultQD388ForSubject(config.subject)?.summary || '')}
            mode={config.preschoolIndicatorMode || 'default_388'}
            onChangeCodes={(newCodes) => onChangeConfig({ preschoolCustomCodes: newCodes })}
            onChangeMode={(newMode) => onChangeConfig({ preschoolIndicatorMode: newMode })}
          />
        </div>
      )}
    </div>
  );
};
