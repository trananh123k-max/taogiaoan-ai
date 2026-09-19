import {
  Math as DocxMath,
  MathRun,
  MathFraction,
  MathSuperScript,
  MathSubScript,
  MathSubSuperScript,
  MathRadical,
  MathRoundBrackets,
  MathSquareBrackets,
  MathCurlyBrackets,
  TextRun,
} from 'docx';

/**
 * Common LaTeX mathematical symbols mapped to Unicode characters
 * used by Word Equation engine (OMML).
 */
const SYMBOL_MAP: Record<string, string> = {
  '\\pm': '±',
  '\\mp': '∓',
  '\\times': '×',
  '\\cdot': '·',
  '\\div': '÷',
  '\\le': '≤',
  '\\leq': '≤',
  '\\ge': '≥',
  '\\geq': '≥',
  '\\neq': '≠',
  '\\ne': '≠',
  '\\approx': '≈',
  '\\equiv': '≡',
  '\\sim': '∽',
  '\\cong': '≅',
  '\\propto': '∝',
  '\\in': '∈',
  '\\notin': '∉',
  '\\subset': '⊂',
  '\\subseteq': '⊆',
  '\\supset': '⊃',
  '\\supseteq': '⊇',
  '\\cup': '∪',
  '\\cap': '∩',
  '\\setminus': '∖',
  '\\emptyset': '∅',
  '\\varnothing': '∅',
  '\\forall': '∀',
  '\\exists': '∃',
  '\\nexists': '∄',
  '\\infty': '∞',
  '\\pi': 'π',
  '\\Pi': 'Π',
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\Gamma': 'Γ',
  '\\delta': 'δ',
  '\\Delta': 'Δ',
  '\\epsilon': 'ε',
  '\\varepsilon': 'ε',
  '\\zeta': 'ζ',
  '\\eta': 'η',
  '\\theta': 'θ',
  '\\Theta': 'Θ',
  '\\iota': 'ι',
  '\\kappa': 'κ',
  '\\lambda': 'λ',
  '\\Lambda': 'Λ',
  '\\mu': 'μ',
  '\\nu': 'ν',
  '\\xi': 'ξ',
  '\\rho': 'ρ',
  '\\sigma': 'σ',
  '\\Sigma': 'Σ',
  '\\tau': 'τ',
  '\\upsilon': 'υ',
  '\\phi': 'φ',
  '\\varphi': 'φ',
  '\\Phi': 'Φ',
  '\\chi': 'χ',
  '\\psi': 'ψ',
  '\\omega': 'ω',
  '\\Omega': 'Ω',
  '\\degree': '°',
  '\\angle': '∠',
  '\\measuredangle': '∡',
  '\\perp': '⊥',
  '\\parallel': '∥',
  '\\triangle': '△',
  '\\to': '→',
  '\\rightarrow': '→',
  '\\leftarrow': '←',
  '\\leftrightarrow': '↔',
  '\\Leftarrow': '⇐',
  '\\Rightarrow': '⇒',
  '\\Leftrightarrow': '⇔',
  '\\dots': '…',
  '\\ldots': '…',
  '\\cdots': '⋯',
  '\\vdots': '⋮',
  '\\ddots': '⋱',
  '\\circ': '°',
  '\\prime': '′',
};

/**
 * Extracts a balanced braced group `{...}` or next single non-whitespace token
 */
function extractGroup(str: string, pos: number): { content: string; nextPos: number } {
  while (pos < str.length && /\s/.test(str[pos])) pos++;
  if (pos >= str.length) return { content: '', nextPos: pos };

  if (str[pos] === '{') {
    let depth = 1;
    let i = pos + 1;
    while (i < str.length && depth > 0) {
      if (str[i] === '\\') {
        i += 2;
        continue;
      }
      if (str[i] === '{') depth++;
      else if (str[i] === '}') depth--;
      i++;
    }
    return { content: str.slice(pos + 1, i - 1), nextPos: i };
  }

  if (str[pos] === '\\') {
    let i = pos + 1;
    while (i < str.length && /[a-zA-Z]/.test(str[i])) i++;
    if (i === pos + 1) i++;
    return { content: str.slice(pos, i), nextPos: i };
  }

  return { content: str[pos], nextPos: pos + 1 };
}

/**
 * Extracts optional square brackets `[...]` (e.g. for `\sqrt[3]{x}`)
 */
function extractOptionalBracket(str: string, pos: number): { content: string; nextPos: number } | null {
  while (pos < str.length && /\s/.test(str[pos])) pos++;
  if (pos >= str.length || str[pos] !== '[') return null;

  let depth = 1;
  let i = pos + 1;
  while (i < str.length && depth > 0) {
    if (str[i] === '\\') {
      i += 2;
      continue;
    }
    if (str[i] === '[') depth++;
    else if (str[i] === ']') depth--;
    i++;
  }
  return { content: str.slice(pos + 1, i - 1), nextPos: i };
}

