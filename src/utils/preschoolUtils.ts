import { PreschoolPreparationData } from '../types';

export type PreschoolDomainType = 
  | 'MUSIC' // Âm nhạc (Nghệ thuật / Thẩm mỹ)
  | 'SCIENCE' // Khám phá khoa học (Nhận thức)
  | 'SOCIAL' // Khám phá xã hội (Nhận thức / Tình cảm-xã hội)
  | 'MATH' // Làm quen với Toán (Nhận thức)
  | 'POETRY' // Thơ (Ngôn ngữ)
  | 'STORY' // Truyện (Ngôn ngữ)
  | 'LETTER' // Chữ cái (Ngôn ngữ)
  | 'ART' // Tạo hình (Nghệ thuật / Thẩm mỹ)
  | 'PHYSICAL' // Thể chất
  | 'SKILLS' // Tình cảm - Kỹ năng xã hội
  | 'PLAY_INDOOR' // Hoạt động vui chơi trong lớp
  | 'OUTDOOR' // Hoạt động ngoài trời
  | 'PHYSICAL_GAME' // Trò chơi vận động
  | 'LEARNING_GAME' // Trò chơi học tập
  | 'SKILL_EDU' // Hoạt động giáo dục kỹ năng
  | 'FOLK_GAME' // Trò chơi dân gian
  | 'VIETNAMESE_ENHANCE' // Hoạt động tăng cường tiếng Việt
  | 'LETTER_TRACING' // Hoạt động tập tô chữ cái
  | 'LETTER_GAME' // Hoạt động trò chơi chữ cái
  | 'GENERAL'; // Mầm non chung

export interface PreschoolDomainInfo {
  domainType: PreschoolDomainType;
  mainHeader: string;
  defaultDomainName: string;
  isMusic: boolean;
}

/**
 * Strips all [Tích hợp AI], [Tích hợp NLS], and related AI/NLS codes
 * from preschool lesson plans as required by kindergarten curriculum standards.
 */
