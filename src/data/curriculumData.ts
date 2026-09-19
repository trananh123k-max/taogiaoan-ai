import { NLSDomainOption, AIDomainOption, TextbookSample, BookSeries, LessonPlanOutput } from '../types';


export const TIEU_HOC_SUBJECTS_LIST = [
  'Tiếng Việt',
  'Toán',
  'Đạo đức',
  'Tự nhiên và xã hội',
  'Khoa học',
  'Lịch sử và Địa lí',
  'Tiếng Anh',
  'Tin học',
  'Công nghệ',
  'Giáo dục thể chất',
  'Nghệ thuật (Âm nhạc, Mĩ thuật)',
  'Hoạt động trải nghiệm',
];

export const THCS_SUBJECTS_LIST = [
  'Ngữ văn',
  'Toán',
  'Tiếng Anh',
  'Giáo dục công dân',
  'Lịch sử và Địa lí',
  'Khoa học tự nhiên (KHTN)',
  'Công nghệ',
  'Tin học',
  'Giáo dục thể chất',
  'Nghệ thuật (Âm nhạc, Mĩ thuật)',
  'Hoạt động trải nghiệm, hướng nghiệp (HĐTN-HN)',
];

export const THPT_SUBJECTS_LIST = [
  'Ngữ văn',
  'Toán',
  'Tiếng Anh',
  'Lịch sử',
  'Địa lí',
  'Giáo dục kinh tế và pháp luật (GDKT&PL)',
  'Vật lí',
  'Hóa học',
  'Sinh học',
  'Công nghệ',
  'Tin học',
  'Giáo dục thể chất',
  'Giáo dục Quốc phòng và An ninh',
  'Nghệ thuật (Âm nhạc, Mĩ thuật)',
  'Hoạt động trải nghiệm, hướng nghiệp (HĐTN-HN)',
];

export const SUBJECTS_LIST = Array.from(new Set([
  ...TIEU_HOC_SUBJECTS_LIST,
  ...THCS_SUBJECTS_LIST,
  ...THPT_SUBJECTS_LIST,
  'KHTN (Khoa học tự nhiên)',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Lịch sử & Địa lý',
]));

export const MAM_NON_NEW_ACTIVITIES = [
  'HOẠT ĐỘNG VUI CHƠI TRONG LỚP',
  'HOẠT ĐỘNG NGOÀI TRỜI',
  'TRÒ CHƠI VẬN ĐỘNG',
  'HOẠT ĐỘNG GIÁO DỤC KỸ NĂNG',
  'TRÒ CHƠI DÂN GIAN',
  'HOẠT ĐỘNG TĂNG CƯỜNG TIẾNG VIỆT',
  'HOẠT ĐỘNG TẬP TÔ CHỮ CÁI',
  'HOẠT ĐỘNG TRÒ CHƠI CHỮ CÁI'
];

export const MAM_NON_SUBJECTS_LIST = [
  'GIÁO ÁN VĂN HỌC (THƠ)',
  'GIÁO ÁN VĂN HỌC (TRUYỆN)',
  'NGÔN NGỮ (CHỮ CÁI)',
  'KHÁM PHÁ KHOA HỌC',
  'PHÁT TRIỂN NHẬN THỨC (TOÁN)',
  'GIÁO ÁN TẠO HÌNH',
  'GIÁO ÁN ÂM NHẠC (Dạy hát)',
  'GIÁO ÁN ÂM NHẠC (Nghe hát)',
  'GIÁO ÁN ÂM NHẠC (Hát vận động)',
  'GIÁO ÁN TÌNH CẢM - XÃ HỘI',
  'Lĩnh vực Phát triển thể chất',
  ...MAM_NON_NEW_ACTIVITIES
];

export const GRADES_BY_LEVEL = {
  'Tiểu học': ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5'],
  'THCS': ['Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9'],
  'THPT': ['Lớp 10', 'Lớp 11', 'Lớp 12'],
};

export const BOOK_SERIES_LIST: BookSeries[] = [
  'Kết nối tri thức với cuộc sống',
];

export const NLS_DOMAINS: NLSDomainOption[] = [
  {
    id: 'nls_data_info',
    name: '1. Khai thác dữ liệu và thông tin',
    description: '1.1 Duyệt, tìm kiếm & lọc dữ liệu; 1.2 Đánh giá dữ liệu, thông tin và nội dung số; 1.3 Quản lý dữ liệu, thông tin và nội dung số.',
    icon: 'Database',
  },
  {
    id: 'nls_communication',
    name: '2. Giao tiếp và hợp tác',
    description: '2.1 Tương tác số; 2.2 Chia sẻ thông tin; 2.3 Trách nhiệm công dân số; 2.4 Hợp tác số; 2.5 Quy tắc ứng xử mạng (Netiquette); 2.6 Quản lý danh tính số.',
    icon: 'Users',
  },
  {
    id: 'nls_creation',
    name: '3. Sáng tạo nội dung số',
    description: '3.1 Phát triển nội dung số; 3.2 Tích hợp & tái tạo nội dung số; 3.3 Bản quyền & giấy phép số; 3.4 Lập trình & tư duy thuật toán.',
    icon: 'Sparkles',
  },
  {
    id: 'nls_safety',
    name: '4. An toàn',
    description: '4.1 Bảo vệ thiết bị & nội dung; 4.2 Bảo vệ dữ liệu cá nhân & quyền riêng tư; 4.3 Bảo vệ sức khỏe & an sinh số; 4.4 Bảo vệ môi trường.',
    icon: 'ShieldCheck',
  },
  {
    id: 'nls_problem_solving',
    name: '5. Giải quyết vấn đề',
    description: '5.1 Xử lý sự cố kỹ thuật; 5.2 Xác định nhu cầu & giải pháp công nghệ; 5.3 Sử dụng sáng tạo công nghệ số; 5.4 Xác định khoảng cách NLS.',
    icon: 'Wrench',
  },
  {
    id: 'nls_ai',
    name: '6. Ứng dụng trí tuệ nhân tạo (AI)',
    description: '6.1 Hiểu biết về AI (Gen AI); 6.2 Sử dụng AI có đạo đức và trách nhiệm; 6.3 Đánh giá các hệ thống & công cụ AI.',
    icon: 'Brain',
  },
];

