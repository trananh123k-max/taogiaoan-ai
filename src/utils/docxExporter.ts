import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ImageRun,
  convertInchesToTwip,
  VerticalAlign,
  Math as DocxMath,
} from 'docx';
import fileSaver from 'file-saver';
const saveAs = (fileSaver as any)?.saveAs || fileSaver;
import { LessonPlanOutput, ImageSlot, StepDetail, MathFormulaFormatType } from '../types';
import { formatPreschoolActivities, formatPreschoolMusicActivities, parseActivityPairs, detectPreschoolDomain, sanitizeStandardActivity, isPreschoolNew8Activity, stripPreschoolCodes } from './preschoolUtils';
import { latexToDocxMath, splitTextAndMath } from './latexToDocxMath';

// Global state for current math formula export format (default: 'word_equation' - Phương án 2)
let globalMathFormulaFormat: MathFormulaFormatType = 'word_equation';

/**
 * Converts a Base64 string to a Uint8Array for docx ImageRun
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const cleanItem = (text: string) => {
  if (!text) return '';
  return text
    .replace(/^[-•*]\s*/, '')
    .replace(/\*+/g, '')
    .replace(/\[\s*Vị trí ảnh[^\]]*\]/gi, '')
    .replace(/\[\s*Ảnh minh họa[^\]]*\]/gi, '')
    .trim();
};

function formatPeriodSequence(periods: number, targetDetail?: string): string {
  if (targetDetail && targetDetail.trim().length > 0) {
    return targetDetail.trim();
  }
  if (!periods || periods <= 1) return '1';
  return Array.from({ length: periods }, (_, i) => i + 1).join('+');
}

export function formatMathPeriodHeader(periods: number, targetDetail?: string): string {
  if (targetDetail && targetDetail.trim().length > 0) {
    const td = targetDetail.trim();
    if (/^tiết/i.test(td)) return td;
    return `Tiết ${td}`;
  }
  if (!periods || periods <= 1) return 'Tiết 01';
  if (periods === 2) return 'Tiết 01 + 02';
  return 'Tiết ' + Array.from({ length: periods }, (_, i) => String(i + 1).padStart(2, '0')).join(' + ');
}

export function parseMathLessonHeader(lessonTitle: string): { chapter?: string; lessonTitle: string } {
  const cleanTitle = (lessonTitle || '').trim();
  const chapterRegex = /^\s*(chương\s+[IVXLCDM0-9]+[^\-\:\.\n]*[:\.\-]?\s*[^\-\:\n]+)\s*[\-\:\.\n]+\s*(bài\s+\d+.*)$/i;
  const match = cleanTitle.match(chapterRegex);
  if (match) {
    return {
      chapter: match[1].trim(),
      lessonTitle: match[2].trim(),
    };
  }
  return { lessonTitle: cleanTitle };
}

/**
 * Formats standard friendly filename for Word export:
 * e.g. "Tiết 1 Tham gia tìm hiểu về hiện tượng bắt nạt học đường (HĐTN-HN - Chào cờ 9).docx"
 * or "Bài 1 Thế giới kĩ thuật số (Tin học 9).docx"
 */
export function formatDocxFileName(plan: {
  lessonTitle?: string;
  subject?: string;
  grade?: string;
  subBranch?: string;
  [key: string]: any;
}): string {
  let title = (plan.lessonTitle || 'Kế hoạch bài dạy').trim();
  
  // Replace invalid filename characters (: / \ * ? " < > |) with space
  title = title.replace(/[:\/\\*?"<>|]/g, ' ');
  // Replace underscores and multiple spaces with a single space
  title = title.replace(/[_\s]+/g, ' ').trim();

  // Extract grade number/name: "Lớp 9" -> "9", "Khối 10" -> "10", "9" -> "9"
  const rawGrade = (plan.grade || '').trim();
  const gradeClean = rawGrade.replace(/^(lớp|khối)\s*/i, '').trim();

  const rawSubject = (plan.subject || '').trim();
  const isPreschool = (plan as any).schoolLevel === 'Mầm non';
  const isHDTN = /hoạt động trải nghiệm|hđtn|hdtn/i.test(rawSubject) ||
                 /sinh hoạt dưới cờ|sinh hoạt lớp|chào cờ/i.test(title);

  let formattedSubject = rawSubject;
  if (isHDTN) {
    let branch = '';
    const fullText = (title + ' ' + rawSubject + ' ' + (plan.subBranch || '')).toLowerCase();
    
    if (fullText.includes('dưới cờ') || fullText.includes('chào cờ') || fullText.includes('shdc')) {
      branch = 'Chào cờ';
    } else if (fullText.includes('sinh hoạt lớp') || fullText.includes('shl') || fullText.includes('sh lớp')) {
      branch = 'Sinh hoạt lớp';
    } else if (fullText.includes('chủ đề') || fullText.includes('theo chủ đề')) {
      branch = 'Chủ đề';
    } else {
      // Default sub-branch for HĐTN-HN
      branch = 'Chào cờ';
    }

    formattedSubject = branch ? `HĐTN-HN - ${branch}` : 'HĐTN-HN';
  } else {
    // Clean up long common names if needed
    formattedSubject = formattedSubject
      .replace(/^Giáo dục công dân\s*(\(GDCD\))?$/i, 'GDCD')
      .replace(/^Giáo dục thể chất\s*(\(GDTC\))?$/i, 'GDTC')
      .replace(/^Giáo dục quốc phòng và an ninh\s*(\(GDQP-AN\))?$/i, 'GDQP-AN')
      .replace(/^Lịch sử và Địa lí\s*(\(LS&ĐL\))?$/i, 'LS&ĐL')
      .replace(/\s*\([^)]*\)$/, '') // remove trailing parentheses if any
      .trim();
  }

  let tag = '';
  if (formattedSubject && gradeClean) {
    tag = `${formattedSubject} ${gradeClean}`;
  } else if (formattedSubject) {
    tag = formattedSubject;
  } else if (gradeClean) {
    tag = `Lớp ${gradeClean}`;
  }

  if (tag && !title.toLowerCase().includes(tag.toLowerCase())) {
    return `${title} (${tag}).docx`;
  }
  
  return `${title}.docx`;
}

/**
 * Parses markdown bold (**text**), italics, and cleans stray asterisks into DOCX TextRuns or DocxMath equations.
 * Supports:
 * - Option 2 ('word_equation'): Converts $...$, $$...$$, \(...\), \[...\] into native Word Equation (OMML)
 * - Option 1 ('mathtype_latex'): Leaves LaTeX tags intact for MathType Alt+\ conversion
 */
function parseMarkdownRuns(
  text: string,
  fontName: string,
  colorHex?: string,
  size: number = 28,
  overrideFormat?: MathFormulaFormatType
): (TextRun | DocxMath)[] {
  if (!text) return [];

  const format = overrideFormat || globalMathFormulaFormat || 'word_equation';

  // Option 2 (Word Equation): Convert inline and block LaTeX formulas to native docx Math
  if (format === 'word_equation') {
    const chunks = splitTextAndMath(text);
    if (chunks.some(c => c.type === 'math')) {
      const allRuns: (TextRun | DocxMath)[] = [];
      for (const chunk of chunks) {
        if (chunk.type === 'math') {
          allRuns.push(latexToDocxMath(chunk.content));
        } else if (chunk.content) {
          allRuns.push(...parseMarkdownRuns(chunk.content, fontName, colorHex, size, 'mathtype_latex'));
        }
      }
      return allRuns;
    }
  }

  // Clean bullet asterisks or dots at start
  const cleaned = text.replace(/^[*•]\s*/, '').trim();

  // Check if this entire line is a Roman numeral or numbered heading (e.g. "I. THÔNG TIN VÀ DỮ LIỆU:", "1. Thấy gì? Biết gì ?", "1. Thế giới kĩ thuật số")
  const isNumberedHeading = /^\s*(?:[IVXLCDM]+\.|\d+\.|\b[a-e]\))\s+[A-ZÀ-Ỵ0-9\?]/i.test(cleaned) || /^[IVXLCDM]+\.\s+/i.test(cleaned);

  // Split by markdown bold (**...**)
  const boldParts = cleaned.split(/(\*\*.*?\*\*)/g);
  const runs: (TextRun | DocxMath)[] = [];

  for (const part of boldParts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const boldContent = part.slice(2, -2).replace(/\*+/g, '');
      runs.push(
        new TextRun({
          text: boldContent,
          bold: true,
          font: fontName,
          size,
          color: colorHex || '000000',
        })
      );
    } else {
      // Check for italic (*...* or _..._)
      const italicParts = part.split(/(\*.*?\*|_.*?_)/g);
      for (const ipart of italicParts) {
        if (!ipart) continue;
        if ((ipart.startsWith('*') && ipart.endsWith('*') && ipart.length >= 2) ||
            (ipart.startsWith('_') && ipart.endsWith('_') && ipart.length >= 2)) {
          runs.push(
            new TextRun({
              text: ipart.slice(1, -1).replace(/\*+/g, ''),
              italics: true,
              font: fontName,
              size,
              color: colorHex || '000000',
            })
          );
        } else {
          const sanitized = ipart.replace(/\*+/g, '');
          if (sanitized) {
            runs.push(
              new TextRun({
                text: sanitized,
                bold: isNumberedHeading ? true : undefined,
                font: fontName,
                size,
                color: colorHex || '000000',
              })
            );
          }
        }
      }
    }
  }

  return runs.length > 0
    ? runs
    : [new TextRun({ text: cleaned.replace(/\*+/g, ''), bold: isNumberedHeading ? true : undefined, font: fontName, size, color: colorHex || '000000' })];
}

/**
 * Creates a standard paragraph starting with dash (-) for official Vietnamese document formatting.
 * Standardized indentation: dash starts flush with the standard left margin, wrapped lines indent 284 twips.
 */
function createDashListItem(
  text: string,
  fontName: string,
  indentTwips: number = 284,
  colorHex?: string,
  fontSize: number = 28
): Paragraph {
  const clean = cleanItem(text);
  const runs = parseMarkdownRuns(`- ${clean}`, fontName, colorHex, fontSize);
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 30, after: 30 },
    indent: { left: indentTwips, hanging: indentTwips },
    children: runs,
  });
}

/**
 * Creates a formatted item for General Competencies with bold standard titles
 * (Năng lực tự chủ và tự học:, Năng lực giao tiếp và hợp tác:, Năng lực giải quyết vấn đề và sáng tạo:)
 * Standardized indentation: aligns perfectly with all other dash bullet items across the document.
 */
function createGeneralCompetencyDocxItem(
  text: string,
  fontName: string,
  indentTwips: number = 284,
  fontSize: number = 28
): Paragraph {
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
    const descRuns = rest ? parseMarkdownRuns(rest, fontName, '000000', fontSize) : [];

    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 30, after: 30 },
      indent: { left: indentTwips, hanging: indentTwips },
      children: [
        new TextRun({ text: `- ${standardTitle} `, bold: true, font: fontName, size: fontSize }),
        ...descRuns,
      ],
    });
  }

  const runs = parseMarkdownRuns(`- ${clean}`, fontName, '000000', fontSize);
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 30, after: 30 },
    indent: { left: indentTwips, hanging: indentTwips },
    children: runs,
  });
}

/**
 * Formats Subject Competencies (Năng lực đặc thù / Năng lực Tin học):
 * Standard GDPT 2018 Tin học format:
 * Năng lực A (NLa): [Tên năng lực / Biểu hiện]
 * Năng lực B (NLb): [Tên năng lực / Biểu hiện]
 * Năng lực C (NLc): [Tên năng lực / Biểu hiện]
 * Năng lực D (NLd): [Tên năng lực / Biểu hiện]
 * Năng lực E (NLe): [Tên năng lực / Biểu hiện]
 * Standardized indentation: aligns perfectly with all other dash bullet items across the document.
 */
function createSubjectCompetencyDocxItem(
  text: string,
  fontName: string,
  indentTwips: number = 284,
  fontSize: number = 28
): Paragraph {
  const clean = text.replace(/^[-•*]\s*/, '').trim();

  // Pattern 1: Starts with Năng lực [A-E] (NL[a-e]):
  const stdMatch = clean.match(/^(Năng lực\s+[A-E]\s*\((?:NL[a-e]|NLA|NLB|NLC|NLD|NLE)\))[:\s–-]*(.*)$/i);
  if (stdMatch) {
    const prefix = stdMatch[1].trim() + ':';
    const rest = stdMatch[2]?.trim() || '';
    const descRuns = rest ? parseMarkdownRuns(rest, fontName, '000000', fontSize) : [];
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 30, after: 30 },
      indent: { left: indentTwips, hanging: indentTwips },
      children: [
        new TextRun({ text: `- ${prefix} `, bold: true, font: fontName, size: fontSize }),
        ...descRuns,
      ],
    });
  }

  // Pattern 2: Legacy format containing (NLa), (NLb), (NLc), (NLd), (NLe) anywhere in the title
  const legacyMatch = clean.match(/^(?:[-•*]\s*)?(.*?)\s*\((NLa|NLb|NLc|NLd|NLe)\)[:\s–-]*(.*)$/i);
  if (legacyMatch) {
    const code = legacyMatch[2].toLowerCase();
    const letter = code.charAt(2).toUpperCase(); // 'A', 'B', 'C', 'D', 'E'
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

    const descRuns = fullText ? parseMarkdownRuns(fullText, fontName, '000000', fontSize) : [];
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 30, after: 30 },
      indent: { left: indentTwips, hanging: indentTwips },
      children: [
        new TextRun({ text: `- ${standardPrefix} `, bold: true, font: fontName, size: fontSize }),
        ...descRuns,
      ],
    });
  }

  // Pattern 3: General "Tên năng lực: Mô tả" (e.g. Năng lực toán học:, Năng lực tư duy:)
  const generalMatch = clean.match(/^(Năng lực\s+[^:]+)[:\s–-]+(.*)$/i);
  if (generalMatch) {
    const prefix = generalMatch[1].trim() + ':';
    const rest = generalMatch[2]?.trim() || '';
    const descRuns = rest ? parseMarkdownRuns(rest, fontName, '000000', fontSize) : [];
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 30, after: 30 },
      indent: { left: indentTwips, hanging: indentTwips },
      children: [
        new TextRun({ text: `- ${prefix} `, bold: true, font: fontName, size: fontSize }),
        ...descRuns,
      ],
    });
  }

  // Default fallback
  const runs = parseMarkdownRuns(`- ${clean}`, fontName, '000000', fontSize);
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 30, after: 30 },
    indent: { left: indentTwips, hanging: indentTwips },
    children: runs,
  });
}

/**
 * Saves a Blob by prompting the user with the native OS "Save As" (Lưu tệp dưới dạng)
 * dialog to pick their desired directory/folder and file name.
 * Falls back to standard file-saver download if showSaveFilePicker is not supported.
 */
