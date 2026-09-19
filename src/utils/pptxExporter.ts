import PptxGenJS from 'pptxgenjs';
import { saveAs } from 'file-saver';
import { LessonPlanOutput, ImageSlot, ActivityDetail } from '../types';
import { isPreschoolPlan } from './preschoolUtils';

/**
 * Clean and normalize text for PowerPoint presentation:
 * - Remove Markdown asterisks, headers, backticks, bullet prefixes
 * - Clean LaTeX math markers ($...$, $$...$$) into readable Unicode math symbols
 * - Replace Image slot placeholders
 */
export function cleanPptxText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\{\{(IMAGE_SLOT_\d+|IMAGESLOT\d*)\}\}/gi, '')
    .replace(/\[\s*(Vị trí ảnh minh họa|Ảnh minh họa):[^\]]*\]/gi, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_{1,2}(.*?)_{1,2}/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/^\s*#+\s*/gm, '')
    // Math symbol replacements
    .replace(/\$\$([^\$]+)\$\$/g, '$1')
    .replace(/\$([^\$]+)\$/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\cdot/g, '·')
    .replace(/\\times/g, '×')
    .replace(/\\pm/g, '±')
    .replace(/\\leq|\\le/g, '≤')
    .replace(/\\geq|\\ge/g, '≥')
    .replace(/\\neq|\\ne/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\infty/g, '∞')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\pi/g, 'π')
    .replace(/\\notin/g, '∉')
    .replace(/\\in/g, '∈')
    .replace(/\\subset/g, '⊂')
    .replace(/\\supset/g, '⊃')
    .replace(/\\cup/g, '∪')
    .replace(/\\cap/g, '∩')
    .replace(/\\emptyset/g, '∅')
    .replace(/\\mathbb\{R\}/g, 'ℝ')
    .replace(/\\mathbb\{N\}/g, 'ℕ')
    .replace(/\\mathbb\{Z\}/g, 'ℤ')
    .replace(/\\mathbb\{Q\}/g, 'ℚ')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/_1/g, '₁')
    .replace(/_2/g, '₂')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Format slide filename based on lesson plan metadata
 */
export function formatPptxFileName(plan: {
  lessonTitle?: string;
  subject?: string;
  grade?: string;
  subBranch?: string;
  [key: string]: any;
}): string {
  let title = (plan.lessonTitle || 'Bài giảng trình chiếu').trim();
  title = title.replace(/[:\/\\*?"<>|]/g, ' ');
  title = title.replace(/[_\s]+/g, ' ').trim();

  const rawGrade = (plan.grade || '').trim();
  const gradeClean = rawGrade.replace(/^(lớp|khối)\s*/i, '').trim();
  const rawSubject = (plan.subject || '').trim();

  let formattedSubject = rawSubject
    .replace(/^Giáo dục công dân\s*(\(GDCD\))?$/i, 'GDCD')
    .replace(/^Giáo dục thể chất\s*(\(GDTC\))?$/i, 'GDTC')
    .replace(/^Giáo dục quốc phòng và an ninh\s*(\(GDQP-AN\))?$/i, 'GDQP-AN')
    .replace(/^Lịch sử và Địa lí\s*(\(LS&ĐL\))?$/i, 'LS&ĐL')
    .replace(/\s*\([^)]*\)$/, '')
    .trim();

  let tag = '';
  if (formattedSubject && gradeClean) {
    tag = `${formattedSubject} ${gradeClean}`;
  } else if (formattedSubject) {
    tag = formattedSubject;
  } else if (gradeClean) {
    tag = `Lớp ${gradeClean}`;
  }

  if (tag && !title.toLowerCase().includes(tag.toLowerCase())) {
    return `Bài giảng ${title} (${tag}).pptx`;
  }

  return `Bài giảng ${title}.pptx`;
}

/**
 * Save PowerPoint presentation with File System Access Picker or Fallback
 */
async function savePptxBlob(blob: Blob, defaultFileName: string): Promise<boolean> {
  const isTopWindow = (() => {
    try {
      return typeof window !== 'undefined' && window.self === window.top;
    } catch {
      return false;
    }
  })();

  if (isTopWindow && typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: defaultFileName,
        types: [
          {
            description: 'Bài trình chiếu Microsoft PowerPoint (.pptx)',
            accept: {
              'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        return false;
      }
      // Silently proceed to standard download fallback without warning
    }
  }

  saveAs(blob, defaultFileName);
  return true;
}

/**
 * Theme color palettes for PowerPoint presentation
 */
interface SlideTheme {
  primary: string;       // Hex without #
  secondary: string;
  accent: string;
  bgLight: string;
  cardBg: string;
  textDark: string;
  textMuted: string;
  bannerSub: string;
  tagBg: string;
  tagText: string;
  white: string;
}

function getThemeByPlan(plan: LessonPlanOutput): SlideTheme {
  const isPreschool = (plan as any).schoolLevel === 'Mầm non' || isPreschoolPlan(plan);
  const subject = (plan.subject || '').toLowerCase();

  if (isPreschool) {
    return {
      primary: 'EA580C',    // Warm Orange
      secondary: '059669',  // Emerald Green
      accent: 'D97706',     // Amber
      bgLight: 'FFFBEB',    // Warm Cream
      cardBg: 'FFFFFF',
      textDark: '1E293B',
      textMuted: '64748B',
      bannerSub: 'FED7AA',
      tagBg: 'FFF7ED',
      tagText: 'C2410C',
      white: 'FFFFFF',
    };
  }

  if (subject.includes('toán') || subject.includes('tin học')) {
    return {
      primary: '1D4ED8',    // Royal Blue
      secondary: '0D9488',  // Teal
      accent: '2563EB',     // Cobalt Blue
      bgLight: 'F8FAFC',    // Cool Slate
      cardBg: 'FFFFFF',
      textDark: '0F172A',
      textMuted: '475569',
      bannerSub: 'BFDBFE',
      tagBg: 'EFF6FF',
      tagText: '1D4ED8',
      white: 'FFFFFF',
    };
  }

  if (subject.includes('văn') || subject.includes('sử') || subject.includes('địa') || subject.includes('gdcd')) {
    return {
      primary: '991B1B',    // Crimson / Burgundy
      secondary: 'B45309',  // Warm Ochre
      accent: 'C2410C',     // Dark Amber
      bgLight: 'FAF5FF',    // Warm light
      cardBg: 'FFFFFF',
      textDark: '1E1E24',
      textMuted: '57534E',
      bannerSub: 'FECDD3',
      tagBg: 'FEF2F2',
      tagText: '991B1B',
      white: 'FFFFFF',
    };
  }

  if (subject.includes('khtn') || subject.includes('sinh') || subject.includes('hóa') || subject.includes('lý')) {
    return {
      primary: '047857',    // Deep Emerald
      secondary: '0284C7',  // Sky Blue
      accent: '059669',     // Emerald
      bgLight: 'F0FDF4',    // Soft Mint
      cardBg: 'FFFFFF',
      textDark: '064E3B',
      textMuted: '334155',
      bannerSub: 'A7F3D0',
      tagBg: 'ECFDF5',
      tagText: '047857',
      white: 'FFFFFF',
    };
  }

  // Default Professional Modern Theme (Indigo / Teal)
  return {
    primary: '1E3A8A',      // Dark Indigo
    secondary: '0D9488',    // Teal
    accent: '3B82F6',       // Blue
    bgLight: 'F8FAFC',
    cardBg: 'FFFFFF',
    textDark: '0F172A',
    textMuted: '475569',
    bannerSub: 'C7D2FE',
    tagBg: 'EEF2FF',
    tagText: '3730A3',
    white: 'FFFFFF',
  };
}

/**
 * Helper to split text into structured bullets without overflow
 */
function textToBulletRuns(text: string, defaultColor: string, maxItems = 6): any[] {
  if (!text) return [];
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^[-•*+]\s*/, '').trim())
    .filter((l) => l.length > 0);

  const selected = lines.slice(0, maxItems);
  return selected.map((line) => ({
    text: `${line}\n`,
    options: {
      bullet: { type: 'bullet', code: '2022' },
      fontSize: line.length > 100 ? 11 : 12,
      color: defaultColor,
      paraSpaceAfter: 6,
    },
  }));
}

