export interface ImageSlot {
  id: string;
  slotTag: string; // e.g. {{IMAGE_SLOT_1}}
  name: string;
  mimeType: string;
  base64Data: string; // clean base64 data without prefix or with data url
  originalIndex: number;
  width?: number;
  height?: number;
  caption?: string;
}

export type BookSeries = 'Kết nối tri thức với cuộc sống';

export type SchoolLevel = 'Mầm non' | 'Tiểu học' | 'THCS' | 'THPT';

export interface NLSDomainOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface AIDomainOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type NLSIntegrationMode = 'ppct' | 'custom' | 'ai_generated';
export type AIIntegrationMode = 'ppct' | 'custom' | 'ai_generated';
export type TableLayoutType = 'two_column' | 'standard_row' | 'math_4_column';
export type MathFormulaFormatType = 'word_equation' | 'mathtype_latex';

export interface LessonPlanConfig {
  lessonTitle: string;
  subject: string;
  grade: string;
  volume?: string;
  schoolLevel: SchoolLevel;
  bookSeries: BookSeries;
  periods: number;
  lessonTotalPeriods?: number; // Tổng số tiết của bài học theo SGK/PPCT (ví dụ: 3 tiết)
  targetPeriodDetail?: string; // Tiết cụ thể cần soạn (ví dụ: "Tiết 1", "Tiết 2", "Tiết 1-2", "Trọn vẹn 3 tiết")
  schoolName: string;
  teacherName: string;
  tableStyle?: TableLayoutType;
  tableLayout?: TableLayoutType;
  mathFormulaFormat?: MathFormulaFormatType; // 'word_equation' (Phương án 2: OMML tự động) | 'mathtype_latex' (Phương án 1: Giữ mã cho MathType)
  enableNLS: boolean;
  nlsMode?: NLSIntegrationMode; // 'ppct' | 'custom' | 'ai_generated'
  customNLS?: string; // Nội dung năng lực số tự dán/nhập từ bên ngoài
  enableAI: boolean;
  aiMode?: AIIntegrationMode; // 'ppct' | 'custom' | 'ai_generated'
  customAI?: string; // Nội dung năng lực AI tự dán/nhập từ bên ngoài
  enableSTEM?: boolean;
  stemTopic?: string;
  hasStemFromPPCT?: boolean;
  selectedNLSDomains: string[];
  selectedAIDomains: string[];
  oldPlanContent?: string;
  imageSlots: ImageSlot[];
  textbookReference?: string;
  additionalRequirements?: string;
  integratedNLSFromPPCT?: string[];
  integratedAIFromPPCT?: string[];
  ppctContent?: string;
  aiModel?: string; // 'gemini-3.1-flash-lite' | 'gemini-3.5-flash-lite'
  preschoolCategoryMode?: 'traditional' | 'new_8' | 'theme';
  preschoolMainTheme?: string; // Chủ đề lớn: Trường mầm non, Bản thân, Gia đình...
  preschoolSubTheme?: string; // Chủ đề nhỏ / nhánh do giáo viên tự nhập
  preschoolClassSize?: string; // Số lượng trẻ (ví dụ: "30 – 35 trẻ")
  preschoolDuration?: string; // Thời gian (ví dụ: "30 – 35 phút")
  enablePreschool388Criteria?: boolean;
  preschoolIndicatorMode?: 'default_388' | 'custom'; // 'default_388' | 'custom'
  preschoolCustomCodes?: string; // Ví dụ: "NT 3.1, TX 4.4, TC 1.2"
  showPreschoolQD388InPreview?: boolean; // Tích chọn hiển thị bảng tra cứu mã QĐ 388 ở khung xem trước
  selected388CriteriaCodes?: string[];
  custom388CriteriaText?: string;
  preschoolCodesBySection?: {
    knowledge?: string;
    skills?: string;
    qualities?: string;
    competencies?: string;
  };
}

export interface StepDetail {
  title: string; // e.g., "Bước 1: Chuyển giao nhiệm vụ học tập"
  teacherAction: string; // Hoạt động của giáo viên (nêu rõ lệnh, câu hỏi, hướng dẫn công nghệ)
  studentAction: string; // Hoạt động của học sinh (tiếp nhận, chuẩn bị dụng cụ, thực hiện)
  productExpected: string; // Sản phẩm học tập tương ứng
  digitalOrAiTool?: string; // Ứng dụng số / AI nếu có
}

export interface ActivityDetail {
  id: string;
  index: number;
  name: string; // e.g. "Hoạt động 1: Xác định vấn đề / Khởi động"
  duration: string; // e.g. "7-10 phút"
  objective: string; // Mục tiêu hoạt động
  content: string; // Nội dung cốt lõi
  productSummary: string; // Tóm tắt sản phẩm
  step1: StepDetail; // Bước 1: Chuyển giao nhiệm vụ học tập
  step2: StepDetail; // Bước 2: Thực hiện nhiệm vụ học tập
  step3: StepDetail; // Bước 3: Báo cáo kết quả và thảo luận
  step4: StepDetail; // Bước 4: Kết luận, nhận định
  nlsFocus?: string; // Điểm nhấn Năng lực số
  aiFocus?: string;  // Điểm nhấn Năng lực AI
}