/**
 * Parses a LaTeX math string into docx Math components
 */
export function parseLatexToDocxComponents(latex: string): any[] {
  const elements: any[] = [];
  let i = 0;
  let textBuf = '';

  function flushText() {
    if (textBuf) {
      elements.push(new MathRun(textBuf));
      textBuf = '';
    }
  }

  // Pre-clean LaTeX markup
  const cleanLatex = latex
    .replace(/^\\displaystyle\s*/, '')
    .replace(/\\limits/g, '')
    .trim();

  while (i < cleanLatex.length) {
    const ch = cleanLatex[i];

    // Delimiters \left( ... \right) / \left[ ... \right] / \left\{ ... \right\}
    if (cleanLatex.startsWith('\\left(', i) || cleanLatex.startsWith('\\left[', i) || cleanLatex.startsWith('\\left\\{', i)) {
      flushText();
      const isRound = cleanLatex.startsWith('\\left(', i);
      const isSquare = cleanLatex.startsWith('\\left[', i);
      const closeTag = isRound ? '\\right)' : (isSquare ? '\\right]' : '\\right\\}');
      const openLen = isSquare || isRound ? 6 : 7;
      const closeIndex = cleanLatex.indexOf(closeTag, i + openLen);
      if (closeIndex !== -1) {
        const innerContent = cleanLatex.slice(i + openLen, closeIndex);
        const innerEls = parseLatexToDocxComponents(innerContent);
        if (isRound) {
          elements.push(new MathRoundBrackets({ children: innerEls }));
        } else if (isSquare) {
          elements.push(new MathSquareBrackets({ children: innerEls }));
        } else {
          elements.push(new MathCurlyBrackets({ children: innerEls }));
        }
        i = closeIndex + closeTag.length;
        continue;
      }
    }

    // Fractions: \frac{...}{...} or \dfrac{...}{...}
    if (cleanLatex.startsWith('\\frac', i) || cleanLatex.startsWith('\\dfrac', i)) {
      flushText();
      const fracLen = cleanLatex.startsWith('\\dfrac', i) ? 6 : 5;
      const numG = extractGroup(cleanLatex, i + fracLen);
      const denG = extractGroup(cleanLatex, numG.nextPos);
      const numEls = parseLatexToDocxComponents(numG.content);
      const denEls = parseLatexToDocxComponents(denG.content);
      elements.push(
        new MathFraction({
          numerator: numEls.length > 0 ? numEls : [new MathRun('')],
          denominator: denEls.length > 0 ? denEls : [new MathRun('')],
        })
      );
      i = denG.nextPos;
      continue;
    }

    // Radicals: \sqrt[n]{x} or \sqrt{x}
    if (cleanLatex.startsWith('\\sqrt', i)) {
      flushText();
      const degG = extractOptionalBracket(cleanLatex, i + 5);
      const nextP = degG ? degG.nextPos : i + 5;
      const exprG = extractGroup(cleanLatex, nextP);
      const exprEls = parseLatexToDocxComponents(exprG.content);
      if (degG && degG.content.trim()) {
        const degEls = parseLatexToDocxComponents(degG.content);
        elements.push(
          new MathRadical({
            children: exprEls.length > 0 ? exprEls : [new MathRun('')],
            degree: degEls,
          })
        );
      } else {
        elements.push(
          new MathRadical({
            children: exprEls.length > 0 ? exprEls : [new MathRun('')],
          })
        );
      }
      i = exprG.nextPos;
      continue;
    }

    // Text expressions: \text{...}, \mathrm{...}, \mathbf{...}
    if (
      cleanLatex.startsWith('\\text{', i) ||
      cleanLatex.startsWith('\\mathrm{', i) ||
      cleanLatex.startsWith('\\mathbf{', i)
    ) {
      flushText();
      const openIdx = cleanLatex.indexOf('{', i);
      const textG = extractGroup(cleanLatex, openIdx);
      elements.push(new MathRun(textG.content));
      i = textG.nextPos;
      continue;
    }

    // Vectors: \vec{AB} or \overrightarrow{AB}
    if (cleanLatex.startsWith('\\vec{', i) || cleanLatex.startsWith('\\overrightarrow{', i)) {
      flushText();
      const openIdx = cleanLatex.indexOf('{', i);
      const vecG = extractGroup(cleanLatex, openIdx);
      // Represent with vector arrow accent character in text
      textBuf += `${vecG.content}⃗`;
      i = vecG.nextPos;
      continue;
    }

    // LaTeX commands and symbols
    if (ch === '\\') {
      let cmdEnd = i + 1;
      while (cmdEnd < cleanLatex.length && /[a-zA-Z]/.test(cleanLatex[cmdEnd])) cmdEnd++;
      if (cmdEnd === i + 1) cmdEnd++;
      const cmd = cleanLatex.slice(i, cmdEnd);

      if (SYMBOL_MAP[cmd]) {
        textBuf += SYMBOL_MAP[cmd];
        i = cmdEnd;
        continue;
      }
      if (cmd === '\\quad' || cmd === '\\qquad') {
        textBuf += '  ';
        i = cmdEnd;
        continue;
      }
      if (cmd === '\\,' || cmd === '\\;' || cmd === '\\:') {
        textBuf += ' ';
        i = cmdEnd;
        continue;
      }
      if (cmd === '\\{' || cmd === '\\}') {
        textBuf += cmd.slice(1);
        i = cmdEnd;
        continue;
      }
      // Strip unknown backslash and keep readable keyword
      const keyword = cmd.slice(1);
      if (keyword) {
        textBuf += keyword;
      }
      i = cmdEnd;
      continue;
    }

    // Superscripts (^) and Subscripts (_)
    if (ch === '^' || ch === '_') {
      flushText();
      const isSuper = ch === '^';
      const firstG = extractGroup(cleanLatex, i + 1);
      let secondG: { content: string; nextPos: number } | null = null;
      let hasBoth = false;
      let nextPos = firstG.nextPos;

      // Check if immediately followed by the opposite script (e.g. x_1^2 or x^2_1)
      let lookAhead = nextPos;
      while (lookAhead < cleanLatex.length && /\s/.test(cleanLatex[lookAhead])) lookAhead++;
      if (
        lookAhead < cleanLatex.length &&
        ((isSuper && cleanLatex[lookAhead] === '_') || (!isSuper && cleanLatex[lookAhead] === '^'))
      ) {
        hasBoth = true;
        secondG = extractGroup(cleanLatex, lookAhead + 1);
        nextPos = secondG.nextPos;
      }

      // Base element
      const prevEl = elements.pop() || new MathRun('');
      const prevChildren = prevEl ? [prevEl] : [new MathRun('')];

      if (hasBoth && secondG) {
        const subContent = isSuper ? secondG.content : firstG.content;
        const supContent = isSuper ? firstG.content : secondG.content;
        elements.push(
          new MathSubSuperScript({
            children: prevChildren,
            subScript: parseLatexToDocxComponents(subContent),
            superScript: parseLatexToDocxComponents(supContent),
          })
        );
      } else if (isSuper) {
        // Special case: ^\circ -> degree symbol
        if (firstG.content === '\\circ' || firstG.content === 'circ') {
          if (prevEl) {
            elements.push(prevEl);
          }
          elements.push(new MathRun('°'));
        } else {
          elements.push(
            new MathSuperScript({
              children: prevChildren,
              superScript: parseLatexToDocxComponents(firstG.content),
            })
          );
        }
      } else {
        elements.push(
          new MathSubScript({
            children: prevChildren,
            subScript: parseLatexToDocxComponents(firstG.content),
          })
        );
      }
      i = nextPos;
      continue;
    }

    textBuf += ch;
    i++;
  }

  flushText();
  return elements;
}

