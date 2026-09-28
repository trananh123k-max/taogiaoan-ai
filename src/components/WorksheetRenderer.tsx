import React from 'react';
import { MathRenderer } from './MathRenderer';
import { ImageSlot } from '../types';
import {
  normalizeWorksheetMarkdown,
  ensureWorksheetHasAnswerKey,
  isTeacherHeading,
  isAnswerTableLine,
} from '../utils/worksheetUtils';

interface WorksheetRendererProps {
  content: string;
  type?: 'worksheet' | 'rubric';
  slotMap?: Map<string, ImageSlot>;
}

interface MarkdownTableData {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
  isAnswerTable?: boolean;
}

interface ContentBlock {
  type: 'title' | 'teacher-title' | 'metadata' | 'subheading' | 'table' | 'paragraph';
  text: string;
  tableData?: MarkdownTableData;
}

/**
 * Parses markdown text containing titles, student metadata, markdown tables, and text sections
 */
export const WorksheetRenderer: React.FC<WorksheetRendererProps> = ({
  content,
  slotMap,
}) => {
  if (!content) return null;

  const guaranteed = ensureWorksheetHasAnswerKey(content);
  const normalized = normalizeWorksheetMarkdown(guaranteed);
  const blocks = parseContentToBlocks(normalized);

  return (
    <div className="space-y-4 text-slate-800 text-[13pt] leading-relaxed">
      {blocks.map((block, idx) => {
        if (block.type === 'teacher-title') {
          return (
            <div key={idx} className="mt-8 mb-4 pt-4 border-t-2 border-emerald-500/40">
              <div className="flex items-center justify-between gap-2 flex-wrap bg-emerald-50/80 p-3 rounded-lg border border-emerald-200">
                <h3 className="text-base md:text-lg font-extrabold text-emerald-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block shrink-0" />
                  <MathRenderer text={block.text} slotMap={slotMap} />
                </h3>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Dành cho Giáo viên & Hướng dẫn chấm
                </span>
              </div>
            </div>
          );
        }

        if (block.type === 'title') {
          return (
            <div key={idx} className="text-center my-3">
              <h3 className="text-base md:text-lg font-extrabold text-slate-900 uppercase tracking-wide">
                <MathRenderer text={block.text} slotMap={slotMap} />
              </h3>
            </div>
          );
        }

        if (block.type === 'metadata') {
          return (
            <div
              key={idx}
              className="text-center font-medium text-slate-700 italic text-xs md:text-sm my-2 bg-slate-50/80 py-1.5 px-3 rounded-lg border border-slate-200/80 inline-block w-full"
            >
              <MathRenderer text={block.text} slotMap={slotMap} />
            </div>
          );
        }

        if (block.type === 'subheading') {
          return (
            <div key={idx} className="font-bold text-slate-900 mt-3 mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-700 inline-block shrink-0" />
              <span>
                <MathRenderer text={block.text} slotMap={slotMap} />
              </span>
            </div>
          );
        }

        if (block.type === 'table') {
          const tableData = block.tableData!;
          const isAnswer = tableData.isAnswerTable;

          return (
            <div
              key={idx}
              className={`my-3 overflow-x-auto rounded-lg border shadow-2xs ${
                isAnswer ? 'border-emerald-600 ring-1 ring-emerald-500/20' : 'border-slate-700'
              }`}
            >
              <table className="w-full border-collapse text-xs md:text-sm">
                <thead>
                  <tr className={isAnswer ? 'bg-emerald-100/80 border-b border-emerald-600' : 'bg-slate-100 border-b border-slate-700'}>
                    {tableData.headers.map((h, hIdx) => {
                      const align = tableData.alignments[hIdx] || 'center';
                      const isLast = hIdx === tableData.headers.length - 1;
                      return (
                        <th
                          key={hIdx}
                          className={`p-2.5 font-bold ${
                            isAnswer ? 'text-emerald-950 border-r border-emerald-400' : 'text-slate-900 border-r border-slate-700'
                          } ${isLast ? 'border-r-0' : ''} text-${align} align-middle`}
                        >
                          <MathRenderer text={h} slotMap={slotMap} />
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className={isAnswer ? 'divide-y divide-emerald-300' : 'divide-y divide-slate-400'}>
                  {tableData.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={
                        isAnswer
                          ? rIdx % 2 === 1
                            ? 'bg-emerald-50/40 hover:bg-emerald-100/50'
                            : 'bg-white hover:bg-emerald-50/30'
                          : rIdx % 2 === 1
                          ? 'bg-slate-50/70 hover:bg-slate-100'
                          : 'bg-white hover:bg-slate-100'
                      }
                    >
                      {row.map((cell, cIdx) => {
                        const align = tableData.alignments[cIdx] || 'left';
                        const isShort =
                          cell.trim().length <= 10 ||
                          /^\d+$/.test(cell.trim()) ||
                          /^bước\s*\d+$/i.test(cell.trim());
                        const isLast = cIdx === row.length - 1;

                        return (
                          <td
                            key={cIdx}
                            className={`p-2.5 text-slate-800 ${
                              isAnswer ? 'border-r border-emerald-300' : 'border-r border-slate-400'
                            } ${isLast ? 'border-r-0' : ''} align-top ${
                              isShort || align === 'center' ? 'text-center font-medium' : 'text-justify'
                            } ${isAnswer && cIdx === 2 ? 'font-medium text-slate-900' : ''}`}
                          >
                            <MathRenderer text={cell} slotMap={slotMap} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Standard text paragraph
        return (
          <div key={idx} className="text-justify my-1.5 whitespace-pre-wrap">
            <MathRenderer text={block.text} slotMap={slotMap} />
          </div>
        );
      })}
    </div>
  );
};

function parseContentToBlocks(content: string): ContentBlock[] {
  const lines = content.split('\n');
  const blocks: ContentBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Skip horizontal rules (---, ***, ___, <hr>)
    if (trimmed === '---' || trimmed === '***' || trimmed === '___' || /^[-*_]{3,}$/.test(trimmed) || /^<hr\s*\/?>$/i.test(trimmed)) {
      i++;
      continue;
    }

    // Check for Markdown Table: line starting with | and contains |
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length >= 3) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      const tableData = parseMarkdownTable(tableLines);
      if (tableData) {
        blocks.push({
          type: 'table',
          text: tableLines.join('\n'),
          tableData,
        });
        continue;
      }
    }

    // Check for Teacher Answer Key Title
    if (isTeacherHeading(trimmed)) {
      const cleanTitle = trimmed.replace(/^#+\s*/, '').replace(/\*+/g, '');
      blocks.push({
        type: 'teacher-title',
        text: cleanTitle,
      });
      i++;
      continue;
    }

    // Check for Main Title (Phiếu học tập, Hướng dẫn thực hành...)
    const isMainTitle =
      /^(?:#+\s*)?(?:PHẦN\s+\d+[:\.\-]?\s*)?(?:PHIẾU\s+HỌC\s+TẬP|PHIẾU\s+HƯỚNG\s+DẪN|HƯỚNG\s+DẪN\s+THỰC\s+HÀNH|BẢNG\s+TIÊU\s+CHÍ|RUBRIC|BÀI\s+\d+|CHỦ\s+ĐỀ|NHIỆM\s+VỤ\s+THỰC\s+HÀNH)/i.test(
        trimmed
      ) ||
      /^PHẦN\s+\d+[:\.\-]?\s*(?:PHIẾU|BÀI|NỘI DUNG)/i.test(trimmed) ||
      /^#+\s+(PHIẾU|HƯỚNG DẪN|RUBRIC|BÀI)/i.test(trimmed) ||
      (/^PHIẾU\s+/i.test(trimmed) && trimmed.length < 120);

    if (isMainTitle) {
      const cleanTitle = trimmed.replace(/^#+\s*/, '').replace(/\*+/g, '');
      blocks.push({
        type: 'title',
        text: cleanTitle,
      });
      i++;
      continue;
    }

    // Check for Metadata (Họ và tên, Nhóm, Lớp, Thời gian...)
    const isMetadata =
      /^(họ và tên|họ tên|tên học sinh|tên nhóm|lớp|nhóm|thời gian|trường|ngày thực hiện)[:\s]/i.test(trimmed) ||
      (/(\.{4,}|_{4,})/.test(trimmed) && trimmed.length < 150);

    if (isMetadata && (trimmed.toLowerCase().includes('lớp') || trimmed.toLowerCase().includes('nhóm') || trimmed.toLowerCase().includes('tên') || trimmed.toLowerCase().includes('thời gian'))) {
      blocks.push({
        type: 'metadata',
        text: trimmed.replace(/\*+/g, ''),
      });
      i++;
      continue;
    }

    // Check for Subheading (1. Mục tiêu, A. Nhiệm vụ, Phần I,...)
    const isSubheading =
      /^(phần\s+[ivxabc\d]+|\d+\.|\b[a-e]\))\s+[A-ZÀ-Ỵ]/i.test(trimmed) ||
      /^#+\s+/.test(trimmed) ||
      (trimmed.endsWith(':') && trimmed.length < 100);

    if (isSubheading) {
      blocks.push({
        type: 'subheading',
        text: trimmed.replace(/^#+\s*/, ''),
      });
      i++;
      continue;
    }

    // Regular paragraph
    blocks.push({
      type: 'paragraph',
      text: trimmed,
    });
    i++;
  }

  return blocks;
}

function parseMarkdownTable(lines: string[]): MarkdownTableData | null {
  if (lines.length < 2) return null;

  // Header row
  const headerLine = lines[0];
  const headers = headerLine
    .split('|')
    .slice(1, -1)
    .map((h) => h.trim().replace(/\*+/g, ''));

  if (headers.length === 0) return null;

  const alignments: ('left' | 'center' | 'right')[] = headers.map(() => 'left');
  const rows: string[][] = [];
  const isAnswerTable = isAnswerTableLine(headers.join(' ')) || headers.length >= 4;

  for (let r = 1; r < lines.length; r++) {
    const line = lines[r].trim();
    if (!line.includes('|')) continue;

    // Check if this row is a separator row (|:---|:---:|---|)
    if (/^\|?[\s\-:]+\|/.test(line)) {
      const sepParts = line.split('|').slice(1, -1);
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
      continue;
    }

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    // Skip if all cells are separator dashes or empty
    const isAllDashes = cells.every((c) => /^[\s\-:]*$/.test(c));
    if (isAllDashes) continue;

    const cell0Clean = (cells[0] || '').replace(/[\*\_]+/g, '').trim();
    const cell1Clean = (cells[1] || '').replace(/[\*\_]+/g, '').trim();

    // Skip duplicate header row anywhere in table body
    const isDuplicateHeader =
      /^(stt|tt|#|stt\s*\/\s*tt)$/i.test(cell0Clean) &&
      (/nhiệm vụ|câu hỏi|bước|yêu cầu/i.test(cell1Clean) ||
       cell1Clean.toLowerCase() === headers[1]?.toLowerCase());
    if (isDuplicateHeader) continue;

    // Skip empty dummy rows where only STT exists and all other cells are completely blank
    const otherCells = cells.slice(1);
    const hasAnySubstantiveContent = otherCells.some(
      (c) => c.trim().length > 0 && !/^[\s\.\-_]+$/.test(c)
    );
    if (cells.length > 1 && !hasAnySubstantiveContent && /^\d+$/.test(cell0Clean)) {
      continue;
    }

    // Pad or slice to match headers length
    while (cells.length < headers.length) cells.push('');
    const sliced = cells.slice(0, headers.length);

    // If this is an answer table and answer column (index 2) is blank or dots, provide clear answer
    if (isAnswerTable && sliced.length >= 3) {
      const taskText = sliced[1];
      const answerText = sliced[2];
      const isAnswerBlank =
        !answerText ||
        /^[\s\.\-_]+$/.test(answerText) ||
        answerText.toLowerCase().includes('nhiệm vụ / câu hỏi') ||
        answerText.toLowerCase().includes('gợi ý đáp án / yêu cầu') ||
        answerText.trim() === '...';

      if (isAnswerBlank) {
        sliced[2] =
          taskText && taskText.trim().length > 0
            ? `- Học sinh thực hiện đúng và đầy đủ yêu cầu: ${taskText.replace(/\*+/g, '')}.<br>- Trình bày câu trả lời, lời giải hoặc kết quả chính xác theo SGK.`
            : `- Học sinh hoàn thành chính xác nhiệm vụ và ghi lại kết quả đúng theo yêu cầu.<br>- Nắm vững kiến thức trọng tâm bài học.`;
      }
      if (sliced.length >= 4 && (!sliced[3] || /^[\s\.\-_]+$/.test(sliced[3]))) {
        sliced[3] = 'Đạt / 5.0 điểm';
      }
    }

    rows.push(sliced);
  }

  return {
    headers,
    alignments,
    rows,
    isAnswerTable,
  };
}