/**
 * Intelligent Knowledge Extractor from Activity 2
 */
interface KnowledgeItem {
  title: string;
  theory: string;
  example: string;
  note?: string;
}

function extractKnowledgeItems(act: ActivityDetail): KnowledgeItem[] {
  const content = cleanPptxText(act.content || '');
  const product = cleanPptxText(act.step4?.productExpected || act.productSummary || '');
  const teacherAction = cleanPptxText(act.step1?.teacherAction || '');

  const items: KnowledgeItem[] = [];

  // Pattern 1: Look for numbered sections like "1. ...", "2. ...", "I. ...", "Mục 1:"
  const sectionMatches = content.split(/(?=(?:^|\n)(?:\d+\.|\bI+\.|\bMục\s+\d+:|[a-c]\))\s+)/gi);

  if (sectionMatches.length > 1) {
    sectionMatches.forEach((sec, idx) => {
      const trimmed = sec.trim();
      if (!trimmed || trimmed.length < 20) return;

      const firstLineBreak = trimmed.indexOf('\n');
      let title = firstLineBreak !== -1 ? trimmed.substring(0, firstLineBreak).trim() : `Kiến thức ${idx + 1}`;
      let body = firstLineBreak !== -1 ? trimmed.substring(firstLineBreak).trim() : trimmed;

      title = title.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();

      // Separate into theory and example
      let theory = body;
      let example = '';
      let note = '';

      const exampleIdx = body.search(/(?:Ví dụ|Ví dụ minh họa|Bài toán mẫu|Luyện tập tại chỗ)/i);
      const noteIdx = body.search(/(?:Chú ý|Lưu ý|Ghi nhớ|Quy ước)/i);

      if (exampleIdx !== -1 && noteIdx !== -1) {
        if (exampleIdx < noteIdx) {
          theory = body.substring(0, exampleIdx).trim();
          example = body.substring(exampleIdx, noteIdx).trim();
          note = body.substring(noteIdx).trim();
        } else {
          theory = body.substring(0, noteIdx).trim();
          note = body.substring(noteIdx, exampleIdx).trim();
          example = body.substring(exampleIdx).trim();
        }
      } else if (exampleIdx !== -1) {
        theory = body.substring(0, exampleIdx).trim();
        example = body.substring(exampleIdx).trim();
      } else if (noteIdx !== -1) {
        theory = body.substring(0, noteIdx).trim();
        note = body.substring(noteIdx).trim();
      }

      items.push({
        title: title.length > 50 ? title.substring(0, 50) + '...' : title,
        theory: theory || 'Nắm vững các khái niệm và tính chất cốt lõi của nội dung bài học.',
        example: example,
        note: note,
      });
    });
  }

  // Fallback if no explicit numbered sections found: Create 1-2 focused units
  if (items.length === 0) {
    const actName = cleanPptxText(act.name || 'Hình thành kiến thức mới');
    items.push({
      title: actName.replace(/^Hoạt động \d+[:\s-]*/i, '') || 'Kiến thức cốt lõi',
      theory: content || product || 'Học sinh tiếp cận và nắm bắt các khái niệm, quy tắc trọng tâm của bài dạy.',
      example: teacherAction || product || 'Áp dụng lý thuyết vào giải quyết các bài toán và tình huống mẫu.',
      note: 'Ghi nhớ các định nghĩa, quy ước và phương pháp giải chuẩn hóa.',
    });
  }

  return items;
}

/**
 * Intelligent Exercise Extractor from Activity 3 (Practice)
 */
interface ExerciseItem {
  title: string;
  problem: string;
  solution: string;
}

function extractExercises(act: ActivityDetail, worksheetContent?: string): ExerciseItem[] {
  const content = cleanPptxText(act.content || '');
  const product = cleanPptxText(act.step4?.productExpected || act.productSummary || '');
  const extraWorksheet = cleanPptxText(worksheetContent || '');

  const exercises: ExerciseItem[] = [];

  // Split by "Bài 1", "Bài 2", "Câu 1", "Câu 2", "Luyện tập 1", "Bài tập 1"
  const rawText = content + '\n' + extraWorksheet;
  const parts = rawText.split(/(?=(?:^|\n)(?:Bài|Câu|Luyện tập|Thực hành)\s+\d+[:\.\s])/i);

  if (parts.length > 1) {
    parts.forEach((part, i) => {
      const trimmed = part.trim();
      if (!trimmed || trimmed.length < 25) return;

      const firstLineBreak = trimmed.indexOf('\n');
      const title = firstLineBreak !== -1 ? trimmed.substring(0, firstLineBreak).trim() : `Bài tập ${i + 1}`;
      const body = firstLineBreak !== -1 ? trimmed.substring(firstLineBreak).trim() : trimmed;

      // Check if there is solution/answer in product
      let solution = '';
      if (product) {
        const productParts = product.split(/(?=(?:^|\n)(?:Bài|Câu|Luyện tập|Thực hành)\s+\d+[:\.\s])/i);
        const matched = productParts.find((p) => p.toLowerCase().includes(title.toLowerCase().substring(0, 10)));
        if (matched) {
          solution = matched.trim();
        }
      }

      if (!solution) {
        solution = 'Học sinh áp dụng các quy tắc đã học để giải, trình bày các bước suy luận và đối chiếu đáp số chính xác.';
      }

      exercises.push({
        title: title.length > 45 ? title.substring(0, 45) + '...' : title,
        problem: body || 'Thực hiện yêu cầu bài tập theo hướng dẫn của giáo viên.',
        solution: solution,
      });
    });
  }

  if (exercises.length === 0) {
    exercises.push({
      title: 'Bài tập rèn luyện củng cố',
      problem: content || 'Thực hành các bài tập tính toán, phân tích và áp dụng định lý trong SGK.',
      solution: product || 'Học sinh trình bày lời giải chi tiết, giải thích căn cứ và kiểm tra kết quả.',
    });
  }

  return exercises.slice(0, 4); // Max 4 exercises to avoid excessive slides
}

