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
  if (s.includes('tập tô') || t.includes('tập tô') || t.includes('tô chữ cái') || t.includes('tô nét')) {
    return {
      domainType: 'LETTER_TRACING',
      mainHeader: 'HOẠT ĐỘNG TẬP TÔ CHỮ CÁI',
      defaultDomainName: 'Hoạt động tập tô chữ cái',
      isMusic: false,
    };
  }

  // 1.6 HOẠT ĐỘNG TRÒ CHƠI CHỮ CÁI
  if (s.includes('trò chơi chữ cái') || t.includes('trò chơi chữ cái') || t.includes('trò chơi với chữ cái') || t.includes('tc chữ cái')) {
    return {
      domainType: 'LETTER_GAME',
      mainHeader: 'HOẠT ĐỘNG TRÒ CHƠI CHỮ CÁI',
      defaultDomainName: 'Hoạt động trò chơi chữ cái',
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

  // 2. PHYSICAL (Thể chất / Thể dục) with HIGH PRIORITY
  const isPhysicalSubject = s.includes('thể chất') || s.includes('vận động') || s.includes('thể dục') || s.includes('gdtc');
  const isPhysicalTitle = t.includes('vđcb') || t.includes('btptc') || t.includes('đi thăng bằng') ||
    t.includes('bật') || t.includes('ném') || t.includes('bò chui') || t.includes('tung bóng') ||
    t.includes('chuyền bóng') || t.includes('bắt bóng') || t.includes('trèo thang') || t.includes('rửa tay') ||
    t.includes('chạy') || t.includes('bò') || t.includes('trườn') || t.includes('nhảy') ||
    t.includes('thể dục') || t.includes('thể chất') || t.includes('vận động cơ bản') ||
    t.includes('bài tập phát triển chung') || t.includes('kéo co');
  const isPhysicalExtra = extra.includes('thể chất') || extra.includes('btptc') || extra.includes('vđcb') || extra.includes('bài tập phát triển chung');

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

  // 5. SKILLS & SOCIAL (Tình cảm - Xã hội / Kỹ năng sống / Khám phá xã hội)
  const isSkillsSubject = s.includes('tình cảm') || s.includes('kỹ năng') || (s.includes('xã hội') && !s.includes('khoa học'));
  const isSkillsTitle = t.includes('tết') || t.includes('cảm xúc') || t.includes('lễ phép') ||
    t.includes('xin phép') || t.includes('chào hỏi') || t.includes('cất đồ chơi') ||
    t.includes('tự phục vụ') || t.includes('tâm thế vào lớp') || t.includes('quy tắc lớp học') ||
    t.includes('chia sẻ đồ chơi') || t.includes('bác nông dân') || t.includes('chú bộ đội') ||
    t.includes('chú công an') || t.includes('bác cấp dưỡng') || t.includes('cô giáo') ||
    t.includes('trường mầm non') || t.includes('nghề nghiệp') || t.includes('gia đình') ||
    t.includes('lễ hội') || t.includes('quê hương') || t.includes('làng nghề');

  if (isSkillsSubject || (isSkillsTitle && !isScienceSubject && !isScienceTitle && !isMathSubject && !isMathTitle)) {
    return {
      domainType: 'SKILLS',
      mainHeader: 'GIÁO ÁN TÌNH CẢM - XÃ HỘI',
      defaultDomainName: 'Lĩnh vực Phát triển tình cảm - kỹ năng xã hội',
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

export function extractSongTitles(lessonTitle: string = '', extraText: string = ''): { mainSong: string; listeningSong: string } {
  let mainSong = '';
  let listeningSong = '';

  const combined = `${lessonTitle || ''}\n${extraText || ''}`;

  // 1. Match "Dạy hát: ..." or "Dạy hát '...'" or 'Dạy hát "..."" or "Dạy hát [Tên bài]"
  const dayHatMatch = combined.match(/dạy hát\s*[:'"]\s*([^'"\n,–-]+)/i) ||
                      combined.match(/dạy hát\s*["“]([^"”]+)["”]/i) ||
                      combined.match(/dạy hát\s*['‘]([^'’]+)['’]/i) ||
                      combined.match(/dạy hát\s+([^,\n\-–;:]+)/i);
  if (dayHatMatch) {
    mainSong = dayHatMatch[1].replace(/\(TT\)/i, '').replace(/nghe hát.*/i, '').trim();
  }

  // 2. Match "Nghe hát: ..." or "Nghe hát '...'" or 'Nghe hát "...""
  const ngheHatMatch = combined.match(/nghe hát\s*[:'"]\s*([^'"\n,–-]+)/i) ||
                        combined.match(/nghe hát\s*["“]([^"”]+)["”]/i) ||
                        combined.match(/nghe hát\s*['‘]([^'’]+)['’]/i) ||
                        combined.match(/nghe hát\s+([^,\n\-–;:]+)/i);
  if (ngheHatMatch) {
    listeningSong = ngheHatMatch[1].replace(/\(TT\)/i, '').trim();
  }

  // 3. Fallback: if mainSong not found but lessonTitle has quoted titles
  if (!mainSong && lessonTitle) {
    const quotes = lessonTitle.match(/["'“‘]([^"'”’]+)["'”’]/g);
    if (quotes && quotes.length > 0) {
      mainSong = quotes[0].replace(/["'“‘”’]/g, '').trim();
      if (!listeningSong && quotes.length > 1) {
        listeningSong = quotes[1].replace(/["'“‘”’]/g, '').trim();
      }
    }
  }

  if (!mainSong && lessonTitle) {
    mainSong = lessonTitle
      .replace(/^(?:âm nhạc|giáo án âm nhạc|gdam|hoạt động âm nhạc|lĩnh vực nghệ thuật|lĩnh vực phát triển thẩm mỹ|thẩm mỹ)[\s:\-–—]*/i, '')
      .replace(/\(TT\)/i, '')
      .trim();
  }

  if (!mainSong) {
    mainSong = 'Cháu yêu bà';
  }

  if (!listeningSong) {
    // Intelligently determine an appropriate companion preschool listening song based on themes
    const lower = `${lessonTitle} ${mainSong} ${extraText}`.toLowerCase();
    if (lower.includes('bà') || lower.includes('mẹ') || lower.includes('bố') || lower.includes('gia đình') || lower.includes('nhà')) {
      listeningSong = 'Cho con';
    } else if (lower.includes('cô') || lower.includes('trường') || lower.includes('lớp') || lower.includes('bạn')) {
      listeningSong = 'Bàn tay cô giáo';
    } else if (lower.includes('cây') || lower.includes('hoa') || lower.includes('xuân') || lower.includes('tết') || lower.includes('mưa') || lower.includes('nắng')) {
      listeningSong = 'Hoa thơm bướm lượn';
    } else if (lower.includes('bộ đội') || lower.includes('công nhân') || lower.includes('nghề')) {
      listeningSong = 'Cháu hát về đảo xa';
    } else if (lower.includes('gà') || lower.includes('mèo') || lower.includes('vịt') || lower.includes('chim') || lower.includes('cá') || lower.includes('con vật')) {
      listeningSong = 'Gà gáy le te';
    } else {
      listeningSong = 'Cho con';
    }
  }

  return { mainSong, listeningSong };
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
  if (!activities || !Array.isArray(activities)) return [];

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

    step1.teacherAction = teacherAction
      .split('\n')
      .map((l) => cleanPreschoolBulletLine(l))
      .filter(Boolean)
      .join('\n')
      .trim();

    step1.studentAction = studentAction
      .split('\n')
      .map((l) => cleanPreschoolBulletLine(l))
      .filter(Boolean)
      .join('\n')
      .trim();

    newAct.step1 = step1;
    return newAct;
  });
}

export function formatPreschoolActivities(activities: any[], lessonTitle: string = '', subject: string = '', oldPlanContent: string = ''): any[] {
  if (!activities || !Array.isArray(activities)) return [];
  const domain = detectPreschoolDomain(subject, lessonTitle, oldPlanContent);

  if (domain.domainType === 'MUSIC') {
    return formatPreschoolMusicActivities(activities, lessonTitle, oldPlanContent);
  }

  if (domain.domainType === 'PHYSICAL') {
    return formatPreschoolPhysicalActivities(activities, lessonTitle, subject);
  }

  let step1Name = "1. Khởi động – Tạo hứng thú và giao nhiệm vụ";
  let step2Name = "2. Khám phá – Trải nghiệm";
  let step3Name = "3. Chia sẻ - Thảo luận";
  let step4Name = "4. Vận dụng – Mở rộng";
  let step5Name = "5. Chia sẻ - Đánh giá";

  if (domain.domainType === 'ART') {
    step1Name = "1. Khởi động – Tạo tình huống có ý nghĩa";
  } else if (domain.domainType === 'SKILLS' || domain.domainType === 'SOCIAL') {
    step5Name = "5. Đánh giá – Điều chỉnh";
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

    step1.teacherAction = teacherAction
      .split('\n')
      .map((l) => cleanPreschoolBulletLine(l))
      .join('\n')
      .trim();
    step1.studentAction = studentAction
      .split('\n')
      .map((l) => cleanPreschoolBulletLine(l))
      .join('\n')
      .trim();
    newAct.step1 = step1;
    return newAct;
  });
}

export function formatPreschoolMusicActivities(activities: any[], lessonTitle: string = '', oldPlanContent: string = ''): any[] {
  if (!activities || !Array.isArray(activities)) return [];

  const { mainSong, listeningSong } = extractSongTitles(lessonTitle, oldPlanContent);

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

    let teacherAction = (step1.teacherAction || '').replace(/\*\*/g, '');
    let studentAction = (step1.studentAction || '').replace(/\*\*/g, '');

    if (determinedIndex === 1) {
      newAct.name = "1. Khởi động – Tạo tình huống";
    } else if (determinedIndex === 2) {
      newAct.name = "2. Khám phá – Trải nghiệm";
    } else if (determinedIndex === 3) {
      newAct.name = "3. Chia sẻ – Thảo luận";
    } else if (determinedIndex === 4) {
      newAct.name = "4. Vận dụng – Mở rộng";
    } else if (determinedIndex === 5) {
      newAct.name = "5. Đánh giá – Điều chỉnh";
    }

    if (determinedIndex !== 3) {
      step1.teacherAction = teacherAction
        .split('\n')
        .map((l) => cleanPreschoolBulletLine(l))
        .join('\n')
        .trim();
      step1.studentAction = studentAction
        .split('\n')
        .map((l) => cleanPreschoolBulletLine(l))
        .join('\n')
        .trim();
      newAct.step1 = step1;
      return newAct;
    }

    newAct.name = "3. Chia sẻ – Thảo luận";

    // 1. Process Teacher Action - BẮT BUỘC PHẢI CÓ ĐỦ CẢ a. Dạy hát: VÀ b. Nghe hát:
    const lines = teacherAction.split('\n').map(l => l.trim()).filter(Boolean);
    
    let aLines: string[] = [];
    let bLines: string[] = [];
    let currentPart: 'A' | 'B' | 'NONE' = 'NONE';

    lines.forEach(line => {
      const cleanLine = line.replace(/\*\*/g, '').trim();
      if (/^([-\s]*[bB][\.\)]\s*(?:Nghe hát|Bài hát nghe|Nghe|b\.))/i.test(cleanLine) || /^[-\s]*b[\.\)]/i.test(cleanLine)) {
        currentPart = 'B';
        bLines.push(cleanLine);
      } else if (/^([-\s]*[aA][\.\)]\s*(?:Dạy hát|Hát|Trọng tâm|a\.))/i.test(cleanLine) || /^[-\s]*a[\.\)]/i.test(cleanLine)) {
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

    // Ensure aLines has valid header
    const defaultAHeader = `a. Dạy hát: "${mainSong}" (TT)`;
    if (aLines.length === 0) {
      aLines = [
        defaultAHeader,
        `- Cô hát mẫu lần 1: Rõ lời, đúng giai điệu và tính chất bài hát.`,
        `- Cô hát mẫu lần 2: Kết hợp cử chỉ, điệu bộ minh họa và giảng giải nội dung bài hát "${mainSong}".`,
        `- Dạy trẻ hát:`,
        `+ Cô bắt nhịp cho cả lớp hát cùng cô từ đầu đến hết bài (2 - 3 lần).`,
        `+ Cho các tổ, nhóm bạn trai, nhóm bạn gái thi đua hát luân phiên.`,
        `+ Mời cá nhân trẻ thể hiện bài hát. Cô chú ý lắng nghe, sửa sai cao độ, nhịp điệu và lời ca cho trẻ kịp thời.`
      ];
    } else {
      // Normalize first line of aLines to start cleanly with a. Dạy hát:
      let firstA = aLines[0].replace(/^[-•*+\s]*a[\.\)]\s*/i, '').trim();
      if (!firstA.toLowerCase().startsWith('dạy hát')) {
        firstA = `Dạy hát: "${mainSong}" (TT) - ${firstA}`;
      }
      aLines[0] = `a. ${firstA}`;
      if (!/\(TT\)/i.test(aLines[0])) {
        aLines[0] = `${aLines[0]} (TT)`;
      }
    }

    // Ensure bLines has valid header and content
    const defaultBHeader = `b. Nghe hát: "${listeningSong}"`;
    if (bLines.length === 0) {
      bLines = [
        defaultBHeader,
        `- Cô giới thiệu tên bài hát nghe "${listeningSong}", tên tác giả.`,
        `- Cô hát cho trẻ nghe lần 1: Thể hiện tình cảm tha thiết, truyền cảm của giai điệu bài hát.`,
        `- Giảng giải nội dung, ý nghĩa bài hát: Giáo dục trẻ biết yêu thương, trân trọng và biết ơn.`,
        `- Cô hát cho trẻ nghe lần 2: Kết hợp động tác múa minh họa mềm mại, khuyến khích trẻ đứng lên cùng nhún nhảy, đung đưa hưởng ứng theo giai điệu bài hát.`
      ];
    } else {
      // Normalize first line of bLines to start cleanly with b. Nghe hát:
      let firstB = bLines[0].replace(/^[-•*+\s]*b[\.\)]\s*/i, '').trim();
      if (!firstB.toLowerCase().startsWith('nghe hát')) {
        firstB = `Nghe hát: "${listeningSong}" - ${firstB}`;
      }
      bLines[0] = `b. ${firstB}`;
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

    // 2. Process Student Action - BẮT BUỘC PHẢI TƯƠNG ỨNG VỚI CẢ DẠY HÁT VÀ NGHE HÁT
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
      sPartA = [
        'Trẻ chú ý lắng nghe cô hát mẫu và quan sát các động tác cử chỉ của cô.',
        'Cả lớp vui tươi, hào hứng hát cùng cô từ đầu đến hết bài (2 - 3 lần).',
        'Từng tổ, nhóm và cá nhân trẻ tự tin đứng lên biểu diễn bài hát.',
        'Trẻ lắng nghe bạn hát và sửa sai theo sự hướng dẫn của cô.'
      ];
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
 * Normalizes preschool bullet lines to avoid redundant or conflicting symbols like (-) +, - +, + -
 * If line has +, it uses single clean '+ '
 * If line has -, it uses single clean '- '
 */
export function cleanPreschoolBulletLine(line: string): string {
  if (!line) return '';
  let trimmed = line.trim();
  if (!trimmed) return '';

  const cleanNoMD = trimmed.replace(/\*\*/g, '').trim();

  // Preserve subheader lines like "a. Dạy hát..." or "b. Nghe hát..."
  if (/^[-\s]*[ab][\.\)]\s*(?:Dạy hát|Nghe hát|Hát vận động|Trò chơi|Khám phá)/i.test(cleanNoMD) || /^([ab][\.\)]\s*.*)$/i.test(cleanNoMD)) {
    let cleanSub = cleanNoMD.replace(/^-\s*/, '');
    return cleanSub;
  }

  // Preserve physical education subheaders like "* Bài tập phát triển chung:" or "* Vận động cơ bản:"
  if (/^\*?\s*(Bài tập phát triển chung|Vận động cơ bản|BTPTC|VĐCB)/i.test(cleanNoMD)) {
    let cleanSub = cleanNoMD.replace(/^[\*•\-–—\s]+/, '').trim();
    return `* ${cleanSub}`;
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
    const tLines = teacherAction.split('\n').map(l => l.trim()).filter(Boolean);
    const sLines = studentAction.split('\n').map(l => l.trim()).filter(Boolean);

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
    const tLines = teacherAction.split('\n').map(l => l.trim()).filter(Boolean);
    const sLines = studentAction.split('\n').map(l => l.trim()).filter(Boolean);

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

  // 1. Kiểm tra lớp ghép / nhiều độ tuổi (ví dụ: Lớp ghép 3-5 tuổi, Ghép 4-5 và 5-6 tuổi...)
  const isMixed = lower.includes('ghép') || 
                  (lower.includes('tuổi') && (lower.includes('&') || lower.includes('và') || lower.includes('+') || /\d\s*-\s*\d.*(?:\&|\bvà\b|\+).*\d\s*-\s*\d/.test(lower)));
  
  if (isMixed) {
    return {
      rawGrade: g,
      category: 'MIXED_AGE',
      standardName: 'Lớp mầm non ghép độ tuổi',
      recommendedDuration: '25 – 30 phút',
      developmentalTraits: [
        'Lớp học bao gồm các trẻ có nhiều lứa tuổi khác nhau (thường chênh nhau 1-2 tuổi)',
        'Mức độ nhận thức, ngôn ngữ và khả năng vận động không đồng đều giữa các nhóm trẻ',
        'Trẻ lớn có xu hướng thể hiện và che chở cho trẻ nhỏ; trẻ nhỏ học hỏi rất nhanh từ việc quan sát bạn lớn'
      ],
      cognitiveFocus: 'Thiết kế mục tiêu phân hóa 2 mức: Mức cơ bản cho nhóm trẻ nhỏ tuổi hơn và Mức mở rộng/nâng cao cho nhóm trẻ lớn tuổi hơn.',
      languageAndSpeech: 'Cô dùng ngôn ngữ gần gũi, giao tiếp đa tầng; khuyến khích trẻ lớn giải thích hoặc trò chuyện cùng trẻ nhỏ.',
      motorSkills: 'Đa dạng hóa bài tập và dụng cụ: đồ dùng to dễ thao tác cho trẻ nhỏ, đồ dùng tinh xảo hơn cho trẻ lớn.',
      pedagogicalStrategy: 'DẠY HỌC PHÂN HÓA: Tổ chức hoạt động chung ở phần mở đầu và kết thúc. Ở phần Khám phá/Trải nghiệm và Thực hành, giao 2 mức độ nhiệm vụ rõ rệt (Nhóm 1: trẻ nhỏ; Nhóm 2: trẻ lớn). Cô luân phiên hướng dẫn trực tiếp nhóm nhỏ và gợi ý nhóm lớn làm việc độc lập.',
      promptGuidance: `BẮT BUỘC THIẾT KẾ GIÁO ÁN PHÂN HÓA ĐỘ TUỔI CHO LỚP GHÉP (${g}):
- Trong phần Mục đích - yêu cầu (Kiến thức, Kỹ năng): Ghi rõ yêu cầu phân hóa cho từng nhóm tuổi (ví dụ: Với trẻ nhỏ tuổi hơn...; Với trẻ lớn tuổi hơn...).
- Trong Bảng Tiến trình hoạt động (Đặc biệt ở Bước 2 Khám phá - Trải nghiệm và Bước 4 Thực hành - Vận dụng):
  + Tách rõ hành động của cô và trẻ theo từng nhóm:
    * Nhóm trẻ nhỏ hơn: Làm quen thao tác cơ bản, nhận biết trực quan, cô trực tiếp hỗ trợ, động viên âu yếm.
    * Nhóm trẻ lớn hơn: Tự thực hiện nhiệm vụ nâng cao hơn, sáng tạo hơn, hoặc hỗ trợ bạn nhỏ.
- Đồ dùng chuẩn bị phải có phân loại phù hợp cho cả 2 nhóm độ tuổi.`
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

