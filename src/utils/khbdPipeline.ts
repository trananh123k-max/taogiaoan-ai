/**
 * KHBD AI PRO - COMPLETE PIPELINE SERVICE
 * 
 * Flow:
 * 1. Firebase Storage: Lấy danh mục PDF Sách giáo khoa theo Môn/Lớp.
 * 2. Trích xuất DOCX cũ: Dùng Mammoth & JSZip bóc tách văn bản, lưu ảnh vào mảng và gắn thẻ {{IMAGE_SLOT_X}}.
 * 3. Gửi Gemini API: Gửi nội dung bài, tài liệu tham khảo SGK, cấu hình NLS/AI và nhận Kế hoạch bài dạy chuẩn 5512.
 * 4. Xuất Word DOCX: Dùng docx.js ráp lại bài dạy 4 bước, khôi phục ảnh gốc vào đúng thẻ {{IMAGE_SLOT_X}}.
 */

import mammoth from 'mammoth';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, WidthType, AlignmentType } from 'docx';
import fileSaver from 'file-saver';
const saveAs = (fileSaver as any)?.saveAs || fileSaver;
import { LessonPlanOutput, ImageSlot, LessonPlanConfig } from '../types';
import { getApiHeaders } from './apiKeyManager';
import { formatDocxFileName, saveFileWithPickerOrFallback } from './docxExporter';

// ============================================================================
// BƯỚC 1: KẾT NỐI FIREBASE STORAGE - TẢI DANH MỤC SGK THEO MÔN / LỚP
// ============================================================================

export interface TextbookItem {
  id: string;
  title: string;
  grade: string;
  subject: string;
  bookSeries: string;
  storageUrl?: string;
  downloadUrl?: string;
  pages?: number;
}

/**
 * Lấy danh mục file PDF Sách giáo khoa từ Firebase Storage / Firestore
 * Có thể gọi trực tiếp Firebase Web SDK hoặc qua API Endpoint của Server.
 */
