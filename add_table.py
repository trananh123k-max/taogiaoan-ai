import re

with open('src/utils/docxExporter.ts', 'r') as f:
    content = f.read()

new_func = """
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
        new TextRun({ text: act.objective || '', font: fontName }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({ text: 'Nội dung: ', bold: true, font: fontName }),
        new TextRun({ text: act.content || '', font: fontName }),
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
      if (!(/^(-|\\*)?\\s*(GV|Giáo viên)\\b/i.test(detail.teacherAction.trim())) && !(/^\\*\\s*(GV|HS)/i.test(detail.title || ''))) {
        actParas.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({ text: '- Giáo viên: ', bold: true, font: fontName }),
            ],
          })
        );
      }
      actParas.push(...parseMarkdownToDocx(detail.teacherAction, slotMap, fontName));
    }

    if (detail.studentAction) {
      if (!(/^(-|\\*)?\\s*(HS|Học sinh)\\b/i.test(detail.studentAction.trim())) && !(/^\\*\\s*(GV|HS)/i.test(detail.title || ''))) {
        actParas.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({ text: '- Học sinh: ', bold: true, font: fontName }),
            ],
          })
        );
      }
      actParas.push(...parseMarkdownToDocx(detail.studentAction, slotMap, fontName));
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
        .split('\\n')
        .map((line) => {
          let l = line.trim();
          if (!l) return '';
          l = l.replace(/\\[\\s*Vị trí ảnh[^\\]]*\\]/gi, '').trim();
          if (/^(\\*|-)?\\s*bước\\s*\\d+\\s*[:\\-–\\.]?\\s*$/i.test(l)) {
            return '';
          }
          l = l.replace(/^(\\*|-)?\\s*bước\\s*\\d+\\s*[:\\-–\\.]\\s*/i, '');
          return l;
        })
        .filter((line) => line.trim().length > 0)
        .join('\\n');
        
      if (cleaned.trim() && !rawResults.includes(cleaned.trim())) {
        rawResults.push(cleaned.trim());
      }
    }
  });
  
  const hasRichKnowledge = rawResults.some(r => /(?:^|\\s)\\d+\\.\\s+[A-ZÀ-Ỵ]/m.test(r) || r.length > 70);
  const prodResults = hasRichKnowledge
    ? rawResults.filter(r => {
        const isGeneric = /^(học sinh|hs|các nhóm|nội dung|kết quả)\\s+(tiếp nhận|nắm rõ|hiểu rõ|lắng nghe|ổn định|bắt đầu|chuẩn bị|báo cáo|thực hiện|ghi chép|ghi vở|thảo luận)\\b/i.test(r.trim()) && r.length < 90 && !/(?:^|\\s)\\d+\\.\\s+[A-ZÀ-Ỵ]/m.test(r);
        return !isGeneric;
      })
    : rawResults;
    
  if (prodResults.length === 0 && act.productSummary && act.productSummary.trim()) {
    let cleaned = repairAnswerLineBreaks(act.productSummary);
    cleaned = dedupeAnswers(cleaned).replace(/\\[\\s*Vị trí ảnh[^\\]]*\\]/gi, '').trim();
    prodResults.push(cleaned);
  }
  
  if (prodResults.length === 0) {
    prodResults.push('Học sinh hoàn thành câu hỏi, bài tập và ghi chép nội dung kiến thức trọng tâm vào vở.');
  }

  prodResults.forEach(content => {
    let expandedText = repairAnswerLineBreaks(content);
    expandedText = expandedText.replace(/(?<!\\b(?:Câu|Bài|Mục|Hình|Ví dụ|Bảng|Bước|Phần|Hoạt động|Nhiệm vụ|Tiết|Tuần|HĐ|NV)\\s*)(?<=[.?!;:]|[a-zà-ỹA-ZÀ-Ỵ0-9])\\s+([IVXLCDM]+\\.\\s+[A-ZÀ-Ỵ0-9])/g, '\\n\\n$1');
    expandedText = expandedText.replace(/(?<!\\b(?:Câu|Bài|Mục|Hình|Ví dụ|Bảng|Bước|Phần|Hoạt động|Nhiệm vụ|Tiết|Tuần|HĐ|NV)\\s*)(?<=[.?!;:]|[a-zà-ỹA-ZÀ-Ỵ0-9])\\s+(\\d+\\.\\s+[A-ZÀ-Ỵ0-9\\?])/g, '\\n\\n$1');
    expandedText = expandedText.replace(/(?<!\\b(?:Câu|Bài|Mục|Hình|Ví dụ|Bảng|Bước|Phần|Hoạt động|Nhiệm vụ|Tiết|Tuần|HĐ|NV)\\s*)(?<=[.?!;:]|[a-zà-ỹA-ZÀ-Ỵ0-9])\\s+(Câu\\s+\\d+[\\.:\\)])/gi, '\\n\\n$1');
    expandedText = expandedText.replace(/([.?!;])\\s+(- |\\* |• )/g, '$1\\n$2');
    expandedText = expandedText.replace(/([.?!;])\\s+([a-e]\\)\\s+)/g, '$1\\n$2');
    
    expandedText = expandedText.split('\\n').map((line) => {
      const romanNumberedMatch = line.match(/^(\\s*[IVXLCDM]+\\.\\s+[^:\\n]+:?)\\s+(\\d+\\.\\s+.+)$/);
      if (romanNumberedMatch) {
        return `${romanNumberedMatch[1].trim()}\\n${romanNumberedMatch[2].trim()}`;
      }
      const match = line.match(/^(\\s*(?:[IVXLCDM]+\\.|\\d+\\.)\\s+[^:\\n]+:)\\s+(.+)$/);
      if (match) {
        const header = match[1].trim();
        const body = match[2].trim();
        if (body) {
          const bodyWithDash = (/^[-•*]/.test(body) || /^\\d+\\./.test(body) || /^[IVXLCDM]+\\./.test(body)) ? body : `- ${body}`;
          return `${header}\\n${bodyWithDash}`;
        }
      }
      return line;
    }).join('\\n');

    expandedText = expandedText.split('\\n').map((line) => {
      let trimmed = line.trim();
      if (!trimmed) return '';
      trimmed = trimmed.replace(/\\[\\s*Vị trí ảnh[^\\]]*\\]/gi, '').trim();
      if (!trimmed || trimmed === '-' || trimmed === '•' || trimmed === '*') return '';
      if (/^\\{\\{IMAGE_SLOT_\\d+\\}\\}$/i.test(trimmed) || /^\\s*(?:[IVXLCDM]+\\.|\\d+\\.|\\b[a-e]\\)|\\bNhiệm vụ\\s+\\d+:|\\bMục\\s+\\d+:|\\bCâu\\s+\\d+[:\\.])/i.test(trimmed) || /^[IVXLCDM]+\\.\\s+/i.test(trimmed) || /\\[Tích hợp NLS\\]/i.test(trimmed) || /\\(NLS\\s+[0-9a-zA-Z\\.]+\\)/i.test(trimmed)) {
        return trimmed;
      }
      if (/^[•*]\\s*/.test(trimmed)) {
        return '- ' + trimmed.replace(/^[•*]\\s*/, '');
      }
      return trimmed;
    }).filter(Boolean).join('\\n');

    prodParas.push(...parseMarkdownToDocx(expandedText, slotMap, fontName));
  });
  
  // NLS logic
  const nlsParas: Paragraph[] = [];
  const nlsList = act.nlsFocus?.split(/[,;\\n]/).map(s => s.trim()).filter(Boolean) || [];
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
  const aiList = act.aiFocus?.split(/[,;\\n]/).map(s => s.trim()).filter(Boolean) || [];
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
"""

# Insert it before `function createTwoColumnPedagogicalTable`
content = content.replace(
    'function createTwoColumnPedagogicalTable(',
    new_func + '\nfunction createTwoColumnPedagogicalTable('
)

with open('src/utils/docxExporter.ts', 'w') as f:
    f.write(content)
print("Added createMath4ColumnPedagogicalTable.")
