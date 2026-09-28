/**
 * Utility functions for handling learning worksheets (Phiếu học tập)
 * and answer keys (Bảng gợi ý đáp án & Hướng dẫn đánh giá).
 */

export interface WorksheetTaskItem {
  stt: string;
  task: string;
  answer?: string;
  score?: string;
}

/**
 * Checks if a string or array of cells indicates an answer table (for teachers)
 */
export function isAnswerTableLine(str: string): boolean {
  const lower = str.toLowerCase();
  return (
    lower.includes('đáp án') ||
    lower.includes('gợi ý') ||
    lower.includes('yêu cầu cần đạt') ||
    lower.includes('hướng dẫn chấm') ||
    lower.includes('thang điểm') ||
    lower.includes('biểu điểm') ||
    lower.includes('điểm / đánh giá') ||
    lower.includes('đánh giá') ||
    lower.includes('kết quả chuẩn') ||
    lower.includes('lời giải')
  );
}

/**
 * Checks if a text line is a section heading for the teacher's answer key
 */
export function isTeacherHeading(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.includes('gợi ý đáp án') ||
    lower.includes('đáp án') ||
    lower.includes('hướng dẫn đánh giá') ||
    lower.includes('hướng dẫn chấm') ||
    lower.includes('thang điểm') ||
    lower.includes('biểu điểm') ||
    lower.includes('dành cho giáo viên') ||
    lower.includes('phần 2') ||
    lower.includes('phần ii') ||
    lower.includes('bảng 2') ||
    lower.includes('lời giải chi tiết')
  );
}

/**
 * Normalizes worksheet markdown text so both Part 1 (Student Worksheet)
 * and Part 2 (Teacher Answer Table) have pristine Markdown table syntax,
 * correct column counts, and preserves 100% of answer content.
 */