/**
 * Intelligent Summary Synthesizer
 */
interface LessonSummary {
  pillar1Title: string;
  pillar1Content: string[];
  pillar2Title: string;
  pillar2Content: string[];
  pillar3Title: string;
  pillar3Content: string[];
  coreTakeaway: string;
}

function extractLessonSummary(plan: LessonPlanOutput): LessonSummary {
  const cleanTitle = cleanPptxText(plan.lessonTitle || 'Bài học');
  const knowledge = (plan.objectives?.knowledge || []).map(cleanPptxText);

  // Extract from activities
  const act2 = (plan.activities || []).find((a) => /hình thành|khám phá|kiến thức/i.test(a.name || ''));
  const act2Content = cleanPptxText(act2?.content || '');
  const act2Product = cleanPptxText(act2?.step4?.productExpected || act2?.productSummary || '');

  return {
    pillar1Title: '1. Khái niệm & Ký hiệu',
    pillar1Content: knowledge.slice(0, 2).length > 0
      ? knowledge.slice(0, 2)
      : [`Nắm chắc bản chất và ý nghĩa của ${cleanTitle}.`, 'Sử dụng đúng các quy ước, thuật ngữ và ký hiệu chuẩn.'],
    pillar2Title: '2. Quy tắc & Phương pháp',
    pillar2Content: knowledge.length > 2
      ? knowledge.slice(2, 4)
      : ['Thực hiện thành thạo các bước giải bài tập.', 'Áp dụng các định lý, công thức chính xác trong từng trường hợp.'],
    pillar3Title: '3. Lưu ý & Kỹ năng',
    pillar3Content: [
      'Tránh các sai lầm phổ biến về điều kiện và biến đổi.',
      'Rèn luyện kỹ năng quan sát, suy luận logic và kiểm tra kết quả.',
    ],
    coreTakeaway: `Ghi nhớ bản chất, quy tắc và áp dụng linh hoạt kiến thức "${cleanTitle}" vào thực hành và đời sống!`,
  };
}

/**
 * MAIN EXPORT FUNCTION: Generates a high-end, professionally styled PowerPoint presentation
 */
