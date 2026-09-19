import React from 'react';
import { MathRenderer } from './MathRenderer';
import { ImageSlot } from '../types';
import { normalizeWorksheetMarkdown } from '../utils/docxExporter';

interface WorksheetRendererProps {
  content: string;
  type?: 'worksheet' | 'rubric';
  slotMap?: Map<string, ImageSlot>;
}

interface MarkdownTableData {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
}

/**
 * Parses markdown text containing titles, student metadata, markdown tables, and text sections
 */
export const WorksheetRenderer: React.FC<WorksheetRendererProps> = ({
  content,
  slotMap,
}) => {
  if (!content) return null;

  const normalized = normalizeWorksheetMarkdown(content);
  const blocks = parseContentToBlocks(normalized);

  return (
    <div className="space-y-4 text-slate-800 text-[13pt] leading-relaxed">
      {blocks.map((block, idx) => {
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
          return (
            <div key={idx} className="my-3 overflow-x-auto rounded border border-slate-700 shadow-2xs">
              <table className="w-full border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-700">
                    {tableData.headers.map((h, hIdx) => {
                      const align = tableData.alignments[hIdx] || 'center';
                      return (
                        <th
                          key={hIdx}
                          className={`p-2.5 font-bold text-slate-900 border-r last:border-r-0 border-slate-700 text-${align} align-middle`}
                        >
                          <MathRenderer text={h} slotMap={slotMap} />
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-400">
                  {tableData.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 1 ? 'bg-slate-50/70 hover:bg-slate-100' : 'bg-white hover:bg-slate-100'}
                    >
                      {row.map((cell, cIdx) => {
                        const align = tableData.alignments[cIdx] || 'left';
                        const isShort = cell.trim().length <= 10 || /^\d+$/.test(cell.trim()) || /^bước\s*\d+$/i.test(cell.trim());
                        return (
                          <td
                            key={cIdx}
                            className={`p-2.5 text-slate-800 border-r last:border-r-0 border-slate-400 align-top ${
                              isShort || align === 'center' ? 'text-center font-medium' : 'text-justify'
                            }`}
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

interface ContentBlock {
  type: 'title' | 'metadata' | 'subheading' | 'table' | 'paragraph';
  text: string;
  tableData?: MarkdownTableData;
}

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

    // Check for Main Title (Phiếu học tập, Hướng dẫn thực hành, Bảng rubric...)
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
      /(\.{4,}|_{4,})/.test(trimmed) && trimmed.length < 150;

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
      /^(phần\s+[ivxabc]+|\d+\.|\b[a-e]\))\s+[A-ZÀ-Ỵ]/i.test(trimmed) ||
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

  // Separator row (line 1)
  let startRowIdx = 1;
  const alignments: ('left' | 'center' | 'right')[] = headers.map(() => 'left');

  if (lines.length > 1 && /^\|?[\s\-:]+\|/.test(lines[1])) {
    const sepParts = lines[1].split('|').slice(1, -1);
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

  // Data rows
  const rows: string[][] = [];
  for (let r = startRowIdx; r < lines.length; r++) {
    const line = lines[r];
    if (!line.includes('|')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    // Pad or slice to match headers length
    while (cells.length < headers.length) cells.push('');
    rows.push(cells.slice(0, headers.length));
  }

  return {
    headers,
    alignments,
    rows,
  };
}