export function normalizeWorksheetMarkdown(raw: string): string {
  if (!raw) return '';
  let text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Handle literal escaped newlines "\n"
  text = text.replace(/\\n/g, '\n');

  // Separate major headers / metadata if text precedes table header on same line without pipe
  text = text.replace(/^([^|\n]+)(\|\s*(?:STT|Nhiệm vụ|Câu hỏi|Bước|Nội dung)[\s|])/gim, '$1\n\n$2');
  text = text.replace(/(PHẦN\s+\d+[^:\n]*:[^\n.]+[\.\:])\s*(Họ và tên|Họ tên|Tên học sinh)/gi, '$1\n$2');
  text = text.replace(/(PHIẾU HỌC TẬP[^\n.]+[\.\:])\s*(Họ và tên|Họ tên|Tên học sinh)/gi, '$1\n$2');

  // Separate inline table rows joined on same line
  text = text.replace(/(^\|[^\n]+\|)\s*(?=\|[^\n]+\|)/gim, '$1\n');

  const lines = text.split('\n');
  const resultLines: string[] = [];
  let currentSection: 'student' | 'teacher' | 'other' = 'other';
  let insideTable = false;
  let previousLineWasHeader = false;

  const defaultDots = '....................................................................................<br>....................................................................................<br>....................................................................................<br>....................................................................................';

  for (let idx = 0; idx < lines.length; idx++) {
    let line = lines[idx].trim();
    if (!line) {
      insideTable = false;
      previousLineWasHeader = false;
      resultLines.push('');
      continue;
    }

    // Section detection from headings
    if (isTeacherHeading(line)) {
      currentSection = 'teacher';
      insideTable = false;
      previousLineWasHeader = false;
      resultLines.push(line);
      continue;
    } else if (/PHIẾU HỌC TẬP|DÀNH CHO HỌC SINH|PHẦN 1|PHẦN I\b/i.test(line) && !isTeacherHeading(line)) {
      currentSection = 'student';
      insideTable = false;
      previousLineWasHeader = false;
      resultLines.push(line);
      continue;
    }

    // Check if line is a table row
    if (line.startsWith('|') && line.endsWith('|') && line.split('|').length >= 3) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      const firstCellClean = (cells[0] || '').replace(/[\*\_]+/g, '').trim();
      const isNumericRow = /^(\d+|câu\s*\d+|bài\s*\d+|bước\s*\d+|[a-z]\))$/i.test(firstCellClean);
      const isSeparator = /^[\s\-:]+$/.test(firstCellClean) || /^\|?[\s\-:]+\|/.test(line);

      if (isSeparator) {
        resultLines.push(line);
        previousLineWasHeader = false;
        continue;
      }

      const isHeader = !isNumericRow && /^(stt|tt|#|stt\s*\/\s*tt)$/i.test(firstCellClean);

      // Check if table itself indicates teacher answer table by its cells or 4 columns
      const tableCellsString = cells.join(' ');
      const looksLikeAnswerTable = isAnswerTableLine(tableCellsString) || cells.length >= 4;

      if (looksLikeAnswerTable) {
        currentSection = 'teacher';
      }

      // If we encounter a header row:
      if (isHeader) {
        // Skip ONLY if previous line in the SAME table block was already a header
        if (insideTable && previousLineWasHeader) {
          continue;
        }

        insideTable = true;
        previousLineWasHeader = true;

        if (currentSection === 'teacher' || looksLikeAnswerTable) {
          line = '| STT | Nhiệm vụ / Câu hỏi học tập | Gợi ý đáp án / Yêu cầu cần đạt | Điểm / Đánh giá |';
        } else {
          line = '| STT | Nhiệm vụ / Câu hỏi học tập | Kết quả / Câu trả lời của học sinh |';
        }

        resultLines.push(line);

        // Ensure separator follows header
        const nextLine = idx + 1 < lines.length ? lines[idx + 1].trim() : '';
        if (!/^\|?[\s\-:]+\|/.test(nextLine)) {
          const colCount = line.split('|').length - 2;
          resultLines.push('|' + Array(colCount).fill('---').join('|') + '|');
        }
        continue;
      }

      insideTable = true;
      previousLineWasHeader = false;

      // Skip empty dummy rows where only STT is present and all other cells are empty
      const otherCells = cells.slice(1);
      const hasAnySubstantiveContent = otherCells.some(
        (c) => c.trim().length > 0 && !/^[\s\.\-_]+$/.test(c)
      );
      if (isNumericRow && !hasAnySubstantiveContent) {
        continue;
      }

      // Data row processing
      if (currentSection === 'teacher' || looksLikeAnswerTable) {
        let col1 = cells[0] || '1';
        let col2 = cells[1] || '';
        let col3 = cells[2] || '';
        let col4 = cells[3] || 'Đạt / 5.0 điểm';

        // Ensure teacher answer is NEVER blank or replaced with dots
        const isAnswerBlank =
          !col3 ||
          /^[\s\.\-_]+$/.test(col3) ||
          col3.toLowerCase().includes('nhiệm vụ / câu hỏi') ||
          col3.toLowerCase().includes('gợi ý đáp án / yêu cầu') ||
          col3.trim() === '...';

        if (isAnswerBlank) {
          col3 =
            col2 && col2.trim().length > 0
              ? `- Học sinh thực hiện đúng và đầy đủ yêu cầu: ${col2.replace(/\*+/g, '')}.<br>- Trình bày câu trả lời, lời giải hoặc kết quả chính xác theo chuẩn kiến thức.`
              : `- Hoàn thành chính xác nhiệm vụ và ghi lại kết quả đúng theo yêu cầu.<br>- Nắm vững kiến thức trọng tâm bài học.`;
        }

        if (!col4 || /^[\s\.\-_]+$/.test(col4)) {
          col4 = 'Đạt / 5.0 điểm';
        }

        line = `| ${col1} | ${col2} | ${col3} | ${col4} |`;
      } else {
        // Student row
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
      }
    } else {
      insideTable = false;
      previousLineWasHeader = false;
    }

    resultLines.push(line);
  }

  return resultLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Ensures that worksheetContent ALWAYS contains Part 2 (Bảng gợi ý đáp án & Hướng dẫn đánh giá).
 * If Part 2 is missing or lacks answers, automatically generates/supplements it based on Part 1 tasks
 * and lesson plan activities context.
 */
