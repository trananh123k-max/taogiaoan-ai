import React from 'react';
import katex from 'katex';
import { ImageSlot } from '../types';
import { ImageIcon } from 'lucide-react';
import { separateNlsBlocks, stripNlsIntegrationTags } from '../utils/docxExporter';

interface MathRendererProps {
  text: string;
  slotMap?: Map<string, ImageSlot>;
  className?: string;
  nlsRed?: boolean;
  suppressNlsTags?: boolean;
}

/**
 * MathRenderer component:
 * 1. Renders LaTeX math / chemistry formulas written as $...$ or $$...$$
 * 2. Resolves {{IMAGE_SLOT_X}} tokens into real image cards
 * 3. Keeps formulas accurate and crystal clear for Math, Physics, Chemistry
 * 4. Renders NLS integration blocks and indicator codes in vivid red (unless suppressNlsTags is true)
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  text,
  slotMap,
  className = '',
  nlsRed = false,
  suppressNlsTags = false,
}) => {
  if (!text) return null;

  // First handle Image Slots if any
  const slotRegex = /(\{\{IMAGE_SLOT_\d+\}\})/g;
  const hasSlots = slotMap && slotRegex.test(text);

  if (hasSlots) {
    const parts = text.split(slotRegex);
    return (
      <div className={className}>
        {parts.map((part, i) => {
          if (/^\{\{IMAGE_SLOT_\d+\}\}$/.test(part.trim())) {
            const slot = slotMap?.get(part.trim());
            if (slot && slot.base64Data) {
              return (
                <div
                  key={i}
                  className="my-3 p-3 rounded-lg bg-white border border-slate-300 shadow-xs max-w-md mx-auto text-center"
                >
                  <div className="relative inline-block overflow-hidden rounded border border-slate-200">
                    <img
                      src={`data:${slot.mimeType};base64,${slot.base64Data}`}
                      alt={slot.name}
                      className="max-h-56 w-auto object-contain mx-auto"
                    />
                  </div>
                  <p className="text-xs text-slate-700 font-medium italic mt-2">
                    {slot.caption || slot.name}
                  </p>
                </div>
              );
            } else {
              return (
                <div
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 my-1 rounded border border-slate-300 bg-white text-slate-800 font-mono text-xs"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{part}</span>
                </div>
              );
            }
          }
          return <React.Fragment key={i}>{renderMathFragments(part, nlsRed, suppressNlsTags)}</React.Fragment>;
        })}
      </div>
    );
  }

  return <span className={className || undefined}>{renderMathFragments(text, nlsRed, suppressNlsTags)}</span>;
};

/**
 * Helper to parse and render LaTeX fragments within text
 */
function renderMathFragments(content: string, nlsRed: boolean = false, suppressNlsTags: boolean = false): React.ReactNode {
  if (!content) return null;

  // Match $$...$$ (display math) or $...$ (inline math)
  const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
  if (!mathRegex.test(content)) {
    return renderTextWithHighlights(content, nlsRed, suppressNlsTags);
  }

  const parts = content.split(mathRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const formula = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(formula, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="my-2 block text-center overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return (
              <code key={index} className="font-mono text-slate-800 bg-slate-100 px-1 rounded">
                {part}
              </code>
            );
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const formula = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(formula, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="inline-block px-0.5 align-baseline"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return (
              <code key={index} className="font-mono text-slate-800 bg-slate-100 px-1 rounded">
                {part}
              </code>
            );
          }
        }

        return <React.Fragment key={index}>{renderTextWithHighlights(part, nlsRed, suppressNlsTags)}</React.Fragment>;
      })}
    </>
  );
}

/**
 * Highlights digital competency codes (e.g. NLa, NLc) and (AI) in blue,
 * or NLS blocks and indicators in red (unless suppressNlsTags is active).
 */
