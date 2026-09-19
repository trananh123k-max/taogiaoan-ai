import * as pdfjsLib from 'pdfjs-dist';

// Set up worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export interface ExtractedPDFInfo {
  extractedText: string;
  pageCount: number;
  detectedSubject?: string;
  detectedGrade?: string;
  detectedVolume?: string;
}

/**
 * Extracts text from the first 15 pages and last 5 pages of a PDF file.
 * This captures the Title, Table of Contents (Mục lục), and Index without sending heavy 50MB+ base64 payloads.
 */
export async function extractTextFromPDF(file: File, maxPagesToScan: number = 15): Promise<ExtractedPDFInfo> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      stopAtErrors: false,
    });

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    let fullExtractedText = '';

    // 1. Scan first N pages (Where Cover, Overview, and Table of Contents are located)
    const pagesToScanFront = Math.min(pageCount, maxPagesToScan);
    for (let i = 1; i <= pagesToScanFront; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
          .trim();

        if (pageText) {
          fullExtractedText += `\n--- [Trang ${i}] ---\n` + pageText;
        }
      } catch (pageErr) {
        console.warn(`Could not read page ${i}:`, pageErr);
      }
    }

    // 2. Scan last 3 pages (Some books put "Mục lục" at the very end)
    if (pageCount > pagesToScanFront) {
      const startBack = Math.max(pagesToScanFront + 1, pageCount - 3);
      for (let i = startBack; i <= pageCount; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ')
            .trim();

          if (pageText) {
            fullExtractedText += `\n--- [Trang cuối ${i}] ---\n` + pageText;
          }
        } catch {
          // ignore
        }
      }
    }

    // Detect metadata from filename or text
    const fileName = file.name.toLowerCase();
    let detectedSubject: string | undefined;
    let detectedGrade: string | undefined;
    let detectedVolume: string | undefined;

    // Detect Subject
    if (fileName.includes('toán') || fileName.includes('toan')) detectedSubject = 'Toán học';
    else if (fileName.includes('tin') || fileName.includes('tin hoc')) detectedSubject = 'Tin học';
    else if (fileName.includes('văn') || fileName.includes('van') || fileName.includes('ngữ văn')) detectedSubject = 'Ngữ văn';
    else if (fileName.includes('khtn') || fileName.includes('khoa học tự nhiên')) detectedSubject = 'Khoa học tự nhiên';
    else if (fileName.includes('vật lí') || fileName.includes('vat li') || fileName.includes('vật lý')) detectedSubject = 'Vật lý';
    else if (fileName.includes('hóa') || fileName.includes('hoa')) detectedSubject = 'Hóa học';
    else if (fileName.includes('sinh') || fileName.includes('sinh hoc')) detectedSubject = 'Sinh học';
    else if (fileName.includes('lịch sử') || fileName.includes('lich su')) detectedSubject = 'Lịch sử';
    else if (fileName.includes('địa') || fileName.includes('dia li') || fileName.includes('địa lí')) detectedSubject = 'Địa lý';
    else if (fileName.includes('anh') || fileName.includes('tiếng anh') || fileName.includes('english')) detectedSubject = 'Tiếng Anh';
    else if (fileName.includes('công nghệ') || fileName.includes('cong nghe')) detectedSubject = 'Công nghệ';

    // Detect Grade
    for (let g = 6; g <= 12; g++) {
      if (
        fileName.includes(`lớp ${g}`) ||
        fileName.includes(`lop ${g}`) ||
        fileName.includes(` ${g} `) ||
        fileName.includes(`toán ${g}`) ||
        fileName.includes(`toan ${g}`) ||
        fileName.includes(`tin ${g}`) ||
        fileName.includes(`khtn ${g}`) ||
        fileName.includes(`văn ${g}`) ||
        fileName.includes(`${g}.pdf`) ||
        fileName.includes(`${g} tập`) ||
        fileName.includes(`${g} tap`)
      ) {
        detectedGrade = `Lớp ${g}`;
        break;
      }
    }

    // Detect Volume
    if (fileName.includes('tập 1') || fileName.includes('tap 1') || fileName.includes('t1')) {
      detectedVolume = 'Tập 1';
    } else if (fileName.includes('tập 2') || fileName.includes('tap 2') || fileName.includes('t2')) {
      detectedVolume = 'Tập 2';
    } else {
      detectedVolume = 'Cả năm / Không phân tập';
    }

    return {
      extractedText: fullExtractedText.trim(),
      pageCount,
      detectedSubject,
      detectedGrade,
      detectedVolume,
    };
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return {
      extractedText: '',
      pageCount: 0,
    };
  }
}