export async function saveFileWithPickerOrFallback(blob: Blob, defaultFileName: string): Promise<boolean> {
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
            description: 'Tài liệu Microsoft Word (.docx)',
            accept: {
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
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
        // User intentionally clicked "Cancel" in the Save As dialog
        return false;
      }
      // Silently proceed to standard download fallback without warning
    }
  }

  // Fallback for browsers / iframe environments without File System Access API
  saveAs(blob, defaultFileName);
  return true;
}

/**
 * Exports the structured lesson plan into a standard DOCX file
 * with clean 2-column table, preserved images, standard dash (-) bullets, and ink-friendly white headers.
 */
export async function exportLessonPlanToDocx(
  plan: LessonPlanOutput,
  imageSlots: ImageSlot[] = [],
  tableLayout: string = 'two_column',
  mathFormulaFormat: MathFormulaFormatType = (plan.mathFormulaFormat || 'word_equation')
): Promise<boolean> {
  globalMathFormulaFormat = mathFormulaFormat;
  const slotMap = new Map<string, ImageSlot>();
  imageSlots.forEach(slot => {
    slotMap.set(slot.slotTag.trim(), slot);
  });

  const isPreschool = (plan as any).schoolLevel === 'Mầm non';
  const isHDTN = (plan.subject || '').toLowerCase().includes('hoạt động trải nghiệm') ||
                 (plan.subject || '').toLowerCase().includes('hđtn') ||
                 (plan.lessonTitle || '').toLowerCase().includes('sinh hoạt dưới cờ') ||
                 (plan.lessonTitle || '').toLowerCase().includes('sinh hoạt lớp');

  const fontName = 'Times New Roman';
  const primaryColor = '000000';

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: fontName,
            size: 28, // 14pt
            color: '000000',
          },
          paragraph: {
            spacing: { line: 260, before: 0, after: 20 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 2.0 cm
              bottom: 1134, // 2.0 cm
              left: 1417, // 2.5 cm
              right: 850, // 1.5 cm
            },
          },
        },

        children: isPreschool 
          ? buildPreschoolDocxElements(plan, slotMap, fontName, primaryColor)
          : buildStandardDocxElements(plan, slotMap, fontName, primaryColor, isHDTN, isPreschool, tableLayout)
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = formatDocxFileName(plan);
  return await saveFileWithPickerOrFallback(blob, fileName);
}

function createSectionHeading(text: string, fontName: string, colorHex: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 100, after: 30 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28, // 14pt
        font: fontName,
        color: colorHex,
      }),
    ],
  });
}

function createSubHeading(text: string, fontName: string): Paragraph {
  return new Paragraph({
    spacing: { before: 50, after: 20 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28, // 14pt
        font: fontName,
      }),
    ],
  });
}

function createSubSubHeading(text: string, fontName: string, colorHex?: string): Paragraph {
  return new Paragraph({
    spacing: { before: 30, after: 15 },
    children: [
      new TextRun({
        text,
        bold: true,
        italics: true,
        size: 28, // 14pt
        font: fontName,
        color: colorHex || '000000',
      }),
    ],
  });
}

function buildActivitiesSection(
  activities: LessonPlanOutput['activities'],
  slotMap: Map<string, ImageSlot>,
  fontName: string,
  periods?: number,
  isPreschool: boolean = false,
  tableLayout: string = 'two_column'
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  const processedActivities = isPreschool ? (activities || []) : (activities || []).map((act, idx) => sanitizeStandardActivity(act, idx));

  processedActivities.forEach(act => {
    // Multi-period clear separation header
    if (periods && periods >= 2) {
      if (act.index === 1) {
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 140, after: 60 },
            children: [
              new TextRun({
                text: '[TIẾT 1] KHỞI ĐỘNG VÀ HÌNH THÀNH KIẾN THỨC MỚI',
                bold: true,
                size: 28,
                font: fontName,
                color: '003366',
              }),
            ],
          })
        );
      } else if (act.index === 3) {
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 60 },
            children: [
              new TextRun({
                text: '[TIẾT 2] LUYỆN TẬP VÀ VẬN DỤNG',
                bold: true,
                size: 28,
                font: fontName,
                color: '003366',
              }),
            ],
          })
        );
      }
    }

    // Activity Title (WITHOUT specific duration string as requested)
    const actNameDisplay = act.name.replace(/\[TIẾT\s*\d+\]\s*/i, '');
    elements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 80, after: 25 },
        children: [
          new TextRun({
            text: actNameDisplay.toUpperCase(),
            bold: true,
            size: 28, // 14pt
            font: fontName,
          }),
        ],
      })
    );

    if (tableLayout === 'math_4_column') {
      const activityTable = createMath4ColumnPedagogicalTable(act, slotMap, fontName);
      elements.push(activityTable);
    } else {
      // Goal, Content info (Omit c) Sản phẩm and d) Tổ chức thực hiện when using the 2-column table with 'Hoạt động của GV và HS' and 'Sản phẩm')
      if (!isPreschool) {
        elements.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 15, after: 15 },
            children: [
              new TextRun({ text: 'a) Mục tiêu: ', bold: true, font: fontName }),
              ...parseMarkdownRuns(act.objective || '', fontName),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 15, after: 30 },
            keepNext: true,
            children: [
              new TextRun({ text: 'b) Nội dung: ', bold: true, font: fontName }),
              ...parseMarkdownRuns(act.content || '', fontName),
            ],
          })
        );
      }
      
      const activityTable = createTwoColumnPedagogicalTable(act, slotMap, fontName, isPreschool);
      elements.push(activityTable);
    }
  });

  return elements;
}


function createMath4ColumnPedagogicalTable(
  act: LessonPlanOutput['activities'][0],
  slotMap: Map<string, ImageSlot>,
  fontName: string
): Table {
  const borderConfig = {
    style: BorderStyle.SINGLE,
    size: 6,
    color: '000000',
  };

  const steps = [
    { key: 'step1', detail: act.step1, label: 'Bước 1: Chuyển giao nhiệm vụ' },
    { key: 'step2', detail: act.step2, label: 'Bước 2: Thực hiện nhiệm vụ' },
    { key: 'step3', detail: act.step3, label: 'Bước 3: Báo cáo thảo luận' },
    { key: 'step4', detail: act.step4, label: 'Bước 4: Kết luận, nhận định' },
  ];

  // Build Column 1: Activities (GV/HS)
  const actParas: Paragraph[] = [];
  actParas.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({ text: 'Mục tiêu: ', bold: true, font: fontName }),
        ...parseMarkdownRuns(stripNlsIntegrationTags(act.objective || ''), fontName),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({ text: 'Nội dung: ', bold: true, font: fontName }),
        ...parseMarkdownRuns(stripNlsIntegrationTags(act.content || ''), fontName),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({ text: 'Tổ chức thực hiện:', bold: true, font: fontName }),
      ],
    })
  );

  steps.forEach(({ detail, label }) => {
    if (!detail) return;
    
    actParas.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 60, after: 40 },
        children: [
          new TextRun({ text: detail.title || label, bold: true, font: fontName }),
        ],
      })
    );

    if (detail.teacherAction) {
      if (!(/^(-|\*)?\s*(GV|Giáo viên)\b/i.test(detail.teacherAction.trim())) && !(/^\*\s*(GV|HS)/i.test(detail.title || ''))) {
        actParas.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({ text: '- Giáo viên: ', bold: true, font: fontName }),
            ],
          })
        );
      }
      actParas.push(...parseTextAndEmbedImages(stripNlsIntegrationTags(detail.teacherAction), slotMap, fontName, 26, undefined, true));
    }

    if (detail.studentAction) {
      if (!(/^(-|\*)?\s*(HS|Học sinh)\b/i.test(detail.studentAction.trim())) && !(/^\*\s*(GV|HS)/i.test(detail.title || ''))) {
        actParas.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({ text: '- Học sinh: ', bold: true, font: fontName }),
            ],
          })
        );
      }
      actParas.push(...parseTextAndEmbedImages(stripNlsIntegrationTags(detail.studentAction), slotMap, fontName, 26, undefined, true));
    }
  });

  // Build Column 2: Expected Products
  const prodParas: Paragraph[] = [];
  prodParas.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'Dự kiến sản phẩm:', bold: true, italics: true, font: fontName }),
      ],
    })
  );
  
  // Extract products
  const rawResults: string[] = [];
  steps.forEach(({ detail }) => {
    if (detail && detail.productExpected && detail.productExpected.trim()) {
      let cleaned = repairAnswerLineBreaks(detail.productExpected);
      cleaned = dedupeAnswers(cleaned)
        .split('\n')
        .map((line) => {
          let l = line.trim();
          if (!l) return '';
          l = l.replace(/\[\s*Vị trí ảnh[^\]]*\]/gi, '').trim();
          if (/^(\*|-)?\s*bước\s*\d+\s*[:\-–\.]?\s*$/i.test(l)) {
            return '';
          }
          l = l.replace(/^(\*|-)?\s*bước\s*\d+\s*[:\-–\.]\s*/i, '');
          return l;
        })
        .filter((line) => line.trim().length > 0)
        .join('\n');
        
      if (cleaned.trim() && !rawResults.includes(cleaned.trim())) {
        rawResults.push(cleaned.trim());
      }
    }
  });
  
  const hasRichKnowledge = rawResults.some(r => /(?:^|\s)\d+\.\s+[A-ZÀ-Ỵ]/m.test(r) || r.length > 70);
  const prodResults = hasRichKnowledge
    ? rawResults.filter(r => {
        const isGeneric = /^(học sinh|hs|các nhóm|nội dung|kết quả)\s+(tiếp nhận|nắm rõ|hiểu rõ|lắng nghe|ổn định|bắt đầu|chuẩn bị|báo cáo|thực hiện|ghi chép|ghi vở|thảo luận)\b/i.test(r.trim()) && r.length < 90 && !/(?:^|\s)\d+\.\s+[A-ZÀ-Ỵ]/m.test(r);
        return !isGeneric;
      })
    : rawResults;
    
  if (prodResults.length === 0 && act.productSummary && act.productSummary.trim()) {
    let cleaned = repairAnswerLineBreaks(act.productSummary);
    cleaned = dedupeAnswers(cleaned).replace(/\[\s*Vị trí ảnh[^\]]*\]/gi, '').trim();
    prodResults.push(cleaned);
  }
  
  if (prodResults.length === 0) {
    prodResults.push('Học sinh hoàn thành câu hỏi, bài tập và ghi chép nội dung kiến thức trọng tâm vào vở.');
  }

  prodResults.forEach(content => {
    let expandedText = repairAnswerLineBreaks(content);
    expandedText = expandedText.replace(/(?<!\b(?:Câu|Bài|Mục|Hình|Ví dụ|Bảng|Bước|Phần|Hoạt động|Nhiệm vụ|Tiết|Tuần|HĐ|NV)\s*)(?<=[.?!;:]|[a-zà-ỹA-ZÀ-Ỵ0-9])\s+([IVXLCDM]+\.\s+[A-ZÀ-Ỵ0-9])/g, '\n\n$1');
    expandedText = expandedText.replace(/(?<!\b(?:Câu|Bài|Mục|Hình|Ví dụ|Bảng|Bước|Phần|Hoạt động|Nhiệm vụ|Tiết|Tuần|HĐ|NV)\s*)(?<=[.?!;:]|[a-zà-ỹA-ZÀ-Ỵ0-9])\s+(\d+\.\s+[A-ZÀ-Ỵ0-9\?])/g, '\n\n$1');
    expandedText = expandedText.replace(/(?<!\b(?:Câu|Bài|Mục|Hình|Ví dụ|Bảng|Bước|Phần|Hoạt động|Nhiệm vụ|Tiết|Tuần|HĐ|NV)\s*)(?<=[.?!;:]|[a-zà-ỹA-ZÀ-Ỵ0-9])\s+(Câu\s+\d+[\.:\)])/gi, '\n\n$1');
    expandedText = expandedText.replace(/([.?!;])\s+(- |\* |• )/g, '$1\n$2');
    expandedText = expandedText.replace(/([.?!;])\s+([a-e]\)\s+)/g, '$1\n$2');
    
    expandedText = expandedText.split('\n').map((line) => {
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
    }).join('\n');

    expandedText = expandedText.split('\n').map((line) => {
      let trimmed = line.trim();
      if (!trimmed) return '';
      trimmed = trimmed.replace(/\[\s*Vị trí ảnh[^\]]*\]/gi, '').trim();
      if (!trimmed || trimmed === '-' || trimmed === '•' || trimmed === '*') return '';
      if (/^\{\{IMAGE_SLOT_\d+\}\}$/i.test(trimmed) || /^\s*(?:[IVXLCDM]+\.|\d+\.|\b[a-e]\)|\bNhiệm vụ\s+\d+:|\bMục\s+\d+:|\bCâu\s+\d+[:\.])/i.test(trimmed) || /^[IVXLCDM]+\.\s+/i.test(trimmed) || /\[Tích hợp [^\]]+\]/i.test(trimmed) || /\((?:NLS|AI)\s+[0-9a-zA-Z\.]+\)/i.test(trimmed)) {
        return trimmed;
      }
      if (/^[•*]\s*/.test(trimmed)) {
        return '- ' + trimmed.replace(/^[•*]\s*/, '');
      }
      return trimmed;
    }).filter(Boolean).join('\n');

    prodParas.push(...parseTextAndEmbedImages(expandedText, slotMap, fontName));
  });
  
  // NLS logic
  const nlsParas: Paragraph[] = [];
  const nlsList = (act.nlsFocus || '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  nlsList.forEach(item => {
    nlsParas.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: item, bold: true, color: 'C00000', font: fontName }),
        ],
      })
    );
  });
  
  // AI logic
  const aiParas: Paragraph[] = [];
  const aiList = (act.aiFocus || '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  aiList.forEach(item => {
    aiParas.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: item, bold: true, color: '0070C0', font: fontName }),
        ],
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig,
      insideVertical: borderConfig, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            shading: { fill: '002060' },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            borders: { top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'HOẠT ĐỘNG CỦA GIÁO VIÊN VÀ HỌC SINH', bold: true, color: 'FFFFFF', font: fontName }),
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '(GV làm gì, HS làm gì...)', color: 'FFFFFF', font: fontName }),
                ]
              })
            ],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            shading: { fill: '002060' },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            borders: { top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'SẢN PHẨM DỰ KIẾN', bold: true, color: 'FFFFFF', font: fontName }),
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '(YCCĐ của hoạt động với HS)', color: 'FFFFFF', font: fontName }),
                ]
              })
            ],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { fill: '002060' },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            borders: { top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Năng', bold: true, color: 'FFFFFF', font: fontName }),
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'lực số', bold: true, color: 'FFFFFF', font: fontName }),
                ]
              })
            ],
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { fill: '002060' },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            borders: { top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Giáo', bold: true, color: 'FFFFFF', font: fontName }),
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'dục AI', bold: true, color: 'FFFFFF', font: fontName }),
                ]
              })
            ],
          }),
        ],
      }),
      new TableRow({
        cantSplit: false,
        children: [
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            borders: { top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig },
            children: actParas,
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            borders: { top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig },
            children: prodParas,
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            borders: { top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig },
            children: nlsParas,
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            borders: { top: borderConfig, bottom: borderConfig, left: borderConfig, right: borderConfig },
            children: aiParas,
          }),
        ],
      })
    ]
  });
}