export const AI_DOMAINS: AIDomainOption[] = [
  {
    id: 'ai_human_centered',
    name: 'Mạch A (NLa). Tư duy lấy con người làm trung tâm',
    description: 'A1. Tính chủ động của con người; A2. AI vì sự tiến bộ của con người; A3. Công dân trong kỉ nguyên AI (Quyền kiểm soát, vai trò con người).',
    icon: 'Brain',
  },
  {
    id: 'ai_ethics',
    name: 'Mạch B (NLb). Đạo đức AI & Trách nhiệm xã hội',
    description: 'B1. Các khía cạnh đạo đức của AI; B2. Sử dụng AI an toàn và có trách nhiệm; B3. Nguyên tắc đạo đức & trách nhiệm giải trình.',
    icon: 'ShieldCheck',
  },
  {
    id: 'ai_techniques_apps',
    name: 'Mạch C (NLc). Các kĩ thuật và ứng dụng AI',
    description: 'C1. Đặc điểm chính của AI; C2. Ứng dụng AI trong học tập; C3. Công nghệ AI (Prompting, GenAI); C4. Dữ liệu trong AI; C5. Kĩ thuật & thuật toán.',
    icon: 'Terminal',
  },
  {
    id: 'ai_system_design',
    name: 'Mạch D (NLd). Thiết kế hệ thống AI & Tác nhân AI',
    description: 'D1. Nhận diện và hình thành giải pháp AI; D2. Cấu trúc, tương tác, cải tiến hệ thống và tác nhân AI (AI Agent).',
    icon: 'Cpu',
  },
];

export const SAMPLE_TEXTBOOKS: TextbookSample[] = [
  {
    id: 'sgk_toan_10_kntt',
    title: 'Toán 10 - Tập 1 (Kết nối tri thức)',
    subject: 'Toán học',
    grade: 'Lớp 10',
    bookSeries: 'Kết nối tri thức với cuộc sống',
    chapter: 'Chương 3: Hàm số bậc hai và đồ thị',
    suggestedActivities: [
      'Khám phá quỹ đạo chuyển động ném parabol trong thực tế',
      'Sử dụng phần mềm GeoGebra khảo sát sự biến thiên của hàm bậc hai',
      'Thiết kế bài toán tối ưu hóa diện tích sân vườn bằng GeoGebra & Excel',
    ],
    pdfAvailable: true,
    sampleSummary: 'Gồm định nghĩa hàm số bậc hai y = ax² + bx + c, tọa độ đỉnh, trục đối xứng, bảng biến thiên và đồ thị hình parabol.',
  },
  {
    id: 'sgk_tin_11_kntt',
    title: 'Tin học 11 - Định hướng Tin học ứng dụng (Kết nối tri thức)',
    subject: 'Tin học',
    grade: 'Lớp 11',
    bookSeries: 'Kết nối tri thức với cuộc sống',
    chapter: 'Chủ đề 5: Trí tuệ Nhân tạo và Ứng dụng trong Đời sống',
    suggestedActivities: [
      'Trải nghiệm phân loại ảnh với Teachable Machine của Google',
      'Thảo luận về tác động của AI tạo sinh đối với các ngành nghề tương lai',
      'Thực hành viết Prompting có cấu trúc để giải quyết bài toán tra cứu',
    ],
    pdfAvailable: true,
    sampleSummary: 'Khái niệm Trí tuệ Nhân tạo (AI), học máy (Machine Learning), các ứng dụng xử lý ngôn ngữ tự nhiên, thị giác máy tính và đạo đức AI.',
  },
  {
    id: 'sgk_khtn_8_kntt',
    title: 'Khoa học tự nhiên 8 (Kết nối tri thức)',
    subject: 'KHTN (Khoa học tự nhiên)',
    grade: 'Lớp 8',
    bookSeries: 'Kết nối tri thức với cuộc sống',
    chapter: 'Chương 2: Khúc xạ ánh sáng và hiện tượng phản xạ toàn phần',
    suggestedActivities: [
      'Thí nghiệm ảo hiện tượng khúc xạ ánh sáng với PhET Interactive Simulations',
      'Ghi chép số liệu đo góc tới và góc khúc xạ vào bảng tính Google Sheets',
      'Học sinh dùng AI tạo sinh để minh họa sơ đồ tia sáng qua lăng kính',
    ],
    pdfAvailable: true,
    sampleSummary: 'Định luật khúc xạ ánh sáng, chiết suất môi trường, hiện tượng phản xạ toàn phần và ứng dụng cáp quang.',
  },
  {
    id: 'sgk_van_10_kntt',
    title: 'Ngữ văn 10 - Tập 2 (Kết nối tri thức)',
    subject: 'Ngữ văn',
    grade: 'Lớp 10',
    bookSeries: 'Kết nối tri thức với cuộc sống',
    chapter: 'Bài 6: Thuyết trình và thảo luận về một vấn đề xã hội',
    suggestedActivities: [
      'Thu thập tư liệu và kiểm chứng nguồn tin trên không gian mạng',
      'Thiết kế Infographic bài thuyết trình bằng Canva / Genially',
      'Sử dụng AI phản biện để chuẩn bị các câu hỏi chất vấn giả định',
    ],
    pdfAvailable: true,
    sampleSummary: 'Quy trình chuẩn bị bài thuyết trình, cách lập dàn ý, nghệ thuật tương tác với người nghe và tiêu chí đánh giá bài nói.',
  },
  {
    id: 'sgk_lichsu_11_kntt',
    title: 'Lịch sử 11 (Kết nối tri thức)',
    subject: 'Lịch sử',
    grade: 'Lớp 11',
    bookSeries: 'Kết nối tri thức với cuộc sống',
    chapter: 'Chủ đề 2: Cách mạng công nghiệp thời kì cận - hiện đại',
    suggestedActivities: [
      'Xây dựng dòng thời gian tương tác (TimelineJS) các cuộc CMCN 1.0 đến 4.0',
      'Phân tích sự thay đổi cơ cấu lao động khi AI và tự động hóa xuất hiện',
      'Tranh biện: Trí tuệ nhân tạo - cơ hội hay thách thức đối với việc làm',
    ],
    pdfAvailable: true,
    sampleSummary: 'Tìm hiểu bối cảnh, thành tựu và tác động kinh tế - xã hội sâu rộng của các cuộc cách mạng công nghiệp.',
  },
  {
    id: 'sgk_hoa_10_kntt',
    title: 'Hóa học 10 (Kết nối tri thức)',
    subject: 'Hóa học',
    grade: 'Lớp 10',
    bookSeries: 'Kết nối tri thức với cuộc sống',
    chapter: 'Chương 3: Liên kết hóa học và cấu trúc phân tử',
    suggestedActivities: [
      'Mô phỏng 3D cấu trúc liên kết cộng hóa trị với phần mềm MolView / PhET',
      'Sử dụng AI tạo mô hình trực quan phân tử phân cực và không phân cực',
      'Thảo luận quy tắc octet và độ âm điện trong liên kết hóa học',
    ],
    pdfAvailable: true,
    sampleSummary: 'Liên kết ion, liên kết cộng hóa trị, liên kết hydrogen và tương tác van der Waals theo định hướng phát triển năng lực.',
  },
];

/**
 * Standard Verified Table of Contents for KNTT textbooks
 * Ensures 100% full lesson coverage even if scanned file has low OCR quality
 */