/**
 * Creates a native Word Equation (OMML / <m:oMath>) from a LaTeX string.
 */
export function latexToDocxMath(latexFormula: string): DocxMath {
  try {
    const components = parseLatexToDocxComponents(latexFormula);
    return new DocxMath({
      children: components.length > 0 ? components : [new MathRun(latexFormula)],
    });
  } catch (e) {
    // Graceful fallback to pure MathRun if any unexpected syntax occurs
    return new DocxMath({
      children: [new MathRun(latexFormula)],
    });
  }
}

export interface TextOrMathChunk {
  type: 'text' | 'math';
  content: string;
  display?: boolean;
  raw: string;
}

/**
 * Splits text into alternating text and LaTeX math blocks ($...$, $$...$$, \(...\), \[...\])
 */
export function splitTextAndMath(text: string): TextOrMathChunk[] {
  if (!text) return [];

  const parts: TextOrMathChunk[] = [];
  const mathRegex = /(\$\$(?:\\.|[^\$])+\$\$|\$(?:\\.|[^\$])+\$|\\\[(?:\\.|[\s\S])+?\\\]|\\\((?:\\.|[\s\S])+?\\\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
        raw: text.slice(lastIndex, match.index),
      });
    }

    const raw = match[0];
    let formula = raw;
    let display = false;

    if (raw.startsWith('$$') && raw.endsWith('$$')) {
      formula = raw.slice(2, -2).trim();
      display = true;
    } else if (raw.startsWith('$') && raw.endsWith('$')) {
      formula = raw.slice(1, -1).trim();
    } else if (raw.startsWith('\\[') && raw.endsWith('\\]')) {
      formula = raw.slice(2, -2).trim();
      display = true;
    } else if (raw.startsWith('\\(') && raw.endsWith('\\)')) {
      formula = raw.slice(2, -2).trim();
    }

    parts.push({
      type: 'math',
      content: formula,
      display,
      raw,
    });

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
      raw: text.slice(lastIndex),
    });
  }

  return parts;
}