function createTwoColumnPedagogicalTable(
  act: LessonPlanOutput['activities'][0],
  slotMap: Map<string, ImageSlot>,
  fontName: string,
  isPreschool: boolean = false
): Table {
  const borderConfig = {
    style: BorderStyle.SINGLE,
    size: 6,
    color: '000000',
  };

  const steps = [act.step1, act.step2, act.step3, act.step4];
  const leftColParagraphs: Paragraph[] = [];
  const rightColParagraphs: Paragraph[] = [];

  steps.forEach((step, idx) => {
    if (!step || (isPreschool && !step.teacherAction && !step.studentAction)) return;
    const stepNumber = idx + 1;
    const stepTitle = getStepStandardTitle(stepNumber);
    const stepLeftParas = createLeftColumnContent(stepTitle, step, slotMap, fontName, idx > 0, isPreschool);
    leftColParagraphs.push(...stepLeftParas);

    if (isPreschool) {
      if (step.studentAction && step.studentAction.trim()) {
        const stepRightParas = createRightColumnContent(step.studentAction, slotMap, fontName);
        rightColParagraphs.push(...stepRightParas);
      }
    } else {
      if (step.productExpected && step.productExpected.trim()) {
        const cleaned = cleanProductContent(step.productExpected);
        if (cleaned.trim()) {
          const stepRightParas = createRightColumnContent(cleaned, slotMap, fontName);
          rightColParagraphs.push(...stepRightParas);
        }
      }
    }
  });

  if (!isPreschool && rightColParagraphs.length === 0 && act.productSummary && act.productSummary.trim()) {
    const cleaned = cleanProductContent(act.productSummary);
    rightColParagraphs.push(...createRightColumnContent(cleaned, slotMap, fontName));
  }

  const rows: TableRow[] = [
    // Header Row (Clean White Background, No Ink Waste)
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 120, bottom: 120, left: 180, right: 180 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: isPreschool ? 'Hoạt động của giáo viên' : 'Hoạt động của GV và HS',
                  bold: true,
                  size: 28,
                  font: fontName,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 120, bottom: 120, left: 180, right: 180 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: isPreschool ? 'Hoạt động của trẻ' : 'Sản phẩm',
                  bold: true,
                  size: 28,
                  font: fontName,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    // Single Continuous Content Row containing all 4 steps without dividing borders - cantSplit: false prevents empty headers / unwanted spacing
    new TableRow({
      cantSplit: false,
      children: [
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          margins: { top: 140, bottom: 140, left: 180, right: 180 },
          children: leftColParagraphs,
        }),
        new TableCell({
          width: { size: 40, type: WidthType.PERCENTAGE },
          margins: { top: 140, bottom: 140, left: 180, right: 180 },
          children: rightColParagraphs.length > 0 ? rightColParagraphs : [new Paragraph({ children: [new TextRun({ text: '', font: fontName, size: 28 })] })],
        }),
      ],
    }),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: {
      top: 140,
      bottom: 140,
      left: 180,
      right: 180,
    },
    borders: {
      top: borderConfig,
      bottom: borderConfig,
      left: borderConfig,
      right: borderConfig,
      insideHorizontal: borderConfig,
      insideVertical: borderConfig,
    },
    rows,
  });
}

function getStepStandardTitle(stepNumber: number): string {
  switch (stepNumber) {
    case 1:
      return 'Bước 1: Chuyển giao nhiệm vụ học tập';
    case 2:
      return 'Bước 2: Thực hiện nhiệm vụ học tập';
    case 3:
      return 'Bước 3: Báo cáo kết quả và thảo luận';
    case 4:
      return 'Bước 4: Kết luận, nhận định';
    default:
      return `Bước ${stepNumber}`;
  }
}

function createLeftColumnContent(
  stepTitle: string,
  step: StepDetail,
  slotMap: Map<string, ImageSlot>,
  fontName: string,
  isSubsequentStep: boolean = false,
  isPreschool: boolean = false
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Step Heading
  if (!isPreschool) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: isSubsequentStep ? 60 : 20, after: 15 },
        children: [
          new TextRun({
            text: stepTitle,
            bold: true,
            size: 28,
            font: fontName,
          }),
        ],
      })
    );
  }

  // Teacher Action
  if (step.teacherAction && step.teacherAction.trim()) {
    const hideTeacherPrefix = /^(-|\*)?\s*(GV|Giáo viên)\b/i.test(step.teacherAction.trim()) || /^\*\s*(GV|HS)/i.test(stepTitle);
    if (!hideTeacherPrefix) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 15, after: 10 },
          children: [
            new TextRun({ text: '- Giáo viên: ', bold: true, font: fontName, size: 28 }),
          ],
        })
      );
    }

    const teacherLines = formatDashLines(step.teacherAction);
    teacherLines.forEach(line => {
      if (!line.trim()) return;
      const itemParagraphs = parseTextAndEmbedImages(line, slotMap, fontName, 28);
      paragraphs.push(...itemParagraphs);
    });
  }

  // Student Action
  if (!isPreschool && step.studentAction && step.studentAction.trim()) {
    const hideStudentPrefix = /^(-|\*)?\s*(HS|Học sinh)\b/i.test(step.studentAction.trim()) || /^\*\s*(GV|HS)/i.test(stepTitle);
    if (!hideStudentPrefix) {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 15, after: 10 },
          children: [
            new TextRun({ text: '- Học sinh: ', bold: true, font: fontName, size: 28 }),
          ],
        })
      );
    }

    const studentLines = formatDashLines(step.studentAction);
    studentLines.forEach(line => {
      if (!line.trim()) return;
      const itemParagraphs = parseTextAndEmbedImages(line, slotMap, fontName, 28);
      paragraphs.push(...itemParagraphs);
    });
  }

  return paragraphs;
}

function createRightColumnContent(
  productText: string,
  slotMap: Map<string, ImageSlot>,
  fontName: string
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const cleaned = cleanProductContent(productText);
  const lines = formatDashLines(cleaned || productText);

  lines.forEach(line => {
    if (!line.trim()) return;
    const itemParagraphs = parseTextAndEmbedImages(line, slotMap, fontName, 28);
    paragraphs.push(...itemParagraphs);
  });

  return paragraphs.length > 0
    ? paragraphs
    : [new Paragraph({ children: [new TextRun({ text: productText.replace(/\*+/g, ''), font: fontName, size: 28 })] })];
}

export function repairAnswerLineBreaks(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  let cleaned = text;

  // 1. Join "Câu X. Đáp án" or "Câu X. Đáp án:" + newline + "C." or "C" or "- C." -> "Câu X. Đáp án C."
  cleaned = cleaned.replace(/(\b(?:Câu|Bài|Mục|Hình|Ví dụ|Bảng|Bước|Phần|Hoạt động|Nhiệm vụ|Tiết|Tuần|HĐ|NV)\s*\d*[\.:\)]?\s*(?:Đáp\s*án|đáp\s*án)?\s*[:\-–]?)\s*[\r\n]+\s*(?:[-•*]\s*)?([A-D0-9][\.:\)]?)/gi, '$1 $2');

  // 2. Join "Đáp án" or "Đáp án:" or "Đáp án là" + newline + "C." or "C" or "- C."
  cleaned = cleaned.replace(/(\b(?:Đáp\s*án|đáp\s*án)\s*(?:là)?\s*[:\-–]?)\s*[\r\n]+\s*(?:[-•*]\s*)?([A-D0-9][\.:\)]?)/gi, '$1 $2');

  // 3. Join "Câu X." + newline + "Đáp án C." or "C."
  cleaned = cleaned.replace(/(\bCâu\s*\d+[\.:\)]?)\s*[\r\n]+\s*(?:[-•*]\s*)?((?:Đáp\s*án|đáp\s*án)?\s*[:\-–]?\s*[A-D0-9][\.:\)]?)/gi, '$1 $2');

  // 4. Join "Câu" + newline + "1. Đáp án B."
  cleaned = cleaned.replace(/\bCâu\s*[\r\n]+\s*(\d+[\.:\)]\s*(?:Đáp\s*án\s*)?[A-D0-9])/gi, 'Câu $1');

  // 5. Join "Bài" / "Mục" / "Bước" + newline + "1"
  cleaned = cleaned.replace(/\b(Bài|Mục|Hình|Ví dụ|Bảng|Bước|Phần|Hoạt động|Nhiệm vụ|Tiết|Tuần|HĐ|NV)\s*[\r\n]+\s*(\d+)/gi, '$1 $2');

  // 6. Fix "Đáp" + newline + "án"
  cleaned = cleaned.replace(/\b(Đáp)\s*[\r\n]+\s*(án\b)/gi, '$1 $2');

  return cleaned;
}

export function dedupeAnswers(text: string): string {
  if (!text || typeof text !== 'string') return text || '';

  const lines = text.split('\n');
  const seenFullAnswers = new Set<number>();
  
  for (const line of lines) {
    const trimmed = line.trim();
    const fullMatch = trimmed.match(/^[-•*]?\s*Câu\s*(\d+)[\.:\)]?\s*(?:Đáp\s*án\s*)?[:\-–]?\s*[A-D][\.:\)]?$/i);
    if (fullMatch) {
      const qNum = parseInt(fullMatch[1], 10);
      seenFullAnswers.add(qNum);
    }
  }

  const resultLines: string[] = [];
  const seenLines = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      resultLines.push('');
      continue;
    }
    
    // Check if short form answer like "1. B" or "1. B." or "- 1. B"
    const shortMatch = trimmed.match(/^[-•*]?\s*(\d+)[\.:\)]\s*([A-D])[\.:\)]?$/i);
    if (shortMatch) {
      const qNum = parseInt(shortMatch[1], 10);
      if (seenFullAnswers.has(qNum)) {
        continue; // Skip short form duplicate when full form already exists
      }
    }

    // Deduplicate exact duplicate lines for answer statements
    const normalizedKey = trimmed.toLowerCase();
    if (normalizedKey && (normalizedKey.startsWith('câu ') || /^\d+[\.:\)]\s*[a-d]/.test(normalizedKey))) {
      if (seenLines.has(normalizedKey)) {
        continue;
      }
      seenLines.add(normalizedKey);
    }

    resultLines.push(line);
  }

  return resultLines.join('\n');
}

export function separateNlsBlocks(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  let res = text.trim();

  // 1. Separate [Tích hợp NLS] / [Tích hợp AI] onto its own line preceded by empty line if glued
  res = res.replace(/(?<!\n)\s*(\[Tích hợp [^\]]+\])/gi, '\n\n$1');
  // 2. Put text following [Tích hợp ...] on the next line
  res = res.replace(/(\[Tích hợp [^\]]+\])[ \t]*([^\n]+)/gi, '$1\n$2');

  // 3. If line has inline (NLS ...) or (AI ...), e.g. "Giao nhiệm vụ: ... (NLS 3.1.TC1a)." without [Tích hợp ...]
  const lines = res.split('\n');
  const newLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const nlsMatch = l.match(/\s*\(\s*NLS\s+([0-9a-zA-Z\.]+)\s*\)\.?/i);
    const aiMatch = l.match(/\s*\(\s*AI\s+([0-9a-zA-Z\.]+)\s*\)\.?/i);
    const hasNlsOrAiTag = /\[Tích hợp [^\]]+\]/i.test(l) || (i > 0 && /\[Tích hợp [^\]]+\]/i.test(lines[i - 1]));
    if (nlsMatch && !hasNlsOrAiTag) {
      const cleanLine = l.replace(/\s*\(\s*NLS\s+[0-9a-zA-Z\.]+\s*\)\.?/i, '.').replace(/\.\.+$/, '.').trim();
      if (cleanLine) newLines.push(cleanLine);
      newLines.push('');
      newLines.push('[Tích hợp NLS]');
      newLines.push(`HS thực hiện thao tác trên thiết bị số/MTCT hoặc tra cứu số liệu (NLS ${nlsMatch[1]}).`);
    } else if (aiMatch && !hasNlsOrAiTag) {
      const cleanLine = l.replace(/\s*\(\s*AI\s+[0-9a-zA-Z\.]+\s*\)\.?/i, '.').replace(/\.\.+$/, '.').trim();
      if (cleanLine) newLines.push(cleanLine);
      newLines.push('');
      newLines.push('[Tích hợp AI]');
      newLines.push(`HS sử dụng công cụ AI hỗ trợ nhiệm vụ học tập (AI ${aiMatch[1]}).`);
    } else {
      newLines.push(l);
    }
  }
  return newLines.join('\n');
}

export function stripNlsIntegrationTags(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  
  // 1. Remove standalone lines with [Tích hợp ...] or [Tích hợp NLS] (with optional bullet like *, -, •)
  let lines = text.split('\n').filter(line => {
    const trimmed = line.trim();
    if (/^(\*|-|•)?\s*\[\s*Tích\s*hợp[^\]]*\]\s*$/i.test(trimmed)) {
      return false;
    }
    return true;
  });

  // 2. Remove inline [Tích hợp ...] tags if any remain within a line
  lines = lines.map(line => line.replace(/\[\s*Tích\s*hợp[^\]]*\]/gi, '').trim());

  // 3. Clean up excessive empty lines
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function formatHomeworkText(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  let formatted = text.trim();

  // 1. Separate 'a) ...', 'b) ...', 'c) ...' onto new lines
  formatted = formatted.replace(/(?<![\p{L}\p{N}_])([a-eA-E]\))(?=\s|[A-ZÀ-Ỵa-zà-ỹ:])/gu, '\n$1');

  // 2. Break lines before headers like "Nhiệm vụ về nhà:", "Hướng dẫn tự học:", "Đối với bài vừa học:", "Đối với bài học tiếp theo:", etc.
  formatted = formatted.replace(/(?<!\n)\s*([a-eA-E]\)\s*(?:Đối\s*với\s*)?Bài\s*(?:vừa\s*học|học\s*tiếp\s*theo|mới)|Nhiệm\s*vụ\s*về\s*nhà|Hướng\s*dẫn\s*tự\s*học|Chuẩn\s*bị\s*bài\s*mới|Bài\s*học\s*tiếp\s*theo)\s*[:\-–]?/gi, '\n$1:');

  // 3. Separate numbered tasks like "Nhiệm vụ 1:", "Nhiệm vụ 2:" only if glued after punctuation
  formatted = formatted.replace(/(?<=[:\?\.\!\;])\s*(Nhiệm\s*vụ\s*\d+[\.:\)]?)/gi, '\n$1');

  // 4. Separate "Xem trước nội dung...", "Đọc trước...", "Chuẩn bị...", "Làm bài tập..." if they follow punctuation without line break
  formatted = formatted.replace(/(?<=[\?\.\!])\s*(Xem\s*trước|Đọc\s*trước|Chuẩn\s*bị|Học\s*sinh\s*ôn|Làm\s*các\s*bài\s*tập)\b/gi, '\n- $1');

  // 5. Clean up lines and eliminate stray dashes
  const rawLines = formatted.split('\n');
  const cleanLines: string[] = [];

  for (const raw of rawLines) {
    let l = raw.trim();
    if (!l) continue;

    // Eliminate pure dashes, bullet-only lines e.g. "-", "- -", "•", "*"
    if (/^[-•*\s–—]+$/.test(l)) continue;

    // Clean multiple leading dashes
    l = l.replace(/^[-•*\s–—]+/, '- ');

    // Normalize duplicate "Nhiệm vụ"
    l = l.replace(/^-\s*Nhiệm\s*vụ\s*Nhiệm\s*vụ\s*/i, '- Nhiệm vụ ');
    l = l.replace(/^-\s*Nhiệm\s*vụ\s*(\d+)[\.:\)]?/i, '- Nhiệm vụ $1:');

    // Clean redundant dashes right after colon e.g. "Nhiệm vụ 3: - Đọc trước" -> "Nhiệm vụ 3: Đọc trước"
    l = l.replace(/:\s*[-•*–—]\s*/g, ': ');

    // Remove leading dash for section headers like "Hướng dẫn tự học:" or "a) Đối với bài vừa học:"
    if (/^-\s*(Hướng\s*dẫn\s*tự\s*học|Nhiệm\s*vụ\s*về\s*nhà|[a-eA-E]\)\s*[^:]+)\s*:/i.test(l)) {
      l = l.replace(/^-\s*/, '');
    }

    cleanLines.push(l);
  }

  return cleanLines.join('\n');
}