export function stripPreschoolAICodes(text?: string): string {
  if (!text || typeof text !== 'string') return text || '';
  let cleaned = text;

  // 1. Remove [Tích hợp AI] and any subsequent explanation block
  cleaned = cleaned.replace(/\[\s*Tích\s*hợp\s*(?:Trí\s*tuệ\s*nhân\s*tạo|AI)\s*\][^\n]*\n?(?:-\s*)?(?:HS|Học sinh|Trẻ|Giáo viên)[^\n]*/gmi, '');
  cleaned = cleaned.replace(/\[\s*Tích\s*hợp\s*(?:Trí\s*tuệ\s*nhân\s*tạo|AI)\s*\]/gmi, '');

  // 2. Remove [Tích hợp NLS]
  cleaned = cleaned.replace(/\[\s*Tích\s*hợp\s*(?:Năng\s*lực\s*số|NLS)\s*\][^\n]*\n?(?:-\s*)?(?:HS|Học sinh|Trẻ|Giáo viên)[^\n]*/gmi, '');
  cleaned = cleaned.replace(/\[\s*Tích\s*hợp\s*(?:Năng\s*lực\s*số|NLS)\s*\]/gmi, '');

  // 3. Remove (AI ...) / [AI ...] / (NLS ...) / [NLS ...]
  cleaned = cleaned.replace(/[\[\(]\s*AI\s+[a-z0-9._\-]+\s*[\]\)]/gi, '');
  cleaned = cleaned.replace(/[\[\(]\s*NLS\s+[a-z0-9._\-]+\s*[\]\)]/gi, '');

  // 4. Remove standalone AI / NLS code patterns
  cleaned = cleaned.replace(/\bAI\s+\d+\.[A-Z0-9\.]+\b/gi, '');
  cleaned = cleaned.replace(/\bNLS\s+\d+\.[A-Z0-9\.]+\b/gi, '');

  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Intelligent Preschool Domain Classifier
 * Precisely determines the preschool domain and the exact standardized header
 */
export function detectPreschoolDomain(
  subject: string = '',
  lessonTitle: string = '',
  extraText: string = ''
): PreschoolDomainInfo {
  const s = (subject || '').toLowerCase().trim();
  const t = (lessonTitle || '').toLowerCase().trim();
  const extra = (extraText || '').toLowerCase().trim();
  const full = `${s} ${t} ${extra}`;

  // 1. MUSIC (Âm nhạc / Lĩnh vực nghệ thuật - Dạy hát) with TOP PRIORITY
  const isMusicSubject = s.includes('âm nhạc') || s.includes('ấm nhạc') || s.includes('gdam') || s.includes('hát múa') || s.includes('dạy hát') || s.includes('nghe hát') ||
    ((s.includes('nghệ thuật') || s.includes('thẩm mỹ') || s.includes('thẩm mĩ')) && (t.includes('hát') || t.includes('nhạc') || t.includes('âm') || t.includes('ấm') || extra.includes('dạy hát') || extra.includes('nghe hát') || extra.includes('âm nhạc') || extra.includes('ấm nhạc') || full.includes('dạy hát') || full.includes('nghe hát')));
  
  const isMusicTitle = t.startsWith('dạy hát:') || t.startsWith('dạy hát ') || t.startsWith('dạy hát') ||
    t.startsWith('nghe hát:') || t.startsWith('nghe hát ') || t.startsWith('nghe hát') ||
    t.startsWith('hát:') || t.includes('dạy hát') || t.includes('nghe hát') ||
    t.includes('hát và nhún nhảy') || t.includes('vận động âm nhạc') || t.includes('vận động theo nhạc') ||
    t.includes('gõ đệm theo tiết tấu') || t.includes('nhạc kịch') || t.includes('hát ngẫu hứng') ||
    t.includes('âm nhạc:') || t.includes('ấm nhạc:') || ((s.includes('nghệ thuật') || s.includes('thẩm mỹ') || s.includes('thẩm mĩ') || s === '' || s.includes('mầm non')) && (t.includes('hát') || t.includes('nhạc')));
  
  const isMusicExtra = extra.includes('dạy hát') || extra.includes('nghe hát') || extra.includes('trò chơi âm nhạc') || extra.includes('hát mẫu') || full.includes('dạy hát') || full.includes('nghe hát') || full.includes('ấm nhạc') || full.includes('âm nhạc dạy hát');

  if (isMusicSubject || isMusicTitle || isMusicExtra) {
    return {
      domainType: 'MUSIC',
      mainHeader: 'GIÁO ÁN ÂM NHẠC',
      defaultDomainName: 'Lĩnh vực Phát triển thẩm mỹ (Âm nhạc)',
      isMusic: true,
    };
  }

  // 1.1 HOẠT ĐỘNG VUI CHƠI TRONG LỚP (Hoạt động góc)
  if (s.includes('vui chơi trong lớp') || s.includes('hoạt động vui chơi') || s.includes('hoạt động góc') || t.includes('vui chơi trong lớp') || t.includes('hoạt động góc')) {
    return {
      domainType: 'PLAY_INDOOR',
      mainHeader: 'HOẠT ĐỘNG VUI CHƠI TRONG LỚP',
      defaultDomainName: 'Hoạt động vui chơi trong lớp (Hoạt động góc)',
      isMusic: false,
    };
  }

  // 1.2 HOẠT ĐỘNG NGOÀI TRỜI
  if (s.includes('ngoài trời') || t.includes('ngoài trời') || extra.includes('hoạt động ngoài trời')) {
    return {
      domainType: 'OUTDOOR',
      mainHeader: 'HOẠT ĐỘNG NGOÀI TRỜI',
      defaultDomainName: 'Hoạt động ngoài trời',
      isMusic: false,
    };
  }

  // 1.3 TRÒ CHƠI DÂN GIAN
  if (s.includes('dân gian') || t.includes('dân gian') || t.includes('rồng rắn lên mây') || t.includes('chi chi chành chành') || t.includes('kéo cưa lừa xẻ') || t.includes('nu na nu nống')) {
    return {
      domainType: 'FOLK_GAME',
      mainHeader: 'TRÒ CHƠI DÂN GIAN',
      defaultDomainName: 'Trò chơi dân gian',
      isMusic: false,
    };
  }

  // 1.4 HOẠT ĐỘNG TĂNG CƯỜNG TIẾNG VIỆT
  if (s.includes('tăng cường tiếng việt') || s.includes('tctv') || t.includes('tăng cường tiếng việt') || t.includes('tctv')) {
    return {
      domainType: 'VIETNAMESE_ENHANCE',
      mainHeader: 'HOẠT ĐỘNG TĂNG CƯỜNG TIẾNG VIỆT',
      defaultDomainName: 'Hoạt động tăng cường tiếng Việt',
      isMusic: false,
    };
  }

  // 1.5 HOẠT ĐỘNG TẬP TÔ CHỮ CÁI
  if (
    s.includes('tập tô') ||
    s.includes('to chu cai') ||
    t.includes('tập tô') ||
    t.includes('tô chữ cái') ||
    t.includes('tô nét') ||
    t.includes('sao chép nét') ||
    s.includes('sao chép nét') ||
    t.includes('tô, đồ') ||
    t.includes('tô đồ') ||
    t.includes('nét thẳng') ||
    t.includes('nét xiên')
  ) {
    return {
      domainType: 'LETTER_TRACING',
      mainHeader: 'HOẠT ĐỘNG TẬP TÔ CHỮ CÁI',
      defaultDomainName: 'Hoạt động tập tô chữ cái',
      isMusic: false,
    };
  }

  // 1.6 HOẠT ĐỘNG TRÒ CHƠI CHỮ CÁI
  if (s.includes('trò chơi chữ cái') || t.includes('trò chơi chữ cái') || t.includes('trò chơi với chữ cái') || t.includes('chơi với chữ cái') || t.includes('tc chữ cái')) {
    return {
      domainType: 'LETTER_GAME',
      mainHeader: 'HOẠT ĐỘNG TRÒ CHƠI CHỮ CÁI',
      defaultDomainName: 'Hoạt động trò chơi chữ cái',
      isMusic: false,
    };
  }

  // 1.6.1 TRÒ CHƠI HỌC TẬP
  if (s.includes('trò chơi học tập') || t.includes('trò chơi học tập') || t.includes('tìm bạn thân')) {
    return {
      domainType: 'LEARNING_GAME',
      mainHeader: 'TRÒ CHƠI HỌC TẬP',
      defaultDomainName: 'Trò chơi học tập',
      isMusic: false,
    };
  }

  // 1.7 HOẠT ĐỘNG GIÁO DỤC KỸ NĂNG
  if (s.includes('giáo dục kỹ năng') || s.includes('kỹ năng sống') || t.includes('giáo dục kỹ năng') || t.includes('kỹ năng sống') || (s.includes('kỹ năng') && !s.includes('xã hội'))) {
    return {
      domainType: 'SKILL_EDU',
      mainHeader: 'HOẠT ĐỘNG GIÁO DỤC KỸ NĂNG',
      defaultDomainName: 'Hoạt động giáo dục kỹ năng',
      isMusic: false,
    };
  }

  // 1.8 TRÒ CHƠI VẬN ĐỘNG
  if (s.includes('trò chơi vận động') || (t.includes('trò chơi vận động') && !s.includes('ngoài trời') && !s.includes('thể chất'))) {
    return {
      domainType: 'PHYSICAL_GAME',
      mainHeader: 'TRÒ CHƠI VẬN ĐỘNG',
      defaultDomainName: 'Trò chơi vận động',
      isMusic: false,
    };
  }

  // 1.9 SKILLS & SOCIAL (Tình cảm - Xã hội / Kỹ năng sống) - HIGH PRIORITY when subject is explicitly Tình cảm / Xã hội
  const isSkillsSubject = s.includes('tình cảm') || s.includes('kỹ năng') || (s.includes('xã hội') && !s.includes('khoa học'));
  const isSkillsTitle = t.includes('tết') || t.includes('cảm xúc') || t.includes('lễ phép') ||
    t.includes('xin phép') || t.includes('chào hỏi') || t.includes('cất đồ chơi') ||
    t.includes('tự phục vụ') || t.includes('tâm thế vào lớp') || t.includes('quy tắc lớp học') ||
    t.includes('chia sẻ đồ chơi') || t.includes('bác nông dân') || t.includes('chú bộ đội') ||
    t.includes('chú công an') || t.includes('bác cấp dưỡng') || t.includes('cô giáo') ||
    t.includes('trường mầm non') || t.includes('nghề nghiệp') || t.includes('gia đình') ||
    t.includes('lễ hội') || t.includes('quê hương') || t.includes('làng nghề') ||
    t.includes('trò chuyện về');

  if (isSkillsSubject || (isSkillsTitle && !s.includes('thể chất') && !s.includes('thể dục') && !s.includes('khoa học') && !s.includes('toán') && !s.includes('âm nhạc') && !s.includes('hát'))) {
    return {
      domainType: 'SKILLS',
      mainHeader: 'GIÁO ÁN TÌNH CẢM - XÃ HỘI',
      defaultDomainName: 'Lĩnh vực Phát triển tình cảm - kỹ năng xã hội',
      isMusic: false,
    };
  }

  // 2. PHYSICAL (Thể chất / Thể dục) with strict word boundaries (prevents false matches like 'trường' matching 'trườn')
  const isPhysicalSubject = !isSkillsSubject && (s.includes('thể chất') || s.includes('thể dục') || s.includes('gdtc') || (s.includes('vận động') && !s.includes('xã hội')));
  const isPhysicalTitle = !isSkillsSubject && (
    t.includes('vđcb') || t.includes('btptc') || t.includes('đi thăng bằng') ||
    t.includes('ném trúng đích') || t.includes('ném xa') || t.includes('bật sâu') || t.includes('bật xa') ||
    t.includes('tung bóng') || t.includes('chuyền bóng') || t.includes('bắt bóng') || t.includes('trèo thang') ||
    /(?:^|[^\p{L}\p{N}])(?:trườn\s+sấp|trườn\s+theo|trườn\s+qua|bò\s+chui|bò\s+theo|bò\s+bằng|bò\s+zic|nhảy\s+xa|nhảy\s+bật)(?:[^\p{L}\p{N}]|$)/ui.test(t) ||
    t.includes('vận động cơ bản') || t.includes('bài tập phát triển chung') || t.includes('kéo co')
  );
  const isPhysicalExtra = !isSkillsSubject && (extra.includes('thể chất') || extra.includes('btptc') || extra.includes('vđcb') || extra.includes('bài tập phát triển chung'));

  if (isPhysicalSubject || isPhysicalTitle || isPhysicalExtra) {
    return {
      domainType: 'PHYSICAL',
      mainHeader: 'LĨNH VỰC PHÁT TRIỂN THỂ CHẤT',
      defaultDomainName: 'Lĩnh vực Phát triển thể chất',
      isMusic: false,
    };
  }

  // 3. SCIENCE (Khám phá khoa học)
  const isScienceSubject = s.includes('khoa học') || s.includes('kpk') || s.includes('khám phá khoa học');
  const isScienceTitle = t.includes('khám phá khoa học') || t.includes('kpk') ||
    t.includes('màu sắc') || t.includes('khám phá màu') || t.includes('thí nghiệm') ||
    t.includes('pha màu') || t.includes('vật chìm vật nổi') || t.includes('vật chìm') ||
    t.includes('không khí') || t.includes('ánh sáng') || t.includes('nam châm') ||
    t.includes('nước và hiện tượng') || t.includes('hiện tượng tự nhiên') ||
    t.includes('giác quan') || t.includes('thời tiết') || t.includes('sự đổi màu');
  const isScienceContext = (s.includes('nhận thức') || s.includes('kntt') || s === '' || s.includes('mầm non')) &&
    (isScienceTitle || t.includes('khám phá') || t.includes('cây xanh') || t.includes('thực vật') || t.includes('động vật') || t.includes('con vật') || t.includes('hoa quả'));

  if (isScienceSubject || (isScienceTitle && !s.includes('âm nhạc') && !s.includes('hát')) || isScienceContext) {
    return {
      domainType: 'SCIENCE',
      mainHeader: 'LĨNH VỰC NHẬN THỨC (KHÁM PHÁ KHOA HỌC)',
      defaultDomainName: 'Lĩnh vực Phát triển nhận thức (Khám phá khoa học)',
      isMusic: false,
    };
  }

  // 4. MATH (Làm quen với Toán)
  const isMathSubject = s.includes('toán') || s.includes('lqvt') || s.includes('làm quen với toán');
  const isMathTitle = t.includes('toán') || t.includes('đếm') || t.includes('chữ số') ||
    t.includes('số lượng') || t.includes('hình tròn') || t.includes('hình vuông') ||
    t.includes('hình tam giác') || t.includes('hình chữ nhật') || t.includes('cao - thấp') ||
    t.includes('to - nhỏ') || t.includes('dài - ngắn') || t.includes('tách gộp') ||
    t.includes('xếp tương ứng') || t.includes('ghép đôi') || t.includes('phạm vi') ||
    t.includes('so sánh kích thước') || t.includes('phân loại đồ dùng');

  if (isMathSubject || isMathTitle) {
    return {
      domainType: 'MATH',
      mainHeader: 'PHÁT TRIỂN NHẬN THỨC (TOÁN)',
      defaultDomainName: 'Lĩnh vực Nhận thức (Làm quen với toán)',
      isMusic: false,
    };
  }

  // 4.1 SOCIAL (Khám phá xã hội / Lĩnh vực nhận thức)
  const isSocialSubject = s.includes('khám phá xã hội') || s.includes('kpxh') || (s.includes('nhận thức') && s.includes('xã hội'));
  const isSocialTitle = t.includes('khám phá xã hội') || t.includes('đồ dùng, đồ chơi') || t.includes('lớp học của bé') || t.includes('đồ dùng đồ chơi');
  if (isSocialSubject || isSocialTitle) {
    return {
      domainType: 'SOCIAL',
      mainHeader: 'LĨNH VỰC: PHÁT TRIỂN NHẬN THỨC\nHOẠT ĐỘNG: KHÁM PHÁ XÃ HỘI',
      defaultDomainName: 'Lĩnh vực Phát triển nhận thức (Khám phá xã hội)',
      isMusic: false,
    };
  }

  // 6. POETRY (Thơ)
  const isPoetrySubject = s.includes('thơ') || s.includes('dạy thơ') || s.includes('đồng dao');
  const isPoetryTitle = t.startsWith('thơ:') || t.startsWith('thơ ') || t.startsWith('thơ\n') ||
    t.includes('bài thơ') || t.includes('đọc thơ') || t.includes('đồng dao');

  if (isPoetrySubject || isPoetryTitle) {
    return {
      domainType: 'POETRY',
      mainHeader: 'GIÁO ÁN VĂN HỌC (THƠ)',
      defaultDomainName: 'Phát triển Ngôn ngữ',
      isMusic: false,
    };
  }

  // 7. STORY (Truyện)
  const isStorySubject = s.includes('truyện') || s.includes('kể chuyện') || s.includes('sự tích');
  const isStoryTitle = t.startsWith('truyện:') || t.startsWith('truyện ') || t.startsWith('truyện\n') ||
    t.includes('câu chuyện') || t.includes('kể chuyện') || t.includes('sự tích');

  if (isStorySubject || isStoryTitle) {
    return {
      domainType: 'STORY',
      mainHeader: 'GIÁO ÁN VĂN HỌC (TRUYỆN)',
      defaultDomainName: 'Lĩnh vực Ngôn ngữ',
      isMusic: false,
    };
  }

  // 8. LETTER (Làm quen với chữ cái)
  const isLetterSubject = s.includes('chữ cái') || s.includes('lqcc') || (s.includes('chữ') && !s.includes('thơ') && !s.includes('truyện'));
  const isLetterTitle = t.includes('chữ cái') || t.includes('tập tô') || t.includes('chữ o') ||
    t.includes('chữ ô') || t.includes('chữ ơ') || t.includes('chữ a') || t.includes('chữ ă') ||
    t.includes('chữ â') || t.includes('chữ e') || t.includes('chữ ê') || t.includes('29 chữ cái');

  if (isLetterSubject || isLetterTitle) {
    return {
      domainType: 'LETTER',
      mainHeader: 'NGÔN NGỮ (CHỮ CÁI)',
      defaultDomainName: 'Lĩnh vực Ngôn ngữ',
      isMusic: false,
    };
  }

  // 9. ART (Tạo hình)
  const isArtSubject = s.includes('tạo hình') || (s.includes('thẩm mỹ') && s.includes('tạo hình')) || (s.includes('nghệ thuật') && s.includes('tạo hình'));
  const isArtTitle = t.includes('tạo hình') || t.includes('xé dán') || t.includes('nặn') ||
    t.includes('vẽ tranh') || t.includes('cắt dán') || t.includes('chấm màu') ||
    t.includes('di màu') || t.includes('gấp giấy') || t.includes('làm khung tranh') ||
    t.includes('in hoa') || t.includes('trang trí');

  if (isArtSubject || isArtTitle) {
    return {
      domainType: 'ART',
      mainHeader: 'GIÁO ÁN TẠO HÌNH',
      defaultDomainName: 'Phát triển thẩm mỹ (Tạo hình)',
      isMusic: false,
    };
  }

  // Fallbacks based on broad subject naming
  if (s.includes('tình cảm') || s.includes('kỹ năng') || s.includes('xã hội')) {
    return {
      domainType: 'SKILLS',
      mainHeader: 'GIÁO ÁN TÌNH CẢM - XÃ HỘI',
      defaultDomainName: 'Lĩnh vực Phát triển tình cảm - kỹ năng xã hội',
      isMusic: false,
    };
  }
  if (s.includes('nhận thức')) {
    return {
      domainType: 'SCIENCE',
      mainHeader: 'LĨNH VỰC NHẬN THỨC (KHÁM PHÁ KHOA HỌC)',
      defaultDomainName: 'Lĩnh vực Phát triển nhận thức',
      isMusic: false,
    };
  }
  if (s.includes('ngôn ngữ')) {
    return {
      domainType: 'GENERAL',
      mainHeader: 'LĨNH VỰC PHÁT TRIỂN NGÔN NGỮ',
      defaultDomainName: 'Lĩnh vực Phát triển ngôn ngữ',
      isMusic: false,
    };
  }
  if (s.includes('nghệ thuật') || s.includes('thẩm mỹ')) {
    return {
      domainType: 'GENERAL',
      mainHeader: 'LĨNH VỰC PHÁT TRIỂN THẨM MỸ',
      defaultDomainName: 'Lĩnh vực Phát triển thẩm mỹ',
      isMusic: false,
    };
  }

  return {
    domainType: 'GENERAL',
    mainHeader: 'GIÁO ÁN MẦM NON',
    defaultDomainName: subject || 'Chương trình Mầm non',
    isMusic: false,
  };
}

export interface PreschoolMusicSongInfo {
  mainSong: string;
  listeningSong: string;
  gameTitle: string;
  focusType: 'HAT_VAN_DONG' | 'DAY_HAT' | 'NGHE_HAT';
  movementType: string;
}

export function extractSongTitles(
  lessonTitle: string = '',
  extraText: string = ''
): PreschoolMusicSongInfo {
  let mainSong = '';
  let listeningSong = '';
  let gameTitle = '';
  let focusType: 'HAT_VAN_DONG' | 'DAY_HAT' | 'NGHE_HAT' = 'DAY_HAT';
  let movementType = 'Dạy hát';

  const combined = `${lessonTitle || ''}\n${extraText || ''}`;
  const lowerCombined = combined.toLowerCase();

  // 1. Detect focusType and movementType
  if (
    lowerCombined.includes('vỗ tay theo tiết tấu chậm') ||
    lowerCombined.includes('vỗ tay theo tiết tấu phối hợp') ||
    lowerCombined.includes('vỗ tay tiết tấu chậm')
  ) {
    focusType = 'HAT_VAN_DONG';
    movementType = 'Vỗ tay theo tiết tấu chậm';
  } else if (lowerCombined.includes('vỗ tay theo tiết tấu nhanh')) {
    focusType = 'HAT_VAN_DONG';
    movementType = 'Vỗ tay theo tiết tấu nhanh';
  } else if (lowerCombined.includes('vỗ tay theo phách')) {
    focusType = 'HAT_VAN_DONG';
    movementType = 'Vỗ tay theo phách';
  } else if (lowerCombined.includes('vỗ tay theo nhịp')) {
    focusType = 'HAT_VAN_DONG';
    movementType = 'Vỗ tay theo nhịp';
  } else if (lowerCombined.includes('vận động minh họa') || lowerCombined.includes('múa minh họa')) {
    focusType = 'HAT_VAN_DONG';
    movementType = 'Vận động minh họa';
  } else if (lowerCombined.includes('vận động theo nhạc') || lowerCombined.includes('vdtn')) {
    focusType = 'HAT_VAN_DONG';
    movementType = 'Vận động theo nhạc';
  } else if (
    lowerCombined.includes('hát vận động') ||
    lowerCombined.includes('hát vận đông') ||
    lowerCombined.includes('dạy vận động') ||
    lowerCombined.includes('hvd')
  ) {
    focusType = 'HAT_VAN_DONG';
    movementType = 'Hát vận động';
  } else if (
    lowerCombined.includes('múa:') ||
    lowerCombined.includes('múa ') ||
    lowerCombined.startsWith('múa')
  ) {
    focusType = 'HAT_VAN_DONG';
    movementType = 'Múa';
  } else if (
    (lowerCombined.includes('nghe hát (tt)') || lowerCombined.includes('ndtt: nghe hát') || /^nghe hát\b/i.test(lessonTitle.trim())) &&
    !lowerCombined.includes('dạy hát') &&
    !lowerCombined.includes('vận động')
  ) {
    focusType = 'NGHE_HAT';
    movementType = 'Nghe hát';
  } else if (lowerCombined.includes('dạy hát') || lowerCombined.includes('ndtt: dạy hát')) {
    focusType = 'DAY_HAT';
    movementType = 'Dạy hát';
  } else if (lowerCombined.includes('vận động')) {
    focusType = 'HAT_VAN_DONG';
    movementType = 'Hát vận động';
  } else {
    focusType = 'DAY_HAT';
    movementType = 'Dạy hát';
  }

  // 2. Extract gameTitle (Trò chơi âm nhạc / T/C / TCÂN)
  const gameMatch =
    combined.match(/(?:trò chơi âm nhạc|tcân|t\/c|tc|trò chơi)\s*[:'"]\s*["“']?([^"”'\n\.,;–—\(\)]+)["”']?/i);
  if (gameMatch && gameMatch[1]?.trim()) {
    gameTitle = gameMatch[1].replace(/["'“‘”’]/g, '').trim();
    // Strip trailing keywords
    gameTitle = gameTitle.replace(/\s*(?:ndkh|ndtt|tác giả|tt).*$/i, '').trim();
  }

  // 3. Clean string for song extraction (strip game parts so game title doesn't pollute song names)
  const cleanedForSongs = combined
    .replace(/(?:trò chơi âm nhạc|tcân|t\/c|tc|trò chơi)\s*[:'"][^\n\)]*/gi, '')
    .replace(/\b(?:tc|t\/c)\b[^\n\)]*/gi, '');

  // 4. Extract mainSong
  if (focusType === 'HAT_VAN_DONG') {
    const vdMatch =
      cleanedForSongs.match(/(?:hát vận động|hát vận đông|vận động theo nhạc|vận động minh họa|vỗ tay theo tiết tấu chậm|vỗ tay theo tiết tấu nhanh|vỗ tay theo tiết tấu|vỗ tay theo phách|vỗ tay theo nhịp|múa|dạy vận động|vận động)\s*[:'"]\s*["“']?([^"”'\n,–—;\(\)]+)["”']?/i) ||
      cleanedForSongs.match(/(?:hát vận động|hát vận đông|vận động theo nhạc|vận động minh họa|vỗ tay theo tiết tấu chậm|vỗ tay theo phách|vỗ tay theo nhịp|múa|dạy vận động|vận động)\s+["“']([^"”']+)["”']/i) ||
      cleanedForSongs.match(/(?:hát vận động|hát vận đông|vận động theo nhạc|vận động minh họa|vỗ tay theo tiết tấu chậm|vỗ tay theo phách|vỗ tay theo nhịp|múa|dạy vận động|vận động)\s+bài\s+hát\s+["“']?([^"”'\n,–—;\(\)]+)["”']?/i) ||
      cleanedForSongs.match(/(?:hát vận động|hát vận đông|vận động theo nhạc|vận động minh họa|vỗ tay theo tiết tấu chậm|vỗ tay theo phách|vỗ tay theo nhịp|múa|dạy vận động|vận động)\s+bài\s+["“']?([^"”'\n,–—;\(\)]+)["”']?/i);
    if (vdMatch && vdMatch[1]?.trim()) {
      mainSong = vdMatch[1].replace(/["'“‘”’]/g, '').replace(/\(TT\)/i, '').trim();
    }
  } else if (focusType === 'DAY_HAT') {
    const dayHatMatch =
      cleanedForSongs.match(/dạy hát\s*[:'"]\s*["“']?([^"”'\n,–—;\(\)]+)["”']?/i) ||
      cleanedForSongs.match(/dạy hát\s+["“']([^"”']+)["”']/i) ||
      cleanedForSongs.match(/dạy hát\s+bài\s+hát\s+["“']?([^"”'\n,–—;\(\)]+)["”']?/i) ||
      cleanedForSongs.match(/dạy hát\s+bài\s+["“']?([^"”'\n,–—;\(\)]+)["”']?/i);
    if (dayHatMatch && dayHatMatch[1]?.trim()) {
      mainSong = dayHatMatch[1].replace(/["'“‘”’]/g, '').replace(/\(TT\)/i, '').trim();
    }
  } else if (focusType === 'NGHE_HAT') {
    const ngheMatch =
      cleanedForSongs.match(/nghe hát\s*[:'"]\s*["“']?([^"”'\n,–—;\(\)]+)["”']?/i) ||
      cleanedForSongs.match(/nghe hát\s+["“']([^"”']+)["”']/i);
    if (ngheMatch && ngheMatch[1]?.trim()) {
      mainSong = ngheMatch[1].replace(/["'“‘”’]/g, '').replace(/\(TT\)/i, '').trim();
    }
  }

  // Fallback: quotes from lessonTitle
  if (!mainSong && lessonTitle) {
    const cleanLessonTitleNoGame = lessonTitle.replace(/(?:trò chơi âm nhạc|tcân|t\/c|tc|trò chơi)\s*[:'"][^\n\)]*/gi, '');
    const quotes = cleanLessonTitleNoGame.match(/["'“‘]([^"'”’]+)["'”’]/g);
    if (quotes && quotes.length > 0) {
      mainSong = quotes[0].replace(/["'“‘”’]/g, '').trim();
      if (!listeningSong && quotes.length > 1) {
        listeningSong = quotes[1].replace(/["'“‘”’]/g, '').trim();
      }
    }
  }

  // Fallback: clean lessonTitle
  if (!mainSong && lessonTitle) {
    mainSong = lessonTitle
      .replace(/^(?:âm nhạc|giáo án âm nhạc|gdam|hoạt động âm nhạc|lĩnh vực nghệ thuật|lĩnh vực phát triển thẩm mỹ|thẩm mỹ)[\s:\-–—]*/i, '')
      .replace(/^(?:ndtt|ndkh)[\s:\-–—]*/i, '')
      .replace(/^(?:hát vận động|hát vận đông|vận động theo nhạc|vận động minh họa|vỗ tay theo tiết tấu chậm|vỗ tay theo phách|vỗ tay theo nhịp|dạy hát|múa|nghe hát)[\s:\-–—]*/i, '')
      .replace(/(?:trò chơi âm nhạc|tcân|t\/c|tc|trò chơi)\s*[:'"][^\n\)]*/gi, '')
      .replace(/\(TT\)/i, '')
      .replace(/["'“‘”’]/g, '')
      .trim();
    // Split by separator like - or . or ,
    if (mainSong.includes('-')) {
      mainSong = mainSong.split('-')[0].trim();
    } else if (mainSong.includes('.')) {
      mainSong = mainSong.split('.')[0].trim();
    }
  }

  // Clean trailing artifacts from mainSong
  if (mainSong) {
    mainSong = mainSong
      .replace(/^(?:bài\s+hát|bài)\s+/i, '')
      .replace(/\s*(?:nghe hát|t\/c|tc|trò chơi|ndkh|ndtt|tác giả).*$/i, '')
      .replace(/["'“‘”’]/g, '')
      .trim();
  }

  if (!mainSong) {
    mainSong = 'Cái mũi';
  }

  // 5. Extract listeningSong
  const ngheHatMatch =
    cleanedForSongs.match(/(?:nghe hát|bài hát nghe|nghe)\s*[:'"]\s*["“']?([^"”'\n,–—;\(\)]+)["”']?/i) ||
    cleanedForSongs.match(/(?:nghe hát|bài hát nghe)\s+["“']([^"”']+)["”']/i) ||
    cleanedForSongs.match(/(?:nghe hát|bài hát nghe)\s+bài\s+hát\s+["“']?([^"”'\n,–—;\(\)]+)["”']?/i) ||
    cleanedForSongs.match(/(?:nghe hát|bài hát nghe)\s+bài\s+["“']?([^"”'\n,–—;\(\)]+)["”']?/i);

  if (ngheHatMatch && ngheHatMatch[1]?.trim()) {
    listeningSong = ngheHatMatch[1]
      .replace(/["'“‘”’]/g, '')
      .replace(/\(TT\)/i, '')
      .replace(/\(NDKH\)/i, '')
      .replace(/\s*(?:t\/c|tc|trò chơi|tác giả).*$/i, '')
      .trim();
  }

  // Clean listeningSong of any game words or if equal to mainSong
  if (listeningSong) {
    listeningSong = listeningSong
      .replace(/^(?:bài\s+hát|bài)\s+/i, '')
      .replace(/\s*(?:t\/c|tc|trò chơi|tai ai thính|tác giả).*$/i, '')
      .replace(/["'“‘”’]/g, '')
      .trim();
  }

  // If listeningSong matches mainSong, or contains game keywords, or is empty:
  const isInvalidListeningSong =
    !listeningSong ||
    listeningSong.toLowerCase() === mainSong.toLowerCase() ||
    /tai ai thính|trò chơi|t\/c|tcân/i.test(listeningSong);

  if (isInvalidListeningSong) {
    const lower = `${lessonTitle} ${mainSong} ${extraText}`.toLowerCase();
    if (
      lower.includes('mũi') ||
      lower.includes('tai') ||
      lower.includes('mắt') ||
      lower.includes('miệng') ||
      lower.includes('tay') ||
      lower.includes('chân') ||
      lower.includes('bản thân') ||
      lower.includes('khuôn mặt') ||
      lower.includes('cơ thể')
    ) {
      listeningSong = mainSong.toLowerCase().includes('thật đáng yêu') ? 'Tay thơm tay ngoan' : 'Thật đáng yêu';
    } else if (
      lower.includes('bà') ||
      lower.includes('mẹ') ||
      lower.includes('bố') ||
      lower.includes('gia đình') ||
      lower.includes('nhà')
    ) {
      listeningSong = mainSong.toLowerCase().includes('cho con') ? 'Bàn tay mẹ' : 'Cho con';
    } else if (
      lower.includes('cô') ||
      lower.includes('trường') ||
      lower.includes('lớp') ||
      lower.includes('bạn')
    ) {
      listeningSong = mainSong.toLowerCase().includes('bàn tay cô giáo') ? 'Ngày đầu tiên đi học' : 'Bàn tay cô giáo';
    } else if (
      lower.includes('cây') ||
      lower.includes('hoa') ||
      lower.includes('xuân') ||
      lower.includes('tết') ||
      lower.includes('mưa') ||
      lower.includes('nắng')
    ) {
      listeningSong = mainSong.toLowerCase().includes('hoa thơm bướm lượn') ? 'Em yêu cây xanh' : 'Hoa thơm bướm lượn';
    } else if (
      lower.includes('bộ đội') ||
      lower.includes('công nhân') ||
      lower.includes('nghề')
    ) {
      listeningSong = 'Cháu hát về đảo xa';
    } else if (
      lower.includes('gà') ||
      lower.includes('mèo') ||
      lower.includes('vịt') ||
      lower.includes('chim') ||
      lower.includes('cá') ||
      lower.includes('con vật') ||
      lower.includes('động vật')
    ) {
      listeningSong = mainSong.toLowerCase().includes('gà gáy le te') ? 'Chú voi con ở Bản Đôn' : 'Gà gáy le te';
    } else {
      listeningSong = mainSong.toLowerCase().includes('cho con') ? 'Thật đáng yêu' : 'Cho con';
    }
  }

  if (!gameTitle) {
    gameTitle = 'Tai ai thính';
  }

  return { mainSong, listeningSong, gameTitle, focusType, movementType };
}

export function isPreschoolMusicPlan(plan: any): boolean {
  if (!plan) return false;
  const isPreschool = isPreschoolPlan(plan);
  if (!isPreschool) return false;
  const domain = detectPreschoolDomain(plan.subject || '', plan.lessonTitle || '', plan.oldPlanContent || '');
  return domain.domainType === 'MUSIC';
}

export function isPreschoolPhysicalPlan(plan: any): boolean {
  if (!plan) return false;
  const isPreschool = isPreschoolPlan(plan);
  if (!isPreschool) return false;
  const domain = detectPreschoolDomain(plan.subject || '', plan.lessonTitle || '', plan.oldPlanContent || '');
  return domain.domainType === 'PHYSICAL';
}

export function formatPreschoolPhysicalActivities(
  activities: any[],
  lessonTitle: string = '',
  subject: string = ''
): any[] {
  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return generateDefaultPreschoolActivities(lessonTitle, subject, { domainType: 'PHYSICAL' });
  }

  const defaultThemeSong = '“Trường chúng cháu là trường mầm non”';

  return activities.map((act, idx) => {
    let determinedIndex = idx + 1;
    if (typeof act.index === 'number' && act.index >= 1 && act.index <= 5) {
      determinedIndex = act.index;
    } else if (act.name) {
      const lower = act.name.toLowerCase();
      if (/^1[\.\s\-–—]/.test(lower) || lower.includes('khởi động') || lower.includes('tạo tình huống') || lower.includes('tạo hứng thú')) {
        determinedIndex = 1;
      } else if (/^2[\.\s\-–—]/.test(lower) || lower.includes('khám phá') || lower.includes('trải nghiệm') || lower.includes('nhiệm vụ vận động')) {
        determinedIndex = 2;
      } else if (/^5[\.\s\-–—]/.test(lower) || lower.includes('hồi tĩnh') || lower.includes('điều chỉnh') || (lower.includes('chia sẻ') && lower.includes('đánh giá'))) {
        determinedIndex = 5;
      } else if (/^4[\.\s\-–—]/.test(lower) || lower.includes('thực hành') || lower.includes('vận dụng')) {
        determinedIndex = 4;
      } else if (/^3[\.\s\-–—]/.test(lower) || lower.includes('hình thành') || lower.includes('thảo luận') || lower.includes('chia sẻ')) {
        determinedIndex = 3;
      }
    }

    const newAct = { ...act };
    const step1 = { ...(newAct.step1 || {}) };
    let teacherAction = (step1.teacherAction || '').replace(/\*\*/g, '').trim();
    let studentAction = (step1.studentAction || '').replace(/\*\*/g, '').trim();

    // Strip accidental music headers
    teacherAction = teacherAction
      .replace(/^a[\.\)]\s*Dạy hát[^\n]*\n?/gmi, '')
      .replace(/^b[\.\)]\s*Nghe hát[^\n]*\n?/gmi, '')
      .replace(/Trò chơi âm nhạc\s*[:'"][^\n]*\n?/gmi, '');
    studentAction = studentAction
      .replace(/^a[\.\)][^\n]*\n?/gmi, '')
      .replace(/^b[\.\)][^\n]*\n?/gmi, '');

    if (determinedIndex === 1) {
      newAct.name = "1. Khởi động – Tạo hứng thú";
      // If act 1 mistakenly contains BTPTC, clean it out so it doesn't duplicate
      teacherAction = teacherAction
        .replace(/\*?\s*Bài tập phát triển chung[\s\S]*?(?=(?:- Cho trẻ chuyển về đội hình|Chuyển về đội hình|$))/i, '')
        .trim();

      if (!teacherAction.includes('mũi bàn chân') && !teacherAction.includes('mũi chân') && !teacherAction.includes('xoay các khớp')) {
        teacherAction = `- Cho trẻ đi vòng tròn kết hợp các kiểu đi, chạy theo hiệu lệnh và nhạc: đi thường -> đi bằng mũi bàn chân -> đi thường -> đi bằng gót bàn chân -> đi thường -> chạy chậm -> chạy nhanh -> chạy chậm -> đi thường.\n- Cho trẻ xoay các khớp cổ tay, bả vai, hông, khớp gối.\n- Cho trẻ chuyển về đội hình 3 hàng dọc -> chuyển thành 3 hàng ngang dãn cách đều chuẩn bị tập BTPTC.`;
      }
      if (!studentAction) {
        studentAction = `- Trẻ đi vòng tròn thực hiện các kiểu đi, chạy theo hiệu lệnh của cô.\n- Trẻ xoay các khớp cổ tay, bả vai, khớp gối theo hiệu lệnh.\n- Trẻ chuyển về đội hình hàng ngang dãn cách đều.`;
      }
    } else if (determinedIndex === 2) {
      newAct.name = "2. Khám phá – Trải nghiệm nhiệm vụ vận động.";

      // Check if teacherAction already has BTPTC
      const hasBTPTC = /Bài tập phát triển chung|BTPTC/i.test(teacherAction);

      if (!hasBTPTC) {
        // Construct full standard preschool BTPTC and prepend
        const btptcBlock = `* Bài tập phát triển chung:\n- Tập theo nhạc bài hát ${defaultThemeSong}:\n+ Tay: Hai tay đưa ra trước, lên cao (2 lần x 8 nhịp).\n+ Bụng: Đứng nghiêng người sang hai bên (2 lần x 8 nhịp).\n+ Chân: Đứng khuỵu gối, hai tay chống hông (2 lần x 8 nhịp).\n+ Bật: Bật nhảy tại chỗ, chân tách khép nhịp nhàng (2 lần x 8 nhịp).\n- Cho trẻ chuyển về đội hình 2 hàng đối diện nhau dãn cách cách nhau 3 - 4m.\n* Vận động cơ bản:\n`;

        let existingVdcb = teacherAction;
        if (!existingVdcb.trim()) {
          existingVdcb = `- Cô giới thiệu sơ đồ sân tập / dụng cụ vận động và gợi mở tình huống thử thách.\n- Mời 1 - 2 trẻ lên thử trải nghiệm thực hiện vận động theo cách của mình trước; Cô và cả lớp quan sát, gợi mở tư thế đứng, hướng nhìn (tuyệt đối không làm mẫu trước).`;
        }
        teacherAction = `${btptcBlock}${existingVdcb}`;

        if (!studentAction.includes('Tay, Bụng') && !studentAction.includes('BTPTC')) {
          const studentBTPTC = `- Trẻ đứng theo hàng dãn cách, lắng nghe nhạc và tập đều các động tác Tay, Bụng, Chân, Bật cùng cô.\n- Trẻ chuyển đội hình về 2 hàng đối diện nhau theo hiệu lệnh của cô.\n`;
          let existingSAction = studentAction || `- Trẻ quan sát sơ đồ/dụng cụ và bạn đại diện lên thực hiện thử vận động theo cách của mình.`;
          studentAction = `${studentBTPTC}${existingSAction}`;
        }
      } else {
        // Ensure header starts cleanly with "* Bài tập phát triển chung:"
        teacherAction = teacherAction.replace(/^[-•*+\s–—]*(?:Bài tập phát triển chung|BTPTC)[:\s]*/mi, '* Bài tập phát triển chung:\n');
        if (/Vận động cơ bản|VĐCB/i.test(teacherAction) && !/\* Vận động cơ bản/i.test(teacherAction)) {
          teacherAction = teacherAction.replace(/^[-•*+\s–—]*(?:Vận động cơ bản|VĐCB)[:\s]*/mi, '* Vận động cơ bản:\n');
        }
      }
    } else if (determinedIndex === 3) {
      newAct.name = "3. Chia sẻ – Hình thành cách thực hiện";
      if (!teacherAction) {
        teacherAction = `- Mời trẻ chia sẻ cách thực hiện, cảm nhận sau khi thử vận động.\n- Cô làm mẫu chuẩn hóa kỹ năng:\n+ Lần 1: Làm mẫu toàn phần không giải thích.\n+ Lần 2: Làm mẫu kết hợp phân tích kỹ thuật vận động chi tiết.\n+ Lần 3: Nhấn mạnh điểm mấu chốt kỹ thuật.\n- Mời 2 trẻ lên thực hiện lại để cô và cả lớp quan sát, chuẩn hóa.`;
      }
    } else if (determinedIndex === 4) {
      newAct.name = "4. Thực hành – Vận dụng";
      if (!teacherAction) {
        teacherAction = `- Cho trẻ lần lượt thực hành vận động theo hàng/nhóm từ dễ đến nâng cao; cô bao quát sửa sai.\n- Trò chơi vận động củng cố: Giới thiệu tên trò chơi vận động phù hợp chủ đề, luật chơi, cách chơi và tổ chức cho trẻ chơi hào hứng.`;
      }
    } else if (determinedIndex === 5) {
      newAct.name = "5. Chia sẻ – Đánh giá và Hồi tĩnh";
      if (!teacherAction) {
        teacherAction = `- Trao đổi cảm nhận của trẻ sau buổi tập, cô nhận xét, tuyên dương tinh thần tập luyện.\n- Hồi tĩnh: Cho trẻ đi nhẹ nhàng 1 - 2 vòng quanh sân/phòng tập theo nhạc êm dịu, làm động tác chim bay/thả lỏng cơ thể, hít thở sâu.`;
      }
    }

    step1.teacherAction = expandPreschoolTextLines(teacherAction)
      .map((l) => cleanPreschoolBulletLine(l))
      .filter(Boolean)
      .join('\n')
      .trim();

    step1.studentAction = expandPreschoolTextLines(studentAction)
      .map((l) => cleanPreschoolBulletLine(l))
      .filter(Boolean)
      .join('\n')
      .trim();

    newAct.step1 = step1;
    return newAct;
  });
}

/**
 * Generate rich default 5-step preschool activities based on domain, topic, and age.
 * Ensures the lesson plan NEVER has 0 activities even if AI tasks encounter rate limits or return an empty array.
 */
export function generateDefaultPreschoolActivities(
  lessonTitle: string = 'Trò chuyện về bài học',
  subject: string = '',
  domainInfo?: any
): any[] {
  const domain = domainInfo || detectPreschoolDomain(subject, lessonTitle);
  const title = lessonTitle || 'chủ đề bài học';

  if (domain.domainType === 'MUSIC') {
    const { mainSong, listeningSong, gameTitle, focusType, movementType } = extractSongTitles(lessonTitle);
    const headerA = focusType === 'HAT_VAN_DONG'
      ? `a. ${movementType}: "${mainSong}" (TT)`
      : (focusType === 'NGHE_HAT' ? `a. Nghe hát: "${mainSong}" (TT)` : `a. Dạy hát: "${mainSong}" (TT)`);
    const headerB = focusType === 'NGHE_HAT'
      ? `b. Hát vận động: "${listeningSong}"`
      : `b. Nghe hát: "${listeningSong}"`;

    let teacherActionAct3A: string[] = [];
    let studentActionAct3A: string[] = [];

    if (focusType === 'HAT_VAN_DONG') {
      teacherActionAct3A = [
        headerA,
        `- Cô cho cả lớp hát lại bài hát "${mainSong}" 1 - 2 lần để trẻ nhớ lại giai điệu và lời ca.`,
        `- Cô giới thiệu và thực hiện vận động mẫu:`,
        `+ Lần 1: Làm mẫu toàn phần kết hợp hát và vận động nhịp nhàng, biểu cảm từ đầu đến hết bài.`,
        `+ Lần 2: Làm mẫu kết hợp phân tích kỹ thuật từng động tác vận động minh họa / vỗ tay nhịp nhàng theo câu hát của bài "${mainSong}".`,
        `+ Lần 3: Nhấn mạnh các động tác tạo điểm nhấn và tư thế biểu diễn tự tin.`,
        `- Tổ chức cho trẻ thực hành vận động:`,
        `+ Cho cả lớp cùng đứng dậy hát và vận động theo cô (2 - 3 lần).`,
        `+ Cho các tổ, nhóm bạn trai, nhóm bạn gái thi đua hát và vận động luân phiên (kết hợp dụng cụ gõ đệm: phách tre, xắc xô, gáo dừa...).`,
        `+ Mời cá nhân trẻ tự tin lên sân khấu biểu diễn hát vận động. Cô chú ý quan sát, sửa sai và khích lệ trẻ biểu diễn tự nhiên, đúng nhịp.`
      ];
      studentActionAct3A = [
        `- Trẻ quây quần bên cô, hào hứng hát lại bài hát "${mainSong}" cùng cô để nhớ lại giai điệu.`,
        `- Trẻ chăm chú quan sát cô làm mẫu từng động tác vận động và lắng nghe cô phân tích kỹ thuật.`,
        `- Cả lớp đứng lên cùng hát và vận động nhịp nhàng theo cô (2 - 3 lần).`,
        `- Từng tổ, nhóm bạn trai, bạn gái và cá nhân trẻ tự tin lên sân khấu thể hiện hát vận động kết hợp dụng cụ gõ đệm trong tiếng vỗ tay cổ vũ của các bạn.`
      ];
    } else {
      teacherActionAct3A = [
        headerA,
        `- Cô trò chuyện gợi mở về giai điệu và lời ca của bài hát "${mainSong}".`,
        `- Cô hát mẫu lần 1: Rõ lời, đúng giai điệu và tính chất bài hát.`,
        `- Cô hát mẫu lần 2: Kết hợp cử chỉ, điệu bộ minh họa và giảng giải nội dung bài hát "${mainSong}".`,
        `- Dạy trẻ hát:`,
        `+ Cô bắt nhịp cho cả lớp hát cùng cô từ đầu đến hết bài (2 - 3 lần).`,
        `+ Cho các tổ, nhóm bạn trai, nhóm bạn gái thi đua hát luân phiên (kết hợp vỗ tay theo nhịp).`,
        `+ Mời cá nhân trẻ thể hiện bài hát. Cô chú ý lắng nghe, sửa sai cao độ, nhịp điệu và lời ca cho trẻ kịp thời.`
      ];
      studentActionAct3A = [
        `- Trẻ quây quần bên cô, chăm chú lắng nghe cô hát mẫu và quan sát các động tác cử chỉ của cô.`,
        `- Cả lớp vui tươi, hào hứng hát cùng cô từ đầu đến hết bài (2 - 3 lần).`,
        `- Từng tổ, nhóm và cá nhân trẻ tự tin đứng lên biểu diễn bài hát.`,
        `- Trẻ lắng nghe bạn hát và sửa sai theo sự hướng dẫn của cô.`
      ];
    }

    const teacherActionAct3B = [
      headerB,
      `- Cô giới thiệu tên bài hát nghe "${listeningSong}", tên tác giả.`,
      `- Cô hát cho trẻ nghe lần 1: Thể hiện tình cảm tha thiết, truyền cảm của giai điệu bài hát.`,
      `- Giảng giải nội dung, ý nghĩa bài hát: Giáo dục trẻ biết yêu thương, trân trọng và biết ơn.`,
      `- Cô hát cho trẻ nghe lần 2: Kết hợp động tác múa minh họa mềm mại, khuyến khích trẻ đứng lên cùng nhún nhảy, đung đưa hưởng ứng theo giai điệu bài hát.`
    ];
    const studentActionAct3B = [
      `- Trẻ ngồi yên lặng, chăm chú lắng nghe cô hát bài nghe hát "${listeningSong}".`,
      `- Trẻ hiểu nội dung bài hát qua lời giảng giải của cô.`,
      `- Trẻ vui vẻ đứng dậy nhún nhảy, làm động tác đung đưa hưởng ứng cùng cô theo nhịp điệu bài hát.`
    ];

    return [
      {
        id: 'act-1',
        index: 1,
        name: '1. Khởi động – Tạo tình huống',
        duration: '3 - 5 phút',
        objective: 'Trẻ hào hứng, tập trung chú ý và sẵn sàng bước vào hoạt động âm nhạc',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô cùng cả lớp chơi trò chơi âm thanh ("Lắng nghe âm thanh kỳ diệu"): Cô phát các âm thanh vui tươi, tiếng chuông gió hoặc tiếng kêu của các con vật quen thuộc để trẻ lắng nghe và phán đoán.\n- Cô tạo tình huống dẫn dắt dịu dàng, truyền cảm: "Các con ơi! Hôm nay lớp chúng mình sẽ cùng bước vào một không gian âm nhạc vô cùng rộn rã với những giai điệu thật tươi vui đấy! Chúng mình đã sẵn sàng chưa nào?".\n- Cô giới thiệu đề tài và mời các bé cùng chuẩn bị tham gia biểu diễn.`,
          studentAction: `- Trẻ chăm chú lắng nghe âm thanh và hào hứng reo vui, đoán đúng nguồn âm thanh.\n- Trẻ hưởng ứng vỗ tay nồng nhiệt, tươi cười sẵn sàng bước vào bài học âm nhạc cùng cô.`,
          productExpected: '',
          digitalOrAiTool: '',
        }
      },
      {
        id: 'act-2',
        index: 2,
        name: '2. Khám phá – Trải nghiệm',
        duration: '5 - 7 phút',
        objective: 'Trẻ tự do cảm nhận giai điệu bài hát và khám phá các nhạc cụ gõ đệm',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô mở bản nhạc bài hát "${mainSong}" với giai điệu vui tươi, rộn rã.\n- Cô khuyến khích trẻ tản ra không gian lớp học, tự do lắng nghe, nhún nhảy và tự sáng tạo các động tác điệu bộ, vỗ tay minh họa theo cảm nhận của riêng mình.\n- Cô để trẻ tự tìm đến khay nhạc cụ (xắc xô, phách tre, gáo dừa, trống lắc) chọn món đồ chơi âm nhạc yêu thích và tự gõ đệm theo nhịp điệu bài hát cùng bạn.\n- Cô bao quát, mỉm cười khích lệ trẻ cảm nhận giai điệu (không uốn nắn hay dạy kỹ thuật ngay lúc này).`,
          studentAction: `- Trẻ di chuyển tự do trong lớp, hào hứng lắng nghe giai điệu bài hát "${mainSong}".\n- Trẻ tự nghĩ ra các động tác nhún nhảy, lắc lư cơ thể và tự nhẩm hát theo lời ca.\n- Trẻ vui vẻ chọn xắc xô, phách tre tự gõ đệm hòa nhịp cùng bạn bên cạnh.`,
          productExpected: '',
          digitalOrAiTool: '',
        }
      },
      {
        id: 'act-3',
        index: 3,
        name: '3. Chia sẻ – Thảo luận',
        duration: '12 - 15 phút',
        objective: 'Trẻ nắm vững kỹ năng hát vận động / dạy hát và biết cảm thụ giai điệu bài hát nghe',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: [...teacherActionAct3A, ...teacherActionAct3B].join('\n'),
          studentAction: [...studentActionAct3A, ...studentActionAct3B].join('\n'),
          productExpected: '',
          digitalOrAiTool: '',
        }
      },
      {
        id: 'act-4',
        index: 4,
        name: '4. Vận dụng – Mở rộng',
        duration: '6 - 8 phút',
        objective: 'Trẻ tự tin biểu diễn giao lưu âm nhạc và hào hứng tham gia trò chơi âm nhạc',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô tổ chức hoạt động giao lưu âm nhạc và trò chơi củng cố:\n- Mời các nhóm trẻ lên sân khấu đeo mũ múa biểu diễn giao lưu bài hát "${mainSong}" kết hợp gõ đệm nhạc cụ tự tạo (phách tre, xắc xô).\n- Cô bao quát, cổ vũ và khen ngợi sự tự tin, sáng tạo của các nhóm.\n\n+ Trò chơi âm nhạc: “${gameTitle}”\n- **Cách chơi:** Cô chuẩn bị các nốt nhạc / vòng tròn may mắn trên sàn. Khi nhạc nổi lên, cả lớp vừa đi vừa hát bài "Ngày vui của bé". Khi nhạc dừng hoặc có hiệu lệnh của cô, mỗi trẻ nhanh chân nhảy vào 1 nốt nhạc / gọi đúng tên bạn hát hoặc thực hiện yêu cầu âm nhạc vui nhộn.\n- **Luật chơi:** Bạn nào không tìm được nốt nhạc hoặc đoán sai tên bạn hát sẽ phải nhảy lò cò 1 vòng hoặc hát tặng cả lớp 1 câu hát.\n- Tổ chức cho trẻ chơi 2 - 3 lần sôi nổi.`,
          studentAction: `- Trẻ hào hứng đeo mũ múa, tự tin bước lên sân khấu biểu diễn giao lưu cùng các bạn:\n  + Nhóm 1: Trẻ hát vang kết hợp gõ phách tre nhịp nhàng.\n  + Nhóm 2: Trẻ vừa hát vừa nhún nhảy, lắc xắc xô rộn rã.\n  + Nhóm 3: Trẻ tự tin biểu diễn các động tác minh họa sinh động.\n- Trẻ hào hứng lắng nghe cô phổ biến luật chơi và tham gia trò chơi âm nhạc “${gameTitle}” 2 - 3 lần.\n- Trẻ phản xạ nhanh nhạy, reo vui khi đoán đúng và vui vẻ nhảy lò cò khi bị phạm quy.`,
          productExpected: '',
          digitalOrAiTool: '',
        }
      },
      {
        id: 'act-5',
        index: 5,
        name: '5. Chia sẻ – Đánh giá',
        duration: '3 - 5 phút',
        objective: 'Trẻ chia sẻ cảm xúc sau buổi học âm nhạc, củng cố nề nếp thu dọn nhạc cụ gọn gàng',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô tập trung trẻ lại, trò chuyện hỏi cảm nhận của trẻ:\n  + "Hôm nay các con cảm thấy thế nào sau giờ học âm nhạc?"\n  + "Các con thích nhất bài hát, điệu múa hay trò chơi âm nhạc nào?"\n  + "Về nhà các con sẽ hát tặng ai bài hát tuyệt vời này?"\n- Cô nhận xét, tuyên dương sự nỗ lực, giọng hát trong sáng, điệu bộ tự tin và tinh thần hợp tác của trẻ trong suốt buổi học.\n- Hướng dẫn trẻ cùng cô thu dọn nhạc cụ (phách tre, xắc xô, trống lắc), mũ múa cất vào đúng góc âm nhạc, củng cố nề nếp ngăn nắp vệ sinh lớp học.`,
          studentAction: `- Trẻ tự tin chia sẻ cảm xúc, niềm vui khi được hát múa và chơi trò chơi âm nhạc cùng cô và các bạn.\n- Trẻ tích cực trả lời: "Con rất vui và thích biểu diễn bài hát ạ!", "Về nhà con sẽ hát cho ông bà, bố mẹ nghe!".\n- Trẻ tươi cười lắng nghe cô nhận xét và đón nhận lời khen ngợi.\n- Trẻ tự giác cùng cô và các bạn thu dọn xắc xô, phách tre, mũ múa xếp gọn gàng vào các khay ở góc âm nhạc.`,
          productExpected: '',
          digitalOrAiTool: '',
        }
      }
    ];
  }

  if (domain.domainType === 'LETTER_GAME') {
    // Extract specific letters from title if mentioned (e.g. "l, m, n", "o, ô, ơ", "a, ă, â", "e, ê", "u, ư", "i, t, c", "b, d, đ")
    let letters = 'o, ô, ơ';
    const letterMatch = (lessonTitle || '').match(/(?:chữ cái|chữ|với)\s+([a-zA-Zà-ỹÀ-Ỹ\s,–—\-]+)/i);
    if (letterMatch && letterMatch[1]) {
      const parsed = letterMatch[1].trim().replace(/\s*[,–—\-]\s*/g, ', ');
      if (parsed.length > 0 && parsed.length < 25) {
        letters = parsed;
      }
    }

    return [
      {
        id: 'act-1',
        index: 1,
        name: '1. Gợi hứng thú – hình thành và lựa chọn ý tưởng chơi',
        duration: '3 - 5 phút',
        objective: 'Trẻ hào hứng, ghi nhớ và gọi tên các chữ cái trọng tâm bài học',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô cho trẻ hát và vận động theo bài hát ngắn có chứa các chữ cái trọng tâm ${letters} gắn với "${title}".\n- Cô đưa các thẻ chữ cái trọng tâm ra và đố vui trẻ: "Các con có biết đây là những chữ cái gì không?", "Chúng mình có thể chơi những trò chơi thú vị nào với các chữ cái này nhỉ?".\n- Cô giới thiệu chuỗi 5 trò chơi chữ cái hấp dẫn (Trò chơi 1: Ai tìm chữ nhanh, Trò chơi 2: Về đúng nhà, Trò chơi 3: Chuyền chữ tiếp sức, Trò chơi 4: Ghép chữ tạo từ, Trò chơi 5: Săn tìm chữ cái sáng tạo) và cho trẻ lựa chọn.`,
          studentAction: `- Trẻ hát và nhún nhảy vui tươi theo giai điệu bài hát cùng cô.\n- Trẻ quan sát, hào hứng gọi to tên các chữ cái trọng tâm ${letters}.\n- Trẻ nêu ý tưởng, sôi nổi lựa chọn các trò chơi chữ cái mình yêu thích.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-2',
        index: 2,
        name: '2. Thỏa thuận – Lập kế hoạch chơi',
        duration: '3 - 5 phút',
        objective: 'Trẻ về nhóm, thống nhất luật chơi văn minh và chuẩn bị học cụ cho chuỗi 5 trò chơi',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô chia trẻ thành các nhóm/đội chơi phù hợp theo các chữ cái ${letters}.\n- Cùng trẻ thỏa thuận và thống nhất kế hoạch:\n  + Tham gia chuỗi 5 trò chơi chữ cái theo hiệu lệnh của cô.\n  + Phân công vị trí chơi, đồ dùng học liệu cho từng đội.\n  + Thống nhất luật chơi văn minh: Chơi trung thực, không xô đẩy, biết chờ lượt, đoàn kết và giúp đỡ bạn bè.\n- Cô nhắc nhở trẻ chuẩn bị sẵn sàng rổ đựng chữ cái, vòng bật nhảy, thẻ tranh từ.`,
          studentAction: `- Trẻ nhanh nhẹn về nhóm theo sự phân công.\n- Trẻ cùng bạn trao đổi về cách chơi và cam kết tuân thủ đúng luật chơi.\n- Trẻ chuẩn bị sẵn sàng tâm thế và đồ dùng học liệu của nhóm mình.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-3',
        index: 3,
        name: '3. Thực hiện hoạt động chơi',
        duration: '15 - 18 phút',
        objective: 'Trẻ tham gia đầy đủ chuỗi 5 trò chơi chữ cái, rèn phản xạ, nhận biết mặt chữ và tinh thần đồng đội',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô tổ chức cho trẻ lần lượt tham gia trọn vẹn chuỗi 5 trò chơi chữ cái:\n\nTrò chơi 1: AI TÌM CHỮ NHANH?\n- **Cách chơi:** Cô đặt nhiều thẻ chữ cái lẫn nhau trong rổ. Cô phát âm hoặc nêu đặc điểm nét (ví dụ: tìm chữ cái theo hiệu lệnh). Trẻ nhanh tay tìm đúng thẻ chữ giơ lên thật nhanh và đọc to.\n- **Luật chơi:** Chọn đúng chữ và phát âm chuẩn mới được tính điểm thưởng.\n- **Mục tiêu:** Rèn nhận biết mặt chữ, phát âm chuẩn xác và phản xạ nhanh với các chữ cái ${letters}.\n\nTrò chơi 2: VỀ ĐÚNG NHÀ\n- **Cách chơi:** Bố trí các ngôi nhà mang ký hiệu chữ cái ở các góc. Mỗi trẻ cầm một thẻ chữ cái đi vòng tròn hát theo nhạc; khi nhạc dừng hoặc có hiệu lệnh "Trời mưa", trẻ nhanh chân chạy về đúng ngôi nhà có chữ cái giống thẻ trên tay mình.\n- **Luật chơi:** Về đúng nhà và đọc to tên chữ cái của ngôi nhà; về nhầm nhà phải nhảy lò cò về đúng nhà.\n- **Mục tiêu:** Củng cố phân biệt các chữ cái đã học, rèn luyện vận động và phản xạ định hướng không gian.\n\nTrò chơi 3: CHUYỀN CHỮ TIẾP SỨC\n- **Cách chơi:** Chia các đội xếp hàng dọc trước vạch xuất phát. Khi có hiệu lệnh, bạn đầu hàng bật qua các vòng thể dục, chạy lên rổ chọn đúng chữ cái của đội mình mang về rổ đội, rồi chạy về đập tay bạn tiếp theo.\n- **Luật chơi:** Mỗi lượt chỉ lấy 1 thẻ chữ, đội nào lấy đúng và nhiều thẻ chữ nhất trong thời gian 1 bản nhạc là thắng cuộc.\n- **Mục tiêu:** Rèn tinh thần hợp tác đồng đội, phản xạ nhanh và sự khéo léo.\n\nTrò chơi 4: GHÉP CHỮ TẠO TỪ\n- **Cách chơi:** Cô phát các bức tranh kèm từ bên dưới còn khuyết chữ cái. Trẻ quan sát tranh, tìm các thẻ chữ cái ${letters} còn thiếu gắn vào đúng vị trí để hoàn thiện từ có nghĩa.\n- **Luật chơi:** Ghép đúng vị trí và phát âm to từ hoàn chỉnh.\n- **Mục tiêu:** Khắc sâu cấu tạo nét của chữ cái, nhận diện chữ cái trong từ hoàn chỉnh gắn với tranh.\n\nTrò chơi 5: SĂN TÌM CHỮ CÁI SÁNG TẠO\n- **Cách chơi:** Cô phân công các nhóm: Nhóm đi săn tìm thẻ chữ ẩn giấu quanh lớp; Nhóm phối hợp 2–3 bạn uốn mình tạo dáng chữ cái; Nhóm dùng hột hạt, sỏi màu, dây len xếp viền thành chữ cái sinh động.\n- **Luật chơi:** Tìm đúng số lượng chữ theo yêu cầu, không tranh giành thẻ của bạn, thuyết minh về chữ cái sáng tạo của nhóm mình.\n- **Mục tiêu:** Phát huy tư duy sáng tạo nghệ thuật, định hướng không gian và tinh thần phối hợp.`,
          studentAction: `- Trẻ hào hứng tham gia lần lượt cả 5 trò chơi chữ cái:\n  + Trò chơi 1: Trẻ tinh mắt, nhanh tay tìm đúng thẻ chữ trong rổ giơ lên và phát âm to, rõ ràng.\n  + Trò chơi 2: Trẻ vừa đi vừa hát, khi nhạc dừng nhanh chân chạy về đúng ngôi nhà chữ cái và đọc to tên chữ.\n  + Trò chơi 3: Trẻ khéo léo bật qua vòng, chọn đúng chữ cái tiếp sức cho đội mình trong tiếng reo hò cổ vũ.\n  + Trò chơi 4: Trẻ chăm chú quan sát tranh, tìm đúng chữ cái còn thiếu gắn vào từ và phát âm từ trọn vẹn.\n  + Trò chơi 5: Trẻ hào hứng săn tìm chữ cái quanh lớp, cùng bạn tạo dáng chữ bằng cơ thể hoặc khéo léo xếp chữ bằng sỏi màu, hột hạt.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-4',
        index: 4,
        name: '4. Mở rộng và phát triển',
        duration: '5 - 7 phút',
        objective: 'Trẻ nhận diện chữ cái trong môi trường thực tế và phân tích cấu tạo nét',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô tăng độ khó:\n  + Cho trẻ quan sát và tìm các chữ cái vừa học xuất hiện trong các từ trên bảng tuyên truyền, góc sách truyện xung quanh lớp.\n  + Đàm thoại phân tích sâu: So sánh điểm giống và khác nhau về cấu tạo nét giữa các chữ cái đã học.\n  + Khuyến khích trẻ tự nghĩ thêm các từ ngữ quen thuộc trong đời sống hàng ngày có chứa các chữ cái vừa học.\n- Cô khích lệ trẻ sáng tạo thêm các cách chơi mới với thẻ chữ cái.`,
          studentAction: `- Trẻ tích cực quan sát không gian lớp học và chỉ ra các chữ cái trong từ trên tranh, góc sách.\n- Trẻ phân tích và nêu rõ đặc điểm nét giống và khác nhau của các chữ cái.\n- Trẻ tự tin kể thêm các từ quen thuộc trong cuộc sống có chứa chữ cái vừa học.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-5',
        index: 5,
        name: '5. Chia sẻ – Đánh giá – Kết thúc chơi',
        duration: '3 - 5 phút',
        objective: 'Trẻ chia sẻ cảm xúc, củng cố phát âm chuẩn xác và cất dọn học cụ gọn gàng',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô trò chuyện đàm thoại củng cố: "Hôm nay các con đã tham gia những trò chơi chữ cái nào?", "Con thích nhất trò chơi nào trong 5 trò chơi hôm nay?", "Chúng mình đã được chơi với những chữ cái gì?".\n- Cho cả lớp đồng thanh phát âm lại rõ ràng, chuẩn xác các chữ cái.\n- Cô nhận xét quá trình chơi, tuyên dương tinh thần đoàn kết, chơi trung thực và sự nhanh nhạy của các đội chơi; trao hoa thưởng/sticker khích lệ.\n- Hướng dẫn trẻ cùng cô thu dọn đồ dùng thẻ chữ, rổ đồ chơi vào đúng nơi quy định của lớp.`,
          studentAction: `- Trẻ hào hứng chia sẻ cảm xúc và kết quả đạt được sau 5 trò chơi.\n- Cả lớp đồng thanh phát âm to, rõ ràng các chữ cái trọng tâm.\n- Trẻ vui sướng đón nhận hoa thưởng và vỗ tay chúc mừng các bạn.\n- Trẻ tự giác cùng cô thu dọn thẻ chữ, rổ đồ dùng cất gọn gàng vào góc lớp.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
    ];
  }

  if (domain.domainType === 'PHYSICAL') {
    return [
      {
        id: 'act-1',
        index: 1,
        name: '1. Khởi động – Tạo hứng thú',
        duration: '3 - 5 phút',
        objective: 'Trẻ hào hứng, khởi động các nhóm cơ chuẩn bị vận động',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cho trẻ đi vòng tròn kết hợp các kiểu đi/chạy theo hiệu lệnh và nhạc: đi thường -> đi bằng mũi bàn chân -> đi thường -> đi bằng gót bàn chân -> đi thường -> chạy chậm -> chạy nhanh -> chạy chậm -> đi thường.\n- Cho trẻ xoay các khớp cổ tay, khớp bả vai, hông và khớp gối.\n- Cho trẻ chuyển đội hình về 3 hàng ngang dãn cách đều chuẩn bị tập BTPTC.`,
          studentAction: `- Trẻ chú ý lắng nghe hiệu lệnh của cô và đi/chạy theo vòng tròn nhịp nhàng theo nhạc.\n- Trẻ tích cực xoay đều các khớp cổ tay, bả vai, hông, khớp gối.\n- Trẻ nhanh nhẹn chuyển về 3 hàng ngang dãn cách đều theo hiệu lệnh.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-2',
        index: 2,
        name: '2. Khám phá – Trải nghiệm nhiệm vụ vận động.',
        duration: '5 - 7 phút',
        objective: 'Trẻ tập bài tập phát triển chung và làm quen sơ đồ vận động',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `* Bài tập phát triển chung:\n- Tập theo nhạc bài hát chủ đề:\n+ Tay: Hai tay đưa ra trước, lên cao (2 lần x 8 nhịp).\n+ Bụng: Hai tay giơ cao, cúi gập người chạm mũi bàn chân (2 lần x 8 nhịp).\n+ Chân: Hai tay chống hông, khuỵu gối bật nhẹ (2 lần x 8 nhịp).\n+ Bật: Bật tách khép chân tại chỗ (2 lần x 8 nhịp).\n- Cho trẻ chuyển về đội hình 2 hàng đối diện nhau dãn cách cách nhau 3 - 4m.\n* Vận động cơ bản:\n- Cô giới thiệu sơ đồ sân tập và dụng cụ vận động gắn với "${title}".\n- Mời 1 - 2 trẻ lên thử trải nghiệm thực hiện vận động theo cách của mình.`,
          studentAction: `- Trẻ đứng theo hàng dãn cách, lắng nghe nhạc và tập đều các động tác Tay, Bụng, Chân, Bật cùng cô.\n- Trẻ chú ý chuyển đội hình về 2 hàng đối diện nhau theo hiệu lệnh của cô.\n- Trẻ quan sát sơ đồ/dụng cụ và bạn lên thử trải nghiệm thực hiện vận động theo cách của mình.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-3',
        index: 3,
        name: '3. Chia sẻ – Hình thành cách thực hiện',
        duration: '10 - 12 phút',
        objective: 'Trẻ nắm vững kỹ thuật vận động cơ bản đúng tư thế',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô mời trẻ chia sẻ cách thực hiện, cảm nhận sau khi quan sát bạn thử vận động.\n- Cô chuẩn hóa và làm mẫu vận động cơ bản:\n  + Lần 1: Làm mẫu toàn phần không giải thích để trẻ hình dung trọn vẹn.\n  + Lần 2: Làm mẫu kết hợp phân tích kỹ thuật vận động chi tiết, nhấn mạnh tư thế chuẩn bị và phối hợp tay chân nhịp nhàng.\n  + Lần 3: Nhấn mạnh điểm mấu chốt kỹ thuật và chú ý an toàn.\n- Mời 2 trẻ khá lên thực hiện lại để cô và cả lớp cùng quan sát, chuẩn hóa.`,
          studentAction: `- Trẻ chú ý lắng nghe bạn chia sẻ cảm nhận.\n- Trẻ chăm chú quan sát cô làm mẫu từng động tác và lắng nghe cô phân tích kỹ thuật.\n- Trẻ nhận xét bạn lên làm mẫu và ghi nhớ các bước thực hiện đúng.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-4',
        index: 4,
        name: '4. Thực hành – Vận dụng',
        duration: '8 - 10 phút',
        objective: 'Trẻ luyện tập vận động thuần thục và hào hứng chơi trò chơi vận động',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Tổ chức cho trẻ thực hành vận động:\n  + Lần 1: Cho lần lượt từng trẻ ở 2 hàng lên thực hiện (cô quan sát, sửa sai kịp thời).\n  + Lần 2: Cho 2 trẻ cùng thực hiện nối tiếp nhau theo hiệu lệnh.\n  + Lần 3: Thi đua giữa 2 tổ với hình thức tiếp sức vui nhộn.\n- Trò chơi vận động củng cố: Cô giới thiệu trò chơi vận động sôi nổi, phổ biến cách chơi và luật chơi, bao quát động viên trẻ tham gia hết mình.`,
          studentAction: `- Từng nhóm trẻ lần lượt lên thực hiện vận động đúng kỹ thuật theo sự hướng dẫn của cô.\n- Trẻ hào hứng thi đua giữa các tổ, biết phối hợp và cổ vũ bạn cùng đội.\n- Trẻ tham gia trò chơi vận động sôi nổi, tuân thủ đúng luật chơi và reo vui khi đội mình chiến thắng.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-5',
        index: 5,
        name: '5. Chia sẻ – Đánh giá và Hồi tĩnh',
        duration: '3 - 5 phút',
        objective: 'Trẻ thả lỏng cơ thể, chia sẻ cảm xúc sau giờ tập',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô trò chuyện thân mật, hỏi cảm nhận của trẻ sau giờ học thể chất: "Con cảm thấy cơ thể mình thế nào? Con thích bài tập nào nhất?".\n- Cô nhận xét, tuyên dương tinh thần cố gắng và sự khéo léo của các bé.\n- Hồi tĩnh: Cho trẻ đi nhẹ nhàng 1 - 2 vòng quanh sân theo nền nhạc êm dịu, làm động tác chim bay thả lỏng các cơ và hít thở sâu.`,
          studentAction: `- Trẻ hào hứng chia sẻ cảm nhận cơ thể khỏe khoắn, vui tươi sau giờ học.\n- Trẻ vỗ tay tự khen ngợi sự nỗ lực của bản thân và các bạn.\n- Trẻ nhẹ nhàng thả lỏng chân tay, hít thở sâu theo giai điệu nhạc êm dịu.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
    ];
  }

  if (domain.domainType === 'PLAY_INDOOR') {
    const isOld5Step = (subject || '').includes('Bản cũ') || (subject || '').trim() === 'HOẠT ĐỘNG VUI CHƠI TRONG LỚP' || (title || '').toLowerCase().includes('bản cũ') || (title || '').toLowerCase().includes('truyền thống') || (title || '').toLowerCase().includes('5 bước');
    
    if (isOld5Step) {
      // HOẠT ĐỘNG VUI CHƠI TRONG LỚP (BẢN CŨ / TRUYỀN THỐNG 5 BƯỚC)
      return [
        {
          id: 'act-1',
          index: 1,
          name: '1. Ổn định tổ chức và trò chuyện chủ đề',
          duration: '3 - 5 phút',
          objective: 'Trẻ hào hứng, tập trung và chuẩn bị tâm thế bước vào giờ hoạt động góc',
          step1: {
            title: '1. Ổn định tổ chức và trò chuyện chủ đề',
            teacherAction: `- Cô cùng trẻ hát và vận động theo bài hát chủ đề (ví dụ "Trường chúng cháu là trường mầm non" / "Đố bạn").\n- Trò chuyện dẫn dắt gợi mở cảm xúc về chủ đề: "${title}".\n- Giới thiệu các góc chơi sẽ mở trong buổi chơi hôm nay.`,
            studentAction: `- Trẻ vui tươi hát và vận động theo giai điệu bài hát cùng cô.\n- Trẻ hào hứng trả lời câu hỏi và đón chờ giờ chơi.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
        {
          id: 'act-2',
          index: 2,
          name: '2. Thỏa thuận trước khi chơi',
          duration: '5 - 7 phút',
          objective: 'Trẻ tự chọn góc chơi, nhận vai chơi và thống nhất nội quy chơi',
          step1: {
            title: '2. Thỏa thuận trước khi chơi',
            teacherAction: `- Hướng dẫn trẻ thỏa thuận nội dung chơi tại các góc: Góc Phân vai, Góc Xây dựng, Góc Nghệ thuật, Góc Học tập - Khám phá.\n- Cho trẻ tự nguyện nhận vai chơi và chọn góc chơi yêu thích.\n- Nhắc nhở quy tắc chơi văn minh: Đoàn kết, nhường nhịn, không ném đồ chơi, nói năng nhẹ nhàng.\n- Cho trẻ nhẹ nhàng di chuyển về góc chơi đã nhận.`,
            studentAction: `- Trẻ tự tin giơ tay lựa chọn góc chơi và nhận vai diễn yêu thích.\n- Trẻ ghi nhớ và nhắc lại quy tắc chơi văn minh cùng cô.\n- Trẻ nhẹ nhàng di chuyển về các góc chơi.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
        {
          id: 'act-3',
          index: 3,
          name: '3. Quá trình chơi / Trải nghiệm tại các góc chơi',
          duration: '18 - 22 phút',
          objective: 'Trẻ tích cực thể hiện vai chơi, sáng tạo sản phẩm và giao lưu liên góc',
          step1: {
            title: '3. Quá trình chơi / Trải nghiệm tại các góc chơi',
            teacherAction: `- Cô bao quát toàn lớp, hỗ trợ các góc chơi và đóng vai người chơi gợi mở liên kết giữa các góc:\n  + Góc Nghệ thuật: Hướng dẫn trẻ vẽ, xé dán, nặn, biểu diễn văn nghệ theo chủ đề.\n  + Góc Học tập: Hướng dẫn trẻ phân loại đồ vật, ghép tranh, xem truyện tranh.\n  + Góc Phân vai: Hướng dẫn mẹ bế con, bác sĩ khám bệnh, người bán hàng niềm nở.\n  + Góc Xây dựng: Gợi ý các bác thợ xây lắp ghép công trình vững chắc, đẹp mắt.`,
            studentAction: `- Trẻ say sưa thực hiện nhiệm vụ ở từng góc chơi, trao đổi rôm rả với bạn.\n- Trẻ nhập vai tự nhiên, cử chỉ ân cần, giao tiếp lễ phép và liên kết sôi nổi giữa các góc.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
        {
          id: 'act-4',
          index: 4,
          name: '4. Nhận xét sau khi chơi',
          duration: '4 - 6 phút',
          objective: 'Trẻ tham quan góc chơi nổi bật, chia sẻ sản phẩm và lắng nghe nhận xét',
          step1: {
            title: '4. Nhận xét sau khi chơi',
            teacherAction: `- Cô báo hiệu hết giờ chơi, tập trung trẻ lại.\n- Dẫn cả lớp đến tham quan 1 - 2 góc chơi nổi bật trong ngày.\n- Mời đại diện góc tự tin giới thiệu công trình/sản phẩm; các bạn góc khác nhận xét.\n- Cô nhận xét chung, khen ngợi tinh thần đoàn kết, sáng tạo và ý thức giữ gìn đồ chơi.`,
            studentAction: `- Trẻ dừng tay khi nghe hiệu lệnh hết giờ và tập trung quanh cô.\n- Đại diện góc tự tin thuyết minh về công trình của mình.\n- Trẻ chăm chú lắng nghe, vỗ tay tuyên dương bạn.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
        {
          id: 'act-5',
          index: 5,
          name: '5. Kết thúc và thu dọn đồ chơi',
          duration: '3 - 5 phút',
          objective: 'Trẻ tự giác thu dọn, phân loại đồ chơi ngăn nắp vào đúng nơi quy định',
          step1: {
            title: '5. Kết thúc và thu dọn đồ chơi',
            teacherAction: `- Hướng dẫn và cùng trẻ thu dọn đồ dùng đồ chơi về đúng các góc.\n- Kiểm tra và tuyên dương nề nếp gọn gàng, sạch sẽ của cả lớp.`,
            studentAction: `- Trẻ nhanh nhẹn, tự giác phân loại và cất đồ chơi gọn gàng lên giá kệ.\n- Trẻ vui vẻ xếp hàng chuyển sang hoạt động tiếp theo.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
      ];
    }

    // HOẠT ĐỘNG VUI CHƠI TRONG LỚP 1 (3 BƯỚC MẪU MỚI CHUẨN)
    return [
      {
        id: 'act-1',
        index: 1,
        name: '1. Thỏa thuận trước khi chơi',
        duration: '5 - 7 phút',
        objective: 'Trẻ hứng thú, thảo luận và lựa chọn góc chơi, nhận vai chơi và nắm rõ quy tắc chơi',
        step1: {
          title: '1. Thỏa thuận trước khi chơi',
          teacherAction: `- Ổn định tổ chức: Cô cùng cả lớp hát vang bài hát theo chủ đề (ví dụ "Trường chúng cháu là trường mầm non" / "Đố bạn" / "Cháu yêu cô chú công nhân").\n- Trò chuyện dẫn dắt: Cô trò chuyện về chủ đề "${title}", gợi hỏi trẻ về các ý tưởng chơi hôm nay.\n- Giới thiệu các góc chơi và hướng dẫn trẻ thỏa thuận nội dung chơi:\n  + "Hôm nay lớp mình mở những góc chơi nào các con?" (Góc Nghệ thuật, Góc học tập - khám phá khoa học, Góc Phân vai, Góc Xây dựng).\n  + "Ở Góc Nghệ thuật, các con dự định sẽ tạo ra những sản phẩm gì?" (Vẽ tranh, nặn đồ chơi, hát múa biểu diễn văn nghệ theo chủ đề).\n  + "Ở Góc học tập - khám phá khoa học, các con sẽ khám phá điều gì?" (Phân loại đồ dùng, đếm số lượng, ghép tranh, đọc sách truyện).\n  + "Ở Góc Phân vai, ai sẽ nhận vai gia đình, bác sĩ khám bệnh, người bán hàng/bác cấp dưỡng?".\n  + "Ở Góc Xây dựng, các bác thợ xây sẽ xây dựng công trình gì hôm nay?".\n- Cho trẻ tự nguyện lựa chọn góc chơi và nhận vai chơi mình yêu thích.\n- Thống nhất quy tắc chơi văn minh: Chơi đoàn kết, nói năng nhẹ nhàng, không tranh giành đồ chơi, biết nhường nhịn và hợp tác cùng bạn bè, chơi xong cất dọn đồ chơi đúng nơi quy định của từng góc.\n- Cho trẻ nhẹ nhàng di chuyển về góc chơi đã chọn.`,
          studentAction: `- Cả lớp hát và vận động vui tươi cùng cô theo bài hát chủ đề.\n- Trẻ hào hứng trò chuyện cùng cô, đưa ra các ý tưởng chơi phong phú.\n- Trẻ tự tin giơ tay lựa chọn góc chơi và nhận vai chơi mình yêu thích:\n  + Trẻ thích góc Nghệ thuật: "Con muốn vẽ tranh và nặn đồ chơi theo chủ đề ạ!".\n  + Trẻ thích góc Học tập: "Con muốn làm bài tập phân loại và ghép tranh cùng bạn ạ!".\n  + Trẻ thích góc Phân vai: "Con nhận làm bác sĩ / mẹ nấu ăn chăm sóc gia đình ạ!".\n  + Trẻ thích góc Xây dựng: "Chúng con sẽ cùng nhau xây dựng công trình thật đẹp ạ!".\n- Trẻ đồng thanh nhắc lại các quy tắc chơi văn minh.\n- Trẻ nhẹ nhàng đi về các góc chơi đã nhận.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-2',
        index: 2,
        name: '2. Theo dõi quá trình chơi',
        duration: '20 - 25 phút',
        objective: 'Trẻ tích cực nhập vai, phát huy tính sáng tạo và giao lưu liên kết giữa các góc chơi',
        step1: {
          title: '2. Theo dõi quá trình chơi',
          teacherAction: `Cô bao quát toàn bộ lớp học, quan sát, hỗ trợ và gợi mở tình huống cho từng góc chơi:\n\n* Góc Nghệ thuật:\n- Hoạt động của cô:\n  + Gợi ý trẻ sử dụng các nguyên vật liệu mở (giấy màu, đất nặn, sáp màu, lá cây...) để tạo sản phẩm theo chủ đề "${title}".\n  + Bật nhạc không lời nhẹ nhàng tạo cảm xúc sáng tạo cho trẻ.\n  + Động viên nhóm âm nhạc biểu diễn các bài hát vui tươi.\n- Hoạt động của trẻ:\n  + Trẻ khéo léo vẽ, tô màu, nặn các sản phẩm ngộ nghĩnh đặt lên bảng con.\n  + Nhóm âm nhạc múa hát tự tin, gõ đệm phách tre nhịp nhàng.\n\n* Góc học tập - khám phá khoa học:\n- Hoạt động của cô:\n  + Gợi ý trẻ thực hiện các bài tập phân loại, so sánh, đếm số lượng, ghép hình hoặc làm thí nghiệm đơn giản.\n  + Đặt câu hỏi kích thích tư duy, khám phá của trẻ.\n- Hoạt động của trẻ:\n  + Trẻ say sưa xếp hình, ghép thẻ từ/thẻ số, phân loại đồ dùng chính xác.\n  + Trẻ trao đổi rôm rả với bạn về hiện tượng và kết quả khám phá.\n\n* Góc Phân vai:\n- Hoạt động của cô:\n  + Quan sát sự nhập vai của trẻ, nhập vai chơi khi cần thiết để gợi mở liên kết giữa các góc (ví dụ: cô đóng vai khách hàng đến mua đồ, bác sĩ đến thăm khám).\n  + Hướng dẫn trẻ giao tiếp lễ phép, thân thiện, dùng từ "cảm ơn", "xin chào".\n- Hoạt động của trẻ:\n  + Trẻ thể hiện đúng cử chỉ, hành động của vai diễn (mẹ bế búp bê, bác sĩ khám bệnh, người bán hàng niềm nở).\n  + Trẻ giao tiếp lịch sự và tích cực liên kết với các góc chơi khác.\n\n*(Góc Xây dựng: Trẻ cùng nhau xếp khối gỗ, hàng rào, cây xanh để hoàn thành công trình; cô đến tham quan và khen ngợi tinh thần hợp tác).*`,
          studentAction: `- Trẻ tại Góc Nghệ thuật say sưa sáng tạo sản phẩm, tự hào khoe với bạn tranh vẽ và sản phẩm đất nặn đẹp mắt; nhóm âm nhạc múa hát rộn rã.\n- Trẻ tại Góc Học tập tập trung đếm số lượng, làm bài tập phân loại và cùng bạn xoay ghép các mảnh tranh hoàn chỉnh.\n- Trẻ tại Góc Phân vai nhập vai tự nhiên, cử chỉ ân cần, giọng nói ngọt ngào lễ phép; các vai chơi liên kết sôi nổi.\n- Trẻ góc Xây dựng phối hợp nhịp nhàng, chuyển khối gỗ cho nhau để hoàn thiện công trình to đẹp.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-3',
        index: 3,
        name: '3. Nhận xét sau khi chơi',
        duration: '5 - 8 phút',
        objective: 'Trẻ tham quan chia sẻ sản phẩm, cô nhận xét tuyên dương và cùng trẻ thu dọn đồ chơi ngăn nắp',
        step1: {
          title: '3. Nhận xét sau khi chơi',
          teacherAction: `- Cô dùng hiệu lệnh gõ xắc xô nhẹ nhàng báo hiệu giờ chơi đã kết thúc: "Đã hết giờ chơi rồi, cô mời các con cùng dừng tay nào!".\n- Cô tập trung trẻ lại và dẫn cả lớp đến tham quan góc chơi nổi bật nhất hôm nay.\n- Mời đại diện các góc tự tin giới thiệu về sản phẩm, công trình hoặc vai diễn của nhóm mình.\n- Cho trẻ ở các góc khác nhận xét, đóng góp ý kiến khen ngợi bạn.\n- Cô nhận xét chung toàn bộ buổi chơi:\n  + Tuyên dương tinh thần đoàn kết, sự khéo léo, sáng tạo và ý thức giữ gìn đồ chơi của trẻ.\n  + Động viên, khích lệ những trẻ còn nhút nhát để lần sau tự tin hơn.\n- Cô hướng dẫn và cùng trẻ thu dọn đồ dùng đồ chơi: "Bây giờ chúng mình cùng thu dọn đồ chơi về đúng vị trí thật ngăn nắp nhé!".\n- Cô và trẻ cùng phân loại, cất đồ chơi gọn gàng lên giá kệ của từng góc.`,
          studentAction: `- Trẻ dừng tay ngay khi nghe tiếng xắc xô báo hiệu hết giờ.\n- Trẻ cùng cô đến tham quan các góc chơi trọng tâm.\n- Đại diện các góc tự tin thuyết minh về công trình và sản phẩm của góc mình.\n- Trẻ các góc khác lắng nghe, vỗ tay tán thưởng và chúc mừng bạn.\n- Trẻ chú ý lắng nghe cô nhận xét với nét mặt tươi vui, phấn khởi.\n- Trẻ tự giác, nhanh nhẹn thu dọn đồ dùng đồ chơi, phân loại và xếp ngay ngắn vào đúng nơi quy định của từng góc.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
    ];
  }

  if (domain.domainType === 'OUTDOOR') {
    const isOld5Step = (subject || '').includes('Bản cũ') || (subject || '').trim() === 'HOẠT ĐỘNG NGOÀI TRỜI' || (title || '').toLowerCase().includes('bản cũ') || (title || '').toLowerCase().includes('truyền thống') || (title || '').toLowerCase().includes('5 bước');
    
    if (isOld5Step) {
      // HOẠT ĐỘNG NGOÀI TRỜI (BẢN CŨ / TRUYỀN THỐNG 5 BƯỚC)
      return [
        {
          id: 'act-1',
          index: 1,
          name: '1. Ổn định tổ chức và chuẩn bị',
          duration: '3 - 5 phút',
          objective: 'Kiểm tra sĩ số, trang phục, dặn dò an toàn khi ra sân',
          step1: {
            title: '1. Ổn định tổ chức và chuẩn bị',
            teacherAction: `- Cô tập trung trẻ, kiểm tra sĩ số, trang phục, giày dép, mũ nón đảm bảo gọn gàng, phù hợp thời tiết.\n- Dặn dò quy định an toàn khi ra sân: Đi theo hàng, không xô đẩy, lắng nghe hiệu lệnh của cô.\n- Dẫn dắt tạo hứng thú, cho trẻ xếp hàng nhẹ nhàng ra sân trường.`,
            studentAction: `- Trẻ tập trung chỉnh tề trang phục, lắng nghe cô dặn dò an toàn và vui vẻ xếp hàng ra sân.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
        {
          id: 'act-2',
          index: 2,
          name: '2. Hoạt động có mục đích (Quan sát / Khám phá có chủ đích)',
          duration: '10 - 15 phút',
          objective: 'Trẻ dùng đa giác quan quan sát, tìm hiểu đối tượng ngoài trời',
          step1: {
            title: '2. Hoạt động có mục đích (Quan sát / Khám phá có chủ đích)',
            teacherAction: `- Cho trẻ quây quần quanh đối tượng quan sát (${title}).\n- Đặt câu hỏi gợi mở về đặc điểm, hình dáng, màu sắc, công dụng, ích lợi.\n- Cho trẻ đến gần sờ, ngửi, cảm nhận và nêu nhận xét.\n- Cô chuẩn hóa kiến thức, giáo dục trẻ yêu quý và bảo vệ thiên nhiên/môi trường.`,
            studentAction: `- Trẻ chăm chú quan sát, tự tin trả lời các câu hỏi gợi mở của cô.\n- Trẻ sờ, cảm nhận và trao đổi rôm rả với bạn về đối tượng quan sát.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
        {
          id: 'act-3',
          index: 3,
          name: '3. Trò chơi vận động',
          duration: '6 - 8 phút',
          objective: 'Trẻ rèn luyện thể lực, phản xạ nhanh nhẹn và tinh thần đồng đội',
          step1: {
            title: '3. Trò chơi vận động',
            teacherAction: `- Giới thiệu tên trò chơi vận động phù hợp chủ đề.\n- Phổ biến cách chơi và luật chơi rõ ràng.\n- Tổ chức cho trẻ chơi 2 – 3 lần sôi nổi, bao quát cổ vũ động viên trẻ.`,
            studentAction: `- Trẻ lắng nghe luật chơi và hào hứng tham gia chơi 2 – 3 lần sôi nổi, reo vui cổ vũ bạn.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
        {
          id: 'act-4',
          index: 4,
          name: '4. Chơi tự do',
          duration: '8 - 10 phút',
          objective: 'Trẻ thỏa sức chơi với đồ chơi ngoài trời hoặc trò chơi dân gian yêu thích an toàn',
          step1: {
            title: '4. Chơi tự do',
            teacherAction: `- Giới thiệu khu vực chơi tự do (cầu trượt, xích đu, vẽ phấn trên sân, nhặt lá xếp hình).\n- Dặn dò chơi an toàn, nhường nhịn bạn bè; cô theo sát bao quát toàn sân.`,
            studentAction: `- Trẻ tự chọn khu vực chơi yêu thích, chơi đoàn kết, chia sẻ đồ chơi cùng bạn.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
        {
          id: 'act-5',
          index: 5,
          name: '5. Kết thúc, nhận xét, vệ sinh',
          duration: '3 - 5 phút',
          objective: 'Hồi tĩnh, điểm danh, nhận xét tuyên dương và rửa tay sạch sẽ',
          step1: {
            title: '5. Kết thúc, nhận xét, vệ sinh',
            teacherAction: `- Tập trung trẻ, điểm danh sĩ số.\n- Cho trẻ đi lại nhẹ nhàng hít thở sâu thả lỏng cơ thể.\n- Nhận xét buổi chơi, tuyên dương tinh thần sôi nổi, tự giác của cả lớp.\n- Hướng dẫn trẻ xếp hàng rửa tay bằng xà phòng sạch sẽ và vào lớp.`,
            studentAction: `- Trẻ tập trung quanh cô, thực hiện động tác hồi tĩnh nhẹ nhàng.\n- Trẻ chú ý nghe nhận xét và tự giác xếp hàng rửa tay sạch sẽ trước khi vào lớp.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
      ];
    }

    const isGameFocus = (subject || '').includes('2') || title.toLowerCase().includes('trò chơi') || title.toLowerCase().includes('chuyền bóng') || title.toLowerCase().includes('kéo co') || title.toLowerCase().includes('vận động');
    if (isGameFocus) {
      // MẪU 2: HOẠT ĐỘNG NGOÀI TRỜI 2 (TRÒ CHƠI) - 3 BƯỚC MẪU MỚI
      return [
        {
          id: 'act-1',
          index: 1,
          name: '1. Trước khi chơi',
          duration: '3 - 5 phút',
          objective: 'Kiểm tra trang phục, phổ biến nội dung và dặn dò an toàn khi hoạt động ngoài trời',
          step1: {
            title: '1. Trước khi chơi',
            teacherAction: `- Cô tập trung trẻ thành hàng dọc trên sân trường, kiểm tra sĩ số, trang phục, giày dép của từng trẻ đảm bảo gọn gàng, thuận tiện cho việc chạy nhảy vận động.\n- Cô thông báo nội dung buổi hoạt động ngoài trời hôm nay: Tham gia trò chơi vận động trọng tâm và chơi với các đồ chơi ngoài trời liên hoàn.\n- Cô dặn dò các quy định an toàn khi chơi ngoài sân trường:\n  + Chú ý lắng nghe hiệu lệnh còi và xắc xô của cô.\n  + Không xô đẩy bạn, không chạy quá đà va vào chướng ngại vật.\n  + Chơi trong phạm vi khu vực sân trường đã quy định.`,
            studentAction: `- Trẻ xếp hàng ngay ngắn, kiểm tra lại dây giày, trang phục chỉnh tề.\n- Trẻ chăm chú lắng nghe cô giới thiệu nội dung hoạt động và reo hò thích thú.\n- Trẻ ghi nhớ các quy định an toàn khi chơi ngoài sân trường.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
        {
          id: 'act-2',
          index: 2,
          name: '2. Trong khi chơi',
          duration: '20 - 25 phút',
          objective: 'Trẻ tích cực tham gia trò chơi vận động đúng luật và chơi an toàn với đồ chơi ngoài trời',
          step1: {
            title: '2. Trong khi chơi',
            teacherAction: `* Trò chơi vận động: ${title}\n- **Cách chơi:** Cô chia lớp thành các đội chơi có số lượng bằng nhau, đứng xếp hàng dọc sau vạch xuất phát. Khi có hiệu lệnh còi cùng tiếng nhạc sôi động vang lên, bạn đầu hàng của mỗi đội sẽ thực hiện thao tác vận động (chuyền bóng / bật nhảy / chạy tiếp sức) thật nhanh rồi chạy về đập tay bạn tiếp theo. Cứ như vậy tiếp tục cho đến bạn cuối cùng của đội.\n- **Luật chơi:** Các đội phải thực hiện đúng hiệu lệnh và quy tắc vận động. Đội nào hoàn thành trước mà không phạm quy sẽ là đội chiến thắng. Đội về sau sẽ nhảy lò cò 1 vòng chúc mừng đội bạn.\n- Cô cho 1 nhóm làm mẫu thao tác trước để cả lớp quan sát trực quan.\n- Tổ chức cho trẻ chơi 2 – 3 lần sôi nổi, cô bao quát, cổ vũ, khích lệ tinh thần thi đua hào hứng giữa các đội và đảm bảo an toàn cho trẻ.\n- Sau mỗi lần chơi, cô cùng cả lớp kiểm tra kết quả, tuyên dương đội chiến thắng và động viên đội về sau.\n\n* Chơi với đồ chơi ngoài trời:\n- Cô hướng dẫn trẻ đến các khu vực đồ chơi ngoài trời liên hoàn: cầu trượt, bập bênh, xích đu, thú nhún.\n- Nhắc nhở quy tắc an toàn khi chơi: chơi lần lượt, trượt cầu trượt đúng tư thế ngồi, hai tay bám chắc tay vịn xích đu/bập bênh, nhường nhịn nhau.\n- Trẻ tự chọn đồ chơi mình thích; cô theo sát bao quát toàn sân, luôn quan sát hỗ trợ để đảm bảo an toàn tuyệt đối.`,
            studentAction: `- Trẻ chú ý lắng nghe cô phổ biến chi tiết cách chơi và luật chơi của trò chơi vận động.\n- Trẻ chăm chú quan sát bạn làm mẫu thao tác.\n- Trẻ chia thành các đội thi đấu đầy hào hứng, phối hợp nhịp nhàng, reo hò cổ vũ đồng đội: "Cố lên! Cố lên!".\n- Trẻ chấp hành nghiêm túc luật chơi, đoàn kết và chúc mừng đội bạn.\n- Trẻ di chuyển về các khu vực đồ chơi ngoài trời yêu thích: chơi cầu trượt trật tự, xếp hàng chờ đến lượt, bám chắc tay vịn xích đu, chơi vui vẻ và hòa thuận cùng bạn.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
        {
          id: 'act-3',
          index: 3,
          name: '3. Sau khi chơi',
          duration: '3 - 5 phút',
          objective: 'Hồi tĩnh, nhận xét tuyên dương, thu dọn đồ dùng và vệ sinh sạch sẽ',
          step1: {
            title: '3. Sau khi chơi',
            teacherAction: `- Cô thổi còi / gõ xắc xô tập hợp trẻ về vị trí tập trung.\n- Cô điểm danh, kiểm tra lại sĩ số và trang phục của trẻ.\n- Hồi tĩnh: Cho trẻ làm động tác chim bay, đi lại nhẹ nhàng 1 - 2 vòng quanh sân trường hít thở sâu để điều hòa nhịp tim và thả lỏng cơ bắp.\n- Nhận xét buổi chơi: Khen ngợi tinh thần thi đua nhanh nhẹn, khéo léo của các đội trong trò chơi vận động và ý thức chơi an toàn, đoàn kết của cả lớp.\n- Hướng dẫn trẻ cùng cô cất đồ dùng vào rổ, xếp hàng trật tự đến khu vực bồn rửa tay, rửa tay bằng xà phòng sạch sẽ và bước vào lớp học.`,
            studentAction: `- Trẻ nhanh chóng tập trung quanh cô khi có hiệu lệnh còi.\n- Trẻ thực hiện các động tác hồi tĩnh nhẹ nhàng theo cô, hít thở sâu thả lỏng cơ thể.\n- Trẻ tươi cười lắng nghe cô nhận xét và vỗ tay tuyên dương cả lớp.\n- Trẻ cùng cô cất đồ dùng, xếp hàng rửa tay sạch sẽ bằng xà phòng và vào lớp.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
      ];
    } else {
      // MẪU 1: HOẠT ĐỘNG NGOÀI TRỜI 1 (QUAN SÁT) - 3 BƯỚC MẪU MỚI
      return [
        {
          id: 'act-1',
          index: 1,
          name: '1. Trước khi quan sát',
          duration: '3 - 5 phút',
          objective: 'Kiểm tra sĩ số, trang phục, dặn dò an toàn và tạo hứng thú trước khi ra sân',
          step1: {
            title: '1. Trước khi quan sát',
            teacherAction: `- Cô tập trung trẻ, kiểm tra sĩ số, kiểm tra sức khỏe và trang phục, giày dép, mũ nón của trẻ đảm bảo gọn gàng, an toàn, phù hợp thời tiết.\n- Cô dặn dò các quy định an toàn khi ra sân:\n  + Đi thành hàng ngay ngắn, không chen lấn xô đẩy bạn.\n  + Lắng nghe hiệu lệnh của cô, không tự ý chạy ra khỏi khu vực quy định của lớp.\n  + Không ngắt lá, bẻ cành, không nghịch đất cát văng vào mắt bạn.\n- Cô dẫn dắt tạo hứng thú: Cho cả lớp cùng đọc bài thơ / hát bài hát theo chủ đề và nhẹ nhàng dắt tay nhau ra sân trường đến vị trí quan sát.`,
            studentAction: `- Trẻ tập trung quanh cô, kiểm tra lại giày dép, trang phục ngay ngắn.\n- Trẻ chú ý lắng nghe cô dặn dò các quy định an toàn khi ra sân.\n- Trẻ đọc thơ/hát vui tươi cùng cô và xếp hàng nhẹ nhàng di chuyển ra sân trường.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
        {
          id: 'act-2',
          index: 2,
          name: '2. Trong khi quan sát',
          duration: '20 - 25 phút',
          objective: 'Trẻ trực tiếp quan sát đối tượng bằng đa giác quan, chơi TCVĐ sôi nổi và chơi tự do an toàn',
          step1: {
            title: '2. Trong khi quan sát',
            teacherAction: `* Quan sát ${title}:\n- Cho trẻ đứng quây quần xung quanh đối tượng ở vị trí thoáng mát, thuận tiện quan sát.\n- Đặt câu hỏi gợi mở kích thích trẻ sử dụng các giác quan để quan sát, sờ, cảm nhận:\n  + "Các con nhìn xem hôm nay chúng mình cùng quan sát điều gì đây?"\n  + "Đối tượng có những bộ phận/đặc điểm nổi bật nào?" (Màu sắc, hình dáng, kích thước, cấu tạo...).\n  + Cho trẻ đến gần sờ, ngắm nhìn và nêu cảm nhận thực tế.\n  + "Điều này mang lại ích lợi gì cho cuộc sống và môi trường trường lớp của chúng mình?".\n  + "Chúng mình cần làm gì để chăm sóc, giữ gìn và bảo vệ?".\n- Cô chuẩn hóa kiến thức khoa học đơn giản, khen ngợi câu trả lời của trẻ và giáo dục tình yêu thiên nhiên.\n\n* TCVĐ: Bỏ dẻ (hoặc Trò chơi vận động phù hợp chủ đề)\n- Cô giới thiệu tên trò chơi vận động.\n- Phổ biến cách chơi và luật chơi rõ ràng, dễ hiểu.\n- Tổ chức cho trẻ chơi 2 – 3 lần sôi nổi, cô bao quát cổ vũ động viên trẻ tham gia hết mình và đảm bảo an toàn.\n- Nhận xét, tuyên dương tinh thần nhanh nhẹn của trẻ.\n\n* Chơi tự do:\n- Cô giới thiệu các khu vực chơi tự do: chơi với đồ chơi ngoài trời liên hoàn (cầu trượt, bập bênh, đu quay), vẽ phấn trên sân, nhặt lá rụng xếp hình.\n- Dặn dò trẻ chơi hòa thuận, không tranh giành đồ chơi, biết nhường nhịn và chơi an toàn.\n- Cô luôn bao quát toàn sân, theo sát hỗ trợ để đảm bảo an toàn tuyệt đối cho trẻ.`,
            studentAction: `- Trẻ đứng quây quần bên cô, chăm chú quan sát đối tượng.\n- Trẻ tự tin trả lời các câu hỏi gợi mở của cô, chia sẻ cảm nhận và phát hiện của mình.\n- Trẻ đến gần dùng tay sờ, cảm nhận và lắng nghe lời cô dặn dò về ý thức bảo vệ môi trường.\n- Trẻ chú ý lắng nghe cô phổ biến cách chơi, luật chơi của trò chơi vận động.\n- Cả lớp hào hứng tham gia chơi 2 – 3 lần sôi nổi, tuân thủ đúng luật chơi và reo vui cổ vũ bạn bè.\n- Trẻ tự chọn khu vực chơi tự do yêu thích, chơi đoàn kết, chia sẻ đồ chơi cùng bạn.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
        {
          id: 'act-3',
          index: 3,
          name: '3. Sau khi quan sát',
          duration: '3 - 5 phút',
          objective: 'Tập trung trẻ, nhận xét tuyên dương, chia sẻ cảm xúc và vệ sinh sạch sẽ',
          step1: {
            title: '3. Sau khi quan sát',
            teacherAction: `- Cô rung xắc xô tập trung trẻ lại thành vòng tròn.\n- Cô điểm danh, kiểm tra lại sĩ số và trang phục của trẻ.\n- Cô trò chuyện hỏi cảm nhận của trẻ sau buổi hoạt động ngoài trời.\n- Cô nhận xét chung, biểu dương tinh thần tham gia sôi nổi, tính tự giác và sự đoàn kết của cả lớp.\n- Cô hướng dẫn trẻ xếp hàng lần lượt đi rửa tay bằng xà phòng sạch sẽ, lau khô tay và chỉnh trang trang phục bước vào lớp học.`,
            studentAction: `- Trẻ nhanh chóng tập trung quanh cô khi nghe tiếng xắc xô.\n- Trẻ điểm danh to rõ ràng và tự tin chia sẻ cảm xúc hào hứng của bản thân.\n- Trẻ chú ý lắng nghe cô nhận xét và đón nhận lời khen ngợi.\n- Trẻ tự giác xếp hàng ngay ngắn, rửa tay bằng xà phòng sạch sẽ và theo cô bước vào lớp học.`,
            productExpected: '',
            digitalOrAiTool: '',
          },
        },
      ];
    }
  }

  if (domain.domainType === 'SKILLS') {
    // GIÁO ÁN TÌNH CẢM - XÃ HỘI / KỸ NĂNG SỐNG
    return [
      {
        id: 'act-1',
        index: 1,
        name: '1. Khởi động – Tạo hứng thú và giao nhiệm vụ',
        duration: '3 - 5 phút',
        objective: 'Trẻ hứng thú, tập trung và chuẩn bị tâm thế bước vào hoạt động',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô cùng cả lớp hát và vận động theo giai điệu vui tươi của bài hát chủ đề (ví dụ "Trường chúng cháu là trường mầm non", "Lời chào của bé"...).\n- Cô tạo tình huống gây bất ngờ với "Chiếc hộp bí mật" hoặc video giới thiệu sinh động gắn liền với nội dung "${title}".\n- Cô trò chuyện gợi mở cảm xúc: "Các con có cảm thấy vui và tò mò về điều kỳ diệu hôm nay không?".\n- Cô dẫn dắt nhẹ nhàng, giới thiệu đề tài và giao nhiệm vụ trải nghiệm cho trẻ.`,
          studentAction: `- Trẻ cùng cô hát và nhún nhảy theo giai điệu bài hát vui nhộn.\n- Trẻ ngắm nhìn chiếc hộp bí mật, hào hứng đoán xem bên trong có gì.\n- Trẻ sẵn sàng tinh thần cùng cô bước vào hoạt động khám phá.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-2',
        index: 2,
        name: '2. Khám phá – Trải nghiệm',
        duration: '8 - 10 phút',
        objective: 'Trẻ được trực tiếp quan sát, trải nghiệm qua các trạm hoạt động',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô tạo điều kiện cho trẻ tự do chia thành các nhóm nhỏ (4 - 5 trẻ/nhóm) về các trạm trải nghiệm theo sở thích liên quan đến "${title}":\n  + Trạm 1 (Góc Quan sát & Tranh ảnh / Video thực tế): Trẻ quan sát các hình ảnh thực tế, mô hình và góc quen thuộc liên quan đến "${title}".\n  + Trạm 2 (Góc Trò chuyện & Tương tác xã hội): Trẻ cùng bạn trao đổi về các hành vi, tình cảm, sự chăm sóc và những kỷ niệm đáng nhớ.\n  + Trạm 3 (Góc Thực hành trải nghiệm): Trẻ thực hành các hành động cụ thể, cùng bạn sắp xếp, trang trí hoặc nhập vai tình huống đẹp.\n- Cô đến từng trạm quan sát, gợi mở câu hỏi kích thích tư duy và cảm xúc của trẻ: "Con thấy điều gì ở đây?", "Hành động này mang lại niềm vui gì cho mọi người?".`,
          studentAction: `- Trẻ hào hứng chia về các trạm theo ý thích:\n  + Tại Trạm 1: Trẻ sờ, ngắm nhìn tranh ảnh, chia sẻ với bạn những gì mình thấy.\n  + Tại Trạm 2: Trẻ trao đổi, kể cho bạn nghe những điều mình biết về "${title}".\n  + Tại Trạm 3: Trẻ cùng bạn phối hợp thực hiện các thao tác, sắp xếp đồ dùng gọn gàng.\n- Trẻ bộc lộ cảm xúc vui tươi, gắn kết cùng bạn bè.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-3',
        index: 3,
        name: '3. Chia sẻ - Thảo luận',
        duration: '10 - 12 phút',
        objective: 'Trẻ tự tin bộc lộ cảm xúc, chuẩn hóa kiến thức và hành vi xã hội tích cực',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô gõ xắc xô nhẹ nhàng, mời trẻ quây quần ngồi thành vòng tròn đầm ấm bên cô.\n- Cô đặt câu hỏi khơi gợi để trẻ tự tin nói ra suy nghĩ và cảm xúc của mình về "${title}":\n  + "Qua trải nghiệm vừa rồi, con đã phát hiện ra điều gì thú vị?"\n  + "Để thể hiện tình cảm yêu thương, chúng mình cần làm những việc gì?"\n  + "Những hành động nào giúp lớp mình, mọi người xung quanh luôn vui vẻ, hạnh phúc?"\n- Cô trình chiếu hình ảnh/video chuẩn hóa kiến thức, đàm thoại làm rõ ý nghĩa.\n- Cô khái quát, giáo dục bài học tình cảm: Biết yêu quý, kính trọng người lớn, đoàn kết và sẻ chia cùng bạn bè trong cuộc sống.`,
          studentAction: `- Trẻ nhanh nhẹn về ngồi quây quần xung quanh cô với nét mặt rạng rỡ.\n- Trẻ mạnh dạn giơ tay chia sẻ trải nghiệm ở các trạm và cảm xúc của mình.\n- Trẻ chú ý xem tranh/video và lắng nghe cô đàm thoại, giảng giải.\n- Trẻ tiếp thu lời cô dạy, biết nói lời cảm ơn, xin lỗi và thể hiện tình yêu thương.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-4',
        index: 4,
        name: '4. Vận dụng và mở rộng',
        duration: '6 - 8 phút',
        objective: 'Trẻ tự tin áp dụng kỹ năng xã hội, tham gia trò chơi vận động tập thể có luật rõ ràng',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô hướng dẫn, dẫn dắt sư phạm cụ thể trước khi vào trò chơi:\n  + Cô tổ chức trò chơi trải nghiệm “Hướng dẫn viên nhí”: Cô đóng vai khách tham quan, mời các nhóm trẻ đóng vai hướng dẫn viên giới thiệu về các khu vực, góc chơi trong lớp và trường mầm non.\n  + Mời 1 - 2 trẻ tự tin kể tên cô giáo chủ nhiệm của mình và kể tên một số bạn học thân thiết trong lớp.\n  + Cô giới thiệu thêm cho trẻ biết trong trường/điểm trường còn có các cô giáo khác, hỏi trẻ tên trường mầm non nơi trẻ đang học và cô giới thiệu thêm tên cô hiệu trưởng, cô hiệu phó của trường mầm non.\n  + Cô bao quát, cổ vũ và khen ngợi sự tự tin, tinh thần hợp tác của các nhóm trước khi vào trò chơi củng cố.\n\n+ Trò chơi: “Ai nhanh, bạn trai hay bạn gái”\n- **Mục tiêu:** Củng cố sự hiểu biết về bản thân, bạn bè, giới tính và tinh thần đoàn kết tập thể; rèn luyện khả năng quan sát, phản xạ nhanh nhẹn theo hiệu lệnh, tính kỷ luật và niềm vui gắn kết cho trẻ mầm non.\n- **Chuẩn bị:** Sân lớp rộng rãi, các ô hình tròn (dành cho bạn trai) và ô hình vuông (dành cho bạn gái) được bố trí rõ ràng trên sàn, nhạc bài hát "Ngày vui của bé".\n- **Cách chơi:** Cô và các con cùng nắm tay nhau đi vòng tròn, vừa đi vừa hát vang bài hát "Ngày vui của bé". Các con chú ý lắng tai nghe thật kỹ hiệu lệnh của cô nhé! Khi cô hô to hiệu lệnh "Tạo nhóm! Tạo nhóm!", các bạn trai sẽ nhanh chân chạy về ô hình tròn, còn các bạn gái sẽ nhanh chân chạy về ô hình vuông (hoặc ngược lại). Sau khi đã về đúng nhóm của mình, các con hãy cùng gọi tên các bạn trong nhóm và bắt tay chào nhau thật vui vẻ nhé!\n- **Luật chơi:** Bạn nào về sai nhóm hoặc không về được đúng nhóm theo hiệu lệnh của cô sẽ phải nhảy lò cò 1 vòng quanh nhóm để tìm về đúng bạn của mình. Nhóm nào về nhanh, đúng và đoàn kết nhất sẽ được cô và cả lớp vỗ tay hoan hô khen ngợi.\n- Tổ chức cho trẻ chơi 2 – 3 lần sôi nổi (Cô bao quát, khích lệ trẻ, có thể đổi hiệu lệnh nhóm bạn mặc áo màu đỏ/màu vàng, hoặc đổi vị trí hình để rèn phản xạ linh hoạt cho trẻ).`,
          studentAction: `- Trẻ tự tin đóng vai hướng dẫn viên nhí, hào hứng giới thiệu về trường lớp với khách tham quan (cô giáo) theo từng nhóm:\n  + Nhóm 1: "Ôi sân trường rộng quá, có nhiều cây xanh và bồn hoa đẹp lắm ạ!".\n  + Nhóm 2: "Đây là góc sách, còn kia là góc xây dựng của chúng con với nhiều khối gỗ đẹp ạ!".\n  + Nhóm 3: "Đây là khu nhà bóng, bên kia là khu vực cầu trượt chúng con rất thích chơi ạ!".\n- Trẻ tự do đặt câu hỏi cho cô và bạn, tự tin kể tên cô giáo chủ nhiệm, cô hiệu trưởng và các bạn trong lớp.\n- Trẻ chăm chú lắng nghe cô phổ biến mục tiêu, cách chơi và luật chơi của trò chơi “Ai nhanh, bạn trai hay bạn gái”.\n- Trẻ hào hứng tham gia chơi 2 – 3 lần sôi nổi: Vừa đi vòng tròn vừa hát vang bài hát, khi có hiệu lệnh trẻ nhanh nhẹn chạy về đúng nhóm của mình và gọi tên bạn thân trong nhóm.\n- Trẻ chấp hành nghiêm túc luật chơi, vui vẻ nhảy lò cò khi phạm quy và nhiệt tình cổ vũ đồng đội.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-5',
        index: 5,
        name: '5. Đánh giá – Điều chỉnh',
        duration: '3 - 5 phút',
        objective: 'Trẻ chia sẻ cảm xúc sau buổi học, hình thành thói quen ngăn nắp tự giác',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô tập trung trẻ lại, trò chuyện hỏi cảm xúc gợi mở của trẻ:\n  + "Hôm nay các con cảm thấy thế nào sau buổi học?"\n  + "Con thích nhất hoạt động nào hay góc chơi nào trong ngày hôm nay?"\n  + "Con sẽ làm gì để trường Mầm non của chúng mình luôn sạch đẹp, lớp học luôn chan hòa tình yêu thương?"\n- Cô nhận xét, tuyên dương sự cố gắng, tinh thần tự giác, tự tin và sự đoàn kết giúp đỡ bạn bè của trẻ trong suốt buổi học.\n- Cô hướng dẫn trẻ cùng cô thu dọn giáo cụ, phân loại đồ dùng đồ chơi vào đúng góc quy định, củng cố nề nếp vệ sinh sạch sẽ lớp học.`,
          studentAction: `- Trẻ tự tin chia sẻ cảm xúc, niềm vui khi được khám phá về trường lớp và bạn bè: "Con rất vui và yêu quý trường lớp, cô giáo và các bạn ạ!".\n- Trẻ tích cực trả lời các câu hỏi liên hệ thực tế: "Con sẽ cùng các bạn giữ gìn trường lớp sạch đẹp, không vứt rác bừa bãi và luôn vâng lời cô giáo ạ!".\n- Trẻ tươi cười đón nhận lời khen ngợi của cô và vỗ tay chúc mừng cả lớp.\n- Trẻ tự giác cùng cô và các bạn thu dọn đồ dùng, học liệu, xếp ngăn nắp vào đúng góc quy định.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
    ];
  }

  if (domain.domainType === 'SCIENCE') {
    // KHÁM PHÁ KHOA HỌC
    return [
      {
        id: 'act-1',
        index: 1,
        name: '1. Khởi động – Tạo hứng thú và giao nhiệm vụ',
        duration: '3 - 5 phút',
        objective: 'Khơi gợi trí tò mò, khám phá khoa học của trẻ',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô tạo tình huống bất ngờ với "Chiếc túi kỳ diệu" / một thí nghiệm nhỏ khơi gợi sự tò mò gắn với "${title}".\n- Cô đặt câu hỏi kích thích óc quan sát: "Các con có nhìn thấy điều gì kỳ lạ vừa xảy ra không?".\n- Dẫn dắt trẻ vào hành trình khám phá khoa học hôm nay.`,
          studentAction: `- Trẻ tập trung chú ý, quan sát hiện tượng và hào hứng phán đoán.\n- Trẻ sôi nổi đưa ra ý kiến của mình và háo hức muốn tự tay làm thử.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-2',
        index: 2,
        name: '2. Khám phá – Trải nghiệm',
        duration: '8 - 10 phút',
        objective: 'Trẻ trực tiếp trải nghiệm, thực hành thí nghiệm bằng đa giác quan',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Chia trẻ về các nhóm khám phá, cung cấp đồ dùng học liệu thí nghiệm/vật thật liên quan đến "${title}".\n- Hướng dẫn trẻ sử dụng các giác quan (mắt nhìn, tai nghe, tay sờ, mũi ngửi...) để quan sát và khám phá đặc điểm, sự biến đổi.\n- Cô đi lại gợi mở câu hỏi khám phá: "Con thấy vật này thế nào?", "Khi làm như vậy thì điều gì xuất hiện?".`,
          studentAction: `- Trẻ về nhóm, chủ động sờ, ngửi, quan sát và thao tác với học liệu:\n  + Nhóm 1: Trẻ hào hứng quan sát hiện tượng và trao đổi rôm rả cùng bạn.\n  + Nhóm 2: Trẻ tự tay thực hiện thao tác thử nghiệm và reo vui khi thấy sự thay đổi.\n  + Nhóm 3: Trẻ chăm chú ghi nhận kết quả và đối chiếu cùng cô.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-3',
        index: 3,
        name: '3. Chia sẻ - Thảo luận',
        duration: '10 - 12 phút',
        objective: 'Trẻ báo cáo kết quả quan sát, cô chuẩn hóa kiến thức khoa học',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Tập trung trẻ, mời đại diện các nhóm chia sẻ kết quả khám phá / thí nghiệm.\n- Cô đàm thoại phân tích, giải thích bản chất hiện tượng khoa học bằng slide/hình ảnh trực quan dễ hiểu.\n- Chuẩn hóa kiến thức khoa học cốt lõi phù hợp với lứa tuổi.`,
          studentAction: `- Trẻ tự tin chia sẻ những gì nhóm mình phát hiện được.\n- Trẻ chú ý quan sát hình ảnh chuẩn hóa của cô và đối chiếu với kết quả thực hành.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-4',
        index: 4,
        name: '4. Vận dụng – Mở rộng',
        duration: '6 - 8 phút',
        objective: 'Trẻ áp dụng kiến thức vào trò chơi khoa học sáng tạo và trò chơi vận động có luật rõ ràng',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô hướng dẫn, dẫn dắt sư phạm trước khi vào trò chơi:\n  + Cô tổ chức hoạt động trải nghiệm mở rộng đóng vai "Nhà khoa học nhí" / thực hành ứng dụng khoa học vào thực tế quanh lớp học.\n  + Mời đại diện 1 - 2 nhóm trẻ giới thiệu về phát hiện khoa học, hiện tượng biến đổi hoặc các vật dụng mà nhóm vừa khám phá.\n  + Cô đàm thoại gợi mở ứng dụng thực tế: "Trong cuộc sống hằng ngày, các con thấy điều kỳ diệu này xuất hiện ở những đâu?".\n  + Cô bao quát, cổ vũ và khen ngợi tinh thần say mê tìm tòi, hợp tác tích cực của các nhóm trước khi bước vào phần trò chơi củng cố.\n\n+ Trò chơi: “Ai nhanh hơn – Đội nào giỏi nhất”\n- **Mục tiêu:** Củng cố kiến thức khoa học cốt lõi trẻ vừa khám phá (nhận biết đặc điểm, phân loại đúng đối tượng/hiện tượng khoa học); rèn luyện kỹ năng quan sát, thao tác nhanh nhẹn, tinh thần đồng đội, tính kỷ luật và phản xạ tự tin cho trẻ mầm non.\n- **Chuẩn bị:** Vạch xuất phát, các vòng thể dục bật nhảy tiếp sức, rổ đựng thẻ tranh/vật thật khoa học theo yêu cầu, bảng từ gắn kết quả của các đội, nhạc nền sôi động.\n- **Cách chơi:** Cô chia lớp mình thành 2 đội chơi xuất sắc có số lượng bạn bằng nhau, đứng xếp hàng trước vạch xuất phát nhé! Phía trước mỗi đội là con đường vòng thể dục và một rổ đựng thẻ tranh/vật thật khoa học. Khi bản nhạc sôi động vang lên và có hiệu lệnh xuất phát của cô, bạn đầu hàng của mỗi đội sẽ bật liên tục qua các vòng thể dục, nhanh chân chạy lên bàn chọn đúng 1 thẻ hình ảnh/vật thật theo yêu cầu khoa học gắn lên bảng của đội mình. Sau đó, các con nhanh chân chạy về cuối hàng đập nhẹ vào tay bạn tiếp theo để bạn tiếp tục lên chơi nhé! Trò chơi sẽ kết thúc khi bản nhạc dừng lại!\n- **Luật chơi:** Mỗi lượt lên chơi, mỗi bạn chỉ được chọn đúng 1 thẻ tranh/vật thật. Bạn nào chọn sai hoặc dẫm chân vào viền vòng thể dục thì lượt đó sẽ không được tính điểm. Đội nào chọn đúng và gắn được nhiều thẻ nhất sẽ là đội chiến thắng. Đội về sau sẽ cùng nhau làm động tác mô phỏng chú ếch nhảy / chú chim bay vui nhộn để chúc mừng đội bạn.\n- Tổ chức cho trẻ chơi 2 – 3 lần sôi nổi (Cô bao quát, cổ vũ tinh thần các đội, đổi tranh ảnh/nhiệm vụ phân loại có độ khó tăng dần ở lượt chơi sau).`,
          studentAction: `- Trẻ tự tin đóng vai nhà khoa học nhí, hào hứng phát biểu rôm rả theo từng nhóm:\n  + Nhóm 1: "Thưa cô, nhóm con phát hiện ra khi thử nghiệm sẽ tạo ra điều kỳ diệu rất đẹp ạ!".\n  + Nhóm 2: "Nhóm con thấy các vật dụng có đặc điểm rất đặc biệt ạ!".\n  + Nhóm 3: "Chúng con tìm thấy rất nhiều đồ dùng, đồ chơi tương ứng trong các góc học tập ạ!".\n- Trẻ tự do đặt câu hỏi và tự tin trả lời các câu hỏi liên hệ thực tế của cô giáo.\n- Trẻ chăm chú lắng nghe cô phổ biến mục tiêu, cách chơi và luật chơi của trò chơi “Ai nhanh hơn – Đội nào giỏi nhất”.\n- Trẻ tích cực tham gia chơi 2 – 3 lần, bật nhảy khéo léo qua các vòng thể dục, phối hợp tiếp sức nhịp nhàng và reo hò cổ vũ bạn cùng đội.\n- Trẻ chấp hành nghiêm túc luật chơi và vui vẻ chúc mừng đội chiến thắng.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-5',
        index: 5,
        name: '5. Chia sẻ - Đánh giá',
        duration: '3 - 5 phút',
        objective: 'Trẻ chia sẻ cảm nhận, cô nhận xét tuyên dương và rèn luyện nề nếp thu dọn đồ dùng',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô tập trung trẻ lại, trò chuyện hỏi cảm nhận gợi mở của trẻ:\n  + "Hôm nay các con cảm thấy thế nào khi được làm những nhà khoa học nhí khám phá thế giới xung quanh?"\n  + "Qua buổi học hôm nay, con thích nhất trải nghiệm hay trò chơi khoa học nào?"\n  + "Về nhà con sẽ làm gì để giữ gìn môi trường và ứng dụng điều kỳ diệu này cùng bố mẹ?"\n- Cô nhận xét, tuyên dương sự cố gắng, tinh thần say mê tìm tòi và ý thức tự giác, hợp tác của trẻ trong suốt buổi học.\n- Cô hướng dẫn trẻ cùng cô thu dọn đồ dùng thí nghiệm, phân loại học liệu vào đúng góc quy định, củng cố nề nếp vệ sinh sạch sẽ, ngăn nắp lớp học.`,
          studentAction: `- Trẻ hào hứng chia sẻ cảm xúc, niềm vui khi được khám phá khoa học: "Con thấy rất vui và thích làm thí nghiệm cùng các bạn ạ!".\n- Trẻ tích cực trả lời các câu hỏi liên hệ thực tế của cô giáo.\n- Trẻ tươi cười lắng nghe cô nhận xét và tự hào đón nhận lời khen ngợi của cô.\n- Trẻ tự giác cùng cô và các bạn thu dọn đồ dùng, học liệu thí nghiệm cất ngăn nắp vào đúng nơi quy định.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
    ];
  }

  if (domain.domainType === 'MATH') {
    // LÀM QUEN VỚI TOÁN
    return [
      {
        id: 'act-1',
        index: 1,
        name: '1. Khởi động – Tạo hứng thú và giao nhiệm vụ',
        duration: '3 - 5 phút',
        objective: 'Trẻ hứng thú, ôn lại kiến thức toán đã học',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô cho trẻ hát và vận động bài hát toán học vui nhộn.\n- Tổ chức trò chơi ôn luyện số lượng/hình khối đã biết qua câu đố hoặc trò chơi vận động nhẹ nhàng.\n- Dẫn dắt vào bài học toán mới: "${title}".`,
          studentAction: `- Trẻ hào hứng hát và vận động theo bài hát.\n- Trẻ nhanh nhẹn đoán đúng số lượng, gọi tên hình khối theo hiệu lệnh của cô.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-2',
        index: 2,
        name: '2. Khám phá – Trải nghiệm',
        duration: '8 - 10 phút',
        objective: 'Trẻ làm quen với biểu tượng toán mới qua đồ dùng trực quan',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Phát rổ đồ dùng cho từng trẻ.\n- Cho trẻ lấy đồ dùng trong rổ ra xếp thành hàng ngang từ trái sang phải theo hướng dẫn.\n- Hướng dẫn trẻ đếm, so sánh số lượng, phát hiện sự thay đổi hoặc nhận biết đặc điểm hình khối.`,
          studentAction: `- Trẻ nhận rổ đồ dùng và xếp ngay ngắn từ trái qua phải.\n- Trẻ đếm to, rõ ràng từ 1 đến hết và đặt thẻ số tương ứng.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-3',
        index: 3,
        name: '3. Chia sẻ - Thảo luận',
        duration: '10 - 12 phút',
        objective: 'Trẻ chuẩn hóa khái niệm toán học và quy tắc nhận biết',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô mời trẻ phát biểu quy tắc xếp, cách đếm và kết quả so sánh.\n- Cô thao tác mẫu trên bảng từ chuẩn hóa kiến thức, giới thiệu chữ số / hình khối mới.\n- Cho cả lớp, từng tổ, cá nhân trẻ phát âm và chỉ vào chữ số/hình khối mới.`,
          studentAction: `- Trẻ tự tin trả lời câu hỏi và chia sẻ thao tác xếp của mình.\n- Trẻ đồng thanh và cá nhân phát âm chính xác tên số lượng / hình khối.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-4',
        index: 4,
        name: '4. Vận dụng – Mở rộng',
        duration: '6 - 8 phút',
        objective: 'Trẻ tham gia các trò chơi củng cố kiến thức toán học, rèn luyện phản xạ và tinh thần hợp tác',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô hướng dẫn, dẫn dắt sư phạm cụ thể trước khi vào trò chơi:\n  + Cô cùng trẻ đàm thoại, tổ chức hoạt động trải nghiệm toán học thực tế quanh lớp học: "Các con ơi! Xung quanh lớp mình có rất nhiều góc chơi với những đồ dùng, đồ chơi mang số lượng/hình khối như bài học hôm nay đấy!".\n  + Cô mời các nhóm trẻ quan sát nhanh và tìm các nhóm đồ vật quanh lớp có số lượng tương ứng với bài học (ví dụ: 5 bông hoa ở góc thiên nhiên, 5 khối gỗ ở góc xây dựng, 5 quyển truyện ở góc sách...).\n  + Mời đại diện 1 - 2 trẻ lên chỉ vào các nhóm đồ vật vừa tìm thấy, cả lớp cùng đếm kiểm tra lại và mời trẻ chọn thẻ số tương ứng gắn vào.\n  + Cô bao quát, cổ vũ và khen ngợi tinh thần nhanh mắt, khéo léo của các nhóm trẻ trước khi bước vào trò chơi củng cố.\n\n+ Trò chơi: “Về đúng nhà”\n- **Mục tiêu:** Củng cố biểu tượng toán học (nhận biết chữ số, đếm đúng số lượng và phân biệt hình khối nhanh nhạy); rèn luyện khả năng quan sát, phản xạ nhanh nhẹn theo hiệu lệnh, tinh thần đồng đội và tính kỷ luật cho trẻ mầm non.\n- **Chuẩn bị:** 3 - 4 ngôi nhà mang các thẻ số/chữ số tương ứng được bố trí ở các góc lớp, mỗi trẻ cầm 1 thẻ số trên tay, nhạc bài hát "Ngày vui của bé".\n- **Cách chơi:** Cô phát cho mỗi bạn một thẻ số bất kỳ. Các con cầm thẻ số trên tay và cùng nắm tay nhau đi vòng tròn theo điệu nhạc bài hát "Ngày vui của bé". Khi bản nhạc dừng lại hoặc cô hô to hiệu lệnh "Tìm nhà! Tìm nhà!", các con hãy quan sát thật nhanh xem thẻ số trên tay mình là số mấy rồi chạy thật nhanh về đúng ngôi nhà mang chữ số tương ứng nhé! Về đến nhà, các con hãy giơ cao thẻ số của mình lên và đọc to số của mình cùng các bạn trong nhà nhé!\n- **Luật chơi:** Bạn nào về sai nhà hoặc không về được đúng nhà theo hiệu lệnh của cô sẽ phải nhảy lò cò 1 vòng quanh lớp để tìm về đúng ngôi nhà của mình. Đội nào/bạn nào về nhanh, đúng nhà và giơ đúng thẻ số sẽ được cô và cả lớp vỗ tay khen ngợi thật to!\n- Tổ chức cho trẻ chơi 2 – 3 lần sôi nổi (Cô hướng dẫn trẻ đổi thẻ số cho bạn bên cạnh sau mỗi lần chơi, cô bao quát, khích lệ động viên trẻ còn nhút nhát và tạo không khí vui tươi, hào hứng).`,
          studentAction: `- Trẻ tự tin quan sát xung quanh lớp học và hào hứng phát biểu rôm rả theo từng nhóm:\n  + Nhóm 1: "Thưa cô, chúng con tìm thấy các nhóm đồ vật rất đẹp ở góc thiên nhiên và góc sách ạ!".\n  + Nhóm 2: "Nhóm con tìm thấy các khối đồ chơi ở góc xây dựng và đã gắn đúng thẻ số rồi ạ!".\n  + Nhóm 3: "Góc học tập của chúng con có đủ đồ dùng học toán ngồi ngay ngắn ạ!".\n- Cả lớp cùng đếm to kiểm tra lại số lượng bạn vừa tìm và vỗ tay chúc mừng.\n- Trẻ chăm chú lắng nghe cô phổ biến mục tiêu, cách chơi và luật chơi của trò chơi “Về đúng nhà”.\n- Trẻ hào hứng tham gia chơi 2 – 3 lần sôi nổi: Vừa đi vừa hát vui tươi, khi nghe hiệu lệnh nhanh chân chạy về đúng ngôi nhà mang chữ số của mình, tươi cười giơ cao thẻ số đọc vang.\n- Trẻ vui vẻ đổi thẻ cho bạn sau mỗi lượt chơi, chấp hành nghiêm túc luật chơi và vui vẻ nhảy lò cò khi về nhầm nhà.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
      {
        id: 'act-5',
        index: 5,
        name: '5. Chia sẻ - Đánh giá',
        duration: '3 - 5 phút',
        objective: 'Trẻ củng cố bài học, chia sẻ cảm xúc và cất dọn đồ dùng toán ngăn nắp',
        step1: {
          title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
          teacherAction: `- Cô tập trung trẻ lại, trò chuyện hỏi cảm nhận gợi mở của trẻ:\n  + "Hôm nay các con đã được học bài học toán gì thú vị?"\n  + "Chúng mình đã được làm quen với nội dung gì và chơi những trò chơi nào?"\n  + "Các con cảm thấy buổi học hôm nay như thế nào? Về nhà các con sẽ đếm những đồ dùng gì giúp ông bà, bố mẹ?"\n- Cô nhận xét, tuyên dương sự nỗ lực, kỹ năng đếm thành thạo, xếp tương ứng chuẩn xác và tinh thần học tập chăm chỉ, tự giác của trẻ trong suốt buổi học.\n- Cô giáo dục trẻ biết giữ gìn đồ dùng học tập, đoàn kết giúp đỡ bạn bè trong lớp.\n- Hướng dẫn trẻ cùng cô thu dọn rổ đồ dùng, xếp thẻ số gọn gàng và cất vào đúng góc học tập, củng cố nề nếp ngăn nắp của lớp.`,
          studentAction: `- Trẻ lắng nghe và hào hứng chia sẻ cảm xúc: "Hôm nay chúng con học toán rất vui và thích thú ạ!".\n- Trẻ tích cực trả lời: "Về nhà con sẽ đếm bát đũa giúp mẹ trong bữa cơm ạ!".\n- Trẻ tươi cười đón nhận lời khen ngợi của cô và vỗ tay chúc mừng cả lớp.\n- Trẻ tự giác cùng cô và các bạn thu dọn rổ đồ dùng, xếp thẻ số ngay ngắn và cất vào góc học tập.`,
          productExpected: '',
          digitalOrAiTool: '',
        },
      },
    ];
  }

  // DEFAULT / GENERAL PRESCHOOL DOMAINS (Thơ, Truyện, Tạo hình, Xã hội, etc.)
  return [
    {
      id: 'act-1',
      index: 1,
      name: '1. Khởi động – Tạo hứng thú và giao nhiệm vụ',
      duration: '3 - 5 phút',
      objective: 'Trẻ hứng thú, chuẩn bị tâm thế sẵn sàng tham gia hoạt động',
      step1: {
        title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
        teacherAction: `- Cô tạo tình huống bất ngờ với bài hát, trò chơi nhỏ hoặc câu đố vui nhộn gắn với nội dung "${title}".\n- Cô trò chuyện gợi mở tạo cảm xúc vui vẻ và kết nối trẻ vào bài học.\n- Cô dẫn dắt tự nhiên, giới thiệu đề tài bài học hôm nay.`,
        studentAction: `- Trẻ chăm chú lắng nghe, cùng cô hát và vận động nhịp nhàng.\n- Trẻ sôi nổi trả lời câu hỏi và hào hứng đón chờ hoạt động tiếp theo.`,
        productExpected: '',
        digitalOrAiTool: '',
      },
    },
    {
      id: 'act-2',
      index: 2,
      name: '2. Khám phá – Trải nghiệm',
      duration: '8 - 10 phút',
      objective: 'Trẻ được quan sát, tiếp cận trực quan với nội dung bài học',
      step1: {
        title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
        teacherAction: `- Cô tổ chức cho trẻ tiếp cận đối tượng học tập gắn với "${title}" (qua tranh ảnh, vật thật, video, bài thơ, câu chuyện hoặc các trạm trải nghiệm).\n- Cô hướng dẫn, đặt câu hỏi gợi mở để trẻ tự quan sát, cảm nhận và tìm hiểu đặc điểm chính.`,
        studentAction: `- Trẻ tập trung quan sát, lắng nghe và tự tay trải nghiệm học liệu:\n  + Nhóm 1: Trẻ quan sát, sờ vào các vật dụng, trao đổi rôm rả với bạn.\n  + Nhóm 2: Trẻ hào hứng thảo luận và chỉ ra những điểm nổi bật.\n  + Nhóm 3: Trẻ mạnh dạn đặt câu hỏi và chia sẻ cảm nhận với cô.`,
        productExpected: '',
        digitalOrAiTool: '',
      },
    },
    {
      id: 'act-3',
      index: 3,
      name: '3. Chia sẻ - Thảo luận',
      duration: '10 - 12 phút',
      objective: 'Trẻ đàm thoại làm rõ nội dung, cô chuẩn hóa kiến thức và kỹ năng',
      step1: {
        title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
        teacherAction: `- Cô đàm thoại qua hệ thống câu hỏi khơi gợi tư duy từ dễ đến khó về "${title}".\n- Cô giải thích, làm mẫu hoặc phân tích kỹ năng/kiến thức trọng tâm.\n- Cho trẻ luyện tập, phát biểu, thể hiện sự hiểu biết theo nhóm và cá nhân.`,
        studentAction: `- Trẻ mạnh dạn giơ tay trả lời câu hỏi của cô bằng câu trọn vẹn.\n- Trẻ chú ý lắng nghe cô chuẩn hóa và tích cực luyện tập theo hướng dẫn.`,
        productExpected: '',
        digitalOrAiTool: '',
      },
    },
    {
      id: 'act-4',
      index: 4,
      name: '4. Vận dụng – Mở rộng',
      duration: '6 - 8 phút',
      objective: 'Trẻ củng cố kiến thức qua trò chơi đóng vai trải nghiệm và trò chơi vận động tập thể',
      step1: {
        title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
        teacherAction: `- Cô hướng dẫn, dẫn dắt sư phạm cụ thể trước khi vào trò chơi:\n  + Cô tổ chức trò chơi trải nghiệm “Hướng dẫn viên nhí”: Cô đóng vai khách tham quan, mời các nhóm trẻ đóng vai hướng dẫn viên giới thiệu về các khu vực/góc chơi trong lớp, trường học.\n  + Mời 1 - 2 trẻ kể tên cô giáo chủ nhiệm, các bạn trong lớp và những điều mình yêu thích.\n  + Hỏi trẻ về ngôi trường mầm non nơi trẻ đang học, cô giới thiệu thêm tên cô hiệu trưởng và cô hiệu phó.\n  + Cô bao quát, cổ vũ và khen ngợi sự hợp tác của các nhóm trước khi vào trò chơi củng cố.\n\n+ Trò chơi: “Ai nhanh, bạn trai hay bạn gái”\n- **Mục tiêu:** Củng cố kiến thức bài học, rèn luyện kỹ năng quan sát, phản xạ nhanh nhẹn theo hiệu lệnh, tinh thần đồng đội, tính kỷ luật và niềm vui học tập cho trẻ mầm non.\n- **Chuẩn bị:** Sân lớp rộng rãi, các ô hình tròn (dành cho bạn trai) và ô hình vuông (dành cho bạn gái) trên sàn, nhạc bài hát "Ngày vui của bé".\n- **Cách chơi:** Cô và các con cùng nắm tay nhau đi vòng tròn, vừa đi vừa hát bài "Ngày vui của bé". Khi có hiệu lệnh “Tạo nhóm! Tạo nhóm!”, các bạn trai nhanh chân chạy về nhóm hình tròn, bạn gái về nhóm hình vuông (hoặc ngược lại), sau đó cho trẻ gọi tên một số bạn trong nhóm của mình.\n- **Luật chơi:** Bạn nào về sai nhóm hoặc không về được đúng nhóm theo hiệu lệnh sẽ phải nhảy lò cò 1 vòng quanh nhóm để tìm về đúng bạn của mình. Nhóm nào về nhanh, đúng và đoàn kết nhất sẽ được cô và cả lớp hoan hô khen ngợi.\n- Tổ chức cho trẻ chơi 2 – 3 lần sôi nổi (Cô bao quát, khích lệ động viên trẻ).`,
        studentAction: `- Trẻ hào hứng đóng vai hướng dẫn viên, tự tin giới thiệu về trường lớp với khách tham quan (cô giáo):\n  + Nhóm 1: "Ôi sân trường rộng quá, có nhiều cây xanh ạ!".\n  + Nhóm 2: "Đây là góc sách, còn kia là góc xây dựng của chúng con ạ!".\n  + Nhóm 3: "Đây là khu nhà bóng, bên kia là khu vực cầu trượt rất vui ạ!".\n- Trẻ tự tin trả lời các câu hỏi liên hệ thực tế của cô về trường lớp, thầy cô và bạn bè.\n- Trẻ chăm chú lắng nghe cô phổ biến mục tiêu, cách chơi và luật chơi của trò chơi.\n- Trẻ hào hứng tham gia trò chơi "Ai nhanh, bạn trai hay bạn gái" 2 – 3 lần: Vừa đi vòng tròn vừa hát, khi có hiệu lệnh trẻ nhanh nhẹn tìm về đúng nhóm và gọi tên bạn thân trong nhóm.\n- Trẻ chấp hành nghiêm túc luật chơi, vui vẻ nhảy lò cò khi phạm quy và nhiệt tình cổ vũ bạn.`,
        productExpected: '',
        digitalOrAiTool: '',
      },
    },
    {
      id: 'act-5',
      index: 5,
      name: '5. Chia sẻ - Đánh giá',
      duration: '3 - 5 phút',
      objective: 'Trẻ chia sẻ cảm xúc, cô nhận xét tuyên dương và hướng dẫn cất dọn đồ dùng',
      step1: {
        title: 'Bước 1: Chuyển giao nhiệm vụ học tập',
        teacherAction: `- Cô mời trẻ chia sẻ cảm xúc và bài học thực tế:\n  + "Hôm nay con cảm thấy thế nào sau buổi học?"\n  + "Con sẽ làm gì để trường Mầm non của chúng mình luôn sạch đẹp, đoàn kết yêu thương nhau?"\n- Cô nhận xét, tuyên dương sự cố gắng, tự tin và tinh thần tự giác của trẻ trong suốt buổi học.\n- Cô hướng dẫn trẻ cùng cô thu dọn giáo cụ, phân loại đồ dùng vào đúng góc quy định, củng cố nề nếp vệ sinh lớp học.`,
        studentAction: `- Trẻ tự tin chia sẻ cảm xúc, niềm vui khi được khám phá về bài học và trường lớp.\n- Trẻ tích cực trả lời: "Con sẽ cùng các bạn giữ gìn trường lớp sạch đẹp, không vứt rác bừa bãi ạ!".\n- Trẻ tươi cười đón nhận lời khen ngợi của cô.\n- Trẻ tự giác cùng cô và các bạn thu dọn đồ dùng đồ chơi, xếp ngăn nắp vào đúng góc quy định.`,
        productExpected: '',
        digitalOrAiTool: '',
      },
    },
  ];
}

export function enrichPreschoolStep4(
  teacherAction: string,
  studentAction: string,
  lessonTitle: string = '',
  subject: string = '',
  domain: any
): { teacherAction: string; studentAction: string } {
  // If it's Physical Education, formatPreschoolPhysicalActivities already handles it
  if (domain.domainType === 'PHYSICAL' || domain.domainType === 'MUSIC') {
    return { teacherAction, studentAction };
  }

  const isMath = domain.domainType === 'MATH';
  const isScience = domain.domainType === 'SCIENCE';
  const isSocial = domain.domainType === 'SOCIAL';

  let tText = teacherAction.trim();
  let sText = studentAction.trim();

  // 1. Check if there is already a game
  const hasGame = /trò chơi/i.test(tText);

  // If no game at all, or text is very short (less than 60 chars), use the standard activity 4 from generateDefaultPreschoolActivities
  if (!hasGame || tText.length < 60) {
    const defaultActs = generateDefaultPreschoolActivities(lessonTitle, subject, domain);
    const act4 = defaultActs.find(a => a.index === 4) || defaultActs[3];
    if (act4?.step1?.teacherAction) {
      tText = act4.step1.teacherAction;
    }
    if (act4?.step1?.studentAction) {
      sText = act4.step1.studentAction;
    }
    return { teacherAction: tText, studentAction: sText };
  }

  // 2. Ensure pedagogical lead-in before the game (văn phong sư phạm mầm non)
  const startsWithGame = /^[-\s*+•–—]*trò chơi/i.test(tText) || /^[-\s*+•–—]*\+\s*trò chơi/i.test(tText);
  const hasLeadInKeywords = /hướng dẫn viên|nhà khoa học|đàm thoại|liên hệ|tìm các nhóm|góc chơi|khu vực|thực tế quanh lớp|trải nghiệm mở rộng/i.test(tText);

  let leadIn = '';
  if (isMath) {
    leadIn = `- Cô hướng dẫn, dẫn dắt sư phạm cụ thể trước khi vào trò chơi:\n  + Cô cùng trẻ đàm thoại, tổ chức hoạt động trải nghiệm toán học thực tế quanh lớp học: "Các con ơi! Xung quanh lớp mình có rất nhiều góc chơi với những đồ dùng, đồ chơi mang số lượng/hình khối như bài học hôm nay đấy!".\n  + Cô mời các nhóm trẻ quan sát nhanh và tìm các nhóm đồ vật quanh lớp có số lượng tương ứng với bài học.\n  + Mời đại diện 1 - 2 trẻ lên chỉ vào các nhóm đồ vật vừa tìm thấy, cả lớp cùng đếm kiểm tra lại và mời trẻ chọn thẻ số tương ứng gắn vào.\n  + Cô bao quát, cổ vũ và khen ngợi tinh thần nhanh mắt, khéo léo của các nhóm trẻ trước khi bước vào trò chơi củng cố.`;
  } else if (isScience) {
    leadIn = `- Cô hướng dẫn, dẫn dắt sư phạm cụ thể trước khi vào trò chơi:\n  + Cô tổ chức hoạt động trải nghiệm mở rộng đóng vai "Nhà khoa học nhí" / thực hành ứng dụng khoa học vào thực tế quanh lớp học.\n  + Mời đại diện 1 - 2 nhóm trẻ giới thiệu về phát hiện khoa học, hiện tượng biến đổi hoặc các vật dụng mà nhóm vừa khám phá.\n  + Cô đàm thoại gợi mở ứng dụng thực tế: "Trong cuộc sống hằng ngày, các con thấy điều kỳ diệu này xuất hiện ở những đâu?".\n  + Cô bao quát, cổ vũ và khen ngợi tinh thần say mê tìm tòi, hợp tác tích cực của các nhóm trước khi bước vào phần trò chơi củng cố.`;
  } else {
    leadIn = `- Cô hướng dẫn, dẫn dắt sư phạm cụ thể trước khi vào trò chơi:\n  + Cô tổ chức trò chơi trải nghiệm “Hướng dẫn viên nhí”: Cô đóng vai khách tham quan, mời các nhóm trẻ đóng vai hướng dẫn viên giới thiệu về các khu vực, góc chơi trong lớp và trường mầm non.\n  + Mời 1 - 2 trẻ tự tin kể tên cô giáo chủ nhiệm của mình và kể tên một số bạn học thân thiết trong lớp.\n  + Cô giới thiệu thêm cho trẻ biết trong trường/điểm trường còn có các cô giáo khác, hỏi trẻ tên trường mầm non nơi trẻ đang học và cô giới thiệu thêm tên cô hiệu trưởng, cô hiệu phó của trường mầm non.\n  + Cô bao quát, cổ vũ và khen ngợi sự tự tin, tinh thần hợp tác của các nhóm trước khi vào trò chơi củng cố.`;
  }

  if (startsWithGame || !hasLeadInKeywords) {
    tText = `${leadIn}\n\n${tText}`;
  }

  // 3. Ensure Game Objective (- Mục tiêu:) is present in the game section
  const hasGameObjective = /mục tiêu\s*:/i.test(tText);
  if (!hasGameObjective) {
    let defaultObjective = '';
    if (isMath) {
      defaultObjective = `- **Mục tiêu:** Củng cố biểu tượng toán học (nhận biết chữ số, đếm đúng số lượng và phân biệt hình khối nhanh nhạy); rèn luyện khả năng quan sát, phản xạ nhanh nhẹn theo hiệu lệnh, tinh thần đồng đội và tính kỷ luật cho trẻ mầm non.`;
    } else if (isScience) {
      defaultObjective = `- **Mục tiêu:** Củng cố kiến thức khoa học cốt lõi trẻ vừa khám phá (nhận biết đặc điểm, phân loại đúng đối tượng/hiện tượng khoa học); rèn luyện kỹ năng quan sát, thao tác nhanh nhẹn, tinh thần đồng đội, tính kỷ luật và phản xạ tự tin cho trẻ mầm non.`;
    } else if (isSocial) {
      defaultObjective = `- **Mục tiêu:** Củng cố sự hiểu biết về bản thân, bạn bè, giới tính và tinh thần đoàn kết tập thể; rèn luyện khả năng quan sát, phản xạ nhanh nhẹn theo hiệu lệnh, tính kỷ luật và niềm vui gắn kết cho trẻ mầm non.`;
    } else {
      defaultObjective = `- **Mục tiêu:** Củng cố kiến thức bài học, rèn luyện kỹ năng quan sát, phản xạ nhanh nhẹn theo hiệu lệnh, tinh thần đồng đội, tính kỷ luật và niềm vui học tập cho trẻ mầm non.`;
    }

    const gameMatch = tText.match(/(?:^|\n)([-•*+\s–—]*(?:Trò chơi|T\/C|TC|Trò chơi củng cố)[^\n]+)/i);
    if (gameMatch && gameMatch[1]) {
      tText = tText.replace(gameMatch[1], `${gameMatch[1]}\n${defaultObjective}`);
    } else {
      tText = `${tText}\n${defaultObjective}`;
    }
  }

  // 4. Ensure Cách chơi is present & rich
  const hasCachChoi = /cách chơi\s*:/i.test(tText);
  if (!hasCachChoi) {
    let defaultCachChoi = '';
    if (isMath) {
      defaultCachChoi = `- **Cách chơi:** Cô phát cho mỗi bạn một thẻ số bất kỳ. Các con cầm thẻ số trên tay và cùng nắm tay nhau đi vòng tròn theo điệu nhạc bài hát "Ngày vui của bé". Khi bản nhạc dừng lại hoặc cô hô to hiệu lệnh "Tìm nhà! Tìm nhà!", các con hãy quan sát thật nhanh xem thẻ số trên tay mình là số mấy rồi chạy thật nhanh về đúng ngôi nhà mang chữ số tương ứng nhé! Về đến nhà, các con hãy giơ cao thẻ số của mình lên và đọc to số của mình cùng các bạn trong nhà nhé!`;
    } else if (isScience) {
      defaultCachChoi = `- **Cách chơi:** Cô chia lớp mình thành 2 đội chơi xuất sắc có số lượng bạn bằng nhau, đứng xếp hàng trước vạch xuất phát nhé! Phía trước mỗi đội là con đường vòng thể dục và một rổ đựng thẻ tranh/vật thật khoa học. Khi bản nhạc sôi động vang lên và có hiệu lệnh xuất phát của cô, bạn đầu hàng của mỗi đội sẽ bật liên tục qua các vòng thể dục, nhanh chân chạy lên bàn chọn đúng 1 thẻ hình ảnh/vật thật theo yêu cầu khoa học gắn lên bảng của đội mình. Sau đó, các con nhanh chân chạy về cuối hàng đập nhẹ vào tay bạn tiếp theo để bạn tiếp tục lên chơi nhé! Trò chơi sẽ kết thúc khi bản nhạc dừng lại!`;
    } else {
      defaultCachChoi = `- **Cách chơi:** Cô và các con cùng nắm tay nhau đi vòng tròn, vừa đi vừa hát bài "Ngày vui của bé". Khi có hiệu lệnh “tạo nhóm” thì các bạn trai về nhóm hình tròn, bạn gái về nhóm hình vuông (hoặc ngược lại), sau đó cho trẻ gọi tên một số bạn trong nhóm của mình.`;
    }
    tText = `${tText}\n${defaultCachChoi}`;
  }

  // 5. Ensure Luật chơi is present
  const hasLuatChoi = /luật chơi\s*:/i.test(tText);
  if (!hasLuatChoi) {
    let defaultLuatChoi = '';
    if (isMath) {
      defaultLuatChoi = `- **Luật chơi:** Bạn nào về sai nhà hoặc không về được đúng nhà theo hiệu lệnh của cô sẽ phải nhảy lò cò 1 vòng quanh lớp để tìm về đúng ngôi nhà của mình. Đội nào/bạn nào về nhanh, đúng nhà và giơ đúng thẻ số sẽ được cô và cả lớp vỗ tay khen ngợi thật to!`;
    } else if (isScience) {
      defaultLuatChoi = `- **Luật chơi:** Mỗi lượt lên chơi, mỗi bạn chỉ được chọn đúng 1 thẻ tranh/vật thật. Bạn nào chọn sai hoặc dẫm chân vào viền vòng thể dục thì lượt đó sẽ không được tính điểm. Đội nào chọn đúng và gắn được nhiều thẻ nhất sẽ là đội chiến thắng. Đội về sau sẽ cùng nhau làm động tác mô phỏng chú ếch nhảy / chú chim bay vui nhộn để chúc mừng đội bạn.`;
    } else {
      defaultLuatChoi = `- **Luật chơi:** Bạn nào về sai nhóm hoặc không về được đúng nhóm theo hiệu lệnh của cô sẽ phải nhảy lò cò 1 vòng quanh nhóm để tìm về đúng bạn của mình. Nhóm nào về nhanh, đúng và đoàn kết nhất sẽ được cô và cả lớp vỗ tay hoan hô khen ngợi.`;
    }
    tText = `${tText}\n${defaultLuatChoi}`;
  }

  // 6. Ensure 2-3 rounds
  if (!/2\s*[-–—]\s*3\s*lần/i.test(tText)) {
    tText = `${tText}\n- Tổ chức cho trẻ chơi 2 – 3 lần sôi nổi (Cô bao quát, khích lệ động viên trẻ).`;
  }

  // 7. Student Action enrichment
  const hasGroups = /nhóm\s*\d/i.test(sText);
  if (!hasGroups) {
    let groupDialogue = '';
    if (isMath) {
      groupDialogue = `  + Nhóm 1: "Thưa cô, chúng con tìm thấy các nhóm đồ vật rất đẹp ở góc thiên nhiên và góc sách ạ!".\n  + Nhóm 2: "Nhóm con tìm thấy các khối đồ chơi ở góc xây dựng và đã gắn đúng thẻ số rồi ạ!".\n  + Nhóm 3: "Góc học tập của chúng con có đủ đồ dùng học toán ngồi ngay ngắn ạ!".\n- Cả lớp cùng đếm to kiểm tra lại số lượng bạn vừa tìm và vỗ tay chúc mừng.`;
    } else if (isScience) {
      groupDialogue = `  + Nhóm 1: "Thưa cô, nhóm con phát hiện ra khi thử nghiệm sẽ tạo ra điều kỳ diệu rất đẹp ạ!".\n  + Nhóm 2: "Nhóm con thấy các vật dụng có đặc điểm rất đặc biệt ạ!".\n  + Nhóm 3: "Chúng con tìm thấy rất nhiều đồ dùng, đồ chơi tương ứng trong các góc học tập ạ!".`;
    } else {
      groupDialogue = `  + Nhóm 1: "Ôi sân trường rộng quá, có nhiều cây xanh ạ!".\n  + Nhóm 2: "Đây là góc sách, còn kia là góc xây dựng của chúng con ạ!".\n  + Nhóm 3: "Đây là khu nhà bóng, bên kia là khu vực cầu trượt rất vui ạ!".`;
    }
    sText = `- Trẻ tự tin trao đổi, phát biểu rôm rả theo từng nhóm:\n${groupDialogue}\n${sText}`;
  }

  if (!/lắng nghe/i.test(sText) || !/mục tiêu|luật chơi|cách chơi/i.test(sText)) {
    sText = `${sText}\n- Trẻ chăm chú lắng nghe cô phổ biến mục tiêu, cách chơi và luật chơi của trò chơi.`;
  }
  if (!/2\s*[-–—]\s*3\s*lần/i.test(sText)) {
    sText = `${sText}\n- Trẻ hào hứng tham gia chơi 2 – 3 lần sôi nổi, nhanh nhẹn phối hợp cùng bạn, chấp hành nghiêm túc luật chơi và vui vẻ nhảy lò cò khi phạm quy.`;
  }

  return { teacherAction: tText, studentAction: sText };
}

export function enrichPreschoolStep5(
  teacherAction: string,
  studentAction: string,
  domain: any
): { teacherAction: string; studentAction: string } {
  if (domain.domainType === 'PHYSICAL' || domain.domainType === 'MUSIC') {
    return { teacherAction, studentAction };
  }

  let tText = teacherAction.trim();
  let sText = studentAction.trim();

  const hasFeelings = /cảm xúc|cảm thấy|thích nhất/i.test(tText);
  const hasCleanup = /thu dọn|dọn dẹp|cất đồ|vệ sinh/i.test(tText);

  if (!hasFeelings || !hasCleanup || tText.length < 50) {
    tText = `- Cô tập trung trẻ lại, trò chuyện hỏi cảm xúc gợi mở của trẻ:\n  + "Hôm nay các con cảm thấy thế nào sau buổi học?"\n  + "Con thích nhất hoạt động nào hay góc chơi nào trong ngày hôm nay?"\n  + "Con sẽ làm gì để trường lớp/môi trường luôn sạch đẹp, lớp học luôn chan hòa tình yêu thương?"\n- Cô nhận xét, tuyên dương sự cố gắng, tinh thần tự giác, tự tin và sự đoàn kết giúp đỡ bạn bè của trẻ trong suốt buổi học.\n- Cô hướng dẫn trẻ cùng cô thu dọn giáo cụ, phân loại đồ dùng đồ chơi vào đúng góc quy định, củng cố nề nếp vệ sinh sạch sẽ lớp học.`;
  }

  const sHasFeelings = /cảm xúc|rất vui|thích/i.test(sText);
  const sHasCleanup = /thu dọn|cất/i.test(sText);

  if (!sHasFeelings || !sHasCleanup || sText.length < 50) {
    sText = `- Trẻ tự tin chia sẻ cảm xúc, niềm vui khi được tham gia hoạt động cùng cô và các bạn.\n- Trẻ tích cực trả lời các câu hỏi liên hệ thực tế của cô giáo.\n- Trẻ tươi cười đón nhận lời khen ngợi của cô và vỗ tay chúc mừng cả lớp.\n- Trẻ tự giác cùng cô và các bạn thu dọn đồ dùng, học liệu, xếp ngăn nắp vào đúng góc quy định.`;
  }

  return { teacherAction: tText, studentAction: sText };
}

export function formatPreschoolIndoorPlayActivities(
  activities: any[],
  lessonTitle: string = '',
  subject: string = '',
  oldPlanContent: string = ''
): any[] {
  const defaults = generateDefaultPreschoolActivities(lessonTitle, subject, { domainType: 'PLAY_INDOOR' });
  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return defaults;
  }

  let rawAct1: any = null;
  let rawAct2: any = null;
  let rawAct3: any = null;

  if (activities.length === 3) {
    rawAct1 = activities[0];
    rawAct2 = activities[1];
    rawAct3 = activities[2];
  } else if (activities.length >= 4) {
    rawAct1 = activities[0];
    const middleTeacherActions = activities.slice(1, activities.length - 1).map(a => a.step1?.teacherAction || '').filter(Boolean).join('\n\n');
    const middleStudentActions = activities.slice(1, activities.length - 1).map(a => a.step1?.studentAction || '').filter(Boolean).join('\n\n');
    rawAct2 = {
      ...activities[1],
      step1: {
        ...(activities[1].step1 || {}),
        teacherAction: middleTeacherActions,
        studentAction: middleStudentActions
      }
    };
    rawAct3 = activities[activities.length - 1];
  } else if (activities.length === 2) {
    rawAct1 = activities[0];
    rawAct2 = activities[1];
    rawAct3 = defaults[2];
  } else if (activities.length === 1) {
    rawAct1 = activities[0];
    rawAct2 = defaults[1];
    rawAct3 = defaults[2];
  }

  const act1Teacher = (rawAct1?.step1?.teacherAction || defaults[0].step1.teacherAction).replace(/\*\*/g, '').trim();
  const act1Student = (rawAct1?.step1?.studentAction || defaults[0].step1.studentAction).replace(/\*\*/g, '').trim();

  let act2Teacher = (rawAct2?.step1?.teacherAction || defaults[1].step1.teacherAction).replace(/\*\*/g, '').trim();
  let act2Student = (rawAct2?.step1?.studentAction || defaults[1].step1.studentAction).replace(/\*\*/g, '').trim();

  const hasArtCorner = /góc nghệ thuật|góc tạo hình/i.test(act2Teacher);
  const hasLearningCorner = /góc học tập|khám phá khoa học/i.test(act2Teacher);
  const hasRoleCorner = /góc phân vai/i.test(act2Teacher);

  if (!hasArtCorner || !hasLearningCorner || !hasRoleCorner || act2Teacher.length < 100) {
    act2Teacher = defaults[1].step1.teacherAction;
    act2Student = defaults[1].step1.studentAction;
  }

  const act3Teacher = (rawAct3?.step1?.teacherAction || defaults[2].step1.teacherAction).replace(/\*\*/g, '').trim();
  const act3Student = (rawAct3?.step1?.studentAction || defaults[2].step1.studentAction).replace(/\*\*/g, '').trim();

  return [
    {
      id: 'act-1',
      index: 1,
      name: '1. Thỏa thuận trước khi chơi',
      duration: rawAct1?.duration || '5 - 7 phút',
      objective: rawAct1?.objective || 'Trẻ hứng thú, thỏa thuận vai chơi, chọn góc chơi và nắm rõ quy tắc chơi',
      step1: {
        title: '1. Thỏa thuận trước khi chơi',
        teacherAction: expandPreschoolTextLines(act1Teacher).map(l => cleanPreschoolBulletLine(l)).filter(Boolean).join('\n').trim(),
        studentAction: expandPreschoolTextLines(act1Student).map(l => cleanPreschoolBulletLine(l)).filter(Boolean).join('\n').trim(),
        productExpected: '',
        digitalOrAiTool: '',
      }
    },
    {
      id: 'act-2',
      index: 2,
      name: '2. Theo dõi quá trình chơi',
      duration: rawAct2?.duration || '20 - 25 phút',
      objective: rawAct2?.objective || 'Trẻ tích cực nhập vai, phát huy tính sáng tạo và giao lưu liên kết giữa các góc chơi',
      step1: {
        title: '2. Theo dõi quá trình chơi',
        teacherAction: expandPreschoolTextLines(act2Teacher).map(l => cleanPreschoolBulletLine(l)).filter(Boolean).join('\n').trim(),
        studentAction: expandPreschoolTextLines(act2Student).map(l => cleanPreschoolBulletLine(l)).filter(Boolean).join('\n').trim(),
        productExpected: '',
        digitalOrAiTool: '',
      }
    },
    {
      id: 'act-3',
      index: 3,
      name: '3. Nhận xét sau khi chơi',
      duration: rawAct3?.duration || '5 - 8 phút',
      objective: rawAct3?.objective || 'Trẻ tham quan chia sẻ sản phẩm, cô nhận xét tuyên dương và cùng trẻ thu dọn đồ chơi ngăn nắp',
      step1: {
        title: '3. Nhận xét sau khi chơi',
        teacherAction: expandPreschoolTextLines(act3Teacher).map(l => cleanPreschoolBulletLine(l)).filter(Boolean).join('\n').trim(),
        studentAction: expandPreschoolTextLines(act3Student).map(l => cleanPreschoolBulletLine(l)).filter(Boolean).join('\n').trim(),
        productExpected: '',
        digitalOrAiTool: '',
      }
    }
  ];
}

export function formatPreschoolOutdoorActivities(
  activities: any[],
  lessonTitle: string = '',
  subject: string = '',
  oldPlanContent: string = ''
): any[] {
  const isGameFocus = (lessonTitle || '').toLowerCase().includes('trò chơi') || (lessonTitle || '').toLowerCase().includes('chuyền bóng') || (lessonTitle || '').toLowerCase().includes('kéo co') || (lessonTitle || '').toLowerCase().includes('vận động');
  const defaults = generateDefaultPreschoolActivities(lessonTitle, subject, { domainType: 'OUTDOOR' });

  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return defaults;
  }

  let rawAct1: any = null;
  let rawAct2: any = null;
  let rawAct3: any = null;

  if (activities.length === 3) {
    rawAct1 = activities[0];
    rawAct2 = activities[1];
    rawAct3 = activities[2];
  } else if (activities.length >= 4) {
    rawAct1 = activities[0];
    const middleTeacherActions = activities.slice(1, activities.length - 1).map(a => a.step1?.teacherAction || '').filter(Boolean).join('\n\n');
    const middleStudentActions = activities.slice(1, activities.length - 1).map(a => a.step1?.studentAction || '').filter(Boolean).join('\n\n');
    rawAct2 = {
      ...activities[1],
      step1: {
        ...(activities[1].step1 || {}),
        teacherAction: middleTeacherActions,
        studentAction: middleStudentActions
      }
    };
    rawAct3 = activities[activities.length - 1];
  } else if (activities.length === 2) {
    rawAct1 = activities[0];
    rawAct2 = activities[1];
    rawAct3 = defaults[2];
  } else if (activities.length === 1) {
    rawAct1 = activities[0];
    rawAct2 = defaults[1];
    rawAct3 = defaults[2];
  }

  const step1Title = isGameFocus ? '1. Trước khi chơi' : '1. Trước khi quan sát';
  const step2Title = isGameFocus ? '2. Trong khi chơi' : '2. Trong khi quan sát';
  const step3Title = isGameFocus ? '3. Sau khi chơi' : '3. Sau khi quan sát';

  let act1Teacher = (rawAct1?.step1?.teacherAction || defaults[0].step1.teacherAction).replace(/\*\*/g, '').trim();
  let act1Student = (rawAct1?.step1?.studentAction || defaults[0].step1.studentAction).replace(/\*\*/g, '').trim();

  let act2Teacher = (rawAct2?.step1?.teacherAction || defaults[1].step1.teacherAction).replace(/\*\*/g, '').trim();
  let act2Student = (rawAct2?.step1?.studentAction || defaults[1].step1.studentAction).replace(/\*\*/g, '').trim();

  if (isGameFocus) {
    const hasTCVD = /trò chơi vận động/i.test(act2Teacher);
    const hasCachChoi = /cách chơi/i.test(act2Teacher);
    const hasLuatChoi = /luật chơi/i.test(act2Teacher);
    const hasOutdoorToys = /đồ chơi ngoài trời/i.test(act2Teacher);
    if (!hasTCVD || !hasCachChoi || !hasLuatChoi || !hasOutdoorToys || act2Teacher.length < 100) {
      act2Teacher = defaults[1].step1.teacherAction;
      act2Student = defaults[1].step1.studentAction;
    }
  } else {
    const hasObservation = /quan sát/i.test(act2Teacher);
    const hasTCVD = /tcvđ|trò chơi vận động|bỏ dẻ/i.test(act2Teacher);
    const hasFreePlay = /chơi tự do/i.test(act2Teacher);
    if (!hasObservation || !hasTCVD || !hasFreePlay || act2Teacher.length < 100) {
      act2Teacher = defaults[1].step1.teacherAction;
      act2Student = defaults[1].step1.studentAction;
    }
  }

  let act3Teacher = (rawAct3?.step1?.teacherAction || defaults[2].step1.teacherAction).replace(/\*\*/g, '').trim();
  let act3Student = (rawAct3?.step1?.studentAction || defaults[2].step1.studentAction).replace(/\*\*/g, '').trim();

  return [
    {
      id: 'act-1',
      index: 1,
      name: step1Title,
      duration: rawAct1?.duration || '3 - 5 phút',
      objective: rawAct1?.objective || defaults[0].objective,
      step1: {
        title: step1Title,
        teacherAction: expandPreschoolTextLines(act1Teacher).map(l => cleanPreschoolBulletLine(l)).filter(Boolean).join('\n').trim(),
        studentAction: expandPreschoolTextLines(act1Student).map(l => cleanPreschoolBulletLine(l)).filter(Boolean).join('\n').trim(),
        productExpected: '',
        digitalOrAiTool: '',
      }
    },
    {
      id: 'act-2',
      index: 2,
      name: step2Title,
      duration: rawAct2?.duration || '20 - 25 phút',
      objective: rawAct2?.objective || defaults[1].objective,
      step1: {
        title: step2Title,
        teacherAction: expandPreschoolTextLines(act2Teacher).map(l => cleanPreschoolBulletLine(l)).filter(Boolean).join('\n').trim(),
        studentAction: expandPreschoolTextLines(act2Student).map(l => cleanPreschoolBulletLine(l)).filter(Boolean).join('\n').trim(),
        productExpected: '',
        digitalOrAiTool: '',
      }
    },
    {
      id: 'act-3',
      index: 3,
      name: step3Title,
      duration: rawAct3?.duration || '3 - 5 phút',
      objective: rawAct3?.objective || defaults[2].objective,
      step1: {
        title: step3Title,
        teacherAction: expandPreschoolTextLines(act3Teacher).map(l => cleanPreschoolBulletLine(l)).filter(Boolean).join('\n').trim(),
        studentAction: expandPreschoolTextLines(act3Student).map(l => cleanPreschoolBulletLine(l)).filter(Boolean).join('\n').trim(),
        productExpected: '',
        digitalOrAiTool: '',
      }
    }
  ];
}

export function formatPreschoolActivities(activities: any[], lessonTitle: string = '', subject: string = '', oldPlanContent: string = ''): any[] {
  const domain = detectPreschoolDomain(subject, lessonTitle, oldPlanContent);

  if (domain.domainType === 'MUSIC') {
    return formatPreschoolMusicActivities(activities, lessonTitle, oldPlanContent);
  }

  if (domain.domainType === 'PHYSICAL') {
    return formatPreschoolPhysicalActivities(activities, lessonTitle, subject);
  }

  if (domain.domainType === 'PLAY_INDOOR') {
    return formatPreschoolIndoorPlayActivities(activities, lessonTitle, subject, oldPlanContent);
  }

  if (domain.domainType === 'OUTDOOR') {
    return formatPreschoolOutdoorActivities(activities, lessonTitle, subject, oldPlanContent);
  }

  // Safety fallback: If activities array is missing or empty, generate default 5-step curriculum activities!
  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return generateDefaultPreschoolActivities(lessonTitle, subject, domain);
  }

  let step1Name = "1. Khởi động – Tạo hứng thú và giao nhiệm vụ";
  let step2Name = "2. Khám phá – Trải nghiệm";
  let step3Name = "3. Chia sẻ - Thảo luận";
  let step4Name = "4. Vận dụng – Mở rộng";
  let step5Name = "5. Chia sẻ - Đánh giá";

  if (domain.domainType === 'ART') {
    step1Name = "1. Khởi động – Tạo tình huống có ý nghĩa";
  } else if (domain.domainType === 'SOCIAL') {
    step1Name = "1. Khởi động - Tạo tình huống";
    step2Name = "2. Khám phá và trải nghiệm";
    step3Name = "3. Chia sẻ - Thảo luận";
    step4Name = "4. Vận dụng và mở rộng";
    step5Name = "5. Đánh giá và điều chỉnh";
  } else if (domain.domainType === 'LETTER_GAME' || domain.domainType === 'LEARNING_GAME') {
    step1Name = "1. Gợi hứng thú – hình thành và lựa chọn ý tưởng chơi";
    step2Name = "2. Thỏa thuận – Lập kế hoạch chơi";
    step3Name = "3. Thực hiện hoạt động chơi";
    step4Name = "4. Mở rộng và phát triển";
    step5Name = "5. Chia sẻ – Đánh giá – Kết thúc chơi";
  } else if (domain.domainType === 'SKILLS') {
    step5Name = "5. Đánh giá – Điều chỉnh";
  } else if (domain.domainType === 'LETTER_TRACING') {
    step1Name = "1. Gợi hứng thú – Hình thành và lựa chọn ý tưởng";
    step2Name = "2. Thỏa thuận - Lập kế hoạch thực hiện";
    step3Name = "3. Thực hiện hoạt động";
    step4Name = "4. Mở rộng và phát triển kỹ năng";
    step5Name = "5. Chia sẻ – Đánh giá – Kết thúc";
  }

  const defaultNames = [
    step1Name,
    step2Name,
    step3Name,
    step4Name,
    step5Name
  ];

  return activities.map((act, idx) => {
    const newAct = { ...act };
    const step1 = { ...(newAct.step1 || {}) };

    let teacherAction = (step1.teacherAction || '').replace(/\*\*/g, '');
    let studentAction = (step1.studentAction || '').replace(/\*\*/g, '');

    // For non-music plans, strip any accidental music subheaders if LLM hallucinated them
    if (domain.domainType !== 'MUSIC') {
      teacherAction = teacherAction
        .replace(/^a[\.\)]\s*Dạy hát[^\n]*\n?/gmi, '')
        .replace(/^b[\.\)]\s*Nghe hát[^\n]*\n?/gmi, '')
        .replace(/Trò chơi âm nhạc\s*[:'"][^\n]*\n?/gmi, '');
      studentAction = studentAction
        .replace(/^a[\.\)][^\n]*\n?/gmi, '')
        .replace(/^b[\.\)][^\n]*\n?/gmi, '');
    }

    let determinedIndex = idx + 1;
    if (typeof act.index === 'number' && act.index >= 1 && act.index <= 5) {
      determinedIndex = act.index;
    } else if (act.name) {
      const lower = act.name.toLowerCase();
      if (/^1[\.\s\-–—]/.test(lower) || lower.includes('khởi động') || lower.includes('gợi hứng thú') || lower.includes('tạo tình huống') || lower.includes('tạo hứng thú')) {
        determinedIndex = 1;
      } else if (/^2[\.\s\-–—]/.test(lower) || lower.includes('thỏa thuận') || lower.includes('lập kế hoạch') || lower.includes('khám phá') || lower.includes('trải nghiệm')) {
        determinedIndex = 2;
      } else if (/^5[\.\s\-–—]/.test(lower) || lower.includes('kết thúc') || lower.includes('đánh giá') || lower.includes('điều chỉnh') || lower.includes('hồi tĩnh') || (lower.includes('chia sẻ') && lower.includes('đánh giá'))) {
        determinedIndex = 5;
      } else if (/^4[\.\s\-–—]/.test(lower) || lower.includes('phát triển kỹ năng') || lower.includes('vận dụng') || lower.includes('mở rộng') || lower.includes('thực hành')) {
        determinedIndex = 4;
      } else if (/^3[\.\s\-–—]/.test(lower) || lower.includes('thực hiện hoạt động') || lower.includes('thảo luận') || lower.includes('chia sẻ')) {
        determinedIndex = 3;
      }
    }
    
    if (determinedIndex === 1) {
      newAct.name = step1Name;
    } else if (determinedIndex === 2) {
      newAct.name = step2Name;
    } else if (determinedIndex === 3) {
      newAct.name = step3Name;
    } else if (determinedIndex === 4) {
      newAct.name = step4Name;
    } else if (determinedIndex === 5) {
      newAct.name = step5Name;
    } else if (idx < defaultNames.length) {
      newAct.name = defaultNames[idx];
    }

    // Fallback if teacherAction or studentAction is empty
    if (!teacherAction.trim() || !studentAction.trim()) {
      const defaultActs = generateDefaultPreschoolActivities(lessonTitle, subject, domain);
      const matched = defaultActs[determinedIndex - 1] || defaultActs[idx] || defaultActs[0];
      if (!teacherAction.trim() && matched?.step1?.teacherAction) {
        teacherAction = matched.step1.teacherAction;
      }
      if (!studentAction.trim() && matched?.step1?.studentAction) {
        studentAction = matched.step1.studentAction;
      }
    }

    if (determinedIndex === 4) {
      const enriched = enrichPreschoolStep4(teacherAction, studentAction, lessonTitle, subject, domain);
      teacherAction = enriched.teacherAction;
      studentAction = enriched.studentAction;
    } else if (determinedIndex === 5) {
      const enriched = enrichPreschoolStep5(teacherAction, studentAction, domain);
      teacherAction = enriched.teacherAction;
      studentAction = enriched.studentAction;
    }

    step1.teacherAction = expandPreschoolTextLines(teacherAction)
      .map((l) => cleanPreschoolBulletLine(l))
      .filter(Boolean)
      .join('\n')
      .trim();
    step1.studentAction = expandPreschoolTextLines(studentAction)
      .map((l) => cleanPreschoolBulletLine(l))
      .filter(Boolean)
      .join('\n')
      .trim();
    newAct.step1 = step1;
    return newAct;
  });
}

export function formatPreschoolMusicActivities(activities: any[], lessonTitle: string = '', oldPlanContent: string = ''): any[] {
  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return generateDefaultPreschoolActivities(lessonTitle, 'Âm nhạc', { domainType: 'MUSIC' });
  }

  const { mainSong, listeningSong, gameTitle, focusType, movementType } = extractSongTitles(lessonTitle, oldPlanContent);

  return activities.map((act, idx) => {
    let determinedIndex = idx + 1;
    if (typeof act.index === 'number' && act.index >= 1 && act.index <= 5) {
      determinedIndex = act.index;
    } else if (act.name) {
      const lower = act.name.toLowerCase();
      if (/^1[\.\s\-–—]/.test(lower) || lower.includes('khởi động') || lower.includes('tạo tình huống') || lower.includes('tạo hứng thú')) {
        determinedIndex = 1;
      } else if (/^2[\.\s\-–—]/.test(lower) || lower.includes('khám phá') || lower.includes('trải nghiệm')) {
        determinedIndex = 2;
      } else if (/^5[\.\s\-–—]/.test(lower) || lower.includes('đánh giá') || lower.includes('điều chỉnh') || lower.includes('hồi tĩnh') || (lower.includes('chia sẻ') && lower.includes('đánh giá'))) {
        determinedIndex = 5;
      } else if (/^4[\.\s\-–—]/.test(lower) || lower.includes('vận dụng') || lower.includes('mở rộng') || lower.includes('thực hành')) {
        determinedIndex = 4;
      } else if (/^3[\.\s\-–—]/.test(lower) || lower.includes('thảo luận') || lower.includes('chia sẻ')) {
        determinedIndex = 3;
      }
    }
    
    const newAct = { ...act };
    const step1 = { ...(newAct.step1 || {}) };

    let teacherAction = (step1.teacherAction || '').trim();
    let studentAction = (step1.studentAction || '').trim();

    if (determinedIndex === 1) {
      newAct.name = "1. Khởi động – Tạo tình huống";
      if (!teacherAction || (!teacherAction.includes('âm thanh') && !teacherAction.includes('hát') && !teacherAction.includes('nhạc'))) {
        teacherAction = `- Cô cùng cả lớp chơi trò chơi âm thanh ("Lắng nghe âm thanh kỳ diệu"): Cô phát các âm thanh vui tươi, tiếng chuông gió hoặc tiếng kêu của các con vật quen thuộc để trẻ lắng nghe và phán đoán.\n- Cô tạo tình huống dẫn dắt dịu dàng, truyền cảm: "Các con ơi! Hôm nay lớp chúng mình sẽ cùng bước vào một không gian âm nhạc vô cùng rộn rã với những giai điệu thật tươi vui đấy! Chúng mình đã sẵn sàng chưa nào?".\n- Cô giới thiệu đề tài và mời các bé cùng chuẩn bị tham gia biểu diễn.`;
        studentAction = `- Trẻ chăm chú lắng nghe âm thanh và hào hứng reo vui, đoán đúng nguồn âm thanh.\n- Trẻ hưởng ứng vỗ tay nồng nhiệt, tươi cười sẵn sàng bước vào bài học âm nhạc cùng cô.`;
      }
    } else if (determinedIndex === 2) {
      newAct.name = "2. Khám phá – Trải nghiệm";
      if (!teacherAction || (!teacherAction.includes('nhạc cụ') && !teacherAction.includes('nhún nhảy') && !teacherAction.includes('gõ đệm'))) {
        teacherAction = `- Cô mở bản nhạc bài hát "${mainSong}" với giai điệu vui tươi, rộn rã.\n- Cô khuyến khích trẻ tản ra không gian lớp học, tự do lắng nghe, nhún nhảy và tự sáng tạo các động tác điệu bộ, vỗ tay minh họa theo cảm nhận của riêng mình.\n- Cô để trẻ tự tìm đến khay nhạc cụ (xắc xô, phách tre, gáo dừa, trống lắc) chọn món đồ chơi âm nhạc yêu thích và tự gõ đệm theo nhịp điệu bài hát cùng bạn.\n- Cô bao quát, mỉm cười khích lệ trẻ cảm nhận giai điệu (không uốn nắn hay dạy kỹ thuật ngay lúc này).`;
        studentAction = `- Trẻ di chuyển tự do trong lớp, hào hứng lắng nghe giai điệu bài hát "${mainSong}".\n- Trẻ tự nghĩ ra các động tác nhún nhảy, lắc lư cơ thể và tự nhẩm hát theo lời ca.\n- Trẻ vui vẻ chọn xắc xô, phách tre tự gõ đệm hòa nhịp cùng bạn bên cạnh.`;
      }
    } else if (determinedIndex === 4) {
      newAct.name = "4. Vận dụng – Mở rộng";
      const hasGameDetails = /cách chơi/i.test(teacherAction) && /luật chơi/i.test(teacherAction);
      if (!hasGameDetails) {
        teacherAction = `- Cô tổ chức hoạt động giao lưu âm nhạc và trò chơi củng cố:\n- Mời các nhóm trẻ lên sân khấu đeo mũ múa biểu diễn giao lưu bài hát "${mainSong}" kết hợp gõ đệm nhạc cụ tự tạo (phách tre, xắc xô).\n- Cô bao quát, cổ vũ và khen ngợi sự tự tin, sáng tạo của các nhóm.\n\n+ Trò chơi âm nhạc: “${gameTitle}”\n- **Cách chơi:** Cô chuẩn bị các nốt nhạc / vòng tròn may mắn trên sàn. Khi nhạc nổi lên, cả lớp vừa đi vừa hát bài "Ngày vui của bé". Khi nhạc dừng hoặc có hiệu lệnh của cô, mỗi trẻ nhanh chân nhảy vào 1 nốt nhạc / gọi đúng tên bạn hát hoặc thực hiện yêu cầu âm nhạc vui nhộn.\n- **Luật chơi:** Bạn nào không tìm được nốt nhạc hoặc đoán sai tên bạn hát sẽ phải nhảy lò cò 1 vòng hoặc hát tặng cả lớp 1 câu hát.\n- Tổ chức cho trẻ chơi 2 - 3 lần sôi nổi.`;
        studentAction = `- Trẻ hào hứng đeo mũ múa, tự tin bước lên sân khấu biểu diễn giao lưu cùng các bạn:\n  + Nhóm 1: Trẻ hát vang kết hợp gõ phách tre nhịp nhàng.\n  + Nhóm 2: Trẻ vừa hát vừa nhún nhảy, lắc xắc xô rộn rã.\n  + Nhóm 3: Trẻ tự tin biểu diễn các động tác minh họa sinh động.\n- Trẻ hào hứng lắng nghe cô phổ biến luật chơi và tham gia trò chơi âm nhạc “${gameTitle}” 2 - 3 lần.\n- Trẻ phản xạ nhanh nhạy, reo vui khi đoán đúng và vui vẻ nhảy lò cò khi bị phạm quy.`;
      }
    } else if (determinedIndex === 5) {
      newAct.name = "5. Chia sẻ – Đánh giá";
      const hasCleanUp = /thu dọn|dọn dẹp|cất đồ|cất nhạc cụ/i.test(teacherAction);
      if (!hasCleanUp) {
        teacherAction = `- Cô tập trung trẻ lại, trò chuyện hỏi cảm nhận của trẻ:\n  + "Hôm nay các con cảm thấy thế nào sau giờ học âm nhạc?"\n  + "Các con thích nhất bài hát, điệu múa hay trò chơi âm nhạc nào?"\n  + "Về nhà các con sẽ hát tặng ai bài hát tuyệt vời này?"\n- Cô nhận xét, tuyên dương sự nỗ lực, giọng hát trong sáng, điệu bộ tự tin và tinh thần hợp tác của trẻ trong suốt buổi học.\n- Hướng dẫn trẻ cùng cô thu dọn nhạc cụ (phách tre, xắc xô, trống lắc), mũ múa cất vào đúng góc âm nhạc, củng cố nề nếp ngăn nắp vệ sinh lớp học.`;
        studentAction = `- Trẻ tự tin chia sẻ cảm xúc, niềm vui khi được hát múa và chơi trò chơi âm nhạc cùng cô và các bạn.\n- Trẻ tích cực trả lời: "Con rất vui và thích biểu diễn bài hát ạ!", "Về nhà con sẽ hát cho ông bà, bố mẹ nghe!".\n- Trẻ tươi cười lắng nghe cô nhận xét và đón nhận lời khen ngợi.\n- Trẻ tự giác cùng cô và các bạn thu dọn xắc xô, phách tre, mũ múa xếp gọn gàng vào các khay ở góc âm nhạc.`;
      }
    }

    if (determinedIndex !== 3) {
      step1.teacherAction = expandPreschoolTextLines(teacherAction)
        .map((l) => cleanPreschoolBulletLine(l))
        .filter(Boolean)
        .join('\n')
        .trim();
      step1.studentAction = expandPreschoolTextLines(studentAction)
        .map((l) => cleanPreschoolBulletLine(l))
        .filter(Boolean)
        .join('\n')
        .trim();
      newAct.step1 = step1;
      return newAct;
    }

    newAct.name = "3. Chia sẻ – Thảo luận";

    // 1. Process Teacher Action - BẮT BUỘC PHẢI CÓ ĐỦ CẢ a. (Hát vận động hoặc Dạy hát) VÀ b. Nghe hát:
    const lines = expandPreschoolTextLines(teacherAction);
    
    let aLines: string[] = [];
    let bLines: string[] = [];
    let currentPart: 'A' | 'B' | 'NONE' = 'NONE';

    lines.forEach(line => {
      const cleanLine = line.replace(/\*\*/g, '').trim();
      if (/^([-\s]*[bB][\.\)]\s*(?:Nghe hát|Bài hát nghe|Nghe|b\.))/i.test(cleanLine) || /^[-\s]*b[\.\)]/i.test(cleanLine)) {
        currentPart = 'B';
        bLines.push(cleanLine);
      } else if (/^([-\s]*[aA][\.\)]\s*(?:Hát vận động|Vận động theo nhạc|Dạy vận động|Vận động|Vỗ tay|Múa|Dạy hát|Hát|Trọng tâm|a\.))/i.test(cleanLine) || /^[-\s]*a[\.\)]/i.test(cleanLine)) {
        currentPart = 'A';
        aLines.push(cleanLine);
      } else if (currentPart === 'B') {
        bLines.push(cleanLine);
      } else if (currentPart === 'A') {
        aLines.push(cleanLine);
      } else {
        // Before any header, check if it talks about listening song
        if (cleanLine.toLowerCase().includes('nghe hát')) {
          currentPart = 'B';
          bLines.push(cleanLine);
        } else {
          currentPart = 'A';
          aLines.push(cleanLine);
        }
      }
    });

    // Determine correct header for section A
    let defaultAHeader = `a. Dạy hát: "${mainSong}" (TT)`;
    if (focusType === 'HAT_VAN_DONG') {
      defaultAHeader = `a. ${movementType}: "${mainSong}" (TT)`;
    } else if (focusType === 'NGHE_HAT') {
      defaultAHeader = `a. Nghe hát: "${mainSong}" (TT)`;
    }

    if (aLines.length === 0) {
      if (focusType === 'HAT_VAN_DONG') {
        aLines = [
          defaultAHeader,
          `- Cô cho cả lớp hát lại bài hát "${mainSong}" 1 - 2 lần để trẻ nhớ lại giai điệu và lời ca.`,
          `- Cô giới thiệu và thực hiện vận động mẫu:`,
          `+ Lần 1: Làm mẫu toàn phần kết hợp hát và vận động nhịp nhàng, biểu cảm từ đầu đến hết bài.`,
          `+ Lần 2: Làm mẫu kết hợp phân tích kỹ thuật từng động tác vận động minh họa / vỗ tay nhịp nhàng theo câu hát của bài "${mainSong}".`,
          `+ Lần 3: Nhấn mạnh các động tác tạo điểm nhấn và tư thế biểu diễn tự tin.`,
          `- Tổ chức cho trẻ thực hành vận động:`,
          `+ Cho cả lớp cùng đứng dậy hát và vận động theo cô (2 - 3 lần).`,
          `+ Cho các tổ, nhóm bạn trai, nhóm bạn gái thi đua hát và vận động luân phiên (kết hợp dụng cụ gõ đệm: phách tre, xắc xô, gáo dừa...).`,
          `+ Mời cá nhân trẻ tự tin lên sân khấu biểu diễn hát vận động. Cô chú ý quan sát, sửa sai và khích lệ trẻ biểu diễn tự nhiên, đúng nhịp.`
        ];
      } else {
        aLines = [
          defaultAHeader,
          `- Cô hát mẫu lần 1: Rõ lời, đúng giai điệu và tính chất bài hát.`,
          `- Cô hát mẫu lần 2: Kết hợp cử chỉ, điệu bộ minh họa và giảng giải nội dung bài hát "${mainSong}".`,
          `- Dạy trẻ hát:`,
          `+ Cô bắt nhịp cho cả lớp hát cùng cô từ đầu đến hết bài (2 - 3 lần).`,
          `+ Cho các tổ, nhóm bạn trai, nhóm bạn gái thi đua hát luân phiên.`,
          `+ Mời cá nhân trẻ thể hiện bài hát. Cô chú ý lắng nghe, sửa sai cao độ, nhịp điệu và lời ca cho trẻ kịp thời.`
        ];
      }
    } else {
      // Normalize first line of aLines: If focusType is HAT_VAN_DONG, it MUST NOT start with "Dạy hát"!
      let firstA = aLines[0].replace(/^[-•*+\s]*a[\.\)]\s*/i, '').trim();
      if (focusType === 'HAT_VAN_DONG') {
        // Strip any accidental "Dạy hát"
        firstA = firstA.replace(/^dạy hát\s*[:\-\–—]?\s*/i, '');
        if (!firstA.toLowerCase().includes(movementType.toLowerCase()) && !firstA.toLowerCase().includes('vận động')) {
          firstA = `${movementType}: "${mainSong}" (TT) - ${firstA}`;
        } else if (!firstA.toLowerCase().startsWith(movementType.toLowerCase())) {
          firstA = `${movementType}: "${mainSong}" (TT)`;
        }
      } else if (focusType === 'DAY_HAT') {
        if (!firstA.toLowerCase().startsWith('dạy hát')) {
          firstA = `Dạy hát: "${mainSong}" (TT) - ${firstA}`;
        }
      }
      aLines[0] = `a. ${firstA}`;
      if (!/\(TT\)/i.test(aLines[0])) {
        aLines[0] = `${aLines[0]} (TT)`;
      }
    }

    // Ensure bLines has valid header and content (STRICTLY NO GAMES IN B. NGHE HÁT)
    const defaultBHeader = focusType === 'NGHE_HAT' ? `b. Hát vận động: "${listeningSong}"` : `b. Nghe hát: "${listeningSong}"`;
    if (bLines.length === 0) {
      bLines = [
        defaultBHeader,
        `- Cô giới thiệu tên bài hát nghe "${listeningSong}", tên tác giả.`,
        `- Cô hát cho trẻ nghe lần 1: Thể hiện tình cảm tha thiết, truyền cảm của giai điệu bài hát.`,
        `- Giảng giải nội dung, ý nghĩa bài hát: Giáo dục trẻ biết yêu thương, trân trọng và biết ơn.`,
        `- Cô hát cho trẻ nghe lần 2: Kết hợp động tác múa minh họa mềm mại, khuyến khích trẻ đứng lên cùng nhún nhảy, đung đưa hưởng ứng theo giai điệu bài hát.`
      ];
    } else {
      // Normalize first line of bLines to start cleanly with b. Nghe hát: (Strip any game text like T/C: Tai ai thính)
      let firstB = bLines[0]
        .replace(/^[-•*+\s]*b[\.\)]\s*/i, '')
        .replace(/(?:trò chơi âm nhạc|tcân|t\/c|tc|trò chơi)\s*[:'"][^\n\)]*/gi, '')
        .replace(/\btai ai thính\b/gi, '')
        .trim();
      if (!firstB.toLowerCase().startsWith('nghe hát')) {
        firstB = `Nghe hát: "${listeningSong}"`;
      }
      bLines[0] = `b. ${firstB}`;
      // Clean any accidental game lines in bLines
      bLines = bLines.filter(l => !/^(?:[-\s]*\+?\s*)?(?:trò chơi âm nhạc|tcân|t\/c|tc)\b/i.test(l));
    }

    // Clean bullet formatting for sub-items of A and B
    const cleanSectionLines = (secLines: string[]): string[] => {
      if (secLines.length === 0) return [];
      const header = secLines[0].trim();
      const body = secLines.slice(1).map(l => cleanPreschoolBulletLine(l)).filter(Boolean);
      return [header, ...body];
    };

    const finalALines = cleanSectionLines(aLines);
    const finalBLines = cleanSectionLines(bLines);

    step1.teacherAction = [...finalALines, ...finalBLines].join('\n');

    // 2. Process Student Action - BẮT BUỘC PHẢI TƯƠNG ỨNG VỚI CẢ (HÁT VẬN ĐỘNG / DẠY HÁT) VÀ NGHE HÁT
    let sLines = studentAction.split('\n').map(l => l.trim()).filter(Boolean);
    // Strip any floating standalone a. or b. labels
    sLines = sLines.filter(l => !/^[-\s]*[ab][\.\)]\s*$/i.test(l) && !/^[ab][\.\)]$/i.test(l));

    let sPartA: string[] = [];
    let sPartB: string[] = [];
    let foundListening = false;

    sLines.forEach(l => {
      const lower = l.toLowerCase();
      if (/^[-\s]*[bB][\.\)]/i.test(l) || lower.includes('nghe hát') || lower.includes('lắng nghe cô hát bài nghe') || lower.includes('nhún nhảy hưởng ứng')) {
        foundListening = true;
      }
      const cleanL = l.replace(/^[-\s]*[ab][\.\)]\s*/i, '').trim();
      if (cleanL) {
        if (foundListening) {
          sPartB.push(cleanL);
        } else {
          sPartA.push(cleanL);
        }
      }
    });

    if (sPartA.length === 0) {
      if (focusType === 'HAT_VAN_DONG') {
        sPartA = [
          `- Trẻ quây quần bên cô, hào hứng hát lại bài hát "${mainSong}" cùng cô để nhớ lại giai điệu.`,
          `- Trẻ chăm chú quan sát cô làm mẫu từng động tác vận động và lắng nghe cô phân tích kỹ thuật.`,
          `- Cả lớp đứng lên cùng hát và vận động nhịp nhàng theo cô (2 - 3 lần).`,
          `- Từng tổ, nhóm bạn trai, bạn gái và cá nhân trẻ tự tin lên sân khấu thể hiện hát vận động kết hợp dụng cụ gõ đệm trong tiếng vỗ tay cổ vũ của các bạn.`
        ];
      } else {
        sPartA = [
          'Trẻ chú ý lắng nghe cô hát mẫu và quan sát các động tác cử chỉ của cô.',
          'Cả lớp vui tươi, hào hứng hát cùng cô từ đầu đến hết bài (2 - 3 lần).',
          'Từng tổ, nhóm và cá nhân trẻ tự tin đứng lên biểu diễn bài hát.',
          'Trẻ lắng nghe bạn hát và sửa sai theo sự hướng dẫn của cô.'
        ];
      }
    }

    if (sPartB.length === 0) {
      sPartB = [
        `Trẻ ngồi yên lặng, chăm chú lắng nghe cô hát bài nghe hát "${listeningSong}".`,
        'Trẻ hiểu nội dung bài hát qua lời giảng giải của cô.',
        'Trẻ vui vẻ đứng dậy nhún nhảy, làm động tác đung đưa hưởng ứng cùng cô theo nhịp điệu bài hát.'
      ];
    }

    const cleanSPartA = sPartA.map(l => cleanPreschoolBulletLine(l)).filter(Boolean);
    const cleanSPartB = sPartB.map(l => cleanPreschoolBulletLine(l)).filter(Boolean);

    step1.studentAction = [...cleanSPartA, ...cleanSPartB].join('\n');

    newAct.step1 = step1;
    return newAct;
  });
}

export interface PreschoolPairRow {
  type: 'title' | 'subheader' | 'item';
  teacherText: string;
  studentText: string;
}

/**
 * Splits and expands any squashed run-on text lines in preschool activities into clean individual lines.
 * Handles <br>, escaped newlines, squashed bullet points, game sections, age differentiations, etc.
 */
export function expandPreschoolTextLines(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  
  // 1. Normalize all forms of newlines and line breaks
  let normalized = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // 2. Expand squashed game headers: e.g. "...hết bài. Trò chơi 2:..." or "...vui vẻ. + Trò chơi: “..."
  // CRITICAL: ONLY split after sentence-ending punctuation (. ! ? … ;) followed by a game header or bulleted game.
  // NEVER match inside running sentences like "Cô tổ chức trò chơi", "tham gia trò chơi", "chơi trò chơi", etc.
  normalized = normalized.replace(/(?<=[.!?…;])\s+(?=(?:[-+•*]\s*(?:\*\*)?\s*Trò chơi|Trò chơi\s+\d+[:\s]|(?:\*\*)?Trò chơi\s*:\s*[“"”']))/gi, '\n\n');

  // 3. Expand squashed game subheadings: "- Cách chơi:", "- Luật chơi:", "- Mục tiêu:"
  // ONLY split after sentence-ending punctuation (. ! ? … ;)
  normalized = normalized.replace(/(?<=[.!?…;])\s+(?=[-\+•*]?\s*(?:\*\*)?\s*(?:Cách chơi|Luật chơi|Mục tiêu)\s*:)/gi, '\n');

  // 4. Expand squashed physical subheadings: "* Bài tập phát triển chung:", "* Vận động cơ bản:"
  normalized = normalized.replace(/(?<=[.!?…;])\s+(?=[-\+•*]?\s*(?:\*\*)?\s*(?:Bài tập phát triển chung|Vận động cơ bản|BTPTC|VĐCB)\b)/gi, '\n\n');

  // 5. Expand squashed age/group differentiations: e.g. "+ Trẻ 5 tuổi:", "+ Trẻ 4 tuổi:", "+ Trẻ 3 tuổi:", "+ Nhóm 1:"
  normalized = normalized.replace(/(?<=[.!?…;])\s+(?=[-\+•*]?\s*(?:\*\*)?\s*(?:Trẻ\s+\d+\s+tuổi|Nhóm\s+\d+|Tổ\s+\d+)\s*:)/gi, '\n');

  // 6. Expand squashed bullet items starting with + or - or * after sentence endings (. ! ? ; : " ')
  normalized = normalized.replace(/(?<=[.!?…;])\s+(?=[-\+•*]\s+[A-ZÀ-Ỵa-zà-ỹ0-9])/g, '\n');

  // 7. Expand sub-items a., b., c.
  normalized = normalized.replace(/(?<=[.!?…;])\s+(?=[ab][\.\)]\s*(?:Dạy hát|Nghe hát|Hát vận động|Trò chơi|Khám phá|Bài tập|Vận động)\b)/gi, '\n\n');

  // Split, trim, and filter
  return normalized
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

/**
 * Normalizes preschool bullet lines to avoid redundant or conflicting symbols like (-) +, - +, + -, *, ->
 * If line has +, it uses single clean '+ '
 * If line has -, it uses single clean '- '
 */
export function cleanPreschoolBulletLine(line: string): string {
  if (!line) return '';
  let trimmed = line.trim();
  if (!trimmed) return '';

  // Clean arrow symbols -> or --> into clean arrow →
  trimmed = trimmed.replace(/\s*--?>\s*/g, ' → ');

  // If the line is a teacher or student instruction/narrative sentence (e.g. "Cô tổ chức...", "Mời 1-2 trẻ...", "Hỏi trẻ...", "Cô bao quát...", "Trẻ hào hứng...")
  // It must remain a normal bullet line, NEVER treated as a standalone game title!
  if (/^[-•*+\s–—]*(?:Cô|Giáo viên|Mời|Hỏi|Cho trẻ|Hướng dẫn|Tổ chức cho trẻ|Bao quát|Tuyên dương|Trẻ|Cả lớp)\b/i.test(trimmed)) {
    let bullet = '-';
    if (/^\s*\+\s*/.test(trimmed) || /^[-•*\s]*\+\s*/.test(trimmed)) {
      bullet = '+';
    }
    const cleanContent = trimmed.replace(/^[-•*+\s–—]+/, '').trim();
    return `${bullet} ${cleanContent}`;
  }

  // 1. Standalone Game Header: e.g. "* Trò chơi 1: ...", "**Trò chơi 1: ...**", "+ Trò chơi: “Ai nhanh...”", "- Trò chơi 1: ...", "Trò chơi 1: ..."
  if (/^[-•*+\s–—]*(?:Trò chơi|\*\*Trò chơi)\s*\d*[:\s]/i.test(trimmed)) {
    const hasPlus = /^\s*\+\s*/.test(trimmed) || /^[-•*\s]*\+\s*/.test(trimmed);
    const cleanGameHeader = trimmed.replace(/^[-•*+\s–—]+/, '').replace(/\*\*/g, '').trim();
    if (hasPlus) {
      return `+ **${cleanGameHeader}**`;
    }
    return `**${cleanGameHeader}**`;
  }

  // 2. Physical Education / Music subheaders
  if (/^[-•*+\s–—]*(?:Bài tập phát triển chung|Vận động cơ bản|BTPTC|VĐCB)/i.test(trimmed)) {
    const cleanSub = trimmed.replace(/^[-•*+\s–—]+/, '').replace(/\*\*/g, '').trim();
    return `**${cleanSub}**`;
  }

  // 3. Section subheadings like "a. Dạy hát..." or "b. Nghe hát..."
  if (/^[-\s]*[ab][\.\)]\s*(?:Dạy hát|Nghe hát|Hát vận động|Trò chơi|Khám phá)/i.test(trimmed) || /^([ab][\.\)]\s*.*)$/i.test(trimmed)) {
    let cleanSub = trimmed.replace(/^-\s*/, '').replace(/\*\*/g, '').trim();
    return `**${cleanSub}**`;
  }

  // 4. Auto-bold standard game subheadings: Cách chơi, Luật chơi, Mục tiêu, Chuẩn bị (Strip ANY existing **, * or - symbols cleanly)
  if (/^[-•*+\s–—]*(?:\*\*)?\s*Cách chơi\s*:?/i.test(trimmed)) {
    let content = trimmed.replace(/^[-•*+\s–—]*(?:\*\*)?\s*Cách chơi\s*:?\s*(?:\*\*)?\s*/i, '').replace(/^\*\*\s*/, '').trim();
    return `- **Cách chơi:** ${content}`;
  }
  if (/^[-•*+\s–—]*(?:\*\*)?\s*Luật chơi\s*:?/i.test(trimmed)) {
    let content = trimmed.replace(/^[-•*+\s–—]*(?:\*\*)?\s*Luật chơi\s*:?\s*(?:\*\*)?\s*/i, '').replace(/^\*\*\s*/, '').trim();
    return `- **Luật chơi:** ${content}`;
  }
  if (/^[-•*+\s–—]*(?:\*\*)?\s*Mục tiêu\s*:?/i.test(trimmed)) {
    let content = trimmed.replace(/^[-•*+\s–—]*(?:\*\*)?\s*Mục tiêu\s*:?\s*(?:\*\*)?\s*/i, '').replace(/^\*\*\s*/, '').trim();
    return `- **Mục tiêu:** ${content}`;
  }
  if (/^[-•*+\s–—]*(?:\*\*)?\s*Chuẩn bị\s*:?/i.test(trimmed)) {
    let content = trimmed.replace(/^[-•*+\s–—]*(?:\*\*)?\s*Chuẩn bị\s*:?\s*(?:\*\*)?\s*/i, '').replace(/^\*\*\s*/, '').trim();
    return `- **Chuẩn bị:** ${content}`;
  }

  // 5. Age group / differentiation labels: "Trẻ 5 tuổi:", "Trẻ 4 tuổi:", "Trẻ 3 tuổi:", "Nhóm 1 (Trẻ 5 tuổi):"
  const ageMatch = trimmed.match(/^[-•*+\s–—]*(?:\*\*)?\s*(Trẻ\s+\d+\s+tuổi|Nhóm\s+\d+(?:\s*\([^)]+\))?|Tổ\s+\d+)\s*:\s*(?:\*\*)?\s*(.*)$/i);
  if (ageMatch) {
    const label = ageMatch[1].trim();
    const content = ageMatch[2].replace(/^\*\*\s*/, '').trim();
    return `+ **${label}:** ${content}`;
  }

  // Clean (-)+ or (-) + or (-)\s*\+
  trimmed = trimmed.replace(/^\s*\(\s*[-–—]\s*\)\s*\+\s*/, '+ ');
  trimmed = trimmed.replace(/^\s*\(\s*\+\s*\)\s*[-–—]\s*/, '+ ');
  trimmed = trimmed.replace(/^\s*\(\s*[-–—]\s*\)\s*/, '- ');
  trimmed = trimmed.replace(/^\s*\(\s*\+\s*\)\s*/, '+ ');

  // Clean - + or + - or -+ or +- or --+ or ++-
  trimmed = trimmed.replace(/^[-–—\s]*\+\s*[-–—\s]*/, '+ ');
  trimmed = trimmed.replace(/^\+[-–—\s]+/, '+ ');
  trimmed = trimmed.replace(/^[-–—]+\s*[-–—]+/, '- ');

  let bullet = '-';
  if (/^\s*\+\s*/.test(trimmed) || /^[-•*\s]*\+\s*/.test(trimmed)) {
    bullet = '+';
  }

  // Strip all leading bullet symbols then attach clean single bullet
  trimmed = trimmed.replace(/^[-•*+\s–—]+/, '').trim();
  if (!trimmed) return '';
  return `${bullet} ${trimmed}`;
}

/**
 * Format and standardize Letter Game activities, ensuring:
 * 1. 5 distinct, highly engaging games in Act 3
 * 2. Every game has separate lines for Name (Trò chơi x: ...), - **Cách chơi:**, - **Luật chơi:**, - **Mục tiêu:**
 * 3. Never squashed into a single continuous block and no stray *, ->, **
 */
export function formatPreschoolLetterGameActivities(
  activities: any[],
  lessonTitle: string = '',
  subject: string = ''
): any[] {
  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return generateDefaultPreschoolActivities(lessonTitle, subject, { domainType: 'LETTER_GAME' });
  }

  const defaultActs = generateDefaultPreschoolActivities(lessonTitle, subject, { domainType: 'LETTER_GAME' });

  return activities.map((act, idx) => {
    let determinedIndex = idx + 1;
    if (typeof act.index === 'number' && act.index >= 1 && act.index <= 5) {
      determinedIndex = act.index;
    } else if (act.name) {
      const lower = act.name.toLowerCase();
      if (/^1[\.\s\-–—]/.test(lower) || lower.includes('gợi hứng thú') || lower.includes('khởi động')) determinedIndex = 1;
      else if (/^2[\.\s\-–—]/.test(lower) || lower.includes('thỏa thuận') || lower.includes('kế hoạch')) determinedIndex = 2;
      else if (/^3[\.\s\-–—]/.test(lower) || lower.includes('thực hiện hoạt động chơi') || lower.includes('thực hiện')) determinedIndex = 3;
      else if (/^4[\.\s\-–—]/.test(lower) || lower.includes('mở rộng')) determinedIndex = 4;
      else if (/^5[\.\s\-–—]/.test(lower) || lower.includes('chia sẻ') || lower.includes('kết thúc')) determinedIndex = 5;
    }

    const newAct = { ...act };
    const step1 = { ...(newAct.step1 || {}) };
    let teacherAction = (step1.teacherAction || '').trim();
    let studentAction = (step1.studentAction || '').trim();

    if (determinedIndex === 3) {
      newAct.name = "3. Thực hiện hoạt động chơi";

      // Break squashed bullet game markers into real newlines if returned as single run-on paragraph
      if (teacherAction.includes('- Trò chơi 2') || teacherAction.includes('* Trò chơi 2') || teacherAction.includes('Trò chơi 2:')) {
        teacherAction = teacherAction
          .replace(/(?:^|\n|[\.\!\?])\s*[-•*]?\s*(Trò chơi\s*\d+[:\s][^\n]+?)(?=(?:[-•*]?\s*Trò chơi\s*\d+[:\s]|$))/gi, (_match, p1) => {
            return `\n\n${p1.replace(/^[-•*+\s]+/, '').trim()}\n`;
          });
      }

      // Check if games have structured Cách chơi / Luật chơi / Mục tiêu
      const lines = teacherAction.split('\n').map(l => l.trim()).filter(Boolean);
      const hasProperStructure = lines.filter(l => l.includes('Cách chơi') || l.includes('Luật chơi') || l.includes('Mục tiêu')).length >= 5;

      if (!hasProperStructure || lines.length < 10) {
        const defaultAct3 = defaultActs[2]?.step1?.teacherAction;
        if (defaultAct3) {
          teacherAction = defaultAct3;
        }
      }

      if (!studentAction || studentAction.length < 50) {
        const defaultStudent3 = defaultActs[2]?.step1?.studentAction;
        if (defaultStudent3) {
          studentAction = defaultStudent3;
        }
      }
    }

    step1.teacherAction = teacherAction
      .split('\n')
      .map(l => cleanPreschoolBulletLine(l))
      .filter(Boolean)
      .join('\n')
      .trim();

    step1.studentAction = studentAction
      .split('\n')
      .map(l => cleanPreschoolBulletLine(l))
      .filter(Boolean)
      .join('\n')
      .trim();

    newAct.step1 = step1;
    return newAct;
  });
}

export function parseActivityPairs(act: any): PreschoolPairRow[] {
  const rows: PreschoolPairRow[] = [];
  if (!act) return rows;

  const nameClean = (act.name || '').replace(/\[TIẾT\s*\d+\]\s*/i, '').trim();
  if (nameClean) {
    rows.push({
      type: 'title',
      teacherText: nameClean,
      studentText: '',
    });
  }

  const step1 = act.step1 || {};
  let teacherAction = (step1.teacherAction || '').replace(/\*\*/g, '').trim();
  let studentAction = (step1.studentAction || '').replace(/\*\*/g, '').trim();

  const isSubheaderLine = (line: string) => {
    const tr = line.trim().replace(/\*\*/g, '');
    return /^([ab][\.\)]\s*.*)$/i.test(tr) ||
      /^\*?\s*(Bài tập phát triển chung|Vận động cơ bản|BTPTC|VĐCB)/i.test(tr);
  };

  const formatItemLine = (line: string) => {
    return cleanPreschoolBulletLine(line);
  };

  const hasSubheaders = isSubheaderLine(teacherAction) ||
    /^a[\.\)]\s*/m.test(teacherAction) ||
    /^b[\.\)]\s*/m.test(teacherAction) ||
    /Bài tập phát triển chung/i.test(teacherAction) ||
    /Vận động cơ bản/i.test(teacherAction);

  if (hasSubheaders) {
    const tLines = expandPreschoolTextLines(teacherAction);
    const sLines = expandPreschoolTextLines(studentAction);

    let currentSubheader = '';
    let teacherSubGroup: string[] = [];

    const teacherSections: { subheader: string; lines: string[] }[] = [];
    tLines.forEach((line) => {
      if (isSubheaderLine(line)) {
        if (currentSubheader || teacherSubGroup.length > 0) {
          teacherSections.push({ subheader: currentSubheader, lines: teacherSubGroup });
        }
        currentSubheader = line;
        teacherSubGroup = [];
      } else {
        teacherSubGroup.push(line);
      }
    });
    if (currentSubheader || teacherSubGroup.length > 0) {
      teacherSections.push({ subheader: currentSubheader, lines: teacherSubGroup });
    }

    let sPartA: string[] = [];
    let sPartB: string[] = [];
    let foundB = false;

    sLines.forEach((line) => {
      if (isSubheaderLine(line)) {
        foundB = true;
        return;
      }
      if (!foundB && sPartA.length > 0 && /(?:b[\.\)]|nghe hát|hát bài nghe|lắng nghe cô hát|nhún nhảy hưởng ứng|vận động cơ bản|vđcb|thực hiện vận động|thử vận động|bạn lên thực hiện|chuyển đội hình 2 hàng)/i.test(line)) {
        foundB = true;
      }
      if (foundB) {
        sPartB.push(line);
      } else {
        sPartA.push(line);
      }
    });

    let studentSections: string[][] = [];
    if (teacherSections.length >= 2 && (sPartA.length > 0 || sPartB.length > 0)) {
      studentSections = [sPartA, sPartB];
    } else if (teacherSections.length >= 2) {
      const mid = Math.ceil(sLines.length / 2);
      studentSections = [sLines.slice(0, mid), sLines.slice(mid)];
    } else {
      studentSections = [sLines];
    }

    teacherSections.forEach((sec, secIdx) => {
      if (sec.subheader) {
        rows.push({
          type: 'subheader',
          teacherText: sec.subheader,
          studentText: '',
        });
      }
      const tSubLines = sec.lines;
      const sSubLines = studentSections[secIdx] || [];
      const maxCount = Math.max(tSubLines.length, sSubLines.length);

      for (let i = 0; i < maxCount; i++) {
        rows.push({
          type: 'item',
          teacherText: tSubLines[i] ? formatItemLine(tSubLines[i]) : '',
          studentText: sSubLines[i] ? formatItemLine(sSubLines[i]) : '',
        });
      }
    });

  } else {
    // Standard activity
    const tLines = expandPreschoolTextLines(teacherAction);
    const sLines = expandPreschoolTextLines(studentAction);

    const maxCount = Math.max(tLines.length, sLines.length);
    for (let i = 0; i < maxCount; i++) {
      rows.push({
        type: 'item',
        teacherText: tLines[i] ? formatItemLine(tLines[i]) : '',
        studentText: sLines[i] ? formatItemLine(sLines[i]) : '',
      });
    }
  }

  return rows;
}

export function isPreschoolPlan(plan: any): boolean {
  if (!plan) return false;
  if (plan.schoolLevel && plan.schoolLevel !== 'Mầm non') return false;
  if (plan.grade && (
    plan.grade.includes('Lớp 1') ||
    plan.grade.includes('Lớp 2') ||
    plan.grade.includes('Lớp 3') ||
    plan.grade.includes('Lớp 4') ||
    plan.grade.includes('Lớp 5') ||
    plan.grade.includes('Lớp 6') ||
    plan.grade.includes('Lớp 7') ||
    plan.grade.includes('Lớp 8') ||
    plan.grade.includes('Lớp 9') ||
    plan.grade.includes('Lớp 10') ||
    plan.grade.includes('Lớp 11') ||
    plan.grade.includes('Lớp 12')
  )) return false;

  return plan.schoolLevel === 'Mầm non' || 
         (plan.grade || '').toLowerCase().includes('mầm non') ||
         (plan.grade || '').toLowerCase().includes('tuổi') ||
         (plan.targetPeriodDetail || '').toLowerCase().includes('mầm non') ||
         (plan.targetPeriodDetail || '').toLowerCase().includes('tuổi');
}

export function sanitizeStandardActivity(act: any, idx: number): any {
  if (!act) return act;
  const standardNames = [
    '1. HOẠT ĐỘNG 1: MỞ ĐẦU / KHỞI ĐỘNG',
    '2. HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC MỚI',
    '3. HOẠT ĐỘNG 3: LUYỆN TẬP',
    '4. HOẠT ĐỘNG 4: VẬN DỤNG'
  ];
  
  let name = act.name || standardNames[idx] || `HOẠT ĐỘNG ${idx + 1}`;
  // If name has preschool style
  if (/khởi động.*tạo tình huống/i.test(name)) name = standardNames[0];
  if (/khám phá.*trải nghiệm/i.test(name)) name = standardNames[1];
  if (/chia sẻ.*thảo luận/i.test(name)) name = standardNames[2];
  if (/vận dụng.*mở rộng/i.test(name)) name = standardNames[3];

  const stripMusicHeaders = (text: string) => {
    if (!text) return '';
    return text
      .replace(/^[-\s]*a[\.\)]\s*(Dạy hát|Nghe hát|Hát vận động|DẠY HÁT|NGHE HÁT|HÁT VẬN ĐỘNG|Trọng tâm)[^\n]*\n?/gmi, '')
      .replace(/^[-\s]*b[\.\)]\s*(Nghe hát|Hát vận động|Trò chơi|NGHE HÁT|HÁT VẬN ĐỘNG|TRÒ CHƠI)[^\n]*\n?/gmi, '')
      .replace(/Trò chơi âm nhạc\s*[:'"][^\n]*\n?/gmi, '')
      .trim();
  };

  return {
    ...act,
    name,
    step1: {
      ...act.step1,
      teacherAction: stripMusicHeaders(act.step1?.teacherAction || ''),
      studentAction: stripMusicHeaders(act.step1?.studentAction || ''),
    },
    step2: {
      ...act.step2,
      teacherAction: stripMusicHeaders(act.step2?.teacherAction || ''),
      studentAction: stripMusicHeaders(act.step2?.studentAction || ''),
    },
    step3: {
      ...act.step3,
      teacherAction: stripMusicHeaders(act.step3?.teacherAction || ''),
      studentAction: stripMusicHeaders(act.step3?.studentAction || ''),
    },
    step4: {
      ...act.step4,
      teacherAction: stripMusicHeaders(act.step4?.teacherAction || ''),
      studentAction: stripMusicHeaders(act.step4?.studentAction || ''),
    }
  };
}

export function ensurePreschoolMusicInPlan(plan: any): any {
  if (!plan) return plan;
  let newPlan = { ...plan };
  if (isPreschoolPlan(newPlan) && newPlan.appendix) {
    newPlan.appendix = { ...newPlan.appendix, assignmentPrompt: '' };
  }
  if (!plan.activities || !isPreschoolMusicPlan(plan)) return newPlan;

  return {
    ...newPlan,
    activities: formatPreschoolMusicActivities(plan.activities, plan.lessonTitle || ''),
  };
}

export const MAM_NON_8_NEW_ACTIVITIES_LIST = [
  'HOẠT ĐỘNG VUI CHƠI TRONG LỚP',
  'HOẠT ĐỘNG NGOÀI TRỜI',
  'TRÒ CHƠI VẬN ĐỘNG',
  'TRÒ CHƠI HỌC TẬP',
  'HOẠT ĐỘNG GIÁO DỤC KỸ NĂNG',
  'TRÒ CHƠI DÂN GIAN',
  'HOẠT ĐỘNG TĂNG CƯỜNG TIẾNG VIỆT',
  'HOẠT ĐỘNG TẬP TÔ CHỮ CÁI',
  'HOẠT ĐỘNG TRÒ CHƠI CHỮ CÁI'
];

export const PRESCHOOL_NEW_8_DOMAINS: PreschoolDomainType[] = [
  'PLAY_INDOOR',
  'OUTDOOR',
  'PHYSICAL_GAME',
  'LEARNING_GAME',
  'SKILL_EDU',
  'FOLK_GAME',
  'VIETNAMESE_ENHANCE',
  'LETTER_TRACING',
  'LETTER_GAME'
];

/**
 * Checks if a preschool subject or activity belongs to the 8 newly integrated activities
 * that require Quyết định 388/QĐ-BGDĐT indicator codes (Mã: NT 1.1, TC 1.1...).
 * For all traditional/old preschool lesson plans, returns false so codes are NOT applied.
 */
export function isPreschoolNew8Activity(
  subject: string = '',
  lessonTitle: string = '',
  extraText: string = ''
): boolean {
  const s = (subject || '').trim();
  const t = (lessonTitle || '').trim();
  const text = `${s} ${t} ${extraText}`.toLowerCase();

  // 1. Direct match against MAM_NON_8_NEW_ACTIVITIES_LIST
  for (const act of MAM_NON_8_NEW_ACTIVITIES_LIST) {
    if (s.toLowerCase() === act.toLowerCase() || s.toLowerCase().includes(act.toLowerCase())) {
      return true;
    }
  }

  // 2. Clear exclusions: Old traditional preschool subjects must NOT be classified as new 8
  const isOldSubject = 
    s.includes('VĂN HỌC') || s.includes('văn học') ||
    s.includes('THƠ') || s.includes('thơ') ||
    s.includes('TRUYỆN') || s.includes('truyện') ||
    (s.includes('CHỮ CÁI') && !text.includes('tập tô') && !text.includes('trò chơi chữ') && !text.includes('trò chơi với chữ')) ||
    s.includes('KHOA HỌC') || s.includes('khoa học') ||
    s.includes('TOÁN') || s.includes('toán') ||
    s.includes('TẠO HÌNH') || s.includes('tạo hình') ||
    s.includes('ÂM NHẠC') || s.includes('âm nhạc') ||
    (s.includes('thể chất') && !text.includes('trò chơi'));

  if (isOldSubject) {
    // If the subject explicitly selected is an old subject, only treat as new if title clearly specifies one of the 8 new activities
    const isExplicitNewTitle = 
      t.includes('vui chơi trong lớp') || t.includes('hoạt động góc') ||
      t.includes('ngoài trời') ||
      t.includes('trò chơi vận động') ||
      t.includes('trò chơi học tập') ||
      t.includes('giáo dục kỹ năng') || t.includes('kỹ năng sống') ||
      t.includes('trò chơi dân gian') ||
      t.includes('tăng cường tiếng việt') || t.includes('tctv') ||
      t.includes('tập tô') || t.includes('tô chữ cái') ||
      t.includes('trò chơi chữ cái') || t.includes('trò chơi với chữ cái');
    
    if (!isExplicitNewTitle) {
      return false;
    }
  }

  // 3. Keyword matches for the 8 new activities
  if (
    text.includes('vui chơi trong lớp') ||
    text.includes('hoạt động góc') ||
    text.includes('ngoài trời') ||
    text.includes('trò chơi vận động') ||
    text.includes('trò chơi học tập') ||
    text.includes('giáo dục kỹ năng') ||
    text.includes('kỹ năng sống') ||
    text.includes('trò chơi dân gian') ||
    text.includes('tăng cường tiếng việt') ||
    text.includes('tctv') ||
    text.includes('tập tô') ||
    text.includes('tô chữ cái') ||
    text.includes('trò chơi chữ cái') ||
    text.includes('trò chơi với chữ cái')
  ) {
    return true;
  }

  const domain = detectPreschoolDomain(subject, lessonTitle, extraText);
  return PRESCHOOL_NEW_8_DOMAINS.includes(domain.domainType);
}

/**
 * Remove indicator codes like (Mã: NT 1.1), (Mã: NN 5.1), [Mã: ...], [TC 3.1, TC 3.3] from preschool objectives
 * Used exclusively for OLD / TRADITIONAL preschool lesson plans so they strictly preserve
 * the original format before QĐ 388 was introduced.
 */
export function stripPreschoolCodes(text: string): string {
  if (!text) return '';
  return text
    .replace(/\s*\([Mm][ããá]\s*:[^)]+\)/gi, '')
    .replace(/\s*\[[Mm][ããá]\s*:[^\]]+\]/gi, '')
    .replace(/\s*\(MÃ\s*:[^)]+\)/gi, '')
    .replace(/\s*\[MÃ\s*:[^\]]+\]/gi, '')
    .replace(/\s*\(mã\s*:[^)]+\)/gi, '')
    .replace(/\s*\[(?:TC|TX|NN|NT|NgT|KN|QP)\s*[\d\.,\s]+\]/gi, '')
    .replace(/\s*\((?:TC|TX|NN|NT|NgT|KN|QP)\s*[\d\.,\s]+\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function sanitizePreschoolObjectives(objectives: any, isNew8Activity: boolean = false): any {
  if (!objectives || isNew8Activity) return objectives;
  if (Array.isArray(objectives.knowledge)) {
    objectives.knowledge = objectives.knowledge.map((k: string) => stripPreschoolCodes(k));
  }
  if (Array.isArray(objectives.subjectCompetencies)) {
    objectives.subjectCompetencies = objectives.subjectCompetencies.map((c: string) => stripPreschoolCodes(c));
  }
  if (Array.isArray(objectives.generalCompetencies)) {
    objectives.generalCompetencies = objectives.generalCompetencies.map((g: string) => stripPreschoolCodes(g));
  }
  if (Array.isArray(objectives.qualities)) {
    objectives.qualities = objectives.qualities.map((q: string) => stripPreschoolCodes(q));
  }
  return objectives;
}

export interface PreschoolAgeProfile {
  rawGrade: string;
  category: 'INFANT_TODDLER' | 'MAM_3_4' | 'CHOI_4_5' | 'LA_5_6' | 'MIXED_AGE' | 'CUSTOM';
  standardName: string;
  recommendedDuration: string;
  developmentalTraits: string[];
  cognitiveFocus: string;
  languageAndSpeech: string;
  motorSkills: string;
  pedagogicalStrategy: string;
  promptGuidance: string;
}

/**
 * Intelligent Preschool Age Profile Analyzer
 * Deeply analyzes any custom or standard preschool age/grade input to deduce exact
 * developmental psychology, cognitive abilities, attention span, teacher speech,
 * expected child behavior, and pedagogical recommendations.
 */
export function analyzePreschoolAgeProfile(grade: string = ''): PreschoolAgeProfile {
  const g = (grade || '').trim();
  const lower = g.toLowerCase();

  // 1. Kiểm tra lớp ghép / nhiều độ tuổi (ví dụ: Lớp ghép 3-5 tuổi, Ghép 4-5 và 5-6 tuổi, Lớp ghép 3-4-5 tuổi...)
  const isMixed = lower.includes('ghép') || 
                  lower.includes('3-4-5') || lower.includes('3 - 4 - 5') || lower.includes('3, 4, 5') || lower.includes('3,4,5') ||
                  lower.includes('đa độ tuổi') || lower.includes('nhiều độ tuổi') || lower.includes('hỗn hợp') ||
                  /\b(3|4|5)\s*[-–,\+và\&]+\s*(3|4|5)\s*[-–,\+và\&]+\s*(3|4|5)/.test(lower) ||
                  (lower.includes('tuổi') && (lower.includes('&') || lower.includes('và') || lower.includes('+') || /\d\s*-\s*\d.*(?:\&|\bvà\b|\+).*\d\s*-\s*\d/.test(lower)));
  
  if (isMixed) {
    const is345 = lower.includes('3') && lower.includes('4') && lower.includes('5');
    return {
      rawGrade: g,
      category: 'MIXED_AGE',
      standardName: is345 ? 'Lớp mẫu giáo ghép (3 – 4 – 5 tuổi)' : 'Lớp mầm non ghép độ tuổi',
      recommendedDuration: '30 – 35 phút',
      developmentalTraits: [
        'Lớp học bao gồm các trẻ có nhiều lứa tuổi khác nhau (thường là 3 tuổi, 4 tuổi và 5 tuổi)',
        'Mức độ nhận thức, tư duy toán học, ngôn ngữ và khả năng vận động có sự chênh lệch rõ rệt giữa các độ tuổi',
        'Trẻ 5 tuổi có tính tự lập cao, tư duy biểu tượng tốt; trẻ 4 tuổi bắt đầu biết so sánh, phối hợp; trẻ 3 tuổi học qua bắt chước và cần sự trợ giúp trực tiếp từ cô và các anh chị lớn'
      ],
      cognitiveFocus: is345 
        ? 'Thiết kế mục tiêu phân hóa 3 mức rõ ràng theo từng lứa tuổi (5 tuổi: nhận biết số lượng, đếm, so sánh, thêm bớt, nhận biết chữ số; 4 tuổi: đếm, tạo nhóm, xếp tương ứng 1-1, so sánh; 3 tuổi: đếm theo cô, đếm cùng các bạn).'
        : 'Thiết kế mục tiêu phân hóa theo từng nhóm tuổi tương ứng trong lớp ghép.',
      languageAndSpeech: 'Cô dùng ngôn ngữ linh hoạt: với trẻ 3 tuổi dùng câu ngắn trực quan, với trẻ 4-5 tuổi dùng câu hỏi gợi mở, so sánh và giải thích lý do.',
      motorSkills: 'Đa dạng hóa học liệu: đồ dùng trực quan to, dễ cầm cho trẻ 3 tuổi; thẻ số, que tính, bộ ghép tương ứng cho trẻ 4 và 5 tuổi.',
      pedagogicalStrategy: 'DẠY HỌC PHÂN HÓA ĐỘ TUỔI: Chung chủ đề/đề tài nhưng phân hóa mức độ yêu cầu và nhiệm vụ theo từng độ tuổi. Cô luân phiên hướng dẫn trực tiếp nhóm nhỏ (3 tuổi) và bao quát, kích thích nhóm lớn (4-5 tuổi) tự lập, hợp tác.',
      promptGuidance: `BẮT BUỘC THIẾT KẾ GIÁO ÁN PHÂN HÓA ĐỘ TUỔI CHO LỚP GHÉP (${g}):
- Trong phần I. MỤC ĐÍCH - YÊU CẦU:
  + 1. Kiến thức: BẮT BUỘC PHÂN HÓA RÕ TỪNG ĐỘ TUỔI THEO ĐÚNG MẪU CHUẨN:
${is345 ? `    - 5 tuổi: Trẻ nhận biết nhóm có số lượng X, đếm đến X, nhận biết chữ số X biểu thị cho các nhóm có số lượng X. Trẻ đếm từ 1 đến X, đọc được số X và các số nhỏ hơn X. So sánh 2 nhóm đối tượng, biết thêm bớt để có số lượng bằng nhau...
    - 4 tuổi: Trẻ biết đếm đến X, nhận biết các nhóm có X đối tượng. Trẻ biết tạo nhóm, xếp tương ứng 1- 1, biết so sánh 2 nhóm đồ vật, biết đếm đúng số lượng và sử dụng đúng chữ số tương ứng theo cô và các bạn...
    - 3 tuổi: Trẻ đếm số lượng trong phạm vi X theo cô, đếm cùng các bạn.` : `    - Phân hóa rõ theo từng độ tuổi có trong lớp (ví dụ: - [Độ tuổi lớn]: ...; - [Độ tuổi nhỏ]: ...).`}
  + 2. Kỹ năng: BẮT BUỘC PHÂN HÓA RÕ TỪNG ĐỘ TUỔI THEO ĐÚNG MẪU CHUẨN:
${is345 ? `    - 5 tuổi: Rèn kỹ năng đếm thành thạo, so sánh số lượng giữa 2 nhóm, thêm bớt tạo sự bằng nhau trong phạm vi X, chọn và gắn thẻ số X chính xác, nhanh nhẹn.
    - 4 tuổi: Rèn kỹ năng xếp tương ứng 1-1 thẳng hàng từ trái sang phải, đếm theo thứ tự, tìm đúng thẻ số X theo cô và bạn.
    - 3 tuổi: Rèn kỹ năng chú ý quan sát, chỉ tay và đếm theo cô, phát âm rõ từ chỉ số lượng.` : `    - Phân hóa rõ kỹ năng cho từng độ tuổi tương ứng trong lớp.`}
  + 3. Phẩm chất: Yêu thương, Tôn trọng, Trung thực, Trách nhiệm (Nêu rõ tinh thần trẻ lớn biết yêu thương, chia sẻ, giúp đỡ các em nhỏ; trẻ nhỏ tôn trọng, học tập các anh chị lớn).
  + 4. Năng lực: Tự lực, Thích ứng, Giao tiếp, Hợp tác (Trẻ lớn biết phối hợp và hỗ trợ em nhỏ).
- Trong phần II. CHUẨN BỊ:
  + Đồ dùng của cô và trẻ phải ghi rõ học liệu chuẩn bị phân hóa cho từng nhóm tuổi (trẻ 5 tuổi, 4 tuổi, 3 tuổi).
- Trong phần III. TIẾN TRÌNH HOẠT ĐỘNG (Bảng 2 cột: Hoạt động của giáo viên & Hoạt động của trẻ):
  + Ở các bước (Đặc biệt Bước 2 Khám phá - Trải nghiệm, Bước 3 Chia sẻ - Thảo luận, Bước 4 Vận dụng - Mở rộng):
  + BẮT BUỘC PHÂN CHIA RÕ RÀNG HOẠT ĐỘNG CỦA CÔ VÀ TRẺ THEO TỪNG ĐỘ TUỔI:
    * Hoạt động cho trẻ 5 tuổi: Thao tác nhiệm vụ nâng cao (xếp nhóm, so sánh, thêm bớt, gắn số, giải thích...).
    * Hoạt động cho trẻ 4 tuổi: Thao tác nhiệm vụ cơ bản (xếp tương ứng 1-1, đếm, chọn số theo bạn...).
    * Hoạt động cho trẻ 3 tuổi: Thao tác đếm cùng cô, quan sát và bắt chước các anh chị lớn.`
    };
  }

  // 2. Kiểm tra Nhóm trẻ / Nhà trẻ (dưới 36 tháng, ví dụ: 3-12 tháng, 12-18 tháng, 18-24 tháng, 24-36 tháng)
  const isToddler = lower.includes('nhà trẻ') || 
                    lower.includes('nhóm trẻ') || 
                    lower.includes('tháng') || 
                    lower.includes('dưới 3 tuổi') ||
                    lower.includes('0-1') || lower.includes('1-2') || lower.includes('2-3') ||
                    lower.includes('12-24') || lower.includes('18-24') || lower.includes('24-36') ||
                    lower.includes('12 - 24') || lower.includes('18 - 24') || lower.includes('24 - 36') || 
                    lower.includes('12-18') || lower.includes('12 - 18');

  if (isToddler) {
    let subAgeNote = '24 – 36 tháng';
    if (lower.includes('12-18') || lower.includes('12 - 18')) subAgeNote = '12 – 18 tháng';
    else if (lower.includes('18-24') || lower.includes('18 - 24')) subAgeNote = '18 – 24 tháng';
    else if (lower.includes('3-12') || lower.includes('3 - 12') || lower.includes('dưới 12')) subAgeNote = '3 – 12 tháng';

    return {
      rawGrade: g,
      category: 'INFANT_TODDLER',
      standardName: `Khối Nhà trẻ (${subAgeNote})`,
      recommendedDuration: '15 – 20 phút',
      developmentalTraits: [
        'Khả năng chú ý có chủ định rất ngắn (chỉ 5 – 7 phút/hoạt động liên tục), nhanh chán và dễ bị phân tán',
        'Tư duy trực quan hành động: Trẻ nhận thức sự vật trực tiếp thông qua cầm nắm, sờ, nhìn, nghe và bắt chước',
        'Cảm xúc chi phối hành vi, trẻ rất cần tình cảm ấm áp, sự vỗ về, yêu thương che chở của cô giáo'
      ],
      cognitiveFocus: 'Tập trung vào "Nhận biết tập nói": Nhận biết tên gọi, màu sắc nổi bật (đỏ, vàng), kích thước to - nhỏ, số lượng 1 và nhiều; nhận biết các bộ phận cơ thể và đồ chơi gần gũi.',
      languageAndSpeech: 'Trẻ phát âm từ đơn, từ đôi (1-2 từ). Cô nói chậm rãi, giọng điệu ngọt ngào, ấm áp, câu ngắn gọn, nhắc lại từ khóa 3-4 lần để trẻ nhắc lại.',
      motorSkills: 'Vận động thô: đi, chạy trong đường hẹp, bò chui, nhún nhảy, lăn/bắt bóng. Vận động tinh: cầm nắm, nhặt hạt to, vò giấy, chấm màu ngón tay.',
      pedagogicalStrategy: 'PHƯƠNG PHÁP TRỰC QUAN - TÌNH CẢM - HÀNH ĐỘNG: Cô làm mẫu nhiều lần kết hợp lời nói dịu dàng; tạo cơ hội cho từng trẻ được thao tác trực tiếp trên vật thật; khen ngợi ngay lập tức bằng cái ôm hoặc vỗ tay.',
      promptGuidance: `BẮT BUỘC SOẠN GIÁO ÁN ĐẶC THÙ CHO KHỐI NHÀ TRẺ (${g}):
- Thời gian hoạt động: Chuẩn 15 – 20 phút (Tuyệt đối không kéo dài làm trẻ mệt mỏi).
- Mục đích - yêu cầu:
  + Kiến thức: Trẻ nhận biết và gọi tên được đối tượng, màu sắc (Đỏ/Vàng), kích thước (To/Nhỏ), phát âm rõ tên đối tượng.
  + Kỹ năng: Rèn kỹ năng phát âm từ đơn/từ đôi, rèn sự khéo léo của đôi bàn tay và các giác quan.
- Hệ thống câu hỏi của cô: Cực kỳ ngắn gọn, gần gũi, kèm động tác minh họa (ví dụ: "Đây là gì nhỉ?", "Quả bóng màu gì đây các con?", "Con phát âm cùng cô nào: Quả bóng!").
- Lời trẻ dự kiến (Cột Hoạt động của trẻ): Chỉ là các từ đơn, từ đôi hoặc cử chỉ bắt chước (Ví dụ: "Quả bóng ạ", "Màu đỏ ạ", "Trẻ sờ vào quả bóng", "Trẻ nhún nhảy theo nhạc"). Tuyệt đối KHÔNG viết câu trả lời dài dòng, suy luận phức tạp.
- Thái độ của cô: Hết sức dịu dàng, âu yếm, thường xuyên khen ngợi, ôm và vuốt ve động viên trẻ.`
    };
  }

  // 3. Kiểm tra Mẫu giáo bé (3 - 4 tuổi, Lớp Mầm)
  const isMam = lower.includes('mầm') || 
                lower.includes('3-4') || lower.includes('3 - 4') || 
                lower.includes('mẫu giáo bé') || lower.includes('mg bé') || lower.includes('3 tuổi');

  if (isMam) {
    return {
      rawGrade: g,
      category: 'MAM_3_4',
      standardName: 'Khối Mẫu giáo bé - Lớp Mầm (3 – 4 tuổi)',
      recommendedDuration: '20 – 25 phút',
      developmentalTraits: [
        'Trẻ bước vào giai đoạn mẫu giáo đầu tiên, bắt đầu hình thành ý thức cá nhân và bước đầu hòa nhập tập thể',
        'Tư duy trực quan hình tượng sơ khai kết hợp tư duy trực quan hành động',
        'Khả năng tập trung khoảng 15 – 20 phút, bắt đầu biết tham gia trò chơi có quy tắc đơn giản'
      ],
      cognitiveFocus: 'Nhận biết phân biệt 4 hình học phẳng (tròn, vuông, tam giác, chữ nhật); đếm trong phạm vi 3; so sánh to - nhỏ, cao - thấp; phân biệt cảm xúc vui - buồn; khám phá công dụng đồ dùng quen thuộc.',
      languageAndSpeech: 'Trẻ diễn đạt câu ngắn 3 – 5 từ; cô rèn cho trẻ thói quen trả lời tròn câu có chủ ngữ vị ngữ (ví dụ: "Thưa cô, con thưa cô...").',
      motorSkills: 'Đi thăng bằng trên ghế, tung bắt bóng 2 tay, bò chui qua cổng, xé dải giấy, nặn khối tròn, lăn dài.',
      pedagogicalStrategy: 'Dạy học thông qua trò chơi và hình tượng trực quan sinh động; sử dụng nhân vật rối/thú bông để tạo tình huống kích thích trẻ nói; cô hướng dẫn rõ từng thao tác và cho trẻ thực hành nhiều lần.',
      promptGuidance: `BẮT BUỘC SOẠN GIÁO ÁN ĐẶC THÙ CHO LỚP MẦM / MẪU GIÁO BÉ 3 – 4 TUỔI (${g}):
- Thời gian hoạt động: Chuẩn 20 – 25 phút.
- Mục đích - yêu cầu: Đặt mục tiêu vừa sức lứa tuổi 3 – 4 tuổi; rèn kỹ năng diễn đạt câu đủ ý và kỹ năng tự phục vụ cơ bản.
- Lời nói của cô: Dẫn dắt lôi cuốn, tạo bất ngờ (hộp quà, bài hát vui nhộn, nhân vật hoạt hình).
- Lời nói của trẻ: Câu nói ngắn 3 – 5 từ, tròn vành rõ chữ, có dạ thưa lễ phép (ví dụ: "Dạ, màu xanh ạ", "Con thưa cô là hình tròn ạ").
- Tiến trình 5 bước: Khởi động sinh động, Khám phá trải nghiệm thực tế với vật thật, Thực hành có trò chơi củng cố hào hứng.`
    };
  }

  // 4. Kiểm tra Mẫu giáo nhỡ (4 - 5 tuổi, Lớp Chồi)
  const isChoi = lower.includes('chồi') || 
                 lower.includes('4-5') || lower.includes('4 - 5') || 
                 lower.includes('mẫu giáo nhỡ') || lower.includes('mg nhỡ') || lower.includes('4 tuổi');

  if (isChoi) {
    return {
      rawGrade: g,
      category: 'CHOI_4_5',
      standardName: 'Khối Mẫu giáo nhỡ - Lớp Chồi (4 – 5 tuổi)',
      recommendedDuration: '25 – 30 phút',
      developmentalTraits: [
        'Trẻ rất tò mò, thích khám phá, đặt nhiều câu hỏi "Tại sao?", "Để làm gì?"',
        'Khả năng tập trung được kéo dài từ 20 – 25 phút; bắt đầu biết hợp tác, chia sẻ và nhường nhịn bạn bè',
        'Tư duy trực quan hình tượng phát triển mạnh; có khả năng so sánh, phân loại theo 2 dấu hiệu'
      ],
      cognitiveFocus: 'Đếm đến 4 hoặc 5, so sánh kích thước 3 đối tượng, phân loại đồ vật theo 2 dấu hiệu (hình dạng và màu sắc/chất liệu); khám phá quy luật tự nhiên gần gũi; thể hiện tình cảm với gia đình, thầy cô.',
      languageAndSpeech: 'Ngôn ngữ mạch lạc, nói câu ghép đơn giản, biết dùng từ nối "vì... nên...", biết biểu cảm khi đọc thơ hoặc kể chuyện.',
      motorSkills: 'Bật liên tục về phía trước, trèo thang, phối hợp vận động tay - mắt khéo léo, cắt bằng kéo theo đường thẳng, xếp hình sáng tạo.',
      pedagogicalStrategy: 'DẠY HỌC GỢI MỞ & TRẢI NGHIỆM: Đặt câu hỏi mở kích thích tư duy giải quyết vấn đề; tổ chức hoạt động nhóm nhỏ 3-4 bạn; trẻ được tự do nêu ý kiến và tự tay thử nghiệm trước khi cô kết luận.',
      promptGuidance: `BẮT BUỘC SOẠN GIÁO ÁN ĐẶC THÙ CHO LỚP CHỒI / MẪU GIÁO NHỠ 4 – 5 TUỔI (${g}):
- Thời gian hoạt động: Chuẩn 25 – 30 phút.
- Hệ thống câu hỏi của cô: Tăng cường câu hỏi mở dạng "Theo các con điều gì sẽ xảy ra?", "Làm thế nào để...?", "Vì sao con biết?".
- Cột Hoạt động của trẻ: Trẻ chủ động nêu suy nghĩ, tranh luận nhẹ nhàng với bạn, biết giải thích lý do ngắn gọn.
- Kỹ năng hợp tác: Thiết kế phần thực hành/trò chơi có sự phối hợp nhóm đôi hoặc chia tổ thi đua.`
    };
  }

  // 5. Kiểm tra Mẫu giáo lớn (5 - 6 tuổi, Lớp Lá, Tiền tiểu học)
  const isLa = lower.includes('lá') || 
               lower.includes('5-6') || lower.includes('5 - 6') || 
               lower.includes('mẫu giáo lớn') || lower.includes('mg lớn') || lower.includes('5 tuổi') || lower.includes('tiền tiểu học');

  if (isLa || lower.includes('mầm non')) {
    return {
      rawGrade: g,
      category: 'LA_5_6',
      standardName: 'Khối Mẫu giáo lớn - Lớp Lá (5 – 6 tuổi - Chuẩn bị vào lớp Một)',
      recommendedDuration: '30 – 35 phút',
      developmentalTraits: [
        'Khả năng chú ý có chủ định cao, tập trung được 25 – 30 phút liên tục',
        'Tư duy trực quan hình tượng đạt mức độ hoàn thiện cao, xuất hiện mầm mống của tư duy logic trừu tượng',
        'Tính tự lập, ý thức trách nhiệm và tính kỷ luật tăng cao; chuẩn bị sẵn sàng tâm thế bước vào lớp Một'
      ],
      cognitiveFocus: 'Đếm và nhận biết chữ số trong phạm vi 10; tách gộp 10 đối tượng theo các cách khác nhau; đo độ dài bằng các thước đo; làm quen 29 chữ cái tiếng Việt; định hướng không gian; ứng dụng STEM và công nghệ đơn giản.',
      languageAndSpeech: 'Ngôn ngữ phong phú, diễn đạt lưu loát, mạch lạc; tự tin phát biểu trước đám đông; hiểu quy ước đọc viết từ trái sang phải, từ trên xuống dưới.',
      motorSkills: 'Ném trúng đích xa, bật sâu 30cm, chuyền bóng liên hoàn; cầm bút bằng 3 ngón tay chuẩn xác, ngồi đúng tư thế, tô nét trùng khít theo dòng kẻ ô ly.',
      pedagogicalStrategy: 'DẠY HỌC TÍCH HỢP & DỰ ÁN NHỎ: Khuyến khích tư duy phản biện, làm việc nhóm tự quản, ứng dụng kiến thức vào thực tiễn, rèn nề nếp học đường chuẩn mực.',
      promptGuidance: `BẮT BUỘC SOẠN GIÁO ÁN ĐẶC THÙ CHO LỚP LÁ / MẪU GIÁO LỚN 5 – 6 TUỔI (${g}):
- Thời gian hoạt động: Chuẩn 30 – 35 phút.
- Mục tiêu và nội dung mang tính thử thách trí tuệ: Tách gộp phân tích số lượng, nhận diện chữ cái trong từ hoàn chỉnh, đo lường so sánh logic.
- Rèn tác phong học tập: Tư thế ngồi thẳng lưng, cách cầm bút 3 ngón, giơ tay phát biểu, lắng nghe cô và bạn trọn vẹn.
- Hoạt động của trẻ: Trẻ chủ động bàn bạc, phân công nhiệm vụ nhóm, tự kiểm tra kết quả chéo giữa các đội.`
    };
  }

  // 6. Custom grade fallback
  return {
    rawGrade: g,
    category: 'CUSTOM',
    standardName: `Độ tuổi ${g}`,
    recommendedDuration: '25 – 30 phút',
    developmentalTraits: [
      `Đặc điểm phát triển tâm sinh lý và nhận thức tương thích với độ tuổi "${g}"`,
      'Học tập thông qua hình thức vui chơi, trực quan hóa và trải nghiệm giác quan'
    ],
    cognitiveFocus: `Nội dung kiến thức và kỹ năng được căn chỉnh chính xác theo thang nhận thức của độ tuổi "${g}".`,
    languageAndSpeech: 'Ngôn ngữ của cô mẫu mực, dịu dàng; ngôn ngữ của trẻ phù hợp với mức độ phát triển phát âm của độ tuổi.',
    motorSkills: 'Vận động thể chất và thao tác vận động tinh thích hợp với thể trạng lứa tuổi.',
    pedagogicalStrategy: `Áp dụng phương pháp sư phạm mầm non lấy trẻ làm trung tâm, tối ưu hóa các hoạt động trải nghiệm đúng với độ tuổi "${g}".`,
    promptGuidance: `PHÂN TÍCH VÀ CĂN CHỈNH TOÀN BỘ GIÁO ÁN THEO ĐỘ TUỔI TỰ NHẬP: "${g}":
- Phân tích kỹ số tuổi hoặc số tháng trong "${g}" để thiết lập mục tiêu vừa sức, câu hỏi gợi mở và hành động của trẻ chân thực nhất.
- Bố trí thời lượng và đồ dùng học liệu phù hợp, ngôn ngữ trong sáng, chuẩn mực sư phạm mầm non.`
  };
}

export interface PreschoolLessonContext {
  lessonTitle?: string;
  subject?: string;
  grade?: string;
  mainTheme?: string;
  subTheme?: string;
  topic?: string;
}

export function cleanPreschoolLessonName(raw?: string): string {
  if (!raw) return 'bài học';
  let clean = raw
    .replace(/^(\d+[\.\)]|\-|\*)\s*/, '')
    .replace(/^(dạy hát|hát vận động|nghe hát|vận động múa|vđcb|vận động cơ bản|btptc|bài tập phát triển chung|khám phá khoa học|khám phá xã hội|khám phá|kpk|kpxh|toán|làm quen với toán|lqvt|văn học|thơ|truyện|kể chuyện|tạo hình|vẽ|nặn|xé dán|chữ cái|làm quen chữ cái|lqcc|thể dục|gdtc|kỹ năng sống|knxh)\s*[:–-]\s*/i, '')
    .replace(/^bài\s*\d*\s*[:–-]\s*/i, '')
    .trim();
  return clean || raw.trim() || 'bài học';
}

export function isGenericPreschoolParentCollab(list?: string[]): boolean {
  if (!list || list.length === 0) return true;
  return list.every((item) => {
    const trimmed = item.trim();
    if (!trimmed) return true;
    return (
      /hỗ trợ sưu tầm nguyên vật liệu mở an toàn và trò chuyện cùng con/i.test(trimmed) ||
      /trò chuyện, củng cố kiến thức và chuẩn bị một số nguyên vật liệu/i.test(trimmed) ||
      /hỗ trợ nguyên vật liệu mở\/tái chế an toàn/i.test(trimmed) ||
      /chuẩn bị nguyên vật liệu và trò chuyện cùng con ở nhà/i.test(trimmed) ||
      /củng cố rèn luyện cho trẻ tại nhà/i.test(trimmed) ||
      /^phối hợp với phụ huynh\s*:\s*$/i.test(trimmed) ||
      trimmed === 'Phối hợp với phụ huynh' ||
      trimmed === '3. Phối hợp với phụ huynh:'
    );
  });
}

/**
 * Tạo nội dung phối hợp phụ huynh riêng biệt, sâu sắc và bám sát từng bài học mầm non cụ thể
 */
export function generatePreschoolParentCollaboration(context?: PreschoolLessonContext): string[] {
  const subject = context?.subject || '';
  const lessonTitle = context?.lessonTitle || '';
  const cleanName = cleanPreschoolLessonName(lessonTitle);
  const domainInfo = detectPreschoolDomain(subject, lessonTitle, context?.topic || '');
  const domain = domainInfo.domainType;
  const tLow = lessonTitle.toLowerCase();
  const sLow = subject.toLowerCase();

  switch (domain) {
    case 'MUSIC':
      return [
        `Trao đổi với phụ huynh về nội dung và giai điệu tươi vui của bài hát "${cleanName}", khuyến khích cha mẹ mở nhạc cho trẻ nghe và cùng hát, nhún nhảy với con tại gia đình.`,
        `Động viên phụ huynh dành lời khen ngợi, vỗ tay cổ vũ khi trẻ tự tin biểu diễn các động tác múa, vận động minh họa hoặc gõ đệm nhịp nhàng đã được cô hướng dẫn ở lớp.`,
        `Nhờ phụ huynh quay video ngắn khoảnh khắc bé biểu diễn bài hát tại nhà gửi vào nhóm lớp để cô giáo tuyên dương trẻ trước tập thể lớp.`
      ];

    case 'MATH': {
      if (/đếm|số lượng|chữ số|thêm bớt|tách gộp|phạm vi|số \d/i.test(tLow)) {
        return [
          `Phối hợp cùng phụ huynh đố vui và hướng dẫn trẻ đếm số lượng các đồ dùng, đồ chơi, các loại bánh kẹo hoặc hoa quả quen thuộc trong gia đình bám sát nội dung bài học "${cleanName}".`,
          `Khuyến khích cha mẹ cùng con chơi trò đố nhanh tìm nhóm đồ vật có số lượng tương ứng xung quanh nhà, rèn luyện cho trẻ sự nhanh mắt và phát âm chuẩn các số lượng.`,
          `Trao đổi với phụ huynh biểu dương sự tiến bộ, tinh thần tập trung chú ý và khả năng đếm thành thạo của trẻ sau buổi học.`
        ];
      }
      if (/hình tròn|hình vuông|hình tam giác|hình chữ nhật|khối cầu|khối trụ|khối vuông|hình khối/i.test(tLow)) {
        return [
          `Hướng dẫn phụ huynh cùng con chơi trò "Thám tử nhí tìm hình khối", cùng bé tìm kiếm và gọi tên chính xác các đồ vật trong gia đình có hình dạng gắn với bài học "${cleanName}" (như mặt đồng hồ, quyển sách, khung ảnh, cánh cửa...).`,
          `Khuyến khích trẻ cùng cha mẹ ghép các đồ dùng gia đình (que tính, ống hút, đũa) hoặc dùng đất nặn tạo thành các hình khối đã học để khắc sâu biểu tượng hình học.`,
          `Phối hợp trao đổi với cha mẹ về khả năng phân biệt, so sánh đặc điểm góc, cạnh của các hình khối mà bé đã thể hiện trên lớp.`
        ];
      }
      if (/to - nhỏ|to nhỏ|cao - thấp|cao thấp|dài - ngắn|dài ngắn|rộng - hẹp|nhiều hơn - ít hơn|so sánh/i.test(tLow)) {
        return [
          `Khuyến khích phụ huynh cùng con thực hành so sánh kích thước các đồ vật quen thuộc trong nhà (chiếc bát to - bát nhỏ, đôi dép của bố - dép của con, cái thìa dài - thìa ngắn) theo bài học "${cleanName}".`,
          `Hướng dẫn trẻ diễn đạt trọn câu mối quan hệ so sánh trong sinh hoạt hàng ngày nhằm củng cố tư duy logic và ngôn ngữ toán học cho trẻ.`,
          `Trao đổi với phụ huynh về sự tích cực tham gia các thao tác trải nghiệm và so sánh kích thước của trẻ trên lớp.`
        ];
      }
      if (/trên - dưới|trước - sau|phải - trái|phía trên|phía dưới|phía trước|phía sau|tay phải|tay trái/i.test(tLow)) {
        return [
          `Nhờ phụ huynh thường xuyên nhắc nhở, đố vui con xác định vị trí đồ vật trong phòng và phân biệt chính xác tay phải (tay cầm thìa), tay trái khi ăn cơm, mặc quần áo gắn với bài học "${cleanName}".`,
          `Khuyến khích cha mẹ cùng con chơi trò "Vật đó ở đâu", giúp bé củng cố khả năng định hướng không gian nhanh nhẹn và tự tin trong cuộc sống hàng ngày.`
        ];
      }
      return [
        `Phối hợp cùng phụ huynh củng cố kiến thức bài học "${cleanName}" thông qua các tình huống thực tế gần gũi trong sinh hoạt gia đình.`,
        `Khuyến khích cha mẹ động viên, khen ngợi khi trẻ chủ động nhận biết, phân loại và đếm đồ vật xung quanh nhà.`,
        `Trao đổi thông tin thường xuyên giữa cô giáo và phụ huynh về mức độ nhận thức và khả năng tư duy toán học của con.`
      ];
    }

    case 'SCIENCE': {
      if (/cây|hoa|quả|rau|lá|hạt|thực vật/i.test(tLow)) {
        return [
          `Phối hợp cùng phụ huynh sưu tầm các loại lá cây rụng, hạt giống, rau củ quả thật hoặc tranh ảnh sinh động mang đến lớp phục vụ tiết học trải nghiệm "${cleanName}".`,
          `Khuyến khích cha mẹ cùng con chăm sóc cây xanh tại nhà (tưới nước, bắt sâu, nhặt lá úa), trò chuyện về các bộ phận và lợi ích của cây cối đối với đời sống con người.`,
          `Nhắc nhở phụ huynh phối hợp giáo dục trẻ tình yêu thiên nhiên, không ngắt hoa bẻ cành và biết ăn nhiều loại rau củ quả sạch để cơ thể khỏe mạnh.`
        ];
      }
      if (/con vật|động vật|thú|chim|cá|côn trùng|chó|mèo|gà|vịt/i.test(tLow)) {
        return [
          `Trao đổi với phụ huynh về bài học "${cleanName}", khuyến khích cha mẹ cùng con quan sát các con vật nuôi trong nhà hoặc xem video khoa học về thế giới động vật.`,
          `Gợi ý phụ huynh đặt câu hỏi để trẻ mô tả đặc điểm nổi bật, tiếng kêu, thức ăn và thói quen vận động của các con vật mà con đã được quan sát ở lớp.`,
          `Phối hợp giáo dục trẻ lòng nhân ái, biết yêu thương, chăm sóc và không trêu chọc các con vật nuôi an toàn.`
        ];
      }
      if (/nước|không khí|thời tiết|mùa|pha màu|chìm nổi|ánh sáng|nam châm|thí nghiệm/i.test(tLow)) {
        return [
          `Phối hợp cùng phụ huynh sưu tầm vỏ chai nhựa, cốc trong suốt hoặc các vật liệu tái chế sạch mang đến lớp phục vụ các hoạt động thí nghiệm của bài "${cleanName}".`,
          `Khuyến khích cha mẹ cùng con làm các thí nghiệm vui đơn giản tại nhà (quan sát đá tan, pha màu nước, thử vật chìm vật nổi) và giải thích hiện tượng cho trẻ.`,
          `Nhắc nhở trẻ ý thức tiết kiệm nước sạch, biết mặc trang phục phù hợp với thời tiết (mưa, nắng, nóng, lạnh) để bảo vệ sức khỏe.`
        ];
      }
      return [
        `Phối hợp cùng phụ huynh sưu tầm mẫu vật thật hoặc hình ảnh liên quan đến bài học "${cleanName}" mang đến lớp phục vụ góc trải nghiệm khám phá.`,
        `Khuyến khích cha mẹ dành thời gian cùng con quan sát thực tế thiên nhiên quanh nhà, khơi gợi trí tò mò, khám phá và kiên nhẫn giải đáp các thắc mắc của bé.`,
        `Nhắc nhở phụ huynh phối hợp giáo dục con ý thức giữ gìn vệ sinh, yêu quý và bảo vệ môi trường sống.`
      ];
    }

    case 'SOCIAL': {
      if (/gia đình|ngôi nhà|bố mẹ|ông bà|anh chị|đồ dùng gia đình/i.test(tLow)) {
        return [
          `Trao đổi với phụ huynh về bài học "${cleanName}", khuyến khích cha mẹ trò chuyện cùng con về các thành viên, tình cảm yêu thương và sự gắn kết trong gia đình.`,
          `Phối hợp tạo điều kiện để trẻ cùng tham gia các công việc nhà vừa sức (gấp quần áo nhỏ, nhặt rau, dọn bát đũa, cất giày dép) rèn tính tự lập.`,
          `Khuyến khích cha mẹ chụp ảnh hoặc chia sẻ những khoảnh khắc sum vầy ấm áp của gia đình gửi vào nhóm lớp để bé tự tin giới thiệu với các bạn.`
        ];
      }
      if (/nghề|cô giáo|bác sĩ|bộ đội|công an|nông dân|công nhân|thợ/i.test(tLow)) {
        return [
          `Khuyến khích phụ huynh trò chuyện cùng con về công việc, trang phục và đồ dùng đặc trưng của các nghề nghiệp trong xã hội bám sát bài học "${cleanName}".`,
          `Giáo dục trẻ thái độ kính trọng, biết ơn những người lao động và nuôi dưỡng ước mơ nghề nghiệp tương lai tốt đẹp.`,
          `Nhờ phụ huynh hỗ trợ tranh ảnh hoặc đồ chơi mô hình nghề nghiệp mang đến lớp phục vụ góc đóng vai của trẻ.`
        ];
      }
      if (/giao thông|xe|đèn đỏ|ngã tư|tàu|máy bay/i.test(tLow)) {
        return [
          `Nhắc nhở phụ huynh gương mẫu chấp hành luật an toàn giao thông khi đưa đón con (đội mũ bảo hiểm cho trẻ, dừng đúng đèn đỏ, đi đúng làn đường).`,
          `Cùng con đố vui nhận biết các biển báo, phương tiện giao thông và đèn tín hiệu trên đường đi học bám sát bài học "${cleanName}".`,
          `Rèn luyện cho trẻ thói quen quan sát cẩn thận, không chạy nhảy dưới lòng đường và luôn nắm tay người lớn khi qua đường.`
        ];
      }
      return [
        `Trao đổi với phụ huynh về nội dung bài học "${cleanName}", khuyến khích cha mẹ trò chuyện cùng con về môi trường trường lớp và các quy tắc ứng xử văn minh.`,
        `Phối hợp tạo cơ hội cho trẻ thực hành thói quen tốt tại gia đình: biết chào hỏi lễ phép, nói lời cảm ơn - xin lỗi, tự giác thu dọn đồ dùng đồ chơi sau khi chơi.`,
        `Khuyến khích cha mẹ ghi nhận và khen ngợi kịp thời những hành vi tích cực, thái độ thân thiện, biết chia sẻ và giúp đỡ bạn bè của trẻ.`
      ];
    }

    case 'POETRY':
      return [
        `Gửi nội dung bài thơ "${cleanName}" qua bảng tin tuyên truyền hoặc nhóm Zalo lớp để phụ huynh đọc cho con nghe vào buổi tối trước khi đi ngủ.`,
        `Khuyến khích cha mẹ đàm thoại cùng con về nội dung bài thơ, giải thích các từ ngữ giàu hình ảnh và giáo dục tình cảm yêu thương, thái độ sống tích cực cho trẻ.`,
        `Động viên bé tự tin đọc diễn cảm bài thơ kết hợp cử chỉ, điệu bộ đáng yêu cho ông bà, cha mẹ nghe tại nhà.`
      ];

    case 'STORY':
      return [
        `Tóm tắt nội dung câu chuyện "${cleanName}" gửi tới phụ huynh, khuyến khích cha mẹ kể lại câu chuyện cho con nghe trong không gian ấm áp của gia đình.`,
        `Gợi ý cha mẹ đặt câu hỏi gợi mở về hành động của các nhân vật, giúp bé phân biệt việc tốt - việc chưa tốt và khắc sâu bài học đạo đức ý nghĩa của câu chuyện.`,
        `Động viên trẻ tập đóng vai hoặc kể lại câu chuyện theo ngôn ngữ tự nhiên, sáng tạo của con cho người thân nghe.`
      ];

    case 'ART':
      return [
        `Phối hợp cùng phụ huynh sưu tầm các nguyên vật liệu mở an toàn, phong phú tại gia đình (vỏ hộp, lõi giấy, nắp chai nhựa, lá khô, cúc áo, giấy màu báo cũ...) mang đến lớp phục vụ tiết học tạo hình "${cleanName}".`,
        `Khuyến khích cha mẹ tạo một "Góc triển lãm nhỏ" tại gia đình để treo và trân trọng các bức tranh, sản phẩm tạo hình bé mang về từ lớp, tạo niềm tự hào cho con.`,
        `Dành thời gian ngày nghỉ cuối tuần cùng con vẽ, tô màu, nặn những hình thù sáng tạo, khích lệ đôi bàn tay khéo léo và trí tưởng tượng của bé.`
      ];

    case 'PHYSICAL':
      return [
        `Thông báo tới phụ huynh chuẩn bị trang phục gọn gàng, thấm hút mồ hôi, đi giày mềm hoặc dép quai hậu vừa chân để trẻ thoải mái, an toàn khi tham gia bài học thể dục "${cleanName}".`,
        `Khuyến khích cha mẹ cùng con duy trì thói quen tập thể dục buổi sáng tại nhà, cùng chơi các hoạt động vận động ngoài trời (chạy bộ, nhảy dây, đá bóng mini, tung bắt bóng...) tăng cường thể lực.`,
        `Trao đổi với phụ huynh về chế độ dinh dưỡng hợp lý, nhắc nhở con uống đủ nước và ngủ đúng giờ giúp cơ thể phát triển cân đối, khỏe mạnh.`
      ];

    case 'LETTER':
      return [
        `Phối hợp với phụ huynh cùng con chơi trò đố vui tìm các chữ cái trong bài học "${cleanName}" trên biển quảng cáo, bảng tin, nhãn hộp bánh kẹo, bìa truyện tranh tại nhà.`,
        `Khuyến khích cha mẹ hướng dẫn con nhận diện chữ cái qua việc xếp hột hạt, uốn dây kẽm nhung hoặc tô vẽ chữ cái sáng tạo.`,
        `Nhắc nhở phụ huynh phối hợp rèn tư thế ngồi ngay ngắn và cách cầm bút đúng quy cách khi con ngồi vào bàn học tập ở nhà.`
      ];

    case 'SKILLS':
      return [
        `Trao đổi với phụ huynh về kỹ năng trọng tâm của bài học "${cleanName}", thống nhất phương pháp rèn luyện tính tự lập cho trẻ ở cả lớp và ở nhà.`,
        `Tạo điều kiện để trẻ tự thực hành các kỹ năng tự phục vụ tại gia đình (tự rửa mặt, rửa tay bằng xà phòng theo quy trình, tự thay quần áo, tự xúc ăn gọn gàng).`,
        `Khen ngợi, khích lệ kịp thời mỗi khi con thể hiện sự chủ động, tự tin và có trách nhiệm với bản thân và mọi người xung quanh.`
      ];

    default:
      return [
        `Trao đổi với phụ huynh về chủ đề và nội dung bài học "${cleanName}", phối hợp cùng con ôn luyện và trò chuyện về bài học tại gia đình.`,
        `Khuyến khích cha mẹ hỗ trợ sưu tầm học liệu, đồ dùng trực quan phù hợp bài học và tạo điều kiện cho trẻ khám phá, trải nghiệm thực tế.`,
        `Thường xuyên trao đổi hai chiều giữa giáo viên và phụ huynh về sự tiến bộ, tinh thần hứng thú tham gia các hoạt động học tập của trẻ tại lớp.`
      ];
  }
}

/**
 * Trích xuất và chuẩn hóa mục "II. Chuẩn bị:" mầm non thành đúng cấu trúc 3 mục chuẩn:
 * 1. Chuẩn bị của cô:
 * - Môi trường:
 * - Đồ dùng của cô:
 * 2. Chuẩn bị của trẻ:
 * - Trang phục:
 * - Đồ dùng của trẻ:
 * - Tâm sinh lý của trẻ:
 * 3. Phối hợp với phụ huynh: (Mỗi bài học một nội dung riêng biệt, độc đáo, không trùng lặp)
 */
export function getPreschoolPreparation(equipment: any, context?: PreschoolLessonContext): PreschoolPreparationData {
  const effectiveContext: PreschoolLessonContext = context || (equipment?._context || {
    lessonTitle: equipment?.lessonTitle,
    subject: equipment?.subject,
    grade: equipment?.grade,
    mainTheme: equipment?.mainTheme,
    subTheme: equipment?.subTheme,
  });

  if (equipment?.preschoolPreparation) {
    const pp = equipment.preschoolPreparation;
    const rawParent: string[] = (Array.isArray(pp.parentCollaboration) && pp.parentCollaboration.length > 0)
      ? pp.parentCollaboration
      : [];
    const parentCollab = (rawParent.length > 0 && !isGenericPreschoolParentCollab(rawParent))
      ? rawParent
      : generatePreschoolParentCollaboration(effectiveContext);

    return {
      teacherEnvironment: (pp.teacherEnvironment && pp.teacherEnvironment.length > 0)
        ? pp.teacherEnvironment
        : ['Lớp học sạch sẽ, thoáng mát, an toàn, sắp xếp các góc hoạt động phù hợp chủ đề.'],
      teacherTools: (pp.teacherTools && pp.teacherTools.length > 0)
        ? pp.teacherTools
        : ['Giáo án điện tử, máy tính/tivi, bài giảng tương tác, tranh ảnh và đồ dùng trực quan của cô.'],
      studentCostume: (pp.studentCostume && pp.studentCostume.length > 0)
        ? pp.studentCostume
        : ['Trang phục gọn gàng, sạch sẽ, thoải mái, thuận tiện cho các hoạt động vận động và trải nghiệm.'],
      studentTools: (pp.studentTools && pp.studentTools.length > 0)
        ? pp.studentTools
        : ['Mỗi trẻ hoặc nhóm trẻ có đủ rổ học cụ, đồ dùng trải nghiệm theo bài học.'],
      studentPsychology: (pp.studentPsychology && pp.studentPsychology.length > 0)
        ? pp.studentPsychology
        : ['Tâm thế vui tươi, thoải mái, hào hứng, tự tin, sẵn sàng tham gia hoạt động.'],
      parentCollaboration: parentCollab,
    };
  }

  // Phân tách từ danh sách thiết bị thông thường
  const teacherList: string[] = Array.isArray(equipment?.teacher) ? equipment.teacher : [];
  const studentList: string[] = Array.isArray(equipment?.student) ? equipment.student : [];
  const spaceList: string[] = Array.isArray(equipment?.space) ? equipment.space : [];
  const digitalList: string[] = Array.isArray(equipment?.digitalAssets) ? equipment.digitalAssets : [];
  const parentList: string[] = Array.isArray(equipment?.parentCollaboration) ? equipment.parentCollaboration : [];

  const teacherEnv: string[] = [...spaceList];
  const teacherTools: string[] = [];
  const studentCostume: string[] = [];
  const studentTools: string[] = [];
  const studentPsychology: string[] = [];
  const parentCollab: string[] = [...parentList];

  const stripPrefix = (str: string, prefixRegex: RegExp) => str.replace(prefixRegex, '').trim();

  teacherList.forEach((item) => {
    const trimmed = item.replace(/^[\*•\-–—\s]+/, '').trim();
    if (!trimmed) return;
    if (/^môi trường\s*:\s*/i.test(trimmed)) {
      teacherEnv.push(stripPrefix(trimmed, /^môi trường\s*:\s*/i));
    } else if (/^đồ dùng của cô\s*:\s*/i.test(trimmed)) {
      teacherTools.push(stripPrefix(trimmed, /^đồ dùng của cô\s*:\s*/i));
    } else if (/^phối hợp với phụ huynh\s*:\s*/i.test(trimmed) || /phụ huynh/i.test(trimmed)) {
      parentCollab.push(stripPrefix(trimmed, /^phối hợp với phụ huynh\s*:\s*/i));
    } else if (/(không gian|phòng học|lớp học|sân trường|môi trường|góc hoạt động)/i.test(trimmed)) {
      teacherEnv.push(trimmed);
    } else {
      teacherTools.push(trimmed);
    }
  });

  digitalList.forEach((d) => {
    const trimmed = d.replace(/^[\*•\-–—\s]+/, '').trim();
    if (trimmed) teacherTools.push(trimmed);
  });

  studentList.forEach((item) => {
    const trimmed = item.replace(/^[\*•\-–—\s]+/, '').trim();
    if (!trimmed) return;
    if (/^trang phục\s*:\s*/i.test(trimmed)) {
      studentCostume.push(stripPrefix(trimmed, /^trang phục\s*:\s*/i));
    } else if (/^đồ dùng của trẻ\s*:\s*/i.test(trimmed)) {
      studentTools.push(stripPrefix(trimmed, /^đồ dùng của trẻ\s*:\s*/i));
    } else if (/^(tâm sinh lý của trẻ|tâm sinh lý|tâm thế)\s*:\s*/i.test(trimmed)) {
      studentPsychology.push(stripPrefix(trimmed, /^(tâm sinh lý của trẻ|tâm sinh lý|tâm thế)\s*:\s*/i));
    } else if (/^phối hợp với phụ huynh\s*:\s*/i.test(trimmed) || /phụ huynh/i.test(trimmed)) {
      parentCollab.push(stripPrefix(trimmed, /^phối hợp với phụ huynh\s*:\s*/i));
    } else if (/(trang phục|quần áo|giày dép|mũ nón)/i.test(trimmed)) {
      studentCostume.push(trimmed);
    } else if (/(tâm thế|tâm sinh lý|vui tươi|hào hứng|sức khỏe|tinh thần|sẵn sàng)/i.test(trimmed)) {
      studentPsychology.push(trimmed);
    } else {
      studentTools.push(trimmed);
    }
  });

  const finalParentCollab = (parentCollab.length > 0 && !isGenericPreschoolParentCollab(parentCollab))
    ? parentCollab
    : generatePreschoolParentCollaboration(effectiveContext);

  return {
    teacherEnvironment: teacherEnv.length > 0
      ? teacherEnv
      : ['Lớp học sạch sẽ, thoáng mát, an toàn, sắp xếp các góc hoạt động phù hợp chủ đề.'],
    teacherTools: teacherTools.length > 0
      ? teacherTools
      : ['Giáo án điện tử, bài giảng tương tác, tranh ảnh và đồ dùng dạy học theo bài.'],
    studentCostume: studentCostume.length > 0
      ? studentCostume
      : ['Trang phục gọn gàng, sạch sẽ, thoải mái, thuận tiện cho các hoạt động vận động và trải nghiệm.'],
    studentTools: studentTools.length > 0
      ? studentTools
      : ['Mỗi trẻ hoặc nhóm trẻ có đủ rổ học cụ, đồ dùng trải nghiệm theo bài học.'],
    studentPsychology: studentPsychology.length > 0
      ? studentPsychology
      : ['Tâm thế vui tươi, thoải mái, hào hứng, sẵn sàng tham gia hoạt động cùng cô và bạn.'],
    parentCollaboration: finalParentCollab,
  };
}