export interface CompetencyMatrixItem {
  id?: string;
  activityIndex?: number;
  activityName?: string; // Tên hoạt động (ví dụ: Hoạt động 1: Mở đầu, Hoạt động 2: Hình thành kiến thức mới...)
  teachingOrganization?: string; // Tổ chức dạy học (Tóm tắt nhiệm vụ học tập, thao tác của GV và HS)
  indicatorCode?: string; // Mã chỉ báo chuẩn theo Công văn 3456 & TT 02/2025 (ví dụ: 1.1.TC1a, 3.1.NC1a, 5.2.CB2a...)
  competencyDescription?: string; // Mô tả biểu hiện năng lực số / AI tương ứng
  domain?: string; // Miền năng lực (NLS hoặc AI)
  component?: string; // Năng lực thành phần / Tiêu chí
  indicator?: string; // Chỉ số hành vi / Yêu cầu cần đạt
  activityRef?: string; // Thể hiện trong Hoạt động số mấy
  digitalToolUsed?: string; // Công cụ số / AI hỗ trợ (ví dụ: GeoGebra, Padlet, Canva, ChatGPT)
}

export interface PreschoolPreparationData {
  teacherEnvironment: string[];
  teacherTools: string[];
  studentCostume: string[];
  studentTools: string[];
  studentPsychology: string[];
  parentCollaboration: string[];
}

export interface LessonPlanOutput {
  schoolName: string;
  teacherName: string;
  lessonTitle: string;
  subject: string;
  grade: string;
  bookSeries: string;
  volume?: string;
  periods: number;
  mainTheme?: string; // Chủ đề lớn
  subTheme?: string; // Chủ đề nhánh / nhỏ
  classSize?: string; // Số lượng trẻ
  duration?: string; // Thời gian thực hiện (ví dụ: 30 - 35 phút)
  
  // I. MỤC TIÊU
  objectives: {
    knowledge: string[]; // 1. Về kiến thức
    generalCompetencies: string[]; // 2.1. Năng lực chung (Tự chủ, Giao tiếp, Sáng tạo)
    subjectCompetencies: string[]; // 2.2. Năng lực đặc thù môn học
    digitalCompetencies: string[]; // 2.3. Năng lực số (NLS)
    aiCompetencies: string[]; // 2.4. Năng lực AI
    stemCompetencies?: string[]; // 2.5. Năng lực giáo dục STEM
    qualities: string[]; // 3. Về phẩm chất (Yêu nước, Chăm chỉ, Trung thực, Trách nhiệm...)
  };

  // II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU / CHUẨN BỊ
  equipment: {
    teacher: string[];
    student: string[];
    digitalAssets: string[]; // Học liệu số, phần mềm, công cụ AI
    stemMaterials?: string[]; // Vật liệu, dụng cụ thực hành STEM
    parentCollaboration?: string[]; // 3. Phối hợp với phụ huynh
    preschoolPreparation?: PreschoolPreparationData; // Chuẩn hóa 3 mục chuẩn mầm non
  };

  // CHỦ ĐỀ & NỘI DUNG GIÁO DỤC STEM TÍCH HỢP (Nếu có)
  stemIntegration?: {
    topicTitle: string; // Tên chủ đề STEM (ví dụ: Thiết kế hệ thống lọc nước đơn giản)
    stemGoals?: string[]; // Mục tiêu tích hợp S-T-E-M
    stemMaterials?: string[]; // Thiết bị và vật liệu STEM
    stemProcess?: string[]; // Tiến trình thiết kế kỹ thuật / trải nghiệm STEM
    expectedProduct?: string; // Sản phẩm STEM kỳ vọng
    evaluationCriteria?: string; // Tiêu chí nghiệm thu / đánh giá sản phẩm STEM
  };

  // III. TIẾN TRÌNH DẠY HỌC (4 hoạt động theo CV 5512)
  activities: ActivityDetail[];

  // IV. BẢNG PHÂN TÍCH MA TRẬN NLS & AI
  competencyMatrix: {
    nlsItems: CompetencyMatrixItem[];
    aiItems: CompetencyMatrixItem[];
  };

  // V. HỒ SƠ DẠY HỌC & PHỤ LỤC
  appendix: {
    worksheetContent?: string; // Phiếu học tập số
    assignmentPrompt?: string; // Hướng dẫn tự học / nhiệm vụ về nhà
  };

  rawMarkdown?: string;
  imageSlotsUsed: ImageSlot[];
  generatedAt: string;
  tableLayout?: TableLayoutType;
  mathFormulaFormat?: MathFormulaFormatType;
}

export type UserRole = 'teacher' | 'admin';

export interface TextbookSample {
  id: string;
  title: string;
  subject: string;
  grade: string;
  bookSeries: BookSeries;
  chapter: string;
  suggestedActivities: string[];
  pdfAvailable: boolean;
  sampleSummary: string;
  lessons?: string[]; // Pre-extracted lesson titles from 10 first pages (scanned once)
}

export interface CustomUploadedBook {
  id: string;
  title: string;
  grade: string;
  subject: string;
  bookSeries: string;
  volume?: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  pdfDataUrl?: string;
  summary: string;
  lessons: string[]; // List of lessons permanently saved in Firebase
}

export interface CustomUploadedPPCT {
  id: string;
  title: string;
  subject: string;
  grade: string;
  volume?: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  summary: string;
  // A mapping of lesson title to its PPCT config
  lessonConfigs: {
    lessonTitle: string;
    periods: number;
    periodDetail?: string;
    ppctOrder?: string;
    week?: string;
    equipment?: string;
    location?: string;
    integratedNLS?: string[];
    integratedAI?: string[];
    hasStemIntegration?: boolean;
    stemTopic?: string;
  }[];
}