function formatDashLines(text: string): string[] {
  if (!text) return [];
  const separated = separateNlsBlocks(text);
  let expandedText = repairAnswerLineBreaks(separated);

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

  return expandedText.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    // If line is an image slot, a Roman numeral, numbered heading, [Tích hợp NLS], [Tích hợp AI], or NLS/AI indicator line, preserve as-is
    if (/^\{\{IMAGE_SLOT_\d+\}\}$/i.test(trimmed) || /^\s*(?:[IVXLCDM]+\.|\d+\.|\b[a-e]\)|\bNhiệm vụ\s+\d+:|\bMục\s+\d+:|\bCâu\s+\d+[:\.])/i.test(trimmed) || /^[IVXLCDM]+\.\s+/i.test(trimmed) || /\[Tích hợp [^\]]+\]/i.test(trimmed) || /\((?:NLS|AI)\s+[0-9a-zA-Z\.]+\)/i.test(trimmed)) {
      return trimmed;
    }
    if (/^[•*]\s*/.test(trimmed)) {
      return '- ' + trimmed.replace(/^[•*]\s*/, '');
    }
    return line;
  });
}

function cleanProductContent(text: string): string {
  if (!text) return '';
  const repaired = repairAnswerLineBreaks(text);
  const deduped = dedupeAnswers(repaired);
  return deduped
    .split('\n')
    .map((line) => {
      let l = line.trim();
      if (!l) return '';
      // Remove lines that are only "* Bước 1:", "Bước 1:" etc.
      if (/^(\*|-)?\s*bước\s*\d+\s*[:\-–\.]?\s*$/i.test(l)) {
        return '';
      }
      // Remove leading "* Bước 1: " or "Bước 1: "
      l = l.replace(/^(\*|-)?\s*bước\s*\d+\s*[:\-–\.]\s*/i, '');
      // Replace leading * with -
      l = l.replace(/^\*\s*/, '- ');
      return l;
    })
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

function createMultiLineTextParagraphs(text: string, fontName: string): Paragraph[] {
  if (!text) return [];
  const lines = text.split('\n');
  return lines
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const trimmed = line.trim();
      const isHeader =
        /^[a-z]\)\s+|^\d+\.\s+/i.test(trimmed) ||
        trimmed.endsWith(':') ||
        /^(PHIẾU HỌC TẬP|RUBRIC|NHIỆM VỤ|HƯỚNG DẪN)/i.test(trimmed);
      return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: isHeader ? 30 : 10, after: 15 },
        children: [
          new TextRun({
            text: line,
            bold: isHeader,
            font: fontName,
            size: 28, // 14pt
          }),
        ],
      });
    });
}

/**
 * Pre-processes and normalizes worksheet content to guarantee valid Markdown lines,
 * separation between sections, and clean table rows with delimiters.
 */
export function normalizeWorksheetMarkdown(raw: string): string {
  if (!raw) return '';
  let text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Handle literal escaped newlines "\n" if any
  text = text.replace(/\\n/g, '\n');

  // 1. Separate major headers / metadata ONLY if text precedes table header on same line without pipe
  text = text.replace(/^([^|\n]+)(\|\s*(?:STT|Nhiệm vụ|Câu hỏi|Bước|Nội dung)[\s|])/gim, '$1\n\n$2');
  text = text.replace(/\|\s*(PHẦN\s+\d+|###|##|#|Họ và tên|HỌ VÀ TÊN|BẢNG GỢI Ý|HƯỚNG DẪN)/gi, '|\n\n$1');
  text = text.replace(/(PHẦN\s+\d+[^:\n]*:[^\n.]+[\.\:])\s*(Họ và tên|Họ tên|Tên học sinh)/gi, '$1\n$2');
  text = text.replace(/(PHIẾU HỌC TẬP[^\n.]+[\.\:])\s*(Họ và tên|Họ tên|Tên học sinh)/gi, '$1\n$2');

  // 2. Separate inline table rows joined on same line (e.g. `| row 1 | | row 2 |`)
  text = text.replace(/(^\|[^\n]+\|)\s*(?=\|[^\n]+\|)/gim, '$1\n');

  // 3. Process line by line to ensure markdown tables have valid syntax, headers, and separators
  const lines = text.split('\n');
  const resultLines: string[] = [];
  let currentSection: 'student' | 'teacher' | 'other' = 'other';

  const defaultDots = '....................................................................................<br>....................................................................................<br>....................................................................................<br>....................................................................................';

  for (let idx = 0; idx < lines.length; idx++) {
    let line = lines[idx].trim();
    if (!line) {
      resultLines.push('');
      continue;
    }

    // Section detection
    if (/PHIẾU HỌC TẬP|DÀNH CHO HỌC SINH|PHẦN 1/i.test(line) && !/BẢNG GỢI Ý|GIÁO VIÊN/i.test(line)) {
      currentSection = 'student';
    } else if (/BẢNG GỢI Ý|HƯỚNG DẪN ĐÁNH GIÁ|DÀNH CHO GIÁO VIÊN|PHẦN 2/i.test(line)) {
      currentSection = 'teacher';
    }

    if (line.startsWith('|') && line.endsWith('|') && line.split('|').length >= 3) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      const headerStr = cells.join(' ').toLowerCase();
      const isHeader = /(stt|nhiệm vụ|câu hỏi|kết quả|gợi ý|đáp án|điểm)/i.test(headerStr);

      if (isHeader) {
        if (currentSection === 'student' || cells.length === 3) {
          line = '| STT | Nhiệm vụ / Câu hỏi học tập | Kết quả / Câu trả lời của học sinh |';
        } else if (currentSection === 'teacher' || cells.length >= 4) {
          line = '| STT | Nhiệm vụ / Câu hỏi học tập | Gợi ý đáp án / Yêu cầu cần đạt | Điểm / Đánh giá |';
        }
        resultLines.push(line);

        const nextLine = idx + 1 < lines.length ? lines[idx + 1].trim() : '';
        if (!/^\|?[\s\-:]+\|/.test(nextLine)) {
          const colCount = line.split('|').length - 2;
          resultLines.push('|' + Array(colCount).fill('---').join('|') + '|');
        }
        continue;
      }

      // Check if separator line (|---|---|...)
      if (/^\|?[\s\-:]+\|/.test(line)) {
        resultLines.push(line);
        continue;
      }

      // Data row processing
      if (currentSection === 'student') {
        let col1 = cells[0] || '1';
        let col2 = cells[1] || '';
        let col3 = cells[2] || '';

        if (!col2 && col3) {
          col2 = col3;
          col3 = '';
        }

        const dotsCount = (col3.match(/\./g) || []).length;
        if (dotsCount < 20 || !col3.includes('.')) {
          col3 = defaultDots;
        } else {
          const dotLines = col3.split(/<br\s*\/?>|\n/gi).map((l) => l.trim()).filter(Boolean);
          if (dotLines.length < 3) {
            col3 = defaultDots;
          }
        }

        line = `| ${col1} | ${col2} | ${col3} |`;
      } else if (currentSection === 'teacher') {
        let col1 = cells[0] || '1';
        let col2 = cells[1] || '';
        let col3 = cells[2] || '';
        let col4 = cells[3] || 'Đạt / 5.0 điểm';

        line = `| ${col1} | ${col2} | ${col3} | ${col4} |`;
      }
    }

    resultLines.push(line);
  }

  return resultLines.join('\n');
}

/**
 * Creates DOCX elements for worksheets with centered titles, student metadata lines,
 * and structured Markdown tables converted into real Word tables with single black borders.
 */
function createWorksheetDocxElements(
  text: string,
  fontName: string
): (Paragraph | Table)[] {
  if (!text) return [];

  const normalized = normalizeWorksheetMarkdown(text);
  const elements: (Paragraph | Table)[] = [];
  const lines = normalized.split('\n');
  let i = 0;

  const borderConfig = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: '000000',
  };

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 0. Skip horizontal rules (---, ***, ___, <hr>)
    if (trimmed === '---' || trimmed === '***' || trimmed === '___' || /^[-*_]{3,}$/.test(trimmed) || /^<hr\s*\/?>$/i.test(trimmed)) {
      i++;
      continue;
    }

    // 1. Detect Markdown Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length >= 3) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      const tableElement = createDocxTableFromMarkdown(tableLines, fontName, borderConfig);
      if (tableElement) {
        elements.push(tableElement);
        continue;
      }
    }

    // 2. Detect Main Title (PHẦN 1: PHIẾU HỌC TẬP, PHIẾU HƯỚNG DẪN, HƯỚNG DẪN THỰC HÀNH...)
    const isMainTitle =
      /^(?:#+\s*)?(?:PHẦN\s+\d+[:\.\-]?\s*)?(?:PHIẾU\s+HỌC\s+TẬP|PHIẾU\s+HƯỚNG\s+DẪN|HƯỚNG\s+DẪN\s+THỰC\s+HÀNH|BÀI\s+\d+|CHỦ\s+ĐỀ|NHIỆM\s+VỤ\s+THỰC\s+HÀNH)/i.test(
        trimmed
      ) ||
      /^PHẦN\s+\d+[:\.\-]?\s*(?:PHIẾU|BÀI|NỘI DUNG)/i.test(trimmed) ||
      /^#+\s+(PHIẾU|HƯỚNG DẪN|BÀI)/i.test(trimmed) ||
      (/^PHIẾU\s+/i.test(trimmed) && trimmed.length < 120);

    if (isMainTitle) {
      const cleanTitle = trimmed.replace(/^#+\s*/, '').replace(/\*+/g, '').replace(/<br\s*\/?>/gi, ' ');
      elements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 60, after: 20 },
          children: [
            new TextRun({
              text: cleanTitle.toUpperCase(),
              bold: true,
              size: 28, // 14pt
              font: fontName,
            }),
          ],
        })
      );
      i++;
      continue;
    }

    // 3. Detect Metadata (Họ và tên: ... Lớp: ... Nhóm: ...)
    const isMetadata =
      /^(họ và tên|họ tên|tên học sinh|tên nhóm|lớp|nhóm|thời gian|trường|ngày thực hiện)[:\s]/i.test(trimmed) ||
      ((trimmed.toLowerCase().includes('lớp') || trimmed.toLowerCase().includes('nhóm') || trimmed.toLowerCase().includes('tên')) && (trimmed.includes('...') || trimmed.includes('___')));

    if (isMetadata) {
      const cleanMeta = trimmed.replace(/\*+/g, '').replace(/<br\s*\/?>/gi, ' - ');
      elements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 15, after: 30 },
          children: [
            new TextRun({
              text: cleanMeta,
              italics: true,
              size: 26, // 13pt
              font: fontName,
            }),
          ],
        })
      );
      i++;
      continue;
    }

    // 4. Subheadings
    const isSubheading =
      /^(phần\s+[ivxabc]+|\d+\.|\b[a-e]\))\s+[A-ZÀ-Ỵ]/i.test(trimmed) ||
      /^#+\s+/.test(trimmed) ||
      (trimmed.endsWith(':') && trimmed.length < 100);

    if (isSubheading) {
      const cleanSub = trimmed.replace(/^#+\s*/, '').replace(/<br\s*\/?>/gi, ' ');
      elements.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 30, after: 15 },
          children: [
            new TextRun({
              text: cleanSub,
              bold: true,
              size: 28, // 14pt
              font: fontName,
            }),
          ],
        })
      );
      i++;
      continue;
    }

    // 5. Dash list item or regular paragraph (handling <br>)
    const cleanLine = trimmed.replace(/<br\s*\/?>/gi, '\n');
    const subParts = cleanLine.split('\n').map((s) => s.trim()).filter(Boolean);

    subParts.forEach((part) => {
      if (part.startsWith('-') || part.startsWith('*') || part.startsWith('•')) {
        elements.push(createDashListItem(part, fontName, 284, undefined, 28));
      } else {
        const runs = parseMarkdownRuns(part, fontName, undefined, 28);
        elements.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 10, after: 15 },
            children: runs,
          })
        );
      }
    });

    i++;
  }

  return elements;
}