export async function exportLessonPlanToPptx(
  plan: LessonPlanOutput,
  imageSlots: ImageSlot[] = []
): Promise<boolean> {
  const pptx = new PptxGenJS();
  // 'LAYOUT_WIDE' is the 16:9 Widescreen standard in PptxGenJS (13.333" x 7.5")
  // Note: 'LAYOUT_16x9' in PptxGenJS defaults to 10" x 5.625", which caused coordinates past 10" to be cut off
  pptx.layout = 'LAYOUT_WIDE';

  pptx.title = plan.lessonTitle || 'Bài giảng điện tử';
  pptx.subject = `${plan.subject || 'Môn học'} - ${plan.grade || 'Lớp'}`;
  pptx.author = 'AI Giáo Viên - Kế hoạch bài dạy chuẩn';

  const theme = getThemeByPlan(plan);
  const isPreschool = (plan as any).schoolLevel === 'Mầm non' || isPreschoolPlan(plan);

  let slidePage = 1;

  // Helper for slide header bar
  const addHeaderToSlide = (slide: any, category: string, title: string) => {
    // Header Banner Box
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 1.15,
      fill: { color: theme.primary },
    });

    // Decorative accent line under header
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 1.15,
      w: 13.33,
      h: 0.05,
      fill: { color: theme.accent },
    });

    // Category tag
    if (category) {
      slide.addText(category.toUpperCase(), {
        x: 0.8,
        y: 0.16,
        w: 11.73,
        h: 0.3,
        fontSize: 10,
        fontFace: 'Arial',
        color: theme.bannerSub,
        bold: true,
        charSpacing: 1.5,
      });
    }

    // Slide Title
    slide.addText(title, {
      x: 0.8,
      y: category ? 0.46 : 0.28,
      w: 11.73,
      h: 0.58,
      fontSize: 18.5,
      fontFace: 'Arial',
      color: theme.white,
      bold: true,
      valign: 'middle',
    });
  };

  // Helper for slide footer
  const addFooterToSlide = (slide: any) => {
    slide.addShape(pptx.ShapeType.line, {
      x: 0.8,
      y: 6.95,
      w: 11.73,
      h: 0,
      line: { color: 'E2E8F0', width: 1 },
    });

    slide.addText(
      `${plan.lessonTitle || 'Bài giảng'} • ${plan.subject || ''} ${plan.grade ? `(${plan.grade})` : ''}`,
      {
        x: 0.8,
        y: 7.02,
        w: 9.0,
        h: 0.35,
        fontSize: 9.5,
        fontFace: 'Arial',
        color: theme.textMuted,
      }
    );

    slide.addText(`Trang ${slidePage++}`, {
      x: 10.5,
      y: 7.02,
      w: 2.03,
      h: 0.35,
      fontSize: 9.5,
      fontFace: 'Arial',
      color: theme.textMuted,
      align: 'right',
    });
  };

  // =========================================================================
  // SLIDE 1: TRANG BÌA HIỆN ĐẠI (HERO TITLE SLIDE)
  // =========================================================================
  const slide1 = pptx.addSlide();
  slide1.background = { color: theme.bgLight };

  // Hero colored banner
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.33,
    h: 4.8,
    fill: { color: theme.primary },
  });
  slide1.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 4.8,
    w: 13.33,
    h: 0.1,
    fill: { color: theme.accent },
  });

  // Curriculum Badge
  const bookTag = (plan as any).curriculumBook || 'Chương trình GDPT 2018';
  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 1.0,
    y: 0.65,
    w: 4.3,
    h: 0.42,
    rectRadius: 0.1,
    fill: { color: 'FFFFFF' },
    line: { color: theme.accent, width: 1.5 },
  });
  slide1.addText(bookTag.toUpperCase(), {
    x: 1.0,
    y: 0.65,
    w: 4.3,
    h: 0.42,
    fontSize: 10.5,
    fontFace: 'Arial',
    color: theme.primary,
    bold: true,
    align: 'center',
    valign: 'middle',
  });

  // Subject & Grade Label
  slide1.addText(`${(plan.subject || 'MÔN HỌC').toUpperCase()} • ${(plan.grade || 'LỚP').toUpperCase()}`, {
    x: 1.0,
    y: 1.25,
    w: 11.33,
    h: 0.5,
    fontSize: 15,
    fontFace: 'Arial',
    color: theme.bannerSub,
    bold: true,
    charSpacing: 2,
  });

  // Big Lesson Title
  const cleanMainTitle = cleanPptxText(plan.lessonTitle || 'BÀI HỌC MỚI');
  slide1.addText(cleanMainTitle, {
    x: 1.0,
    y: 1.8,
    w: 11.33,
    h: 2.3,
    fontSize: cleanMainTitle.length > 50 ? 28 : 34,
    fontFace: 'Arial',
    color: theme.white,
    bold: true,
    valign: 'top',
  });

  // Bottom Card with Presenter & Academic Info
  slide1.addShape(pptx.ShapeType.roundRect, {
    x: 1.0,
    y: 5.2,
    w: 11.33,
    h: 1.7,
    rectRadius: 0.15,
    fill: { color: theme.cardBg },
    line: { color: 'CBD5E1', width: 1 },
    shadow: { type: 'outer', color: '64748B', blur: 4, offset: 2, angle: 90, opacity: 0.12 },
  });

  slide1.addText(
    [
      { text: 'Thời lượng: ', options: { bold: true, color: theme.primary, fontSize: 13 } },
      { text: `${plan.periods ? `${plan.periods} tiết` : 'Theo kế hoạch dạy học'}\n`, options: { fontSize: 13 } },
      { text: 'Phương pháp: ', options: { bold: true, color: theme.primary, fontSize: 13 } },
      { text: isPreschool ? 'Học bằng chơi, trải nghiệm trực quan sinh động' : 'Dạy học tích cực, phát triển phẩm chất và năng lực', options: { fontSize: 13 } },
    ],
    {
      x: 1.4,
      y: 5.35,
      w: 6.2,
      h: 1.4,
      fontFace: 'Arial',
      color: theme.textDark,
      valign: 'middle',
    }
  );

  slide1.addText(
    [
      { text: 'Giáo viên giảng dạy: ', options: { bold: true, color: theme.primary, fontSize: 13 } },
      { text: `${plan.teacherName || 'Giáo viên bộ môn'}\n`, options: { fontSize: 13 } },
      { text: 'Năm học: ', options: { bold: true, color: theme.primary, fontSize: 13 } },
      { text: `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`, options: { fontSize: 13 } },
    ],
    {
      x: 7.8,
      y: 5.35,
      w: 4.2,
      h: 1.4,
      fontFace: 'Arial',
      color: theme.textDark,
      valign: 'middle',
    }
  );

  // =========================================================================
  // HOẠT ĐỘNG 1: KHỞI ĐỘNG (WARM-UP / TÌNH HUỐNG DẪN NHẬP)
  // =========================================================================
  const act1 = (plan.activities || []).find((a) => /khởi động|mở đầu|đón trẻ/i.test(a.name || '')) || (plan.activities || [])[0];

  if (act1) {
    const slideWarmup = pptx.addSlide();
    slideWarmup.background = { color: theme.bgLight };
    addHeaderToSlide(
      slideWarmup,
      'HOẠT ĐỘNG 1: KHỞI ĐỘNG • TẠO HỨNG THÚ',
      cleanPptxText(act1.name || 'KHỞI ĐỘNG VÀ DẪN NHẬP BÀI HỌC').toUpperCase()
    );
    addFooterToSlide(slideWarmup);

    // Left Box: Tình huống / Câu đố khởi động
    slideWarmup.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 1.35,
      w: 5.7,
      h: 5.4,
      rectRadius: 0.12,
      fill: { color: theme.cardBg },
      line: { color: 'CBD5E1', width: 1.5 },
      shadow: { type: 'outer', color: '64748B', blur: 3, offset: 1.5, angle: 90, opacity: 0.08 },
    });

    slideWarmup.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 1.35,
      w: 5.7,
      h: 0.6,
      rectRadius: 0.1,
      fill: { color: theme.primary },
    });

    slideWarmup.addText('🎮 TÌNH HUỐNG / CÂU ĐỐ KHỞI ĐỘNG', {
      x: 1.0,
      y: 1.35,
      w: 5.3,
      h: 0.6,
      fontSize: 12.5,
      fontFace: 'Arial',
      color: theme.white,
      bold: true,
      valign: 'middle',
    });

    const challengeText = cleanPptxText(
      act1.content || act1.step1?.teacherAction || 'Quan sát hiện tượng, hình ảnh và giải quyết thử thách mở đầu.'
    );

    slideWarmup.addText(
      [
        { text: 'Thử thách dành cho học sinh:\n', options: { bold: true, color: theme.primary, fontSize: 13 } },
        { text: `${challengeText}\n\n`, options: { fontSize: 12, color: theme.textDark } },
      ],
      {
        x: 1.05,
        y: 2.1,
        w: 5.2,
        h: 4.4,
        fontFace: 'Arial',
        valign: 'top',
      }
    );

    // Right Box: Suy ngẫm & Cầu nối bài học
    slideWarmup.addShape(pptx.ShapeType.roundRect, {
      x: 6.83,
      y: 1.35,
      w: 5.7,
      h: 5.4,
      rectRadius: 0.12,
      fill: { color: theme.cardBg },
      line: { color: 'CBD5E1', width: 1.5 },
      shadow: { type: 'outer', color: '64748B', blur: 3, offset: 1.5, angle: 90, opacity: 0.08 },
    });

    slideWarmup.addShape(pptx.ShapeType.roundRect, {
      x: 6.83,
      y: 1.35,
      w: 5.7,
      h: 0.6,
      rectRadius: 0.1,
      fill: { color: theme.secondary },
    });

    slideWarmup.addText('💡 SUY NGẪM & DẪN DẮT VÀO BÀI', {
      x: 7.03,
      y: 1.35,
      w: 5.3,
      h: 0.6,
      fontSize: 12.5,
      fontFace: 'Arial',
      color: theme.white,
      bold: true,
      valign: 'middle',
    });

    const leadinText = cleanPptxText(
      act1.step4?.productExpected || act1.productSummary || act1.step2?.studentAction || 'Học sinh đưa ra ý kiến thảo luận và kết nối vào nội dung bài học mới.'
    );

    slideWarmup.addText(
      [
        { text: 'Câu hỏi gợi mở & Thảo luận:\n', options: { bold: true, color: theme.secondary, fontSize: 13 } },
        { text: `${leadinText}\n\n`, options: { fontSize: 12, color: theme.textDark } },
        { text: '✨ Cầu nối bài mới: ', options: { bold: true, color: theme.accent, fontSize: 13 } },
        { text: `Để giải thích cặn kẽ và tìm ra lời giải chính xác nhất, chúng ta cùng bước vào bài học hôm nay!`, options: { italic: true, fontSize: 12, color: theme.textDark } },
      ],
      {
        x: 7.08,
        y: 2.1,
        w: 5.2,
        h: 4.4,
        fontFace: 'Arial',
        valign: 'top',
      }
    );
  }

  // =========================================================================
  // HOẠT ĐỘNG 2: HÌNH THÀNH KIẾN THỨC MỚI (CORE KNOWLEDGE SLIDES)
  // =========================================================================
  const act2 = (plan.activities || []).find((a) => /hình thành|khám phá|kiến thức|trọng tâm/i.test(a.name || '')) || (plan.activities || [])[1];

  if (act2) {
    const knowledgeItems = extractKnowledgeItems(act2);

    knowledgeItems.forEach((item, idx) => {
      const slideK = pptx.addSlide();
      slideK.background = { color: theme.bgLight };
      addHeaderToSlide(
        slideK,
        `HÌNH THÀNH KIẾN THỨC • PHẦN ${idx + 1}/${knowledgeItems.length}`,
        item.title.toUpperCase()
      );
      addFooterToSlide(slideK);

      // Has example? Use 2 columns (Theory vs Example)
      if (item.example) {
        // Left Column: Lý thuyết / Định nghĩa / Quy tắc
        slideK.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: 1.35,
          w: 5.7,
          h: 5.4,
          rectRadius: 0.12,
          fill: { color: theme.cardBg },
          line: { color: 'CBD5E1', width: 1.5 },
          shadow: { type: 'outer', color: '64748B', blur: 3, offset: 1.5, angle: 90, opacity: 0.08 },
        });

        slideK.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: 1.35,
          w: 5.7,
          h: 0.6,
          rectRadius: 0.1,
          fill: { color: theme.primary },
        });

        slideK.addText('📖 KIẾN THỨC TRỌNG TÂM', {
          x: 1.0,
          y: 1.35,
          w: 5.3,
          h: 0.6,
          fontSize: 12.5,
          fontFace: 'Arial',
          color: theme.white,
          bold: true,
          valign: 'middle',
        });

        const theoryRuns: any[] = [
          { text: 'Nội dung cốt lõi:\n', options: { bold: true, color: theme.primary, fontSize: 13 } },
          { text: `${item.theory}\n\n`, options: { fontSize: item.theory.length > 300 ? 11 : 12, color: theme.textDark } },
        ];

        if (item.note) {
          theoryRuns.push(
            { text: '⚠️ Lưu ý quan trọng:\n', options: { bold: true, color: theme.accent, fontSize: 12.5 } },
            { text: `${item.note}\n`, options: { italic: true, fontSize: 11, color: theme.textDark } }
          );
        }

        slideK.addText(theoryRuns, {
          x: 1.05,
          y: 2.1,
          w: 5.2,
          h: 4.4,
          fontFace: 'Arial',
          valign: 'top',
        });

        // Right Column: Ví dụ minh họa & Phân tích giải
        slideK.addShape(pptx.ShapeType.roundRect, {
          x: 6.83,
          y: 1.35,
          w: 5.7,
          h: 5.4,
          rectRadius: 0.12,
          fill: { color: theme.cardBg },
          line: { color: 'CBD5E1', width: 1.5 },
          shadow: { type: 'outer', color: '64748B', blur: 3, offset: 1.5, angle: 90, opacity: 0.08 },
        });

        slideK.addShape(pptx.ShapeType.roundRect, {
          x: 6.83,
          y: 1.35,
          w: 5.7,
          h: 0.6,
          rectRadius: 0.1,
          fill: { color: theme.secondary },
        });

        slideK.addText('✏️ VÍ DỤ MINH HỌA & PHÂN TÍCH', {
          x: 7.03,
          y: 1.35,
          w: 5.3,
          h: 0.6,
          fontSize: 12.5,
          fontFace: 'Arial',
          color: theme.white,
          bold: true,
          valign: 'middle',
        });

        slideK.addText(
          [
            { text: 'Ví dụ áp dụng:\n', options: { bold: true, color: theme.secondary, fontSize: 13 } },
            { text: `${item.example}\n\n`, options: { fontSize: item.example.length > 300 ? 11 : 12, color: theme.textDark } },
            { text: '📌 Nhận xét phương pháp:\n', options: { bold: true, color: theme.primary, fontSize: 12.5 } },
            { text: 'Đối chiếu lý thuyết, kiểm tra kỹ từng bước thực hiện để rèn tính cẩn thận.', options: { fontSize: 11, color: theme.textDark } },
          ],
          {
            x: 7.08,
            y: 2.1,
            w: 5.2,
            h: 4.4,
            fontFace: 'Arial',
            valign: 'top',
          }
        );
      } else {
        // Single Full-Width Card if only Theory
        slideK.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: 1.35,
          w: 11.73,
          h: 5.4,
          rectRadius: 0.12,
          fill: { color: theme.cardBg },
          line: { color: 'CBD5E1', width: 1.5 },
          shadow: { type: 'outer', color: '64748B', blur: 3, offset: 1.5, angle: 90, opacity: 0.08 },
        });

        slideK.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: 1.35,
          w: 11.73,
          h: 0.6,
          rectRadius: 0.1,
          fill: { color: theme.primary },
        });

        slideK.addText('📖 KIẾN THỨC VÀ QUY TẮC CỐT LÕI', {
          x: 1.0,
          y: 1.35,
          w: 11.33,
          h: 0.6,
          fontSize: 13,
          fontFace: 'Arial',
          color: theme.white,
          bold: true,
          valign: 'middle',
        });

        slideK.addText(
          [
            { text: 'Lý thuyết trọng tâm:\n', options: { bold: true, color: theme.primary, fontSize: 14 } },
            { text: `${item.theory}\n\n`, options: { fontSize: 13, color: theme.textDark } },
            { text: item.note ? `⚠️ Lưu ý: ${item.note}` : 'Nắm vững định nghĩa để vận dụng chính xác vào phần bài tập thực hành.' },
          ],
          {
            x: 1.1,
            y: 2.2,
            w: 11.13,
            h: 4.3,
            fontFace: 'Arial',
            valign: 'top',
          }
        );
      }
    });
  }

  // =========================================================================
  // HOẠT ĐỘNG 3: LUYỆN TẬP & THỰC HÀNH (PRACTICE EXERCISES)
  // =========================================================================
  const act3 = (plan.activities || []).find((a) => /luyện tập|thực hành|bài tập/i.test(a.name || '')) || (plan.activities || [])[2];

  if (act3) {
    const exercises = extractExercises(act3, plan.appendix?.worksheetContent);

    exercises.forEach((ex, exIdx) => {
      const slideP = pptx.addSlide();
      slideP.background = { color: theme.bgLight };
      addHeaderToSlide(
        slideP,
        `HOẠT ĐỘNG 3: LUYỆN TẬP • BÀI TẬP ${exIdx + 1}/${exercises.length}`,
        ex.title.toUpperCase()
      );
      addFooterToSlide(slideP);

      // Left Box: Đề bài & Câu hỏi
      slideP.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: 1.35,
        w: 5.7,
        h: 5.4,
        rectRadius: 0.12,
        fill: { color: theme.cardBg },
        line: { color: 'CBD5E1', width: 1.5 },
        shadow: { type: 'outer', color: '64748B', blur: 3, offset: 1.5, angle: 90, opacity: 0.08 },
      });

      slideP.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: 1.35,
        w: 5.7,
        h: 0.6,
        rectRadius: 0.1,
        fill: { color: theme.primary },
      });

      slideP.addText('📝 ĐỀ BÀI / CÂU HỎI THỰC HÀNH', {
        x: 1.0,
        y: 1.35,
        w: 5.3,
        h: 0.6,
        fontSize: 12.5,
        fontFace: 'Arial',
        color: theme.white,
        bold: true,
        valign: 'middle',
      });

      slideP.addText(
        [
          { text: 'Nhiệm vụ học tập:\n', options: { bold: true, color: theme.primary, fontSize: 13 } },
          { text: `${ex.problem}\n\n`, options: { fontSize: ex.problem.length > 250 ? 11.5 : 12.5, color: theme.textDark } },
          { text: 'Yêu cầu: ', options: { bold: true, color: theme.accent, fontSize: 12 } },
          { text: 'Học sinh độc lập suy nghĩ hoặc thảo luận cặp đôi để tìm lời giải.', options: { fontSize: 11.5, color: theme.textMuted } },
        ],
        {
          x: 1.05,
          y: 2.1,
          w: 5.2,
          h: 4.4,
          fontFace: 'Arial',
          valign: 'top',
        }
      );

      // Right Box: Hướng dẫn giải & Đáp án mẫu
      slideP.addShape(pptx.ShapeType.roundRect, {
        x: 6.83,
        y: 1.35,
        w: 5.7,
        h: 5.4,
        rectRadius: 0.12,
        fill: { color: theme.cardBg },
        line: { color: 'CBD5E1', width: 1.5 },
        shadow: { type: 'outer', color: '64748B', blur: 3, offset: 1.5, angle: 90, opacity: 0.08 },
      });

      slideP.addShape(pptx.ShapeType.roundRect, {
        x: 6.83,
        y: 1.35,
        w: 5.7,
        h: 0.6,
        rectRadius: 0.1,
        fill: { color: theme.secondary },
      });

      slideP.addText('💡 HƯỚNG DẪN GIẢI & ĐÁP ÁN', {
        x: 7.03,
        y: 1.35,
        w: 5.3,
        h: 0.6,
        fontSize: 12.5,
        fontFace: 'Arial',
        color: theme.white,
        bold: true,
        valign: 'middle',
      });

      slideP.addText(
        [
          { text: 'Lời giải chi tiết & Chuẩn hóa:\n', options: { bold: true, color: theme.secondary, fontSize: 13 } },
          { text: `${ex.solution}\n\n`, options: { fontSize: ex.solution.length > 250 ? 11.5 : 12.5, color: theme.textDark } },
          { text: '✓ Nhận xét: ', options: { bold: true, color: theme.primary, fontSize: 12 } },
          { text: 'Đối chiếu kết quả, sửa lỗi sai nếu có và ghi chép vào vở bài tập.', options: { fontSize: 11.5, color: theme.textMuted } },
        ],
        {
          x: 7.08,
          y: 2.1,
          w: 5.2,
          h: 4.4,
          fontFace: 'Arial',
          valign: 'top',
        }
      );
    });
  }

  // =========================================================================
  // HOẠT ĐỘNG 4: VẬN DỤNG & MỞ RỘNG (APPLICATION)
  // =========================================================================
  const act4 = (plan.activities || []).find((a) => /vận dụng|mở rộng|chế tạo|dự án/i.test(a.name || '')) || (plan.activities || [])[3];

  if (act4) {
    const slideApp = pptx.addSlide();
    slideApp.background = { color: theme.bgLight };
    addHeaderToSlide(
      slideApp,
      'HOẠT ĐỘNG 4: VẬN DỤNG • LIÊN HỆ THỰC TIỄN',
      cleanPptxText(act4.name || 'VẬN DỤNG KIẾN THỨC VÀO ĐỜI SỐNG').toUpperCase()
    );
    addFooterToSlide(slideApp);

    // Left Box: Tình huống đời sống
    slideApp.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 1.35,
      w: 5.7,
      h: 5.4,
      rectRadius: 0.12,
      fill: { color: theme.cardBg },
      line: { color: 'CBD5E1', width: 1.5 },
      shadow: { type: 'outer', color: '64748B', blur: 3, offset: 1.5, angle: 90, opacity: 0.08 },
    });

    slideApp.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 1.35,
      w: 5.7,
      h: 0.6,
      rectRadius: 0.1,
      fill: { color: theme.primary },
    });

    slideApp.addText('🌍 TÌNH HUỐNG THỰC TẾ / DỰ ÁN', {
      x: 1.0,
      y: 1.35,
      w: 5.3,
      h: 0.6,
      fontSize: 12.5,
      fontFace: 'Arial',
      color: theme.white,
      bold: true,
      valign: 'middle',
    });

    const appContent = cleanPptxText(
      act4.content || act4.step1?.teacherAction || 'Áp dụng kiến thức bài học để giải quyết vấn đề trong học tập và đời sống hàng ngày.'
    );

    slideApp.addText(
      [
        { text: 'Bài toán thực tế:\n', options: { bold: true, color: theme.primary, fontSize: 13 } },
        { text: `${appContent}\n\n`, options: { fontSize: 12, color: theme.textDark } },
      ],
      {
        x: 1.05,
        y: 2.1,
        w: 5.2,
        h: 4.4,
        fontFace: 'Arial',
        valign: 'top',
      }
    );

    // Right Box: Định hướng giải quyết & Mở rộng
    slideApp.addShape(pptx.ShapeType.roundRect, {
      x: 6.83,
      y: 1.35,
      w: 5.7,
      h: 5.4,
      rectRadius: 0.12,
      fill: { color: theme.cardBg },
      line: { color: 'CBD5E1', width: 1.5 },
      shadow: { type: 'outer', color: '64748B', blur: 3, offset: 1.5, angle: 90, opacity: 0.08 },
    });

    slideApp.addShape(pptx.ShapeType.roundRect, {
      x: 6.83,
      y: 1.35,
      w: 5.7,
      h: 0.6,
      rectRadius: 0.1,
      fill: { color: theme.secondary },
    });

    slideApp.addText('🚀 ĐỊNH HƯỚNG THỰC HIỆN', {
      x: 7.03,
      y: 1.35,
      w: 5.3,
      h: 0.6,
      fontSize: 12.5,
      fontFace: 'Arial',
      color: theme.white,
      bold: true,
      valign: 'middle',
    });

    const appProduct = cleanPptxText(
      act4.step4?.productExpected || act4.productSummary || 'Học sinh trình bày giải pháp sáng tạo, kết nối bài học với các tình huống thực tế xung quanh.'
    );

    slideApp.addText(
      [
        { text: 'Gợi ý phương án thực hiện:\n', options: { bold: true, color: theme.secondary, fontSize: 13 } },
        { text: `${appProduct}\n\n`, options: { fontSize: 12, color: theme.textDark } },
        { text: '🌱 Giá trị bài học: ', options: { bold: true, color: theme.accent, fontSize: 12.5 } },
        { text: 'Kiến thức chỉ thực sự có giá trị khi được vận dụng để làm cho cuộc sống tốt đẹp hơn!', options: { italic: true, fontSize: 12, color: theme.textDark } },
      ],
      {
        x: 7.08,
        y: 2.1,
        w: 5.2,
        h: 4.4,
        fontFace: 'Arial',
        valign: 'top',
      }
    );
  }

  // =========================================================================
  // SLIDE: TỔNG KẾT & TÓM TẮT CHI TIẾT BÀI HỌC (DETAILED LESSON SUMMARY)
  // =========================================================================
  const summary = extractLessonSummary(plan);
  const slideSummary = pptx.addSlide();
  slideSummary.background = { color: theme.bgLight };
  addHeaderToSlide(slideSummary, 'TỔNG KẾT • HỆ THỐNG HÓA KIẾN THỨC', 'SƠ ĐỒ TÓM TẮT TRỌNG TÂM BÀI HỌC');
  addFooterToSlide(slideSummary);

  const colWidth = 3.71;
  const colGap = 0.3;
  const colY = 1.35;
  const colH = 4.15;

  const summaryCards = [
    {
      title: summary.pillar1Title,
      items: summary.pillar1Content,
      color: theme.primary,
      x: 0.8,
    },
    {
      title: summary.pillar2Title,
      items: summary.pillar2Content,
      color: theme.secondary,
      x: 0.8 + colWidth + colGap,
    },
    {
      title: summary.pillar3Title,
      items: summary.pillar3Content,
      color: theme.accent,
      x: 0.8 + (colWidth + colGap) * 2,
    },
  ];

  summaryCards.forEach((card) => {
    // Card Box
    slideSummary.addShape(pptx.ShapeType.roundRect, {
      x: card.x,
      y: colY,
      w: colWidth,
      h: colH,
      rectRadius: 0.12,
      fill: { color: theme.cardBg },
      line: { color: 'CBD5E1', width: 1.5 },
      shadow: { type: 'outer', color: '64748B', blur: 3, offset: 1.5, angle: 90, opacity: 0.08 },
    });

    // Card Header Bar
    slideSummary.addShape(pptx.ShapeType.roundRect, {
      x: card.x,
      y: colY,
      w: colWidth,
      h: 0.6,
      rectRadius: 0.1,
      fill: { color: card.color },
    });

    slideSummary.addText(card.title, {
      x: card.x + 0.15,
      y: colY,
      w: colWidth - 0.3,
      h: 0.6,
      fontSize: 12,
      fontFace: 'Arial',
      color: theme.white,
      bold: true,
      valign: 'middle',
    });

    // Bullets inside card
    const bulletRuns = card.items.map((it) => ({
      text: `${it}\n\n`,
      options: {
        bullet: { type: 'bullet', code: '2713' },
        fontSize: 11.5,
        color: theme.textDark,
      },
    }));

    slideSummary.addText(bulletRuns as any, {
      x: card.x + 0.2,
      y: colY + 0.75,
      w: colWidth - 0.4,
      h: colH - 0.9,
      fontFace: 'Arial',
      valign: 'top',
    });
  });

  // Bottom Takeaway Banner
  slideSummary.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 5.65,
    w: 11.73,
    h: 1.1,
    rectRadius: 0.12,
    fill: { color: theme.tagBg },
    line: { color: theme.accent, width: 1.5 },
  });

  slideSummary.addText(
    [
      { text: '⭐ KHẮC SÂU GHI NHỚ: ', options: { bold: true, color: theme.tagText, fontSize: 13 } },
      { text: summary.coreTakeaway, options: { bold: true, color: theme.textDark, fontSize: 12.5 } },
    ],
    {
      x: 1.1,
      y: 5.65,
      w: 11.13,
      h: 1.1,
      fontFace: 'Arial',
      valign: 'middle',
    }
  );

  // =========================================================================
  // SLIDE: HƯỚNG DẪN TỰ HỌC & DẶN DÒ VỀ NHÀ
  // =========================================================================
  const slideHomework = pptx.addSlide();
  slideHomework.background = { color: theme.bgLight };
  addHeaderToSlide(slideHomework, 'DẶN DÒ • HƯỚNG DẪN TỰ HỌC VỀ NHÀ', 'NHIỆM VỤ CỦA HỌC SINH SAU TIẾT HỌC');
  addFooterToSlide(slideHomework);

  // Box 1: Ôn tập bài học
  slideHomework.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.35,
    w: 5.7,
    h: 5.4,
    rectRadius: 0.12,
    fill: { color: theme.cardBg },
    line: { color: 'CBD5E1', width: 1.5 },
    shadow: { type: 'outer', color: '64748B', blur: 3, offset: 1.5, angle: 90, opacity: 0.08 },
  });

  slideHomework.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.35,
    w: 5.7,
    h: 0.6,
    rectRadius: 0.1,
    fill: { color: theme.primary },
  });

  slideHomework.addText('📚 ÔN TẬP VÀ CỦNG CỐ LÝ THUYẾT', {
    x: 1.0,
    y: 1.35,
    w: 5.3,
    h: 0.6,
    fontSize: 12.5,
    fontFace: 'Arial',
    color: theme.white,
    bold: true,
    valign: 'middle',
  });

  slideHomework.addText(
    [
      { text: '1. Nắm chắc kiến thức bài học:\n', options: { bold: true, color: theme.primary, fontSize: 13 } },
      { text: '   - Đọc kỹ lại toàn bộ nội dung lý thuyết trong Sách giáo khoa và vở ghi chép.\n   - Học thuộc các định nghĩa, quy tắc, công thức tính toán cốt lõi.\n\n', options: { fontSize: 12, color: theme.textDark } },
      { text: '2. Tự tóm tắt kiến thức:\n', options: { bold: true, color: theme.primary, fontSize: 13 } },
      { text: '   - Vẽ lại sơ đồ tư duy (mindmap) ngắn gọn về các nội dung chính đã học.\n   - Ghi chú lại những câu hỏi hoặc phần còn vướng mắc để trao đổi cùng thầy cô.', options: { fontSize: 12, color: theme.textDark } },
    ],
    {
      x: 1.05,
      y: 2.1,
      w: 5.2,
      h: 4.4,
      fontFace: 'Arial',
      valign: 'top',
    }
  );

  // Box 2: Bài tập về nhà & Chuẩn bị bài mới
  slideHomework.addShape(pptx.ShapeType.roundRect, {
    x: 6.83,
    y: 1.35,
    w: 5.7,
    h: 5.4,
    rectRadius: 0.12,
    fill: { color: theme.cardBg },
    line: { color: 'CBD5E1', width: 1.5 },
    shadow: { type: 'outer', color: '64748B', blur: 3, offset: 1.5, angle: 90, opacity: 0.08 },
  });

  slideHomework.addShape(pptx.ShapeType.roundRect, {
    x: 6.83,
    y: 1.35,
    w: 5.7,
    h: 0.6,
    rectRadius: 0.1,
    fill: { color: theme.secondary },
  });

  slideHomework.addText('✍️ BÀI TẬP & CHUẨN BỊ BÀI TIẾP THEO', {
    x: 7.03,
    y: 1.35,
    w: 5.3,
    h: 0.6,
    fontSize: 12.5,
    fontFace: 'Arial',
    color: theme.white,
    bold: true,
    valign: 'middle',
  });

  const assignmentText = cleanPptxText(
    plan.appendix?.assignmentPrompt || 'Hoàn thành các bài tập trong SGK và Sách bài tập theo hướng dẫn.'
  );

  slideHomework.addText(
    [
      { text: '1. Hoàn thành bài tập về nhà:\n', options: { bold: true, color: theme.secondary, fontSize: 13 } },
      { text: `   - ${assignmentText}\n   - Hoàn thành phiếu học tập và câu hỏi rèn luyện.\n\n`, options: { fontSize: 12, color: theme.textDark } },
      { text: '2. Chuẩn bị cho tiết học tới:\n', options: { bold: true, color: theme.secondary, fontSize: 13 } },
      { text: '   - Đọc trước bài tiếp theo trong SGK.\n   - Mang đầy đủ sách vở, đồ dùng học tập và tài liệu học tập theo quy định.', options: { fontSize: 12, color: theme.textDark } },
    ],
    {
      x: 7.08,
      y: 2.1,
      w: 5.2,
      h: 4.4,
      fontFace: 'Arial',
      valign: 'top',
    }
  );

  // =========================================================================
  // SLIDE CUỐI: KẾT THÚC (THANK YOU SLIDE)
  // =========================================================================
  const slideEnd = pptx.addSlide();
  slideEnd.background = { color: theme.primary };

  slideEnd.addShape(pptx.ShapeType.rect, {
    x: 1.5,
    y: 1.2,
    w: 10.33,
    h: 5.1,
    fill: { color: 'FFFFFF' },
    line: { color: theme.accent, width: 2 },
    shadow: { type: 'outer', color: '000000', blur: 6, offset: 3, angle: 90, opacity: 0.2 },
  });

  slideEnd.addText('CHÚC CÁC EM HỌC TỐT!', {
    x: 1.5,
    y: 2.1,
    w: 10.33,
    h: 1.1,
    fontSize: 34,
    fontFace: 'Arial',
    color: theme.primary,
    bold: true,
    align: 'center',
    valign: 'middle',
  });

  slideEnd.addText('Cảm ơn Quý Thầy Cô và các em Học sinh đã chú ý theo dõi!', {
    x: 1.5,
    y: 3.3,
    w: 10.33,
    h: 0.8,
    fontSize: 16.5,
    fontFace: 'Arial',
    color: theme.textDark,
    align: 'center',
    valign: 'middle',
  });

  slideEnd.addShape(pptx.ShapeType.roundRect, {
    x: 4.66,
    y: 4.5,
    w: 4.0,
    h: 0.5,
    rectRadius: 0.1,
    fill: { color: theme.tagBg },
    line: { color: theme.accent, width: 1 },
  });

  slideEnd.addText(`TIẾT HỌC KẾT THÚC`, {
    x: 4.66,
    y: 4.5,
    w: 4.0,
    h: 0.5,
    fontSize: 12,
    fontFace: 'Arial',
    color: theme.tagText,
    bold: true,
    align: 'center',
    valign: 'middle',
  });

  // Export to Blob and Save
  const fileName = formatPptxFileName(plan);
  const blob = (await pptx.write({ outputType: 'blob' })) as Blob;
  return await savePptxBlob(blob, fileName);
}