export async function fetchTextbooksFromFirebase(grade?: string, subject?: string): Promise<TextbookItem[]> {
  try {
    const params = new URLSearchParams();
    if (grade) params.append('grade', grade);
    if (subject) params.append('subject', subject);

    const response = await fetch(`/api/firebase/textbooks?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      return data.textbooks || [];
    }
  } catch (error) {
    console.warn('Fallback sang danh mục SGK Kết nối tri thức offline:', error);
  }

  // Danh mục mẫu dự phòng chuẩn bộ sách Kết nối tri thức với cuộc sống
  return [
    {
      id: 'math10_kntt',
      title: 'Toán 10 - Tập 1 & 2 (Kết nối tri thức)',
      grade: 'Lớp 10',
      subject: 'Toán học',
      bookSeries: 'Kết nối tri thức với cuộc sống',
      downloadUrl: 'https://storage.googleapis.com/sgk-kntt/toan-10.pdf',
      pages: 128,
    },
    {
      id: 'cs11_kntt',
      title: 'Tin học 11 - Định hướng Tin học ứng dụng (Kết nối tri thức)',
      grade: 'Lớp 11',
      subject: 'Tin học',
      bookSeries: 'Kết nối tri thức với cuộc sống',
      downloadUrl: 'https://storage.googleapis.com/sgk-kntt/tin-11.pdf',
      pages: 160,
    },
    {
      id: 'khtn8_kntt',
      title: 'Khoa học tự nhiên 8 (Kết nối tri thức)',
      grade: 'Lớp 8',
      subject: 'KHTN (Khoa học tự nhiên)',
      bookSeries: 'Kết nối tri thức với cuộc sống',
      downloadUrl: 'https://storage.googleapis.com/sgk-kntt/khtn-8.pdf',
      pages: 210,
    }
  ];
}

// ============================================================================
// BƯỚC 2: ĐỌC TEXT DOCX CŨ, TRÍCH XUẤT ẢNH & GẮN THẺ {{IMAGE_SLOT_X}}
// ============================================================================

export interface ExtractedDocxData {
  textWithSlots: string;
  imageSlots: ImageSlot[];
  htmlPreview: string;
}

/**
 * Đọc file .docx giáo án cũ:
 * - Giải nén JSZip để trích xuất toàn bộ file ảnh trong thư mục /word/media/
 * - Sử dụng Mammoth.js để bóc tách văn bản, thay thế vị trí từng hình ảnh bằng {{IMAGE_SLOT_X}}
 */
export async function extractDocxWithImageSlots(file: File): Promise<ExtractedDocxData> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const imageSlots: ImageSlot[] = [];

  // 1. Đọc ánh xạ quan hệ word/_rels/document.xml.rels để xác định tên ảnh
  const relsFile = zip.file('word/_rels/document.xml.rels');
  const relMap: Record<string, string> = {};

  if (relsFile) {
    const relsXml = await relsFile.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(relsXml, 'application/xml');
    const relationships = xmlDoc.getElementsByTagName('Relationship');

    for (let i = 0; i < relationships.length; i++) {
      const rel = relationships[i];
      const id = rel.getAttribute('Id');
      const target = rel.getAttribute('Target');
      const type = rel.getAttribute('Type');

      if (id && target && (type?.includes('image') || target.includes('media/'))) {
        const cleanTarget = target.startsWith('media/') ? `word/${target}` : target.replace(/^\//, '');
        relMap[id] = cleanTarget;
      }
    }
  }

  // 2. Trích xuất buffer nhị phân của từng ảnh
  let slotIndex = 1;
  for (const [, mediaPath] of Object.entries(relMap)) {
    const mediaZipFile = zip.file(mediaPath) || zip.file(mediaPath.replace('word/', ''));
    if (mediaZipFile) {
      const imageBytes = await mediaZipFile.async('uint8array');
      const ext = mediaPath.split('.').pop()?.toLowerCase() || 'png';
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
      
      // Chuyển sang Base64
      let binary = '';
      for (let i = 0; i < imageBytes.length; i++) {
        binary += String.fromCharCode(imageBytes[i]);
      }
      const base64Data = btoa(binary);

      imageSlots.push({
        id: `slot_${slotIndex}`,
        slotTag: `{{IMAGE_SLOT_${slotIndex}}}`,
        name: `Hình ảnh gốc ${slotIndex}`,
        mimeType,
        base64Data,
        originalIndex: slotIndex,
        caption: `Hình ${slotIndex}: Sơ đồ/Hình minh họa từ giáo án gốc`,
      });
      slotIndex++;
    }
  }

  // 3. Dùng Mammoth.js chuyển đổi sang text có gắn thẻ {{IMAGE_SLOT_X}}
  let mammothImgCounter = 1;
  const mammothResult = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement(() => {
        const tag = `{{IMAGE_SLOT_${mammothImgCounter}}}`;
        mammothImgCounter++;
        return Promise.resolve({
          src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40"><text y="20" fill="blue">${tag}</text></svg>`,
          alt: tag
        });
      }),
    }
  );

  const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
  let processedText = rawTextResult.value;

  // Đảm bảo gắn thẻ slot vào text nếu chưa có
  if (imageSlots.length > 0 && !processedText.includes('{{IMAGE_SLOT_')) {
    processedText += '\n\n[DANH SÁCH HÌNH ẢNH GỐC ĐÍNH KÈM]:\n' + 
      imageSlots.map(s => `${s.slotTag}: ${s.caption}`).join('\n');
  }

  return {
    textWithSlots: processedText,
    imageSlots,
    htmlPreview: mammothResult.value,
  };
}

// ============================================================================
// BƯỚC 3: GỬI YÊU CẦU TỚI GEMINI API (PROMPT 5512 + NLS/AI + KHÔI PHỤC VỊ TRÍ ẢNH)
// ============================================================================

/**
 * Gửi dữ liệu soạn bài tới Backend Gemini API để sinh kế hoạch bài dạy chuẩn GDPT 2018 & CV 5512
 */