function renderTextWithHighlights(text: string, nlsRed: boolean = false, suppressNlsTags: boolean = false): React.ReactNode {
  if (!text) return null;

  const processed = suppressNlsTags ? stripNlsIntegrationTags(text) : separateNlsBlocks(text);
  // Split by \n or <br> or <br/> or <br />
  const lineParts = processed.split(/(?:<br\s*\/?>|\n)/gi);
  if (lineParts.length > 1) {
    return (
      <>
        {lineParts.map((lp, lpIdx) => (
          <React.Fragment key={lpIdx}>
            {lpIdx > 0 && <br />}
            {renderSingleLineHighlights(lp, nlsRed, suppressNlsTags)}
          </React.Fragment>
        ))}
      </>
    );
  }

  return renderSingleLineHighlights(processed, nlsRed, suppressNlsTags);
}

function renderSingleLineHighlights(text: string, nlsRed: boolean = false, suppressNlsTags: boolean = false): React.ReactNode {
  if (!text) return null;

  const trimmed = text.trim();

  // 1. Check for [Tích hợp NLS], [Tích hợp AI], etc. title tag
  const titleTagMatch = trimmed.match(/^(\*|-)?\s*(\[Tích hợp[^\]]*\])/i);
  if (titleTagMatch) {
    if (suppressNlsTags) return null;
    return <span className="font-bold text-red-600 block mt-2 mb-1">{titleTagMatch[2]}</span>;
  }

  // 2. Check for NLS / AI indicator action line like "(NLS 5.2.TC1b)", "(AI 6.A1.1)", "[NLS ...]"
  const nlsOrAiIndicatorRegex = /(\((?:NLS|AI)\s+[0-9a-zA-Z\.]+\)|\[(?:NLS|AI)\s+[0-9a-zA-Z\.]+\])/gi;
  if (nlsOrAiIndicatorRegex.test(text)) {
    if (suppressNlsTags) {
      return <span className="text-slate-900 block">{text}</span>;
    }
    const parts = text.split(nlsOrAiIndicatorRegex);
    return (
      <span className="text-red-600 font-medium block">
        {parts.map((p, pIdx) => {
          if (nlsOrAiIndicatorRegex.test(p)) {
            return <strong key={pIdx} className="font-bold text-red-600">{p}</strong>;
          }
          return <React.Fragment key={pIdx}>{p}</React.Fragment>;
        })}
      </span>
    );
  }

  // 3. If nlsRed is explicitly requested (e.g. Math NLS list in Section I)
  if (nlsRed) {
    const codeMatch = trimmed.match(/^(\d+\.\d+\.TC[0-9a-zA-Z]+:?)(.*)$/i);
    if (codeMatch) {
      return (
        <span className="text-red-600 font-medium block">
          <strong className="font-bold text-red-600">{codeMatch[1]}</strong>
          {codeMatch[2]}
        </span>
      );
    }
    return <span className="text-red-600 font-medium">{text}</span>;
  }

  // Check if text is a Roman numeral heading (e.g. "I. THÔNG TIN VÀ DỮ LIỆU:") or numbered section heading (e.g. "1. Thấy gì? Biết gì ?")
  const isNumberedHeading = /^\s*(?:[IVXLCDM]+\.|\d+\.|\b[a-e]\))\s+[A-ZÀ-Ỵ0-9\?]/i.test(text) || /^[IVXLCDM]+\.\s+/i.test(text);

  // Parse markdown bold **text** first
  const boldRegex = /(\*\*[^*]+\*\*)/g;
  const boldParts = text.split(boldRegex);

  const renderedContent = boldParts.map((bPart, bIdx) => {
    if (bPart.startsWith('**') && bPart.endsWith('**')) {
      const boldText = bPart.slice(2, -2);
      return <strong key={bIdx} className="font-bold text-slate-950">{renderCompetencyTags(boldText)}</strong>;
    }
    return <React.Fragment key={bIdx}>{renderCompetencyTags(bPart)}</React.Fragment>;
  });

  if (isNumberedHeading) {
    return <span className="font-bold text-slate-950 block mt-2.5 mb-1 first:mt-0">{renderedContent}</span>;
  }

  return <>{renderedContent}</>;
}

function renderCompetencyTags(text: string): React.ReactNode {
  if (!text) return null;
  // Match NL[a-e] with optional number, or (AI)
  const regex = /(NL[a-eA-E]\d?|\(AI\))/g;
  const parts = text.split(regex);
  return (
    <>
      {parts.map((p, i) => {
        if (regex.test(p)) {
          return <span key={i} className="text-blue-600 font-bold">{p}</span>;
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}