function createDocxTableFromMarkdown(
  tableLines: string[],
  fontName: string,
  borderConfig: any
): Table | null {
  if (tableLines.length < 2) return null;

  // Header row
  const headerLine = tableLines[0];
  const headers = headerLine
    .split('|')
    .slice(1, -1)
    .map((h) => h.trim().replace(/\*+/g, ''));

  if (headers.length === 0) return null;

  // Separator row (line 1)
  let startRowIdx = 1;
  const alignments: ('left' | 'center' | 'right')[] = headers.map(() => 'left');

  if (tableLines.length > 1 && /^\|?[\s\-:]+\|/.test(tableLines[1])) {
    const sepParts = tableLines[1].split('|').slice(1, -1);
    sepParts.forEach((part, idx) => {
      const p = part.trim();
      if (p.startsWith(':') && p.endsWith(':')) {
        alignments[idx] = 'center';
      } else if (p.endsWith(':')) {
        alignments[idx] = 'right';
      } else {
        alignments[idx] = 'left';
      }
    });
    startRowIdx = 2;
  }

  // Calculate Column Width Percentages
  const numCols = headers.length;
  const colWidths: number[] = [];
  const firstColLower = headers[0].toLowerCase();
  const isFirstColIndex = firstColLower.includes('stt') || firstColLower.includes('tt') || firstColLower.includes('bước') || firstColLower.includes('câu');

  if (numCols === 1) {
    colWidths.push(100);
  } else if (numCols === 2) {
    if (isFirstColIndex) {
      colWidths.push(20, 80);
    } else {
      colWidths.push(35, 65);
    }
  } else if (numCols === 3) {
    if (isFirstColIndex) {
      colWidths.push(12, 44, 44);
    } else {
      colWidths.push(25, 45, 30);
    }
  } else if (numCols === 4) {
    if (isFirstColIndex) {
      colWidths.push(10, 30, 30, 30);
    } else {
      colWidths.push(28, 24, 24, 24);
    }
  } else {
    const avg = Math.floor(100 / numCols);
    for (let c = 0; c < numCols; c++) {
      colWidths.push(avg);
    }
  }

  const rows: TableRow[] = [];

  // Header Row (13pt for tables in Appendix)
  rows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map((h, colIdx) => {
        const cleanHeader = h.replace(/<br\s*\/?>/gi, ' ');
        return new TableCell({
          width: { size: colWidths[colIdx] || Math.floor(100 / numCols), type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 80, bottom: 80, left: 140, right: 140 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: cleanHeader,
                  bold: true,
                  font: fontName,
                  size: 26, // 13pt
                }),
              ],
            }),
          ],
        });
      }),
    })
  );

  // Data rows (13pt for tables in Appendix)
  for (let r = startRowIdx; r < tableLines.length; r++) {
    const line = tableLines[r];
    if (!line.includes('|')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim().replace(/^\*+|\*+$/g, ''));

    while (cells.length < numCols) cells.push('');

    rows.push(
      new TableRow({
        children: cells.slice(0, numCols).map((cellText, colIdx) => {
          const isShort = cellText.length <= 10 || /^\d+$/.test(cellText) || /^bước\s*\d+$/i.test(cellText);
          const align = alignments[colIdx] === 'center' || isShort || (colIdx === 0 && isFirstColIndex)
            ? AlignmentType.CENTER
            : AlignmentType.JUSTIFIED;

          // Clean out horizontal rules and split by <br> or \n
          const cleanedText = cellText.replace(/^[-*_]{3,}$/, '').trim();
          const subLines = cleanedText.split(/<br\s*\/?>|\n/gi).map((s) => s.trim()).filter(Boolean);

          const cellParagraphs = subLines.length > 0
            ? subLines.map((subLine, sIdx) => {
                const runs = parseMarkdownRuns(subLine, fontName, undefined, 26);
                return new Paragraph({
                  alignment: align,
                  spacing: { before: sIdx === 0 ? 30 : 15, after: sIdx === subLines.length - 1 ? 30 : 15 },
                  children: runs,
                });
              })
            : [
                new Paragraph({
                  alignment: align,
                  spacing: { before: 30, after: 30 },
                  children: [new TextRun({ text: '', font: fontName, size: 26 })],
                }),
              ];

          return new TableCell({
            width: { size: colWidths[colIdx] || Math.floor(100 / numCols), type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 140, right: 140 },
            children: cellParagraphs,
          });
        }),
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: {
      top: 80,
      bottom: 80,
      left: 140,
      right: 140,
    },
    borders: {
      top: borderConfig,
      bottom: borderConfig,
      left: borderConfig,
      right: borderConfig,
      insideHorizontal: borderConfig,
      insideVertical: borderConfig,
    },
    rows,
  });
}

function parseNlsRuns(text: string, fontName: string, fontSize: number = 28): TextRun[] {
  const runs: TextRun[] = [];
  const nlsOrAiRegex = /(\((?:NLS|AI)\s+[0-9a-zA-Z\.]+\)|\[(?:NLS|AI)\s+[0-9a-zA-Z\.]+\])/gi;
  const parts = text.split(nlsOrAiRegex);
  for (const part of parts) {
    if (!part) continue;
    if (nlsOrAiRegex.test(part)) {
      runs.push(
        new TextRun({
          text: part,
          bold: true,
          font: fontName,
          size: fontSize,
          color: 'FF0000',
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part,
          font: fontName,
          size: fontSize,
          color: 'FF0000',
        })
      );
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text, font: fontName, size: fontSize, color: 'FF0000' })];
}

/**
 * Parses text strings looking for {{IMAGE_SLOT_X}} tokens and embeds real ImageRun
 */
function parseTextAndEmbedImages(
  text: string,
  slotMap: Map<string, ImageSlot>,
  fontName: string,
  fontSize: number = 28,
  spacingAfter?: number,
  suppressNls: boolean = false
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const slotRegex = /\{\{(IMAGE_SLOT_\d+|IMAGESLOT\d*)\}\}/gi;
  const afterVal = spacingAfter !== undefined ? spacingAfter : 20;

  if (!slotRegex.test(text)) {
    const trimmed = text.trim();
    const isNlsOrAiHeader = /^(\*|-)?\s*\[Tích hợp[^\]]*\]/i.test(trimmed);
    if (isNlsOrAiHeader) {
      if (suppressNls) return [];
      const tagMatch = trimmed.match(/^(\*|-)?\s*(\[Tích hợp[^\]]*\])/i);
      const titleText = tagMatch ? tagMatch[2] : '[Tích hợp NLS]';
      const runs = [
        new TextRun({
          text: titleText,
          bold: true,
          font: fontName,
          size: fontSize,
          color: 'FF0000',
        }),
      ];
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 40, after: afterVal },
          children: runs,
        })
      );
      return paragraphs;
    }

    const hasNlsOrAiIndicator = /\((?:NLS|AI)\s+[0-9a-zA-Z\.]+\)/i.test(text) || /\[(?:NLS|AI)\s+[0-9a-zA-Z\.]+\]/i.test(text);

    let runs: (TextRun | DocxMath)[];
    if (hasNlsOrAiIndicator && !suppressNls) {
      runs = parseNlsRuns(text, fontName, fontSize);
    } else {
      runs = parseMarkdownRuns(text, fontName, undefined, fontSize);
    }

    const isHeading = /^\s*(?:[IVXLCDM]+\.|\d+\.|\b[a-e]\))\s+[A-ZÀ-Ỵ]/i.test(text) || /^[IVXLCDM]+\.\s+/i.test(text);
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: isHeading ? 80 : 20, after: isHeading ? 30 : afterVal },
        children: runs,
      })
    );
    return paragraphs;
  }

  // Reset regex index
  slotRegex.lastIndex = 0;
  const parts = text.split(/(\{\{(?:IMAGE_SLOT_\d+|IMAGESLOT\d*)\}\})/gi);

  for (const part of parts) {
    if (!part) continue;

    if (slotRegex.test(part)) {
      const slot = slotMap.get(part.trim());
      if (slot && slot.base64Data) {
        try {
          const imgBytes = base64ToUint8Array(slot.base64Data);
          paragraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 40 },
              children: [
                new ImageRun({
                  data: imgBytes,
                  transformation: {
                    width: slot.width || 320,
                    height: slot.height || 180,
                  },
                  type: (slot.mimeType.includes('png') ? 'png' : 'jpg') as any,
                } as any),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 80 },
              children: [
                new TextRun({
                  text: slot.caption || `${slot.name} (Tái nhúng từ file Word)`,
                  italics: true,
                  size: 22,
                  font: fontName,
                }),
              ],
            })
          );
        } catch (err) {
          console.warn('Could not embed image slot into docx:', err);
        }
      }
      // If no valid slot, simply omit placeholder (do not render broken placeholder)
    } else {
      const runs = parseMarkdownRuns(part, fontName, undefined, fontSize);
      if (runs.length > 0) {
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 20, after: 20 },
            children: runs,
          })
        );
      }
    }
  }

  return paragraphs;
}

function createCompetencyMatrixTable(
  matrix: LessonPlanOutput['competencyMatrix'],
  fontName: string
): Table {
  const borderConfig = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: '000000',
  };

  const nlsList = matrix?.nlsItems || [];
  const aiList = matrix?.aiItems || [];
  const hasNls = nlsList.length > 0;
  const hasAi = aiList.length > 0;

  const col4Header =
    hasNls && hasAi
      ? 'NĂNG LỰC SỐ & AI'
      : hasNls
      ? 'NĂNG LỰC SỐ'
      : 'ỨNG DỤNG AI & NĂNG LỰC';

  const rows: TableRow[] = [
    // Header Row (Clean White Background, BOLD & CENTERED)
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'TT', bold: true, size: 26, font: fontName }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 24, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'TÊN HOẠT ĐỘNG', bold: true, size: 26, font: fontName }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 38, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'TỔ CHỨC DẠY HỌC', bold: true, size: 26, font: fontName }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: col4Header, bold: true, size: 26, font: fontName }),
              ],
            }),
          ],
        }),
      ],
    }),
  ];

  let itemCounter = 1;

  // NLS Items
  if (hasNls) {
    nlsList.forEach((item) => {
      const actName = item.activityName || item.activityRef || `Hoạt động ${itemCounter}`;
      const teachingOrg = item.teachingOrganization || item.indicator || item.digitalToolUsed || '';
      const nlsCode = item.indicatorCode || '';
      const nlsDesc = item.competencyDescription || item.indicator || (item.domain ? `${item.domain}: ${item.component || ''}` : '');
      const fullDesc = nlsCode && !nlsDesc.startsWith(nlsCode) ? `${nlsCode}: ${nlsDesc}` : nlsDesc;

      rows.push(
        new TableRow({
          children: [
            new TableCell({
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${itemCounter++}`, bold: true, size: 26, font: fontName })],
                }),
              ],
            }),
            new TableCell({
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: actName, bold: true, size: 26, font: fontName })],
                }),
              ],
            }),
            new TableCell({
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.JUSTIFIED,
                  children: [new TextRun({ text: teachingOrg, size: 26, font: fontName })],
                }),
              ],
            }),
            new TableCell({
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.JUSTIFIED,
                  children: [new TextRun({ text: fullDesc, size: 26, font: fontName })],
                }),
              ],
            }),
          ],
        })
      );
    });
  }

  // AI Items
  if (hasAi) {
    aiList.forEach((item) => {
      const actName = item.activityName || item.activityRef || `Hoạt động ${itemCounter}`;
      const teachingOrg = item.teachingOrganization || item.indicator || item.digitalToolUsed || '';
      const aiCode = item.indicatorCode || '';
      const aiDesc = item.competencyDescription || item.indicator || (item.domain ? `${item.domain}: ${item.component || ''}` : '');
      const fullDesc = aiCode && !aiDesc.startsWith(aiCode) ? `${aiCode}: ${aiDesc}` : aiDesc;

      rows.push(
        new TableRow({
          children: [
            new TableCell({
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${itemCounter++}`, bold: true, size: 26, font: fontName })],
                }),
              ],
            }),
            new TableCell({
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: actName, bold: true, size: 26, font: fontName })],
                }),
              ],
            }),
            new TableCell({
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.JUSTIFIED,
                  children: [new TextRun({ text: teachingOrg, size: 26, font: fontName })],
                }),
              ],
            }),
            new TableCell({
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.JUSTIFIED,
                  children: [new TextRun({ text: fullDesc, size: 26, font: fontName })],
                }),
              ],
            }),
          ],
        })
      );
    });
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: {
      top: 100,
      bottom: 100,
      left: 160,
      right: 160,
    },
    borders: {
      top: borderConfig,
      bottom: borderConfig,
      left: borderConfig,
      right: borderConfig,
      insideHorizontal: borderConfig,
      insideVertical: borderConfig,
    },
    rows,
  });
}

function createHomeworkParagraphs(text: string, fontName: string): Paragraph[] {
  if (!text) return [];

  const formatted = formatHomeworkText(text);
  const lines = formatted.split('\n');

  return lines.map((line) => {
    const textRuns: TextRun[] = [];
    const match =
      line.match(/^([-•*]?\s*(?:[a-eA-E]\)|Hướng dẫn tự học|Nhiệm vụ về nhà|Bài học tiếp theo|Nhiệm vụ\s*\d*)[^:]*:)(.*)$/iu) ||
      line.match(/^([-•*]?\s*[a-eA-E]\)[^:]+:)(.*)$/);
    let remainingLine = line;

    if (match) {
      const [, boldPart, rest] = match;
      textRuns.push(new TextRun({ text: boldPart, font: fontName, size: 26, bold: true }));
      remainingLine = rest;
    }

    // Now process remainingLine to highlight 'Bài X: Name' and NL/AI codes
    const combinedRegex = /(['"]Bài\s+\d+[^'"]+['"])|(NL[a-eA-E]\d?|\(AI\))/g;
    let lastIndex = 0;
    
    let regexMatch;
    while ((regexMatch = combinedRegex.exec(remainingLine)) !== null) {
      if (regexMatch.index > lastIndex) {
        textRuns.push(new TextRun({ text: remainingLine.substring(lastIndex, regexMatch.index), font: fontName, size: 26 }));
      }
      
      if (regexMatch[1]) {
        // Lesson name
        textRuns.push(new TextRun({ text: regexMatch[1], font: fontName, size: 26, bold: true }));
      } else if (regexMatch[2]) {
        // NL/AI code
        textRuns.push(new TextRun({ text: regexMatch[2], font: fontName, size: 26, bold: true, color: '1d4ed8' })); // blue-700
      }
      
      lastIndex = regexMatch.index + regexMatch[0].length;
    }
    
    if (lastIndex < remainingLine.length) {
      textRuns.push(new TextRun({ text: remainingLine.substring(lastIndex), font: fontName, size: 26 }));
    }

    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 10, after: 15 },
      children: textRuns,
    });
  });
}