export async function requestGeminiGenerateKHBD(
  config: LessonPlanConfig,
  extractedData?: ExtractedDocxData
): Promise<LessonPlanOutput> {
  const payload = {
    lessonTitle: config.lessonTitle,
    subject: config.subject,
    grade: config.grade,
    schoolLevel: config.schoolLevel,
    bookSeries: config.bookSeries || 'Kết nối tri thức với cuộc sống',
    periods: config.periods,
    totalPeriods: config.lessonTotalPeriods || config.periods,
    targetPeriodDetail: config.targetPeriodDetail,
    schoolName: config.schoolName,
    teacherName: config.teacherName,
    enableNLS: config.enableNLS,
    selectedNLSDomains: config.selectedNLSDomains,
    enableAI: config.enableAI,
    selectedAIDomains: config.selectedAIDomains,
    enableSTEM: config.enableSTEM,
    stemTopic: config.stemTopic,
    hasStemFromPPCT: config.hasStemFromPPCT,
    integratedNLSFromPPCT: config.integratedNLSFromPPCT,
    integratedAIFromPPCT: config.integratedAIFromPPCT,
    oldPlanContent: extractedData ? extractedData.textWithSlots : config.oldPlanContent,
    imageSlots: extractedData ? extractedData.imageSlots : config.imageSlots,
    additionalRequirements: config.additionalRequirements,
    ppctContent: config.ppctContent,
    preschoolIndicatorMode: config.preschoolIndicatorMode,
    preschoolCustomCodes: config.preschoolCustomCodes,
    preschoolCodesBySection: config.preschoolCodesBySection,
  };

  const response = await fetch('/api/gemini/generate-khbd', {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Lỗi khi gọi Gemini API tạo Kế hoạch bài dạy.');
  }

  const result = await response.json();
  const planData: LessonPlanOutput = result.data || result.lessonPlan;

  // Đồng bộ lại imageSlots gốc và tự động khôi phục thẻ ảnh nếu AI bỏ xót
  const currentSlots = extractedData?.imageSlots || config.imageSlots || [];
  if (currentSlots.length > 0 && planData && planData.activities) {
    planData.imageSlotsUsed = currentSlots;
    const jsonStr = JSON.stringify(planData.activities);
    const missing = currentSlots.filter(s => !jsonStr.includes(s.slotTag));
    if (missing.length > 0) {
      const oldText = config.oldPlanContent || extractedData?.textWithSlots || '';
      missing.forEach(slot => {
        const slotPos = oldText.indexOf(slot.slotTag);
        let targetActIdx = 1; // Mặc định Hoạt động 2 (Hình thành kiến thức)
        if (slotPos >= 0) {
          const textBefore = oldText.substring(0, slotPos).toLowerCase();
          if (textBefore.includes('vận dụng') || textBefore.includes('hoạt động 4') || textBefore.includes('4. vận dụng')) {
            targetActIdx = Math.min(3, planData.activities.length - 1);
          } else if (textBefore.includes('luyện tập') || textBefore.includes('hoạt động 3') || textBefore.includes('3. luyện tập') || textBefore.includes('bài tập')) {
            targetActIdx = Math.min(2, planData.activities.length - 1);
          } else if (textBefore.includes('khởi động') && !textBefore.includes('khám phá') && !textBefore.includes('hình thành')) {
            targetActIdx = 0;
          } else {
            targetActIdx = Math.min(1, planData.activities.length - 1);
          }
        }
        const targetAct = planData.activities[targetActIdx] || planData.activities[0];
        if (targetAct) {
          if (targetAct.step2) {
            targetAct.step2.teacherAction = (targetAct.step2.teacherAction || '') + `\n\n${slot.slotTag}`;
          } else if (targetAct.step1) {
            targetAct.step1.teacherAction = (targetAct.step1.teacherAction || '') + `\n\n${slot.slotTag}`;
          }
        }
      });
    }
  }

  return planData;
}

// ============================================================================
// BƯỚC 4: TẠO VÀ XUẤT FILE WORD (.DOCX) HOÀN CHỈNH, CHÈN LẠI ẢNH GỐC
// ============================================================================

/**
 * Chuyển Base64 thành Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Phân tách đoạn văn bản và chèn đối tượng ImageRun nếu bắt gặp thẻ {{IMAGE_SLOT_X}}
 */
function renderTextWithImages(text: string, slotMap: Map<string, ImageSlot>): (TextRun | ImageRun | Paragraph)[] {
  const slotRegex = /({{IMAGE_SLOT_\d+}})/g;
  const parts = text.split(slotRegex);
  const runs: (TextRun | ImageRun | Paragraph)[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (slotMap.has(part)) {
      const slot = slotMap.get(part)!;
      try {
        const imageBytes = base64ToUint8Array(slot.base64Data);
        runs.push(
          new ImageRun({
            data: imageBytes,
            transformation: { width: 380, height: 220 },
            type: 'png',
          })
        );
        runs.push(
          new TextRun({
            text: `\n(${slot.caption || 'Hình minh họa gốc'})\n`,
            italics: true,
            size: 22, // 11pt
          })
        );
      } catch {
        runs.push(new TextRun({ text: `[${slot.caption || slot.name}]`, italics: true }));
      }
    } else {
      runs.push(new TextRun({ text: part, size: 26 })); // 13pt
    }
  }

  return runs;
}

/**
 * Tạo file .docx bằng thư viện docx.js và tải về trình duyệt
 */
export async function buildAndDownloadDocx(
  plan: LessonPlanOutput,
  imageSlots: ImageSlot[] = []
): Promise<void> {
  const slotMap = new Map<string, ImageSlot>();
  [...imageSlots, ...(plan.imageSlotsUsed || [])].forEach((slot) => {
    slotMap.set(slot.slotTag.trim(), slot);
  });

  const doc = new Document({
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
        children: [
          // Tiêu đề & Thông tin chung
          new Paragraph({
            children: [
              new TextRun({
                text: 'KẾ HOẠCH BÀI DẠY (GIÁO ÁN)',
                bold: true,
                size: 28, // 14pt
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: (plan.lessonTitle || 'BÀI HỌC').toUpperCase(),
                bold: true,
                color: '1E3A8A',
                size: 30, // 15pt
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Môn: ${plan.subject || ''} | Lớp: ${plan.grade || ''} | Bộ sách: Kết nối tri thức với cuộc sống | Thời lượng: ${plan.periods || 2} tiết`,
                italics: true,
                size: 24, // 12pt
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // I. MỤC TIÊU
          new Paragraph({
            children: [new TextRun({ text: 'I. MỤC TIÊU', bold: true, size: 26 })],
            spacing: { before: 150, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '1. Về kiến thức: ', bold: true }),
              new TextRun({ text: (plan.objectives?.knowledge || []).join('; ') }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '2. Về năng lực số (NLS) & AI: ', bold: true }),
              new TextRun({
                text: `NLS: ${(plan.objectives?.digitalCompetencies || []).join('; ')}. AI: ${(plan.objectives?.aiCompetencies || []).join('; ')}.`,
              }),
            ],
          }),

          // II. THIẾT BỊ DẠY HỌC
          new Paragraph({
            children: [new TextRun({ text: 'II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU', bold: true, size: 26 })],
            spacing: { before: 150, after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '1. Giáo viên: ', bold: true }),
              new TextRun({ text: (plan.equipment?.teacher || []).join(', ') }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '2. Học sinh: ', bold: true }),
              new TextRun({ text: (plan.equipment?.student || []).join(', ') }),
            ],
          }),

          // III. TIẾN TRÌNH DẠY HỌC (BẢNG 4 BƯỚC 2 CỘT)
          new Paragraph({
            children: [new TextRun({ text: 'III. TIẾN TRÌNH DẠY HỌC (CHUẨN 4 BƯỚC SƯ PHẠM)', bold: true, size: 26 })],
            spacing: { before: 200, after: 120 },
          }),

          // Lặp qua từng hoạt động
          ...((plan.activities || []).flatMap((act) => {
            const rows: TableRow[] = [
              // Header dòng tiêu đề hoạt động
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${act.name} (${act.duration || ''})`,
                            bold: true,
                            color: '1E3A8A',
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: 'a) Mục tiêu: ', bold: true }),
                          new TextRun({ text: act.objective }),
                        ],
                      }),
                    ],
                    columnSpan: 2,
                  }),
                ],
              }),
              // Header bảng 2 cột
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Hoạt động của GV & HS', bold: true })], alignment: AlignmentType.CENTER })],
                    width: { size: 60, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Sản phẩm dự kiến', bold: true })], alignment: AlignmentType.CENTER })],
                    width: { size: 40, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              // Nội dung 4 bước
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: '* Bước 1 (Chuyển giao nhiệm vụ): ', bold: true }),
                          ...renderTextWithImages(act.step1?.teacherAction || '', slotMap),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '* Bước 2 (Thực hiện nhiệm vụ): ', bold: true }),
                          ...renderTextWithImages(act.step2?.studentAction || '', slotMap),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '* Bước 3 (Báo cáo, thảo luận): ', bold: true }),
                          ...renderTextWithImages(act.step3?.teacherAction || act.step3?.studentAction || '', slotMap),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: '* Bước 4 (Kết luận, nhận định): ', bold: true }),
                          ...renderTextWithImages(act.step4?.teacherAction || '', slotMap),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: '- Sản phẩm đạt được:\n', bold: true }),
                          ...renderTextWithImages(act.productSummary || act.step1?.productExpected || '', slotMap),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ];

            return [
              new Table({
                rows,
                width: { size: 100, type: WidthType.PERCENTAGE },
                margins: {
                  top: 140,
                  bottom: 140,
                  left: 180,
                  right: 180,
                },
              }),
              new Paragraph({ text: '', spacing: { after: 150 } }),
            ];
          })),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  await saveFileWithPickerOrFallback(blob, formatDocxFileName(plan));
}