export function ensureWorksheetHasAnswerKey(content: string, planContext?: any): string {
  if (!content || typeof content !== 'string') {
    content = '';
  }

  const normalized = normalizeWorksheetMarkdown(content);

  // Check if Part 2 / Answer table is already present with substantive rows
  const hasTeacherHeading = isTeacherHeading(normalized);
  const lines = normalized.split('\n');
  let teacherTableRows = 0;
  let isInsideTeacherTable = false;

  for (const line of lines) {
    if (isTeacherHeading(line)) {
      isInsideTeacherTable = true;
      continue;
    }
    if (isInsideTeacherTable && line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      const firstCellClean = (cells[0] || '').replace(/[\*\_]+/g, '').trim();
      const isNumeric = /^(\d+|câu\s*\d+|bài\s*\d+|[a-z]\))$/i.test(firstCellClean);
      if (isNumeric) {
        teacherTableRows++;
      }
    }
  }

  // If Part 2 is already present with at least 1 data row, return normalized
  if (hasTeacherHeading && teacherTableRows > 0) {
    return normalized;
  }

  // Otherwise, Part 2 is missing! Let's extract tasks from Part 1
  const studentTasks: WorksheetTaskItem[] = [];
  let taskCounter = 1;

  for (const line of lines) {
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      const firstCellClean = (cells[0] || '').replace(/[\*\_]+/g, '').trim();
      const isNumeric = /^(\d+|câu\s*\d+|bài\s*\d+|[a-z]\))$/i.test(firstCellClean);
      const isHeader = /^(stt|tt|#)$/i.test(firstCellClean);
      const isSep = /^[\s\-:]+$/.test(firstCellClean);

      if (isNumeric && !isHeader && !isSep && cells.length >= 2) {
        const taskText = cells[1].trim();
        if (taskText.length > 0) {
          studentTasks.push({
            stt: firstCellClean,
            task: taskText,
          });
          taskCounter++;
        }
      }
    }
  }

  // If no tasks found in Part 1 table, try extracting from planContext activities (Activity 3 Luyện tập or Activity 2)
  if (studentTasks.length === 0 && planContext?.activities) {
    const act3 = planContext.activities[2] || planContext.activities.find((a: any) => /luyện\s*tập/i.test(a?.name || ''));
    const act2 = planContext.activities[1];

    const sourceAct = act3 || act2;
    if (sourceAct) {
      const contentText = sourceAct.content || sourceAct.productSummary || '';
      const lines = contentText.split('\n').map((l: string) => l.trim()).filter(Boolean);
      let num = 1;

      for (const line of lines) {
        if (/^(bài\s*\d+|câu\s*\d+|\d+\.)/i.test(line)) {
          studentTasks.push({
            stt: String(num++),
            task: line.replace(/^[-*•\s]+/, ''),
            answer: sourceAct.productSummary || 'Thực hiện chính xác theo yêu cầu của bài tập và hướng dẫn SGK.',
          });
        }
      }
    }
  }

  // If still no tasks, provide 3 default learning tasks matching lesson title
  if (studentTasks.length === 0) {
    const title = planContext?.lessonTitle || 'bài học';
    studentTasks.push(
      {
        stt: '1',
        task: `Nêu khái niệm và định nghĩa trọng tâm của ${title}.`,
        answer: `Nêu đúng, đủ các định nghĩa và công thức cơ bản theo SGK.`,
      },
      {
        stt: '2',
        task: `Thực hiện giải bài tập áp dụng quy tắc/công thức của ${title}.`,
        answer: `Thực hiện đúng các bước biến đổi, áp dụng chính xác công thức và tính ra kết quả chuẩn.`,
      },
      {
        stt: '3',
        task: `Vận dụng kiến thức ${title} để giải quyết bài toán/tình huống thực tiễn.`,
        answer: `Phân tích đúng tình huống thực tiễn, mô hình hóa toán học và đưa ra kết luận chính xác.`,
      }
    );
  }

  // Formulate Part 2 Markdown Table
  const part2Header = `\n\n---\n\n### BẢNG GỢI Ý ĐÁP ÁN & HƯỚNG DẪN ĐÁNH GIÁ (DÀNH CHO GIÁO VIÊN)\n\n| STT | Nhiệm vụ / Câu hỏi học tập | Gợi ý đáp án / Yêu cầu cần đạt | Điểm / Đánh giá |\n| :---: | :--- | :--- | :---: |`;

  const part2Rows = studentTasks.map((t, idx) => {
    let ans = t.answer;
    if (!ans || /^[\s\.\-_]+$/.test(ans)) {
      // Synthesize answer based on task
      const cleanTask = t.task.replace(/\*+/g, '').trim();
      ans = `- Học sinh nắm vững và giải quyết chính xác yêu cầu: ${cleanTask}.<br>- Trình bày lời giải chi tiết, rõ ràng, áp dụng đúng kiến thức cốt lõi.`;
    }

    const score = t.score || (idx === studentTasks.length - 1 ? 'Đạt / 4.0 điểm' : 'Đạt / 3.0 điểm');
    return `| **${t.stt}** | ${t.task} | ${ans} | ${score} |`;
  });

  return `${normalized}${part2Header}\n${part2Rows.join('\n')}`;
}