function buildStandardDocxElements(
  plan: LessonPlanOutput,
  slotMap: Map<string, ImageSlot>,
  fontName: string,
  primaryColor: string,
  isHDTN: boolean,
  isPreschool: boolean,
  tableLayout: string
): (Paragraph | Table)[] {
  const isMath = /toán|math/i.test(plan.subject || '') || /toán|math/i.test(plan.lessonTitle || '');
  const mathHeader = parseMathLessonHeader(plan.lessonTitle);
  const nlsColor = isMath ? 'FF0000' : '0066CC';

  return [
          // Document Header / Title
          ...(isMath
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40, after: 30 },
                  children: [
                    new TextRun({
                      text: formatMathPeriodHeader(plan.periods, (plan as any).targetPeriodDetail),
                      bold: true,
                      size: 28, // 14pt
                      font: fontName,
                    }),
                  ],
                }),
                ...(mathHeader.chapter
                  ? [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 30 },
                        children: [
                          new TextRun({
                            text: mathHeader.chapter.toUpperCase(),
                            bold: true,
                            size: 28, // 14pt
                            font: fontName,
                          }),
                        ],
                      }),
                    ]
                  : []),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 40 },
                  children: [
                    new TextRun({
                      text: `${mathHeader.lessonTitle.toUpperCase()}`,
                      bold: true,
                      size: 30, // 15pt
                      font: fontName,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 80 },
                  children: [
                    new TextRun({
                      text: `Thời gian thực hiện: ${String(plan.periods).padStart(2, '0')} tiết`,
                      bold: false,
                      italics: false,
                      size: 28, // 14pt
                      font: fontName,
                    }),
                  ],
                }),
              ]
            : [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40, after: 30 },
                  children: [
                    new TextRun({
                      text: 'KẾ HOẠCH BÀI DẠY (GIÁO ÁN)',
                      bold: true,
                      size: 28, // 14pt
                      font: fontName,
                      color: primaryColor,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 30 },
                  children: [
                    new TextRun({
                      text: formatPeriodSequence(plan.periods, (plan as any).targetPeriodDetail),
                      bold: true,
                      size: 28, // 14pt
                      font: fontName,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 40 },
                  children: [
                    new TextRun({
                      text: `${plan.lessonTitle.toUpperCase()}`,
                      bold: true,
                      size: 30, // 15pt
                      font: fontName,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 80 },
                  children: [
                    new TextRun({
                      text: (plan as any).targetPeriodDetail && (plan as any).lessonTotalPeriods && (plan as any).lessonTotalPeriods > plan.periods
                        ? `Thời lượng: ${plan.periods} tiết (${(plan as any).targetPeriodDetail} / Tổng số ${(plan as any).lessonTotalPeriods} tiết của bài)`
                        : (plan as any).targetPeriodDetail
                        ? `Thời lượng: ${plan.periods} tiết (${(plan as any).targetPeriodDetail})`
                        : `Thời lượng: ${plan.periods} tiết`,
                      bold: false,
                      italics: false,
                      size: 28, // 14pt
                      font: fontName,
                    }),
                  ],
                }),
              ]),

          // I. MỤC TIÊU (Standard CV 5512: Knowledge, Competencies, Qualities)
          createSectionHeading('I. MỤC TIÊU', fontName, primaryColor),
          
          // 1. Về kiến thức
          createSubHeading('1. Về kiến thức:', fontName),
          ...plan.objectives.knowledge.map(k => createDashListItem(k, fontName)),

          // 2. Về năng lực
          createSubHeading('2. Về năng lực:', fontName),
          createSubSubHeading('a) Năng lực chung:', fontName),
          ...plan.objectives.generalCompetencies.map(c => createGeneralCompetencyDocxItem(c, fontName)),

          createSubSubHeading('b) Năng lực đặc thù môn học:', fontName),
          ...plan.objectives.subjectCompetencies.map(c => createSubjectCompetencyDocxItem(c, fontName)),

          ...(plan.objectives.digitalCompetencies && plan.objectives.digitalCompetencies.length > 0
            ? [
                createSubSubHeading('c) Các Năng lực số (NLS) được phát triển:', fontName, nlsColor),
                ...plan.objectives.digitalCompetencies.map(c => createDashListItem(c, fontName, undefined, nlsColor)),
              ]
            : []),

          ...(plan.objectives.aiCompetencies && plan.objectives.aiCompetencies.length > 0
            ? [
                createSubSubHeading(
                  (plan.objectives.digitalCompetencies?.length || 0) > 0
                    ? 'd) Năng lực trí tuệ nhân tạo (AI):'
                    : 'c) Năng lực trí tuệ nhân tạo (AI):',
                  fontName,
                  '0066CC'
                ),
                ...plan.objectives.aiCompetencies.map(c => createDashListItem(c, fontName, undefined, '0066CC')),
              ]
            : []),

          ...(plan.objectives.stemCompetencies && plan.objectives.stemCompetencies.length > 0
            ? [
                createSubSubHeading(
                  (plan.objectives.digitalCompetencies?.length || 0) > 0 && (plan.objectives.aiCompetencies?.length || 0) > 0
                    ? 'e) Năng lực giáo dục STEM:'
                    : (plan.objectives.digitalCompetencies?.length || 0) > 0 || (plan.objectives.aiCompetencies?.length || 0) > 0
                    ? 'd) Năng lực giáo dục STEM:'
                    : 'c) Năng lực giáo dục STEM:',
                  fontName,
                  '0066CC'
                ),
                ...plan.objectives.stemCompetencies.map(c => createDashListItem(c, fontName, undefined, '0066CC')),
              ]
            : []),

          // 3. Về phẩm chất
          createSubHeading('3. Về phẩm chất:', fontName),
          ...plan.objectives.qualities.map(q => createDashListItem(q, fontName)),

          // II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
          createSectionHeading('II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU', fontName, primaryColor),
          createSubHeading('1. Giáo viên:', fontName),
          ...plan.equipment.teacher.map(e => createDashListItem(e, fontName)),

          createSubHeading('2. Học sinh:', fontName),
          ...plan.equipment.student.map(e => createDashListItem(e, fontName)),

          ...(plan.equipment.digitalAssets && plan.equipment.digitalAssets.length > 0
            ? [
                createSubHeading('3. Học liệu và thiết bị phụ trợ:', fontName),
                ...plan.equipment.digitalAssets.map(e => createDashListItem(e, fontName)),
              ]
            : []),

          ...(plan.equipment.stemMaterials && plan.equipment.stemMaterials.length > 0
            ? [
                createSubHeading('4. Thiết bị, dụng cụ và vật liệu thực hành STEM:', fontName),
                ...plan.equipment.stemMaterials.map(e => createDashListItem(e, fontName)),
              ]
            : []),

          // DEDICATED STEM INTEGRATION SECTION
          ...(plan.stemIntegration
            ? [
                createSectionHeading(`NỘI DUNG TÍCH HỢP GIÁO DỤC STEM: ${plan.stemIntegration.topicTitle.toUpperCase()}`, fontName, primaryColor),
                createSubHeading('1. Tên chủ đề STEM:', fontName),
                createDashListItem(plan.stemIntegration.topicTitle, fontName),
                ...(plan.stemIntegration.stemGoals && plan.stemIntegration.stemGoals.length > 0
                  ? [
                      createSubHeading('2. Mục tiêu giáo dục STEM (S-T-E-M):', fontName),
                      ...plan.stemIntegration.stemGoals.map(g => createDashListItem(g, fontName)),
                    ]
                  : []),
                ...(plan.stemIntegration.stemMaterials && plan.stemIntegration.stemMaterials.length > 0
                  ? [
                      createSubHeading('3. Dụng cụ và vật liệu chuẩn bị:', fontName),
                      ...plan.stemIntegration.stemMaterials.map(m => createDashListItem(m, fontName)),
                    ]
                  : []),
                ...(plan.stemIntegration.stemProcess && plan.stemIntegration.stemProcess.length > 0
                  ? [
                      createSubHeading('4. Tiến trình hoạt động trải nghiệm / thiết kế kỹ thuật STEM:', fontName),
                      ...plan.stemIntegration.stemProcess.map(p => createDashListItem(p, fontName)),
                    ]
                  : []),
                ...(plan.stemIntegration.expectedProduct
                  ? [
                      createSubHeading('5. Sản phẩm học tập STEM dự kiến:', fontName),
                      createDashListItem(plan.stemIntegration.expectedProduct, fontName),
                    ]
                  : []),
                ...(plan.stemIntegration.evaluationCriteria
                  ? [
                      createSubHeading('6. Tiêu chí đánh giá & nghiệm thu sản phẩm STEM:', fontName),
                      createDashListItem(plan.stemIntegration.evaluationCriteria, fontName),
                    ]
                  : []),
              ]
            : []),

          // III. TIẾN TRÌNH DẠY HỌC
          createSectionHeading('III. TIẾN TRÌNH DẠY HỌC', fontName, primaryColor),

          ...buildActivitiesSection(plan.activities, slotMap, fontName, plan.periods, isPreschool, tableLayout),

          ...((!isPreschool && plan.appendix.assignmentPrompt && plan.appendix.assignmentPrompt.trim() !== '')
            ? [
                createSubHeading('3. Hướng dẫn tự học và nhiệm vụ về nhà:', fontName),
                ...createHomeworkParagraphs(plan.appendix.assignmentPrompt, fontName),
              ]
            : []),

          // IV. HỒ SƠ DẠY HỌC & PHỤ LỤC (KHÔNG XUẤT CHO MÔN HĐTN-HN THEO YÊU CẦU SOẠN THUẦN 5512)
          // ĐẶT TRÊN MỘT TRANG RIÊNG BIỆT (pageBreakBefore: true)
          ...((!isHDTN && !isPreschool)
            ? [
                new Paragraph({
                  pageBreakBefore: true,
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 80, after: 30 },
                  children: [
                    new TextRun({
                      text: 'IV. HỒ SƠ DẠY HỌC VÀ PHỤ LỤC',
                      bold: true,
                      size: 28, // 14pt
                      font: fontName,
                      color: primaryColor,
                    }),
                  ],
                }),
                createSubHeading('1. Phiếu học tập / Hướng dẫn thực hành:', fontName),
                ...(plan.appendix.worksheetContent
                  ? createWorksheetDocxElements(plan.appendix.worksheetContent, fontName)
                  : [
                      new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { before: 20, after: 30 },
                        children: [
                          new TextRun({
                            text: 'Học sinh thực hiện phiếu học tập theo yêu cầu của bài học.',
                            font: fontName,
                            size: 28,
                          }),
                        ],
                      }),
                    ]),
              ]
            : []),

          // V. BẢNG PHÂN TÍCH PHÁT TRIỂN NĂNG LỰC SỐ (NLS) VÀ/HOẶC TRÍ TUỆ NHÂN TẠO (AI) CHO HỌC SINH (CUỐI CÙNG - KHÔNG XUẤT CHO HĐTN-HN VÀ MÔN TOÁN)
          // ĐẶT TRÊN MỘT TRANG RIÊNG BIỆT KHÁC (pageBreakBefore: true)
          ...(!isHDTN && !isMath && ((plan.competencyMatrix?.nlsItems?.length || 0) + (plan.competencyMatrix?.aiItems?.length || 0) > 0)
            ? [
                new Paragraph({
                  pageBreakBefore: true,
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 80, after: 30 },
                  children: [
                    new TextRun({
                      text:
                        (plan.competencyMatrix?.nlsItems?.length || 0) > 0 && (plan.competencyMatrix?.aiItems?.length || 0) > 0
                          ? 'V. BẢNG PHÂN TÍCH PHÁT TRIỂN NĂNG LỰC SỐ (NLS) VÀ TRÍ TUỆ NHÂN TẠO (AI) CHO HỌC SINH'
                          : (plan.competencyMatrix?.nlsItems?.length || 0) > 0
                          ? 'V. BẢNG PHÂN TÍCH PHÁT TRIỂN NĂNG LỰC SỐ (NLS) CHO HỌC SINH'
                          : 'V. BẢNG PHÂN TÍCH PHÁT TRIỂN NĂNG LỰC TRÍ TUỆ NHÂN TẠO (AI) CHO HỌC SINH',
                      bold: true,
                      size: 28,
                      font: fontName,
                      color: primaryColor,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text:
                        (plan.competencyMatrix?.nlsItems?.length || 0) > 0 && (plan.competencyMatrix?.aiItems?.length || 0) > 0
                          ? 'Bảng phân tích minh chứng định lượng và định tính việc phát triển năng lực số và năng lực trí tuệ nhân tạo (AI) trong bài dạy:'
                          : (plan.competencyMatrix?.nlsItems?.length || 0) > 0
                          ? 'Bảng phân tích minh chứng định lượng và định tính việc phát triển năng lực số trong bài dạy:'
                          : 'Bảng phân tích minh chứng định lượng và định tính việc phát triển năng lực trí tuệ nhân tạo (AI) trong bài dạy:',
                      italics: true,
                      font: fontName,
                    }),
                  ],
                  spacing: { before: 20, after: 60 },
                }),
                createCompetencyMatrixTable(plan.competencyMatrix, fontName),
              ]
            : []),

  ];
}


export interface PreschoolHeaderInfo {
  isMusic: boolean;
  mainHeader: string;
  lessonTitle: string;
  contentLines: string[];
  domainLine: string;
  gradeLine: string;
  timeLine: string;
}

function getPreschoolDuration(plan: any): string {
  if (plan.duration && typeof plan.duration === 'string' && plan.duration.trim()) {
    let d = plan.duration.trim();
    if (d.toLowerCase().startsWith('thời gian:')) d = d.substring(10).trim();
    if (d) return d;
  }
  const gradeStr = ((plan.grade || '') + ' ' + (plan.targetPeriodDetail || '')).toLowerCase();
  if (gradeStr.includes('nhà trẻ') || gradeStr.includes('12') || gradeStr.includes('24') || gradeStr.includes('36 tháng')) {
    return '15 – 20 phút';
  }
  if (gradeStr.includes('3-4') || gradeStr.includes('3 – 4') || gradeStr.includes('bé')) {
    return '20 – 25 phút';
  }
  if (gradeStr.includes('4-5') || gradeStr.includes('4 – 5') || gradeStr.includes('nhỡ')) {
    return '25 – 30 phút';
  }
  if (gradeStr.includes('5-6') || gradeStr.includes('5 – 6') || gradeStr.includes('lớn')) {
    return '30 – 35 phút';
  }
  return '20 – 25 phút';
}

function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function cleanPreschoolText(text: string): string {
  if (!text) return '';
  return text.replace(/[\\\{\}\[\]]/g, '').trim();
}