import { VERIFIED_KNTT_CURRICULUM, getVerifiedLessons, getAvailableVolumesForSubjectGrade, standardSubjectMap } from './verifiedCurriculumList';
export { VERIFIED_KNTT_CURRICULUM, getVerifiedLessons, getAvailableVolumesForSubjectGrade, standardSubjectMap };

export const DEMO_PRELOADED_LESSON_PLAN: LessonPlanOutput = {
  schoolName: '',
  teacherName: '',
  lessonTitle: 'BÀI 15: HÀM SỐ BẬC HAI VÀ ỨNG DỤNG THỰC TIỄN',
  subject: 'Toán học',
  grade: 'Lớp 10',
  bookSeries: 'Kết nối tri thức với cuộc sống',
  periods: 2,
  generatedAt: new Date().toISOString(),
  imageSlotsUsed: [
    {
      id: 'img_slot_1',
      slotTag: '{{IMAGE_SLOT_1}}',
      name: 'Đồ thị Parabol cầu Trường Tiền và Cổng vòm St. Louis',
      mimeType: 'image/svg+xml',
      base64Data: '',
      originalIndex: 1,
      caption: 'Hình 1: Mô hình Parabol trong công trình kiến trúc thực tế'
    },
    {
      id: 'img_slot_2',
      slotTag: '{{IMAGE_SLOT_2}}',
      name: 'Giao diện khảo sát đồ thị hàm số GeoGebra',
      mimeType: 'image/svg+xml',
      base64Data: '',
      originalIndex: 2,
      caption: 'Hình 2: Trực quan hóa tọa độ đỉnh và trục đối xứng trên GeoGebra'
    }
  ],
  objectives: {
    knowledge: [
      'Thiết lập và nhận biết được dạng tổng quát của hàm số bậc hai y = ax² + bx + c (a ≠ 0).',
      'Xác định chính xác tọa độ đỉnh I(-b/2a; -Δ/4a), trục đối xứng x = -b/2a, khoảng đồng biến và nghịch biến.',
      'Vẽ thành thạo đồ thị hàm số bậc hai dạng Parabol và giải quyết các bài toán cực trị trong thực tiễn (tối ưu hóa lợi nhuận, quỹ đạo chuyển động).'
    ],
    generalCompetencies: [
      'Năng lực tự chủ và tự học: Tự giác nghiên cứu học liệu số trên hệ thống LMS, hoàn thành phiếu học tập cá nhân.',
      'Năng lực giao tiếp và hợp tác: Tương tác, thảo luận nhóm hiệu quả trên bảng tương tác số Padlet.',
      'Năng lực giải quyết vấn đề và sáng tạo: Sử dụng mô hình toán học giải quyết bài toán thực tế.'
    ],
    subjectCompetencies: [
      'Năng lực tư duy và lập luận toán học: Phân tích sự phụ thuộc của hình dạng parabol vào hệ số a.',
      'Năng lực mô hình hóa toán học: Chuyển đổi bài toán tối ưu thực tế thành bài toán tìm giá trị lớn nhất của tam thức bậc hai.',
      'Năng lực sử dụng công cụ, phương tiện học toán: Sử dụng phần mềm vẽ đồ thị GeoGebra để kiểm chứng giả thuyết.'
    ],
    digitalCompetencies: [
      '1.1.NC1b: Áp dụng được kỹ thuật tìm kiếm để lấy được dữ liệu, thông tin và hình ảnh công trình thực tế có dạng parabol trong môi trường số.',
      '3.1.NC1a: Áp dụng được các cách tạo và chỉnh sửa nội dung ở các định dạng khác nhau (vẽ và khảo sát hàm số bậc hai trên GeoGebra, slide trình chiếu).',
      '5.2.NC1b: Áp dụng được các công cụ số và các giải pháp công nghệ để giải quyết bài toán tối ưu hóa hình học trong thực tiễn.'
    ],
    aiCompetencies: [
      '10.C3.1 & 10.C3.2: Biết mô tả yêu cầu và thực hành đặt prompt phù hợp với mục tiêu cụ thể để hỗ trợ tìm hiểu ứng dụng thực tiễn của Parabol.',
      '10.A1.2 & 10.B2.1: Nhận thức vai trò kiểm soát của con người đối với kết quả do AI cung cấp; tuân thủ quy định và đạo đức khi khai thác AI trong học tập.'
    ],
    qualities: [
      'Chăm chỉ: Tích cực tương tác với các công cụ học tập số và hoàn thành bài tập rèn luyện.',
      'Trung thực: Khách quan trong việc báo cáo số liệu và trích dẫn nguồn khi tra cứu dữ liệu số/AI.',
      'Trách nhiệm: Có ý thức bảo vệ tài khoản số và tôn trọng quy định phòng máy tính.'
    ]
  },
  equipment: {
    teacher: [
      'Máy chiếu, màn hình tương tác thông minh, máy tính giáo viên kết nối Internet tốc độ cao.',
      'Hệ thống LMS lớp học, bảng Padlet thảo luận, tài khoản GeoGebra Classroom.',
      'Học liệu số: File mô phỏng động GeoGebra Parabol, bộ slide bài giảng số hóa.'
    ],
    student: [
      'Máy tính bảng/Laptop hoặc điện thoại thông minh kết nối mạng (1 thiết bị/nhóm 4 HS).',
      'Tài khoản đăng nhập GeoGebra và Padlet của lớp học.',
      'Sách giáo khoa Toán 10 (Kết nối tri thức), vở ghi và thước kẻ parabol.'
    ],
    digitalAssets: [
      'Phần mềm hình học động GeoGebra (https://www.geogebra.org/classic)',
      'Bảng tương tác Padlet thu thập sản phẩm nhóm (https://padlet.com)',
      'Bộ câu hỏi trắc nghiệm tương tác Quizizz củng cố kiến thức'
    ]
  },
  activities: [
    {
      id: 'act_1',
      index: 1,
      name: 'Hoạt động 1: Khởi động (Tiết 1)',
      duration: '',
      objective: 'Tạo hứng thú học tập thông qua hình ảnh thực tế về đường cong Parabol, kích thích nhu cầu mô hình hóa toán học đường cong này bằng hàm số.',
      content: 'Quan sát hình ảnh Cổng vòm St. Louis và Cầu Trường Tiền, phân tích hình dạng đường cong và dự đoán quy luật toán học biểu diễn đường cong đó.',
      productSummary: 'Câu trả lời của học sinh trên Padlet và nhận xét về hình dạng đối xứng của đường cong Parabol.',
      nlsFocus: 'Sử dụng Padlet để gửi hình ảnh và bình luận ý kiến theo thời gian thực.',
      aiFocus: 'Đặt câu hỏi cho AI về phương trình đường cong nổi tiếng trong kiến trúc thế giới.',
      step1: {
        title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
        teacherAction: '- Giáo viên chiếu {{IMAGE_SLOT_1}} lên màn hình tương tác, giới thiệu về các công trình kiến trúc có dạng parabol nổi tiếng thế giới.\n- GV giao nhiệm vụ qua mã QR Padlet: "Hãy quan sát hình ảnh và cho biết đường cong này có đặc điểm đối xứng như thế nào? Trong đời sống em còn gặp hình ảnh này ở đâu?"\n- GV yêu cầu các nhóm quét mã QR và đăng tải câu trả lời trong vòng 3 phút.',
        studentAction: '- Học sinh ổn định vị trí, đại diện các nhóm dùng máy tính bảng quét mã QR truy cập Padlet.\n- Quan sát {{IMAGE_SLOT_1}} trên màn hình và máy cá nhân, thảo luận nhanh trong nhóm 4 người.\n- Soạn thảo và đăng 2-3 nhận xét về tính chất đối xứng, điểm cao nhất của đường cong lên Padlet.\n\n[Tích hợp NLS]\nHS sử dụng thiết bị số quét mã QR và đăng tải ý kiến trên bảng tương tác Padlet (NLS 1.1.NC1b).',
        productExpected: 'Nội dung phản hồi của 6 nhóm hiển thị trên Padlet: Nhận biết được đường cong có trục đối xứng thẳng đứng, có đỉnh cao nhất (hoặc thấp nhất), có dạng Parabol đã học ở lớp 9.',
        digitalOrAiTool: 'Màn hình tương tác, Bảng Padlet số, Mã QR Code chuyển giao nhiệm vụ.'
      },
      step2: {
        title: 'Bước 2: Thực hiện nhiệm vụ học tập',
        teacherAction: '- GV quan sát tiến độ phản hồi của các nhóm trên màn hình điều khiển Padlet.\n- Hỗ trợ các nhóm gặp khó khăn về kết nối mạng hoặc thao tác tải ảnh minh họa.\n- Lựa chọn 2 phản hồi tiêu biểu (1 câu trả lời đầy đủ, 1 câu trả lời còn thiếu sót) để chuẩn bị thảo luận.',
        studentAction: '- Các thành viên nhóm phân công nhiệm vụ: 1 bạn tổng hợp ý kiến, 1 bạn gõ câu trả lời, 1 bạn tìm thêm ảnh thực tế.\n- Thống nhất câu trả lời và bấm gửi bài lên cột nhóm trên Padlet.',
        productExpected: 'Bài đăng hoàn chỉnh của 100% các nhóm trên Padlet có kèm tên thành viên.',
        digitalOrAiTool: 'Padlet Collaborative Board'
      },
      step3: {
        title: 'Bước 3: Báo cáo kết quả và thảo luận',
        teacherAction: '- GV trình chiếu giao diện Padlet lên màn hình lớn.\n- Mời đại diện Nhóm 1 và Nhóm 3 trình bày ngắn gọn nhận định của nhóm trong 1 phút.\n- Khơi gợi câu hỏi mở: "Ở lớp 9 chúng ta đã học hàm số y = ax² (a ≠ 0). Nếu đỉnh của parabol không nằm ở gốc tọa độ O(0;0) mà dịch chuyển thì hàm số có dạng như thế nào?"\n- Yêu cầu các nhóm khác thả tim và nhận xét chéo trên Padlet.',
        studentAction: '- Đại diện Nhóm 1 đứng tại chỗ thuyết trình về tính đối xứng qua trục và bề lõm của cổng vòm.\n- Các nhóm khác lắng nghe, bổ sung ý kiến về độ dốc và độ mở của đường cong.\n- Dự đoán dạng hàm số mở rộng: y = ax² + bx + c.',
        productExpected: 'Ý kiến thảo luận sôi nổi của học sinh; dự đoán bước đầu về dạng tổng quát của hàm số bậc hai.',
        digitalOrAiTool: 'Padlet Live React & Comment'
      },
      step4: {
        title: 'Bước 4: Kết luận, nhận định',
        teacherAction: '- GV tổng kết, chính xác hóa câu trả lời của các nhóm: "Đường cong của cổng vòm là hình ảnh trực quan của đồ thị hàm số bậc hai tổng quát y = ax² + bx + c với a ≠ 0."\n- Đánh giá tinh thần hợp tác số và tốc độ hoàn thành của các nhóm trên Padlet.\n- Dẫn dắt vào bài mới: "Hôm nay chúng ta sẽ cùng khám phá công thức, tính chất biến thiên và cách vẽ đồ thị hàm số bậc hai, đồng thời ứng dụng phần mềm GeoGebra để kiểm chứng và giải quyết bài toán tối ưu."',
        studentAction: '- HS lắng nghe nhận xét của GV, ghi tựa bài vào vở: "Bài 15: Hàm số bậc hai và ứng dụng thực tiễn".\n- Mở sẵn link GeoGebra do GV gửi qua kênh học tập để chuẩn bị cho Hoạt động 2.',
        productExpected: 'Học sinh ghi chép đầy đủ tên bài học và xác định rõ mục tiêu cần đạt của tiết học.',
        digitalOrAiTool: 'Slide trình chiếu hệ thống hóa kiến thức'
      }
    },
    {
      id: 'act_2',
      index: 2,
      name: 'Hoạt động 2: Hình thành kiến thức mới (Mục 1, 2: Tiết 1; Mục 3: Tiết 2)',
      duration: '',
      objective: 'Học sinh nắm vững định nghĩa hàm số bậc hai, tọa độ đỉnh I(-b/2a; -Δ/4a), trục đối xứng x = -b/2a, sự biến thiên theo dấu của hệ số a; thành thạo thao tác thay đổi tham số a, b, c trên GeoGebra.',
      content: 'Mục 1 & 2 (Tiết 1): Định nghĩa hàm số bậc hai, tọa độ đỉnh và trục đối xứng qua GeoGebra. Mục 3 (Tiết 2): Bảng biến thiên và các bước vẽ đồ thị hàm số bậc hai.',
      productSummary: 'Bảng ghi chép tính chất hàm số bậc hai trong vở và file mô phỏng GeoGebra của từng nhóm.',
      nlsFocus: '3.1.NC1a: Sử dụng thanh trượt (slider) trên GeoGebra để trực quan hóa sự biến thiên và rút ra kết luận khoa học.',
      aiFocus: '6.2.NC1a: Dùng prompt mẫu để AI giải thích trực quan ý nghĩa hình học của đại lượng biệt thức Delta (Δ).',
      step1: {
        title: '* GV giao nhiệm vụ học tập',
        teacherAction: '- Nhiệm vụ 1 (Tìm hiểu mục 1. Khái niệm hàm số bậc hai):\n  + GV yêu cầu HS đọc SGK mục 1 và quan sát ví dụ thực tế về quỹ đạo cổng vòm.\n  + Đặt câu hỏi: "Nêu dạng tổng quát của hàm số bậc hai và điều kiện của các hệ số?"\n- Nhiệm vụ 2 (Tìm hiểu mục 2. Tọa độ đỉnh và trục đối xứng qua GeoGebra):\n  + GV chiếu {{IMAGE_SLOT_2}} và cung cấp link file GeoGebra mẫu "Khao_sat_Parabol.ggb".\n  + Yêu cầu HS kéo slider a, b, c và ghi lại tọa độ đỉnh I, trục đối xứng.\n- Nhiệm vụ 3 (Tìm hiểu mục 3. Bảng biến thiên và cách vẽ đồ thị):\n  + Yêu cầu các nhóm hoàn thành Phiếu học tập số 1 về chiều biến thiên khi a > 0 và a < 0.',
        studentAction: '- Nhiệm vụ 1: HS đọc thầm SGK mục 1, thảo luận cặp đôi để xác định công thức và điều kiện a ≠ 0.\n- Nhiệm vụ 2: Mở GeoGebra trên thiết bị cá nhân theo {{IMAGE_SLOT_2}}, tương tác kéo thanh trượt khảo sát điểm I.\n- Nhiệm vụ 3: Thảo luận nhóm 4 người, phân tích đồ thị đi lên/đi xuống để lập bảng biến thiên.',
        productExpected: '1. Khái niệm hàm số bậc hai\n- Hàm số bậc hai là hàm số được cho bởi công thức y = ax² + bx + c, trong đó x là biến số, a, b, c là các hằng số và a ≠ 0.\n- Tập xác định của hàm số bậc hai là D = R.\n\n2. Tọa độ đỉnh và trục đối xứng của Parabol\n- Đồ thị của hàm số bậc hai y = ax² + bx + c (a ≠ 0) là một đường parabol (P).\n- Tọa độ đỉnh: I(-b/2a; -Δ/4a) với Δ = b² - 4ac.\n- Trục đối xứng: đường thẳng x = -b/2a (song song hoặc trùng với Oy).\n- Hướng bề lõm: quay lên trên khi a > 0; quay xuống dưới khi a < 0.\n\n3. Chiều biến thiên và cách vẽ đồ thị\n- Chiều biến thiên:\n  + Khi a > 0: Hàm số nghịch biến trên (-∞; -b/2a) và đồng biến trên (-b/2a; +∞).\n  + Khi a < 0: Hàm số đồng biến trên (-∞; -b/2a) và nghịch biến trên (-b/2a; +∞).\n- Các bước vẽ đồ thị:\n  + Xác định tọa độ đỉnh I(-b/2a; -Δ/4a).\n  + Vẽ trục đối xứng x = -b/2a.\n  + Xác định giao điểm với trục tung (0; c) và trục hoành (nếu có), lấy thêm 2 điểm đối xứng.\n  + Vẽ đường cong parabol đi qua các điểm.',
        digitalOrAiTool: 'Phần mềm GeoGebra Dynamic Mathematics, Phiếu học tập số trực tuyến'
      },
      step2: {
        title: '* HS thực hiện nhiệm vụ',
        teacherAction: '- Theo dõi các nhóm thao tác trên GeoGebra, hỗ trợ kỹ thuật và giải đáp thắc mắc.\n- Gợi ý HS sử dụng Trợ lý AI với prompt: "Giải thích tại sao hoành độ đỉnh parabol luôn là x = -b/2a theo tính đối xứng?"',
        studentAction: '- Nhiệm vụ 1: HS ghi nhận dạng tổng quát của hàm số bậc hai.\n- Nhiệm vụ 2: Thao tác slider trên GeoGebra, kiểm tra tọa độ đỉnh I(-b/2a; -Δ/4a).\n- Nhiệm vụ 3: Điền đầy đủ thông tin vào bảng biến thiên trong Phiếu học tập số 1.\n\n[Tích hợp NLS]\nHS sử dụng phần mềm GeoGebra thao tác với thanh trượt trực quan hóa sự biến thiên của đồ thị parabol (NLS 3.1.NC1a).\n\n[Tích hợp AI]\nHS thực hành đặt câu lệnh Prompt cho Trợ lý AI để giải thích ý nghĩa hình học của tọa độ đỉnh Parabol (AI 6.2.NC1a).',
        productExpected: '',
        digitalOrAiTool: 'GeoGebra Dynamic Geometry & Algebra View'
      },
      step3: {
        title: '* Báo cáo, thảo luận',
        teacherAction: '- Chia sẻ quyền chiếu màn hình (Screen Sharing) cho đại diện Nhóm 2.\n- Yêu cầu Nhóm 2 trình diễn trực tiếp thao tác trên GeoGebra và trình bày kết luận về tọa độ đỉnh và chiều biến thiên.\n- Mời các nhóm khác nhận xét, đặt câu hỏi phản biện.',
        studentAction: '- Đại diện Nhóm 2 chia sẻ màn hình máy tính bảng lên máy chiếu, thuyết minh về sự đổi chiều biến thiên tại điểm x = -b/2a.\n- Các nhóm khác ghi nhận, bổ sung và hoàn thiện sản phẩm học tập.',
        productExpected: '',
        digitalOrAiTool: 'Screen Mirroring / Wireless Display'
      },
      step4: {
        title: '* Kết luận, nhận định',
        teacherAction: '- GV nhận xét thái độ làm việc của các nhóm, chính xác hóa và chốt lại kiến thức trọng tâm các mục 1, 2, 3 lên bảng.\n- Nhắc nhở HS ghi chép đầy đủ nội dung kiến thức cốt lõi vào vở.',
        studentAction: '- Lắng nghe nhận xét, ghi chép toàn bộ kiến thức trọng tâm của các mục 1, 2, 3 vào vở ghi bài.',
        productExpected: '',
        digitalOrAiTool: 'Hệ thống slide số hóa, lưu trữ bài giảng đám mây'
      }
    },
    {
      id: 'act_3',
      index: 3,
      name: 'Hoạt động 3: Luyện tập (Tiết 2)',
      duration: '',
      objective: 'Củng cố kỹ năng xác định đỉnh, trục đối xứng, vẽ đồ thị hàm số bậc hai cụ thể và làm bài tập trắc nghiệm tương tác kiểm tra độ hiểu bài.',
      content: 'Giải bài tập: Khảo sát và vẽ đồ thị hàm số y = x² - 4x + 3. Tham gia mini-game trắc nghiệm Quizizz gồm 5 câu hỏi nhanh.',
      productSummary: 'Lời giải chi tiết và hình vẽ đồ thị parabol trong vở; kết quả điểm số trên bảng xếp hạng Quizizz.',
      nlsFocus: '1.1.NC1b: Học sinh quét mã tham gia bài kiểm tra đánh giá tự động Quizizz nhận phản hồi kết quả ngay lập tức.',
      aiFocus: '6.3.NC1a: So sánh hình vẽ tay trong vở với đồ thị do AI / GeoGebra vẽ để tự đánh giá độ chính xác của các điểm đặc biệt.',
      step1: {
        title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
        teacherAction: '- GV giao bài tập tự luận: "Khảo sát sự biến thiên và vẽ đồ thị hàm số (P): y = x² - 4x + 3 vào vở (thời gian: 5 phút)."\n- Đồng thời gửi mã PIN Quizizz "Luyện tập Hàm số bậc hai" lên màn hình chính cho phần thi đấu trắc nghiệm.',
        studentAction: '- HS mở vở làm bài tập vẽ đồ thị theo các bước chuẩn đã học.\n- Chuẩn bị sẵn điện thoại/máy tính bảng để nhập mã PIN Quizizz sau khi hoàn thành bài tự luận.',
        productExpected: '100% học sinh tập trung làm bài tập vào vở và sẵn sàng thiết bị thi đấu trắc nghiệm.',
        digitalOrAiTool: 'Quizizz Interactive Assessment Platform'
      },
      step2: {
        title: 'Bước 2: Thực hiện nhiệm vụ học tập',
        teacherAction: '- GV đi vòng quanh lớp, kiểm tra thao tác vẽ đồ thị của học sinh (đặc biệt là bảng giá trị 5 điểm và tính đối xứng).\n- Nhắc nhở HS giữ độ cong mượt mà ở đáy parabol, tránh vẽ thành góc nhọn chữ V.\n- Kích hoạt nút "Bắt đầu" trò chơi Quizizz khi hết 5 phút tự luận.',
        studentAction: '- HS giải tự luận: Tính đỉnh I(2; -1), trục đối xứng x = 2, giao Oy (0;3), giao Ox (1;0) và (3;0). Vẽ parabol mượt mà.\n- Tham gia làm 5 câu hỏi trắc nghiệm tốc độ trên Quizizz: nhận diện đồ thị, tìm tọa độ đỉnh, xác định khoảng đồng biến.\n\n[Tích hợp NLS]\nHS quét mã PIN tham gia làm bài kiểm tra đánh giá số tự động Quizizz và nhận phản hồi trực tiếp (NLS 1.1.NC1b).',
        productExpected: 'Bài vẽ đồ thị hoàn chỉnh trong vở và bài làm trắc nghiệm đã nộp trên hệ thống Quizizz.',
        digitalOrAiTool: 'Quizizz Live Game Mode'
      },
      step3: {
        title: 'Bước 3: Báo cáo kết quả và thảo luận',
        teacherAction: '- GV chiếu bảng thống kê câu hỏi sai nhiều nhất trên Quizizz (ví dụ: Câu 4 về xác định dấu của hệ số b khi biết tọa độ đỉnh).\n- Mời học sinh có điểm số cao nhất chia sẻ bí quyết giải nhanh câu hỏi đó.\n- Chiếu bài vẽ trong vở của 1 bạn học sinh qua camera thu hình trực tiếp.',
        studentAction: '- Cả lớp theo dõi bảng xếp hạng Quizizz và phân tích biểu đồ thống kê câu đúng/sai.\n- Học sinh được mời giải thích cách dùng công thức x_đỉnh = -b/2a để suy ra dấu của hệ số b.\n- Cả lớp quan sát bài vẽ mẫu và tự chấm chéo theo tiêu chí GV đưa ra.',
        productExpected: 'Học sinh nhận biết được lỗi sai phổ biến và hiểu rõ phương pháp suy luận nhanh.',
        digitalOrAiTool: 'Quizizz Analytics Dashboard & Document Camera'
      },
      step4: {
        title: 'Bước 4: Kết luận, nhận định',
        teacherAction: '- GV nhận xét đánh giá chung về mức độ thành thạo của cả lớp (tỷ lệ trả lời đúng đạt trên 85%).\n- Chốt lại lưu ý quan trọng: "Khi vẽ parabol, luôn lấy ít nhất 5 điểm đối xứng nhau qua trục và vẽ đường cong trơn đều."',
        studentAction: '- Học sinh sửa chữa các sai sót trong vở ghi nếu có.',
        productExpected: 'Học sinh nắm vững kỹ năng vẽ và phân tích hàm số bậc hai.',
        digitalOrAiTool: 'Bảng tổng hợp điểm số lớp học'
      }
    },
    {
      id: 'act_4',
      index: 4,
      name: 'Hoạt động 4: Vận dụng (Tiết 2)',
      duration: '',
      objective: 'Vận dụng kiến thức hàm số bậc hai giải quyết bài toán thực tế về tối ưu hóa diện tích rào chắn vườn cây hoặc doanh thu bán hàng; ứng dụng công cụ AI để mở rộng nghiên cứu.',
      content: 'Bài toán: Một người nông dân có 40m lưới thép muốn rào một khu đất hình chữ nhật giáp bờ tường thẳng để làm vườn rau có diện tích lớn nhất. Tìm kích thước mảnh đất đó.',
      productSummary: 'Mô hình hàm số diện tích S(x) = x(40 - 2x), giá trị diện tích lớn nhất S_max = 200m² tại x = 10m; câu lệnh Prompt tương tác với AI.',
      nlsFocus: '5.2.NC1b: Lập công thức toán học và kiểm tra kết quả cực trị bằng bảng tính Google Sheets hoặc GeoGebra.',
      aiFocus: '6.2.NC1a: Soạn Prompt chuẩn gửi Trợ lý AI để tìm các ứng dụng khác của Parabol trong kỹ thuật gương cầu lõm của kính thiên văn, nhận diện và trích dẫn bản quyền thông tin.',
      step1: {
        title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
        teacherAction: '- GV trình chiếu bài toán thực tế và mô hình minh họa.\n- Giao nhiệm vụ dự án mini cho các nhóm:\n  + Nhiệm vụ 1: Gọi x (m) là chiều rộng mảnh đất (0 < x < 20). Hãy biểu diễn chiều dài và diện tích S(x) theo x.\n  + Nhiệm vụ 2: Áp dụng kiến thức hàm số bậc hai để tìm x sao cho diện tích S đạt giá trị lớn nhất.\n  + Nhiệm vụ 3 (Mở rộng AI): Hãy dùng ChatGPT/Gemini với cấu trúc Prompt: "Tôi là học sinh lớp 10, hãy giải thích ứng dụng của chảo parabol trong việc thu sóng truyền hình vệ tinh và năng lượng mặt trời".\n- Đăng tải link nộp bài tập số lên Google Classroom.',
        studentAction: '- Các nhóm tiếp nhận đề bài, vẽ sơ đồ phác thảo mảnh đất hình chữ nhật giáp bờ tường.\n- Phân tích mối quan hệ giữa chiều dài, chiều rộng và chu vi lưới thép 40m.\n- Mở Trợ lý AI để thử nghiệm prompt mở rộng theo hướng dẫn.',
        productExpected: 'Sơ đồ toán học hóa bài toán thực tế và prompt đã soạn thảo.',
        digitalOrAiTool: 'Google Classroom, Trợ lý AI Gemini/ChatGPT'
      },
      step2: {
        title: 'Bước 2: Thực hiện nhiệm vụ học tập',
        teacherAction: '- GV hướng dẫn các nhóm chuyển đổi ngôn ngữ thực tế sang ngôn ngữ toán học: Chiều rộng là x, chiều dài là 40 - 2x => Diện tích S(x) = x(40 - 2x) = -2x² + 40x.\n- Hướng dẫn HS nhận xét đây là hàm số bậc hai với a = -2 < 0 nên đạt giá trị lớn nhất tại đỉnh.',
        studentAction: '- HS tính toán: x = -b/2a = -40 / (2*(-2)) = 10 (thỏa mãn điều kiện 0 < x < 20).\n- Khi x = 10m thì chiều dài là 40 - 2*10 = 20m.\n- Diện tích lớn nhất đạt được là S_max = 10 * 20 = 200 m².\n- Đọc phản hồi của AI về nguyên lý tiêu điểm của chảo parabol thu sóng.\n\n[Tích hợp NLS]\nHS sử dụng bảng tính Google Sheets / GeoGebra để lập công thức toán học và kiểm chứng giá trị cực trị (NLS 5.2.NC1b).\n\n[Tích hợp AI]\nHS soạn thảo câu lệnh Prompt tương tác với AI Gemini/ChatGPT tìm hiểu ứng dụng thực tiễn của chảo vệ tinh parabol và trích dẫn nguồn văn minh (AI 6.2.NC1a).',
        productExpected: 'Bản báo cáo giải bài toán tối ưu hoàn chỉnh kèm trích dẫn tóm tắt câu trả lời từ AI.',
        digitalOrAiTool: 'Công cụ tính toán số học & AI Chat'
      },
      step3: {
        title: 'Bước 3: Báo cáo kết quả và thảo luận',
        teacherAction: '- GV mời 1 nhóm trình bày lời giải toán học và 1 nhóm trình bày kết quả khám phá ứng dụng parabol từ AI.\n- Đặt câu hỏi thảo luận: "Nếu bờ tường không thẳng mà là góc vuông thì bài toán tối ưu sẽ thay đổi thế nào?"',
        studentAction: '- Đại diện nhóm báo cáo kết quả: Chiều rộng 10m, chiều dài 20m, diện tích cực đại 200m².\n- Nhóm trình bày về AI chia sẻ hình ảnh chảo vệ tinh hội tụ sóng tại tiêu điểm parabol.\n- Cả lớp ghi chép bài học liên môn giữa Toán học, Vật lý và Công nghệ.',
        productExpected: 'Bài thuyết trình ngắn gọn, thể hiện tư duy mô hình hóa toán học và kỹ năng khai thác AI văn minh.',
        digitalOrAiTool: 'Slide thuyết trình nhóm'
      },
      step4: {
        title: 'Bước 4: Kết luận, nhận định & Hướng dẫn tự học',
        teacherAction: '- GV nhận xét, biểu dương tinh thần làm việc nhóm và năng lực giải quyết vấn đề của học sinh.\n- Hướng dẫn nhiệm vụ tự học và về nhà:\n  + Đối với bài vừa học: Hoàn thành bài tập 1.15 đến 1.18 (trang 15, 16 SGK Toán 10); sử dụng GeoGebra thiết kế mô hình parabol thực tế.\n  + Đối với bài học tiếp theo: Đọc trước và chuẩn bị Bài 16 "Định lí về dấu của tam thức bậc hai" (SGK Toán 10 Kết nối tri thức).',
        studentAction: '- Học sinh lưu lại nhiệm vụ về nhà trên ứng dụng ghi chú hoặc Google Classroom.\n- Đánh giá mức độ hoàn thành bài học qua phiếu tự đánh giá (Self-Assessment Form).',
        productExpected: 'Học sinh nhận nhiệm vụ về nhà rõ ràng và có kế hoạch tự học tiếp theo.',
        digitalOrAiTool: 'Google Forms khảo sát cuối giờ & Hệ thống LMS'
      }
    }
  ],
  competencyMatrix: {
    nlsItems: [
      {
        activityName: 'Hoạt động 1: Khởi động',
        teachingOrganization: 'HS quan sát hình ảnh công trình thực tế, thảo luận nhóm và đăng tải nhận xét về dạng đường cong lên bảng Padlet.',
        indicatorCode: '1.1.NC1b',
        competencyDescription: '1.1.NC1b: HS sử dụng công nghệ số để tìm kiếm, thu thập và chia sẻ hình ảnh tư liệu trong môi trường số.',
        domain: '1. Khai thác dữ liệu và thông tin',
        component: '1.1 Duyệt, tìm kiếm và lọc dữ liệu',
        indicator: '1.1.NC1b: Áp dụng được kỹ thuật tìm kiếm để lấy được dữ liệu, thông tin và hình ảnh trong môi trường số.',
        activityRef: 'Hoạt động 1',
        digitalToolUsed: 'Padlet, Google Images'
      },
      {
        activityName: 'Hoạt động 2: Hình thành kiến thức mới',
        teachingOrganization: 'HS thao tác kéo thanh trượt (slider) trên phần mềm GeoGebra để khảo sát sự biến thiên của đồ thị parabol khi thay đổi hệ số a, b, c.',
        indicatorCode: '3.1.NC1a',
        competencyDescription: '3.1.NC1a: HS áp dụng được các cách tạo và chỉnh sửa nội dung ở định dạng động (GeoGebra) để trực quan hóa kiến thức toán học.',
        domain: '3. Sáng tạo nội dung số',
        component: '3.1 Phát triển nội dung số',
        indicator: '3.1.NC1a: Áp dụng được các cách tạo và chỉnh sửa nội dung ở các định dạng khác nhau.',
        activityRef: 'Hoạt động 2',
        digitalToolUsed: 'GeoGebra Dynamic Mathematics'
      },
      {
        activityName: 'Hoạt động 3: Luyện tập',
        teachingOrganization: 'HS quét mã QR tham gia trả lời các câu hỏi trắc nghiệm tương tác trên hệ thống Quizizz và nhận phản hồi tự động.',
        indicatorCode: '1.1.NC1b',
        competencyDescription: '1.1.NC1b: HS truy cập và tương tác với bài kiểm tra đánh giá số để củng cố kiến thức.',
        domain: '1. Khai thác dữ liệu và thông tin',
        component: '1.1 Duyệt, tìm kiếm và lọc dữ liệu',
        indicator: '1.1.NC1b: Tương tác và khai thác học liệu số trên nền tảng đánh giá trực tuyến.',
        activityRef: 'Hoạt động 3',
        digitalToolUsed: 'Quizizz Interactive Platform'
      },
      {
        activityName: 'Hoạt động 4: Vận dụng',
        teachingOrganization: 'HS lập mô hình toán học giải bài toán tối ưu hóa diện tích rào chắn, sử dụng phần mềm kiểm chứng cực trị và tra cứu ứng dụng thực tế.',
        indicatorCode: '5.2.NC1b',
        competencyDescription: '5.2.NC1b: HS áp dụng công cụ số (GeoGebra/Google Sheets) để giải quyết vấn đề tối ưu hóa trong thực tiễn.',
        domain: '5. Giải quyết vấn đề',
        component: '5.2 Xác định nhu cầu và giải pháp công nghệ',
        indicator: '5.2.NC1b: Áp dụng được các công cụ số và các giải pháp công nghệ để giải quyết nhu cầu thực tiễn.',
        activityRef: 'Hoạt động 4',
        digitalToolUsed: 'GeoGebra Solver, Google Sheets'
      }
    ],
    aiItems: [
      {
        activityName: 'Hoạt động 2: Hình thành kiến thức mới',
        teachingOrganization: 'HS sử dụng câu lệnh Prompt có cấu trúc để AI giải thích ý nghĩa hình học của biệt thức Delta, sau đó đối chiếu kiến thức SGK.',
        indicatorCode: '10.C3.1',
        competencyDescription: '10.C3.1: Mô tả được các yêu cầu để đưa ra prompt phù hợp với mục tiêu học tập cụ thể.',
        domain: 'Mạch C. Các kĩ thuật và ứng dụng AI',
        component: 'Chủ đề C3. Công nghệ AI',
        indicator: '10.C3.1: Mô tả được các yêu cầu để đưa ra prompt phù hợp với mục tiêu cụ thể.',
        activityRef: 'Hoạt động 2',
        digitalToolUsed: 'Trợ lý AI Gemini / ChatGPT'
      },
      {
        activityName: 'Hoạt động 4: Vận dụng',
        teachingOrganization: 'HS thực hành đặt prompt cho AI về ứng dụng thực tế của chảo thu sóng parabol; kiểm chứng và trích dẫn thông tin minh bạch.',
        indicatorCode: '10.C3.2',
        competencyDescription: '10.C3.2 & 10.B2.1: Thực hành đặt prompt giải quyết vấn đề thực tế hiệu quả; tuân thủ tính trung thực và trách nhiệm khi sử dụng AI.',
        domain: 'Mạch C. Các kĩ thuật và ứng dụng AI',
        component: 'Chủ đề C3 & Chủ đề B2',
        indicator: '10.C3.2: Thực hành đặt prompt giải quyết một số vấn đề gần gũi trong học tập một cách hiệu quả.',
        activityRef: 'Hoạt động 4',
        digitalToolUsed: 'Trợ lý AI & Báo cáo số'
      }
    ]
  },
  appendix: {
    worksheetContent: `PHIẾU HỌC TẬP: KHÁM PHÁ HÀM SỐ BẬC HAI VÀ ỨNG DỤNG
Họ và tên: .............................................................. Lớp: 10A... Nhóm: .........

| STT | Nhiệm vụ / Câu hỏi học tập | Kết quả / Câu trả lời của học sinh |
| :---: | :--- | :--- |
| **1** | Mở file GeoGebra, kéo thanh trượt hệ số $a$:<br>- Khi $a > 0$: Bề lõm của parabol quay về phía nào?<br>- Khi $a < 0$: Bề lõm của parabol quay về phía nào? | - Khi $a > 0$: ........................................................................<br>- Khi $a < 0$: ........................................................................ |
| **2** | Xác định tọa độ đỉnh $I$ và trục đối xứng của các hàm số:<br>a) $y = x^2 - 4x + 3$<br>b) $y = -2x^2 + 4x + 1$ | a) Tọa độ đỉnh $I(......; ......)$, Trục đối xứng: $x = ......$<br>b) Tọa độ đỉnh $I(......; ......)$, Trục đối xứng: $x = ......$ |
| **3** | Nêu các khoảng đồng biến, nghịch biến và lập bảng biến thiên của hàm số $y = x^2 - 4x + 3$. | - Khoảng đồng biến: ...........................................................<br>- Khoảng nghịch biến: .........................................................<br>- Bảng biến thiên: (Học sinh vẽ vào ô trống) |
| **4** | Bài toán thực tiễn: Một người thợ dùng 40m lưới rào một mảnh vườn hình chữ nhật giáp một bức tường thẳng. Tính kích thước mảnh vườn để diện tích rào được lớn nhất. | - Gọi ẩn và lập hàm số diện tích $S(x)$: ...................................<br>- Tọa độ đỉnh và diện tích lớn nhất: ........................................ |

---

### BẢNG GỢI Ý ĐÁP ÁN & HƯỚNG DẪN ĐÁNH GIÁ (DÀNH CHO GIÁO VIÊN)

| STT | Nhiệm vụ / Câu hỏi học tập | Gợi ý đáp án / Yêu cầu cần đạt | Điểm / Đánh giá |
| :---: | :--- | :--- | :---: |
| **1** | Chiều quay bề lõm parabol | - $a > 0$: Bề lõm quay lên trên (điểm thấp nhất là đỉnh $I$).<br>- $a < 0$: Bề lõm quay xuống dưới (điểm cao nhất là đỉnh $I$). | Đạt / 2.0 đ |
| **2** | Tọa độ đỉnh và trục đối xứng | a) $I(2; -1)$, trục đối xứng $x = 2$<br>b) $I(1; 3)$, trục đối xứng $x = 1$ | Đạt / 3.0 đ |
| **3** | Sự biến thiên và bảng biến thiên | - Nghịch biến trên $(-\\infty; 2)$, đồng biến trên $(2; +\\infty)$.<br>- Bảng biến thiên đi xuống từ $+\\infty$ đến $-1$ rồi đi lên $+\\infty$. | Đạt / 2.5 đ |
| **4** | Bài toán thực tiễn tối ưu hóa | - Gọi chiều rộng là $x$ ($0 < x < 20$), chiều dài là $40 - 2x$. Diện tích $S(x) = x(40 - 2x) = -2x^2 + 40x$.<br>- $S(x)$ đạt GTLN tại $x = -b/2a = 10$ m. Chiều dài là $20$ m. Diện tích tối đa $S_{max} = 200\\text{ m}^2$. | Đạt / 2.5 đ |`,
    assignmentPrompt: `3. Hướng dẫn tự học & Nhiệm vụ về nhà
a) Bài học vừa học:
- Ôn tập cách xác định tọa độ đỉnh, trục đối xứng của parabol.
- Làm các bài tập 1, 2, 3 SGK Toán 10.
b) Bài học tiếp theo:
- Đọc trước Bài 12: Dấu của tam thức bậc hai.`
  },
};