function cleanAuthorName(author: string): string {
  if (!author) return '';
  let cleaned = author.replace(/[\\\/\"\'\`\:\;\.\,\-\–—\{\}\[\]\(\)]/g, ' ').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 1 || cleaned.toLowerCase().includes('cô') || cleaned.toLowerCase().includes('trẻ')) {
    return '';
  }
  return toTitleCase(cleaned);
}

function normalizeVietnameseCase(text: string): string {
  if (!text) return '';
  const cleaned = cleanPreschoolText(text);
  
  // Check if text is mostly uppercase
  const lettersOnly = cleaned.replace(/[^a-zA-ZÀ-ỹ]/g, '');
  if (lettersOnly.length > 3 && lettersOnly === lettersOnly.toUpperCase()) {
    let lower = cleaned.toLowerCase();
    
    // Capitalize after start of string or delimiters
    lower = lower.replace(/(^|[\.\:\-\–—\(\[\"“‘'\s])([a-zà-ỹ])/g, (match, p1, p2) => {
      return p1 + p2.toUpperCase();
    });
    
    // Fix known acronyms and keywords
    lower = lower.replace(/\bTt\b/g, 'TT')
                 .replace(/\bTcân\b/g, 'TCÂN')
                 .replace(/\bTc\b/g, 'TC')
                 .replace(/\bNdtt\b/g, 'NDTT')
                 .replace(/\bNdkh\b/g, 'NDKH')
                 .replace(/\bVđtn\b/g, 'VĐTN')
                 .replace(/Tác Giả:/gi, 'Tác giả:')
                 .replace(/Nghe Hát/gi, 'Nghe hát')
                 .replace(/Dạy Hát/gi, 'Dạy hát')
                 .replace(/Trò Chơi Âm Nhạc/gi, 'Trò chơi âm nhạc')
                 .replace(/Trò Chơi/gi, 'Trò chơi')
                 .replace(/Lĩnh Vực/gi, 'Lĩnh vực')
                 .replace(/Độ Tuổi/gi, 'Độ tuổi')
                 .replace(/Nhạc Pháp/gi, 'Nhạc Pháp')
                 .replace(/Lời Việt/gi, 'lời Việt')
                 .replace(/Dân Ca/gi, 'Dân ca');
                 
    return lower;
  }
  return cleaned;
}

export function splitPreschoolTitle(rawTitle: string): string[] {
  if (!rawTitle) return [];
  
  let text = cleanPreschoolText(rawTitle.trim());
  
  // Split before known section keywords cleanly without relying on \b which breaks on Vietnamese Unicode
  text = text.replace(/([^\n])\s*(?:[\.\;\-\–—]\s*|\s+)(?=(?:Tác giả|TÁC GIẢ|Nhạc và lời|Sáng tác|Nhạc|Nghe hát|NGHE HÁT|Trò chơi|TRÒ CHƠI|TCÂN|TC|NDKH|NDTT|VĐTN|Lĩnh vực|LĨNH VỰC|Độ tuổi|ĐỘ TUỔI|Thời gian)\s*[:\-\–—\(\"])/gi, '$1\n');
  
  // Also handle cases like "..." Tác giả:
  text = text.replace(/(["”’\)])\s*(?=(?:Tác giả|TÁC GIẢ|Nhạc và lời|Sáng tác|Nhạc|Nghe hát|NGHE HÁT|Trò chơi|TRÒ CHƠI|TCÂN|TC|NDKH|NDTT|VĐTN)\s*[:\-\–—\(\"])/gi, '$1\n');

  return text
    .split('\n')
    .map(s => s.trim().replace(/^[\.\;\:\-\–—•*]\s*/, '').replace(/[\.\;\:\-\–—]\s*$/, '').trim())
    .filter(Boolean);
}

export function getPreschoolHeaderInfo(plan: any): PreschoolHeaderInfo {
  const domainInfo = detectPreschoolDomain(plan.subject || '', plan.lessonTitle || '', plan.oldPlanContent || '');
  const isMusic = domainInfo.isMusic;
  const mainHeader = domainInfo.mainHeader;

  const rawTitle = cleanPreschoolText((plan.lessonTitle || '').trim());
  const rawParts = splitPreschoolTitle(rawTitle);

  // Filter out redundant main headers or metadata lines
  const filteredParts = rawParts.filter((p: string) => {
    const lower = p.toLowerCase();
    return !lower.startsWith('giáo án') &&
           !lower.startsWith('lĩnh vực:') &&
           !lower.startsWith('lĩnh vực') &&
           !lower.startsWith('độ tuổi:') &&
           !lower.startsWith('thời gian:');
  });

  let rawLessonTitle = '';
  const contentLines: string[] = [];
  let extractedAuthor = '';

  // Check if rawTitle itself contains Author
  const authorInTitleMatch = rawTitle.match(/(?:tác giả|nhạc và lời|sáng tác|nhạc)\s*[:\-\–—]\s*([^,\n\.\;\(\)\[\]\"”]+)/i);
  if (authorInTitleMatch && authorInTitleMatch[1]) {
    const candidate = cleanAuthorName(authorInTitleMatch[1]);
    if (candidate) {
      extractedAuthor = candidate;
    }
  }

  filteredParts.forEach((part, idx) => {
    const lower = part.toLowerCase();
    const isAuthorLine = lower.startsWith('tác giả') || lower.startsWith('nhạc và lời') || lower.startsWith('sáng tác');
    const isMetadataLine = isAuthorLine ||
                          lower.startsWith('nghe hát') || 
                          lower.startsWith('trò chơi') || 
                          lower.startsWith('tcân') || 
                          lower.startsWith('tc:');

    if (idx === 0 && !isMetadataLine) {
      rawLessonTitle = part;
    } else if (isAuthorLine && (isMusic || domainInfo.domainType === 'POETRY' || domainInfo.domainType === 'STORY')) {
      const match = part.match(/(?:tác giả|nhạc và lời|sáng tác|nhạc)\s*[:\-\–—]\s*(.+)/i);
      const name = match ? cleanAuthorName(match[1]) : '';
      if (name) {
        extractedAuthor = name;
      }
    } else if (isMusic) {
      const normalized = normalizeVietnameseCase(part);
      if (normalized && normalized.length > 2) {
        contentLines.push(normalized);
      }
    }
  });

  if (!rawLessonTitle && filteredParts.length > 0) {
    rawLessonTitle = filteredParts[0];
  }

  let lessonTitle = rawLessonTitle;
  
  if (isMusic) {
    // Extract trailing (TT), (NDTT) if present before or after author
    const hasTT = /\((?:TT|NDTT)\)/i.test(lessonTitle) || /\((?:TT|NDTT)\)/i.test(rawTitle);

    // Remove author section from lessonTitle
    lessonTitle = lessonTitle
      .replace(/[\.\;\-\–—]?\s*(?:tác giả|tác giả:|nhạc và lời|sáng tác|nhạc)\s*[:\-\–—]?\s*[^,\n\.\;\(\)\[\]\"”]+/gi, '')
      .replace(/\((?:TT|NDTT)\)/gi, '')
      .replace(/\*\*/g, '')
      .replace(/[\.\:\-\–—]\s*$/, '')
      .trim();

    // Re-attach (TT) cleanly at the end if it was originally there
    if (hasTT && !lessonTitle.endsWith('(TT)')) {
      lessonTitle = `${lessonTitle} (TT)`;
    }

    const activities = plan.activities || [];
    const act3 = activities.find((a: any) => a.index === 3) || activities[2];
    const act4 = activities.find((a: any) => a.index === 4) || activities[3];
    const fullText = JSON.stringify(activities) + ' ' + (plan.oldPlanContent || '');

    // 1. Author (Tác giả)
    if (!extractedAuthor) {
      const act3Teacher = act3?.step1?.teacherAction || '';
      // Try to match the author explicitly from the main song (item 'a.' with TT)
      const mainAuthorMatch = act3Teacher.match(/a[\.\)]\s*(?:Dạy hát|Nghe hát|Hát vận động)[^\n]+?\(\s*(?:Tác giả|Nhạc và lời|Sáng tác)\s*[:\-\–—]\s*([^)]+)\)/i);
      if (mainAuthorMatch && mainAuthorMatch[1]?.trim()) {
        const candidate = cleanAuthorName(mainAuthorMatch[1]);
        if (candidate) extractedAuthor = candidate;
      }
    }

    if (!extractedAuthor) {
      const authorMatch = fullText.match(/(?:tác giả|nhạc và lời|nhạc|sáng tác)\s*[:\-\–—]\s*([^,\n\.\;\"”\)\(\]]+)/i);
      if (authorMatch && authorMatch[1]?.trim()) {
        const candidate = cleanAuthorName(authorMatch[1]);
        if (candidate) extractedAuthor = candidate;
      }
    }

    if (!extractedAuthor) {
      const lowerTitle = (lessonTitle + ' ' + rawTitle).toLowerCase();
      if (lowerTitle.includes('gà trống') || lowerTitle.includes('mèo con') || lowerTitle.includes('cún con')) extractedAuthor = 'Thế Vinh';
      else if (lowerTitle.includes('trường chúng cháu')) extractedAuthor = 'Phạm Tuyên';
      else if (lowerTitle.includes('vui đến trường')) extractedAuthor = 'Hồ Bắc';
      else if (lowerTitle.includes('bé đi nhà trẻ')) extractedAuthor = 'Nguyễn Văn Chung';
      else if (lowerTitle.includes('đố bạn')) extractedAuthor = 'Hồng Đăng';
      else if (lowerTitle.includes('tìm bạn thân')) extractedAuthor = 'Việt Anh';
      else if (lowerTitle.includes('tập tầm vông')) extractedAuthor = 'Đồng dao (nhạc Lê Vy)';
      else if (lowerTitle.includes('cháu yêu cô chú') || lowerTitle.includes('công nhân')) extractedAuthor = 'Hoàng Văn Yến';
      else if (lowerTitle.includes('cô và mẹ')) extractedAuthor = 'Phạm Tuyên';
      else if (lowerTitle.includes('cháu đi mẫu giáo')) extractedAuthor = 'Phạm Minh Tuấn';
      else if (lowerTitle.includes('đi học về')) extractedAuthor = 'Hoàng Long, Hoàng Lân';
      else if (lowerTitle.includes('bàn tay mẹ')) extractedAuthor = 'Bùi Đình Thảo';
      else extractedAuthor = 'Hoàng Long, Hoàng Lân';
    }

    // Replace or insert the Author line
    const existingAuthorIdx = contentLines.findIndex(l => l.toLowerCase().startsWith('tác giả'));
    if (existingAuthorIdx >= 0) {
      contentLines[existingAuthorIdx] = `Tác giả: ${extractedAuthor}`;
    } else {
      contentLines.unshift(`Tác giả: ${extractedAuthor}`);
    }

    // 2. Listening Song (Nghe hát)
    const hasListeningSong = contentLines.some(l => l.toLowerCase().startsWith('nghe hát'));
    if (!hasListeningSong) {
      let listenSongText = '';
      const act3Teacher = act3?.step1?.teacherAction || '';
      const listenMatch = act3Teacher.match(/(?:nghe hát\s*["“']([^"”']+)["”'](?:\s*\((?:tác giả\s*:\s*)?([^)]+)\))?)/i) ||
                          act3Teacher.match(/b[\.\)]\s*Nghe hát\s*["“']?([^"”'\n\.]+)/i);
      if (listenMatch) {
        const song = cleanPreschoolText(listenMatch[1]?.trim());
        const author = cleanAuthorName(listenMatch[2]?.trim());
        if (song) {
          listenSongText = `Nghe hát: "${song}"${author ? ` (Tác giả: ${author})` : ''}`;
        }
      }
      if (!listenSongText) {
        const lowerTitle = (lessonTitle + ' ' + rawTitle).toLowerCase();
        if (lowerTitle.includes('gà trống') || lowerTitle.includes('mèo con') || lowerTitle.includes('cún con')) listenSongText = 'Nghe hát: "Gà gáy le te" (Dân ca Cống Khao)';
        else if (lowerTitle.includes('trường chúng cháu')) listenSongText = 'Nghe hát: "Ngày đầu tiên đi học" (Tác giả: Nguyễn Ngọc Thiện)';
        else if (lowerTitle.includes('vui đến trường')) listenSongText = 'Nghe hát: "Đi học về" (Tác giả: Hoàng Long, Hoàng Lân)';
        else if (lowerTitle.includes('bé đi nhà trẻ')) listenSongText = 'Nghe hát: "Cháu đi mẫu giáo" (Tác giả: Phạm Minh Tuấn)';
        else if (lowerTitle.includes('cháu yêu cô chú') || lowerTitle.includes('công nhân')) listenSongText = 'Nghe hát: "Hạt gạo làng ta" (Tác giả: Trần Viết Bính)';
        else listenSongText = 'Nghe hát: "Bàn tay mẹ" (Tác giả: Bùi Đình Thảo)';
      }
      // Insert after author line
      const authorIdx = contentLines.findIndex(l => l.toLowerCase().startsWith('tác giả'));
      if (authorIdx >= 0) {
        contentLines.splice(authorIdx + 1, 0, listenSongText);
      } else {
        contentLines.push(listenSongText);
      }
    }

    // 3. Music Game (Trò chơi âm nhạc)
    const hasGame = contentLines.some(l => l.toLowerCase().startsWith('trò chơi') || l.toLowerCase().startsWith('tcân'));
    if (!hasGame) {
      let gameText = '';
      const act4Teacher = act4?.step1?.teacherAction || '';
      const gameMatch = act4Teacher.match(/(?:trò chơi âm nhạc|trò chơi)\s*[:'"]\s*["“']?([^"”'\n\.\,]+)["”']?/i) ||
                        fullText.match(/(?:trò chơi âm nhạc|trò chơi)\s*[:'"]\s*["“']?([^"”'\n\.\,]+)["”']?/i);
      if (gameMatch && gameMatch[1]?.trim() && !gameMatch[1].toLowerCase().includes('cô')) {
        const gameName = cleanPreschoolText(gameMatch[1].trim());
        gameText = `Trò chơi âm nhạc: "${gameName}"`;
      } else {
        const lowerTitle = (lessonTitle + ' ' + rawTitle).toLowerCase();
        if (lowerTitle.includes('gà trống') || lowerTitle.includes('mèo con') || lowerTitle.includes('cún con')) {
          gameText = 'Trò chơi âm nhạc: "Tai ai tinh (Đoán tiếng kêu các con vật)"';
        } else {
          gameText = 'Trò chơi âm nhạc: "Nốt nhạc vui"';
        }
      }
      contentLines.push(gameText);
    }
  } else {
    // Non-music: clean up and ensure prefix
    let cleanT = lessonTitle.replace(/\*\*/g, '').replace(/[\.\:\-\–—]\s*$/, '').trim();
    const cleanLower = cleanT.toLowerCase();
    
    if (cleanLower.startsWith('đề tài:')) cleanT = cleanT.substring(7).trim();
    else if (cleanLower.startsWith('đề tài')) cleanT = cleanT.substring(6).trim();
    else if (cleanLower.startsWith('thơ:')) cleanT = cleanT.substring(4).trim();
    else if (cleanLower.startsWith('truyện:')) cleanT = cleanT.substring(7).trim();
    else if (cleanLower.startsWith('hoạt động:')) cleanT = cleanT.substring(10).trim();
    else if (cleanLower.startsWith('tên hoạt động:')) cleanT = cleanT.substring(14).trim();
    else if (cleanLower.startsWith('hoạt động truyện:')) cleanT = cleanT.substring(17).trim();

    let prefix = 'Đề tài: ';
    if (domainInfo.domainType === 'MATH') prefix = 'Hoạt động: ';
    else if (domainInfo.domainType === 'STORY') prefix = 'Hoạt động Truyện: ';
    else if (domainInfo.domainType === 'LETTER') prefix = 'Hoạt động: ';
    else if (domainInfo.domainType === 'POETRY') prefix = 'Thơ: ';
    else if (domainInfo.domainType === 'ART') prefix = 'Tên hoạt động: ';
    else if (domainInfo.domainType === 'PHYSICAL') prefix = 'Hoạt động học thể chất: ';

    if (cleanT) {
      lessonTitle = `${prefix}${cleanT}`;
    } else {
      lessonTitle = rawTitle.match(/^(?:đề tài|thơ|truyện|hoạt động|tên hoạt động)/i) ? rawTitle : `${prefix}${rawTitle}`;
    }

    if (domainInfo.domainType === 'POETRY' && extractedAuthor) {
      contentLines.push(`Tác giả: ${extractedAuthor}`);
    } else if (domainInfo.domainType === 'STORY' && extractedAuthor) {
      contentLines.push(`Tác giả: ${extractedAuthor}`);
    }
  }

  // Clean any stray empty or invalid lines from contentLines
  const finalContentLines = contentLines
    .map(line => cleanPreschoolText(line))
    .filter(line => {
      if (!line) return false;
      const lower = line.toLowerCase();
      if (lower === 'tác giả:' || lower === 'tác giả' || lower.startsWith('tác giả: \\') || lower.startsWith('tác giả:\\')) return false;
      if (lower === 'nghe hát:' || lower === 'nghe hát') return false;
      if (lower === 'trò chơi âm nhạc:' || lower === 'trò chơi:') return false;
      return true;
    });

  let domainLine = '';
  if (isMusic || !mainHeader.toUpperCase().startsWith('LĨNH VỰC')) {
    let domain = plan.subject || domainInfo.defaultDomainName;
    if (
      domain === 'GIÁO ÁN VĂN HỌC (THƠ)' ||
      domain === 'GIÁO ÁN VĂN HỌC (TRUYỆN)' ||
      domain === 'NGÔN NGỮ (CHỮ CÁI)' ||
      domain === 'KHÁM PHÁ KHOA HỌC' ||
      domain === 'PHÁT TRIỂN NHẬN THỨC (TOÁN)' ||
      domain === 'GIÁO ÁN TẠO HÌNH' ||
      domain === 'GIÁO ÁN ÂM NHẠC' ||
      domain === 'GIÁO ÁN TÌNH CẢM - XÃ HỘI' ||
      domain === 'HOẠT ĐỘNG VUI CHƠI TRONG LỚP' ||
      domain === 'HOẠT ĐỘNG NGOÀI TRỜI' ||
      domain === 'TRÒ CHƠI VẬN ĐỘNG' ||
      domain === 'HOẠT ĐỘNG GIÁO DỤC KỸ NĂNG' ||
      domain === 'TRÒ CHƠI DÂN GIAN' ||
      domain === 'HOẠT ĐỘNG TĂNG CƯỜNG TIẾNG VIỆT' ||
      domain === 'HOẠT ĐỘNG TẬP TÔ CHỮ CÁI' ||
      domain === 'HOẠT ĐỘNG TRÒ CHƠI CHỮ CÁI'
    ) {
      domain = domainInfo.defaultDomainName;
    }

    if (domain.toLowerCase().startsWith('lĩnh vực:')) {
      domain = domain.substring(9).trim();
    } else if (domain.toLowerCase().startsWith('lĩnh vực phát triển:')) {
      domain = domain.substring(20).trim();
    } else if (domain.toLowerCase().startsWith('hoạt động:')) {
      domain = domain.substring(10).trim();
    }
    
    let domainPrefix = 'Lĩnh vực: ';
    if (domainInfo.domainType === 'ART') {
      domainPrefix = 'Lĩnh vực phát triển: ';
      if (domain.toLowerCase().startsWith('lĩnh vực ')) {
         domain = domain.substring(9).trim();
      }
    } else if (
      domainInfo.domainType === 'PLAY_INDOOR' ||
      domainInfo.domainType === 'OUTDOOR' ||
      domainInfo.domainType === 'PHYSICAL_GAME' ||
      domainInfo.domainType === 'SKILL_EDU' ||
      domainInfo.domainType === 'FOLK_GAME' ||
      domainInfo.domainType === 'VIETNAMESE_ENHANCE' ||
      domainInfo.domainType === 'LETTER_TRACING' ||
      domainInfo.domainType === 'LETTER_GAME'
    ) {
      domainPrefix = 'Hoạt động: ';
      if (domain.toLowerCase().startsWith('lĩnh vực ')) {
        domain = domain.substring(9).trim();
      }
    } else if (!domain.toLowerCase().startsWith('lĩnh vực')) {
      domain = `Lĩnh vực ${domain}`;
    }
    
    domainLine = `${domainPrefix}${domain}`;
  }

  let grade = plan.grade || (plan as any).targetPeriodDetail || 'Mẫu giáo lớn (5-6 tuổi)';
  if (grade.toLowerCase().startsWith('độ tuổi:')) {
    grade = grade.substring(8).trim();
  }
  const gradeLine = `Độ tuổi: ${grade}`;
  const timeLine = `Thời gian: ${getPreschoolDuration(plan)}`;

  return {
    isMusic,
    mainHeader,
    lessonTitle,
    contentLines: finalContentLines,
    domainLine,
    gradeLine,
    timeLine
  };
}

function buildPreschoolDocxElements(
  plan: LessonPlanOutput,
  slotMap: Map<string, ImageSlot>,
  fontName: string,
  primaryColor: string
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  const preschoolInfo = getPreschoolHeaderInfo(plan);

  if (preschoolInfo.isMusic) {
    // 1. Header banner (e.g., GIÁO ÁN ÂM NHẠC with green highlight box matching reference)
    elements.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({
            text: preschoolInfo.mainHeader,
            bold: true,
            size: 28, // 14pt
            font: fontName,
            shading: {
              fill: "00FF00", // Green highlight box matching image
            },
          }),
        ],
      })
    );

    // 2. Lesson Title (CĂN GIỮA, IN HOA, IN ĐẬM)
    if (preschoolInfo.lessonTitle) {
      elements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 120 },
          children: [
            new TextRun({
              text: preschoolInfo.lessonTitle.toUpperCase(),
              bold: true,
              size: 28, // 14pt
              font: fontName,
              color: '000000',
            }),
          ],
        })
      );
    }

    // 3. Sub-lines (Tác giả, Nghe hát, Trò chơi âm nhạc, Lĩnh vực, Độ tuổi tách biệt xuống dòng rõ ràng)
    const subLines = [
      ...preschoolInfo.contentLines,
      preschoolInfo.domainLine,
      preschoolInfo.gradeLine,
    ].filter(Boolean);

    subLines.forEach(line => {
      elements.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 720 }, // 0.5 inch indentation
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({
              text: line,
              size: 28, // 14pt
              font: fontName,
              color: '000000',
            }),
          ],
        })
      );
    });
  } else {
    // NON-MUSIC PRESCHOOL (Science / Khám phá khoa học, Xã hội, Toán, v.v.)
    // 1. Header banner (Centered green highlight box)
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({
            text: preschoolInfo.mainHeader,
            bold: true,
            size: 28, // 14pt
            font: fontName,
            shading: {
              fill: "00FF00",
            },
          }),
        ],
      })
    );

    // 2. Đề tài (CĂN GIỮA, IN ĐẬM)
    if (preschoolInfo.lessonTitle) {
      elements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: preschoolInfo.lessonTitle,
              bold: true,
              size: 28, // 14pt
              font: fontName,
              color: '000000',
            }),
          ],
        })
      );
    }

    // 3. Lĩnh vực (CĂN GIỮA, IN ĐẬM)
    if (preschoolInfo.domainLine) {
      elements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({
              text: preschoolInfo.domainLine,
              bold: true,
              size: 28, // 14pt
              font: fontName,
              color: '000000',
            }),
          ],
        })
      );
    }

    // 4. Độ tuổi (CĂN GIỮA, IN ĐẬM)
    if (preschoolInfo.gradeLine) {
      elements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({
              text: preschoolInfo.gradeLine,
              bold: true,
              size: 28, // 14pt
              font: fontName,
              color: '000000',
            }),
          ],
        })
      );
    }

    // 5. Thời gian (CĂN GIỮA, IN ĐẬM)
    if (preschoolInfo.timeLine) {
      elements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 20, after: 60 },
          children: [
            new TextRun({
              text: preschoolInfo.timeLine,
              bold: true,
              size: 28, // 14pt
              font: fontName,
              color: '000000',
            }),
          ],
        })
      );
    }

    // 6. Any other contentLines
    preschoolInfo.contentLines.forEach(line => {
      elements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({
              text: line,
              size: 28, // 14pt
              font: fontName,
              color: '000000',
            }),
          ],
        })
      );
    });
  }

  // Empty spacing before Section I
  elements.push(
    new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [],
    })
  );

  // I. Mục đích - yêu cầu
  elements.push(createSectionHeading('I. Mục đích - yêu cầu', fontName, primaryColor));
  
  const isNew8 = isPreschoolNew8Activity(plan.subject, plan.lessonTitle);
  const cleanPreschoolText = (t: string) => (!isNew8 ? stripPreschoolCodes(t) : t);

  elements.push(createSubHeading('1. Kiến thức:', fontName));
  plan.objectives.knowledge.forEach(k => elements.push(createDashListItem(cleanPreschoolText(k), fontName)));

  elements.push(createSubHeading('2. Kỹ năng:', fontName));
  plan.objectives.subjectCompetencies.forEach(c => elements.push(createDashListItem(cleanPreschoolText(c), fontName)));

  elements.push(createSubHeading('3. Phẩm chất:', fontName));
  plan.objectives.qualities.forEach(q => elements.push(createDashListItem(cleanPreschoolText(q), fontName)));

  elements.push(createSubHeading('4. Năng lực:', fontName));
  plan.objectives.generalCompetencies.forEach(c => elements.push(createDashListItem(cleanPreschoolText(c), fontName)));

  // 5. Tích hợp Năng lực số (NLS) và 6. Tích hợp Trí tuệ nhân tạo (AI) nếu người dùng chọn tích hợp
  const hasNLS = (plan.objectives.digitalCompetencies || []).length > 0;
  const hasAI = (plan.objectives.aiCompetencies || []).length > 0;
  const hasSTEM = (plan.objectives.stemCompetencies || []).length > 0;

  if (hasNLS || hasAI) {
    const nlsNumber = 5;
    const aiNumber = hasNLS ? 6 : 5;
    if (hasNLS) {
      elements.push(createSubHeading(`${nlsNumber}. Tích hợp Năng lực số (NLS):`, fontName));
      plan.objectives.digitalCompetencies.forEach(c => elements.push(createDashListItem(c, fontName)));
    }
    if (hasAI) {
      elements.push(createSubHeading(`${aiNumber}. Tích hợp Trí tuệ nhân tạo (AI):`, fontName));
      plan.objectives.aiCompetencies.forEach(c => elements.push(createDashListItem(c, fontName)));
    }
    if (hasSTEM) {
      elements.push(createSubHeading(`${hasNLS && hasAI ? 7 : 6}. Tích hợp STEM / Khác:`, fontName));
      plan.objectives.stemCompetencies.forEach(c => elements.push(createDashListItem(c, fontName)));
    }
  } else if (hasSTEM) {
    elements.push(createSubHeading('5. Tích hợp:', fontName));
    plan.objectives.stemCompetencies.forEach(c => elements.push(createDashListItem(c, fontName)));
  }

  // II. Chuẩn bị
  elements.push(createSectionHeading('II. Chuẩn bị', fontName, primaryColor));
  elements.push(createSubHeading('1. Chuẩn bị của cô', fontName));
  plan.equipment.teacher.forEach(e => elements.push(createDashListItem(e, fontName)));
  
  elements.push(createSubHeading('2. Chuẩn bị của trẻ', fontName));
  plan.equipment.student.forEach(e => elements.push(createDashListItem(e, fontName)));

  // III. Tiến trình hoạt động
  elements.push(createSectionHeading('III. Tiến trình hoạt động', fontName, primaryColor));

  // Create single table for preschool
  const borderConfig = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
  const rows: TableRow[] = [];

  rows.push(new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 60, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 120, bottom: 120, left: 180, right: 180 },
        borders: {
          top: borderConfig,
          bottom: borderConfig,
          left: borderConfig,
          right: borderConfig,
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Hoạt động của Cô', bold: true, size: 28, font: fontName })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 120, bottom: 120, left: 180, right: 180 },
        borders: {
          top: borderConfig,
          bottom: borderConfig,
          left: borderConfig,
          right: borderConfig,
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Hoạt động của Trẻ', bold: true, size: 28, font: fontName })],
          }),
        ],
      }),
    ],
  }));

  const formattedActivities = formatPreschoolActivities(plan.activities, plan.lessonTitle || '', plan.subject || '', (plan as any).oldPlanContent || '');

  formattedActivities.forEach((act) => {
    const pairRows = parseActivityPairs(act);
    pairRows.forEach((pRow) => {
      if (pRow.type === 'title') {
        rows.push(
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: 60, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                margins: { top: 120, bottom: 80, left: 180, right: 180 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  left: borderConfig,
                  right: borderConfig,
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: pRow.teacherText,
                        bold: true,
                        size: 28, // 14pt
                        font: fontName,
                        color: primaryColor || '1E293B',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 40, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                margins: { top: 120, bottom: 80, left: 180, right: 180 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  left: borderConfig,
                  right: borderConfig,
                },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: '', font: fontName, size: 28 })],
                  }),
                ],
              }),
            ],
          })
        );
      } else if (pRow.type === 'subheader') {
        rows.push(
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: 60, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                margins: { top: 100, bottom: 60, left: 240, right: 180 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  left: borderConfig,
                  right: borderConfig,
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: pRow.teacherText,
                        bold: true,
                        size: 28,
                        font: fontName,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 40, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                margins: { top: 100, bottom: 60, left: 180, right: 180 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  left: borderConfig,
                  right: borderConfig,
                },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: '', font: fontName, size: 28 })],
                  }),
                ],
              }),
            ],
          })
        );
      } else {
        const teacherParas = pRow.teacherText
          ? parseTextAndEmbedImages(pRow.teacherText, slotMap, fontName, 28)
          : [new Paragraph({ children: [new TextRun({ text: '', font: fontName, size: 28 })] })];

        const studentParas = pRow.studentText
          ? parseTextAndEmbedImages(pRow.studentText, slotMap, fontName, 28)
          : [new Paragraph({ children: [new TextRun({ text: '', font: fontName, size: 28 })] })];

        rows.push(
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: 60, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                margins: { top: 60, bottom: 60, left: 180, right: 180 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  left: borderConfig,
                  right: borderConfig,
                },
                children: teacherParas,
              }),
              new TableCell({
                width: { size: 40, type: WidthType.PERCENTAGE },
                verticalAlign: VerticalAlign.TOP,
                margins: { top: 60, bottom: 60, left: 180, right: 180 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  left: borderConfig,
                  right: borderConfig,
                },
                children: studentParas,
              }),
            ],
          })
        );
      }
    });
  });

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      margins: { top: 140, bottom: 140, left: 180, right: 180 },
      borders: {
        top: borderConfig,
        bottom: borderConfig,
        left: borderConfig,
        right: borderConfig,
        insideVertical: borderConfig,
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      },
      rows,
    })
  );

  return elements;
}
