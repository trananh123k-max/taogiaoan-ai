import JSZip from 'jszip';
import mammoth from 'mammoth';
import { ImageSlot } from '../types';

export interface ParseDocxResult {
  textWithSlots: string;
  imageSlots: ImageSlot[];
  htmlPreview: string;
  summary: {
    wordCount: number;
    imageCount: number;
    paragraphsCount: number;
  };
}

/**
 * Parses a Word .docx file, extracts images, and substitutes image positions
 * with template tags {{IMAGE_SLOT_1}}, {{IMAGE_SLOT_2}}...
 */
export async function parseDocxFile(fileOrBuffer: File | ArrayBuffer): Promise<ParseDocxResult> {
  const arrayBuffer = fileOrBuffer instanceof File 
    ? await fileOrBuffer.arrayBuffer() 
    : fileOrBuffer;

  const zip = await JSZip.loadAsync(arrayBuffer);
  const imageSlots: ImageSlot[] = [];
  let htmlPreview = '';
  let textWithSlots = '';

  // 1. Read document relationships to map rId -> target media path
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
        // Normalize path: e.g. media/image1.png or /word/media/image1.png
        const cleanTarget = target.startsWith('/') ? target.slice(1) : (target.startsWith('media/') ? `word/${target}` : `word/${target}`);
        relMap[id] = cleanTarget;
      }
    }
  }

  // 2. Read document.xml and find image references in chronological order
  const docFile = zip.file('word/document.xml');

  if (docFile) {
    const docXml = await docFile.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, 'application/xml');

    // Find all drawing / pict elements in document order
    const drawingElements = xmlDoc.querySelectorAll('w\\:drawing, drawing, w\\:pict, pict');
    let slotIndex = 1;
    const rIdToSlotMap: Record<string, string> = {};

    for (let i = 0; i < drawingElements.length; i++) {
      const el = drawingElements[i];
      // Search for a:blip or v:imagedata
      const blip = el.querySelector('a\\:blip, blip');
      const imageData = el.querySelector('v\\:imagedata, imagedata');
      
      const rId = blip?.getAttribute('r:embed') || blip?.getAttribute('embed') || 
                  imageData?.getAttribute('r:id') || imageData?.getAttribute('id');

      if (rId && relMap[rId]) {
        const mediaPath = relMap[rId];
        const mediaZipFile = zip.file(mediaPath) || zip.file(mediaPath.replace('word/', ''));

        if (mediaZipFile) {
          const slotTag = `{{IMAGE_SLOT_${slotIndex}}}`;
          rIdToSlotMap[rId] = slotTag;

          const imageBytes = await mediaZipFile.async('uint8array');
          const mimeType = detectMimeType(mediaPath);
          const base64Data = uint8ArrayToBase64(imageBytes);

          imageSlots.push({
            id: `slot_${slotIndex}`,
            slotTag,
            name: `Hình ảnh gốc ${slotIndex} (${mediaPath.split('/').pop() || 'image'})`,
            mimeType,
            base64Data,
            originalIndex: slotIndex,
            caption: `Hình ${slotIndex}: Học liệu / Sơ đồ trích xuất từ file Word gốc`,
          });

          slotIndex++;
        }
      }
    }

    // Convert document XML text with markers and preserved math formulas
    let xmlExtractedText = '';
    try {
      xmlExtractedText = extractCleanTextAndSlotsFromDocXml(xmlDoc, rIdToSlotMap);
    } catch (xmlParseErr) {
      console.warn('Direct XML math and slot extraction error:', xmlParseErr);
    }

    // Use mammoth to extract clean HTML preview
    let mammothText = '';
    let htmlPreview = '';
    try {
      let imgCounter = 1;
      const mammothResult = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          convertImage: mammoth.images.imgElement(() => {
            const currentSlot = `{{IMAGE_SLOT_${imgCounter}}}`;
            imgCounter++;
            return Promise.resolve({
              src: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="80"><rect width="100%" height="100%" fill="%23f1f5f9" stroke="%23cbd5e1" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%232563eb">${currentSlot}</text></svg>`,
            });
          }),
        }
      );
      htmlPreview = mammothResult.value;

      const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
      mammothText = rawTextResult.value;
    } catch (err) {
      console.warn('Mammoth extraction fallback:', err);
    }

    // Prefer direct XML extracted text because it preserves math formulas (OMML) and exact image locations
    if (xmlExtractedText && xmlExtractedText.trim().length > 30) {
      let slotText = xmlExtractedText;
      // Check if any image slots were missed in body (e.g. in headers/footers)
      const missingSlots = imageSlots.filter(s => !slotText.includes(s.slotTag));
      if (missingSlots.length > 0) {
        slotText += `\n\n[CÁC HÌNH ẢNH HỌC LIỆU GỐC TRONG FILE WORD]:\n` +
          missingSlots.map(s => `- ${s.slotTag}: ${s.name}`).join('\n');
      }
      textWithSlots = slotText;
    } else if (mammothText) {
      let slotText = mammothText;
      const hasSlots = imageSlots.some(s => slotText.includes(s.slotTag));
      if (!hasSlots && imageSlots.length > 0) {
        slotText += `\n\n[CÁC HÌNH ẢNH HỌC LIỆU GỐC TRONG FILE WORD]:\n` +
          imageSlots.map(s => `- ${s.slotTag}: ${s.name}`).join('\n');
      }
      textWithSlots = slotText;
    } else {
      textWithSlots = 'Không có nội dung văn bản';
    }
  } else {
    // If no document.xml, try mammoth directly
    try {
      const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
      textWithSlots = rawTextResult.value || 'Không có nội dung văn bản';
    } catch {
      textWithSlots = 'Không có nội dung văn bản';
    }
  }

  return {
    textWithSlots,
    imageSlots,
    htmlPreview,
    summary: {
      wordCount: textWithSlots.trim().split(/\s+/).length,
      imageCount: imageSlots.length,
      paragraphsCount: textWithSlots.split('\n').filter(p => p.trim().length > 0).length,
    },
  };
}

/**
 * Converts Word OMML (Office Open XML Math) elements to standard LaTeX notation
 * to preserve all mathematical formulas, fractions, powers, roots, and equations.
 */
function ommlToLatex(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const el = node as Element;
  const localName = (el.localName || el.nodeName.replace(/^.*:/, '')).toLowerCase();

  switch (localName) {
    case 'omath':
    case 'omathpara': {
      let inner = '';
      for (let i = 0; i < el.childNodes.length; i++) {
        inner += ommlToLatex(el.childNodes[i]);
      }
      return inner.trim();
    }
    case 'r': {
      let text = '';
      for (let i = 0; i < el.childNodes.length; i++) {
        text += ommlToLatex(el.childNodes[i]);
      }
      return text;
    }
    case 't': {
      return el.textContent || '';
    }
    case 'f': {
      // Fraction: num / den
      const numEl = findChildByLocal(el, 'num');
      const denEl = findChildByLocal(el, 'den');
      const num = numEl ? ommlToLatex(numEl).trim() : '';
      const den = denEl ? ommlToLatex(denEl).trim() : '';
      return `\\frac{${num}}{${den}}`;
    }
    case 'ssup': {
      // Superscript: base^sup
      const eEl = findChildByLocal(el, 'e');
      const supEl = findChildByLocal(el, 'sup');
      const base = eEl ? ommlToLatex(eEl).trim() : '';
      const sup = supEl ? ommlToLatex(supEl).trim() : '';
      return `${base}^{${sup}}`;
    }
    case 'ssub': {
      // Subscript: base_sub
      const eEl = findChildByLocal(el, 'e');
      const subEl = findChildByLocal(el, 'sub');
      const base = eEl ? ommlToLatex(eEl).trim() : '';
      const sub = subEl ? ommlToLatex(subEl).trim() : '';
      return `${base}_{${sub}}`;
    }
    case 'ssubsup': {
      // Sub-Sup: base_sub^sup
      const eEl = findChildByLocal(el, 'e');
      const subEl = findChildByLocal(el, 'sub');
      const supEl = findChildByLocal(el, 'sup');
      const base = eEl ? ommlToLatex(eEl).trim() : '';
      const sub = subEl ? ommlToLatex(subEl).trim() : '';
      const sup = supEl ? ommlToLatex(supEl).trim() : '';
      return `${base}_{${sub}}^{${sup}}`;
    }
    case 'rad': {
      // Radical: \sqrt[deg]{e}
      const degEl = findChildByLocal(el, 'deg');
      const eEl = findChildByLocal(el, 'e');
      const deg = degEl ? ommlToLatex(degEl).trim() : '';
      const base = eEl ? ommlToLatex(eEl).trim() : '';
      if (deg && deg.length > 0) {
        return `\\sqrt[${deg}]{${base}}`;
      }
      return `\\sqrt{${base}}`;
    }
    case 'd': {
      // Delimiter: (e) or [e] or {e}
      const dPr = findChildByLocal(el, 'dpr');
      let begChr = '(';
      let endChr = ')';
      if (dPr) {
        const begEl = findChildByLocal(dPr, 'begchr');
        const endEl = findChildByLocal(dPr, 'endchr');
        if (begEl) begChr = begEl.getAttribute('m:val') || begEl.getAttribute('val') || '(';
        if (endEl) endChr = endEl.getAttribute('m:val') || endEl.getAttribute('val') || ')';
      }
      const eEl = findChildByLocal(el, 'e');
      const content = eEl ? ommlToLatex(eEl).trim() : '';
      return `${begChr}${content}${endChr}`;
    }
    case 'bar': {
      const eEl = findChildByLocal(el, 'e');
      const content = eEl ? ommlToLatex(eEl).trim() : '';
      return `\\overline{${content}}`;
    }
    case 'nary': {
      // Integrals, sums, etc.
      const naryPr = findChildByLocal(el, 'narypr');
      let chr = '∑';
      if (naryPr) {
        const chrEl = findChildByLocal(naryPr, 'chr');
        if (chrEl) chr = chrEl.getAttribute('m:val') || chrEl.getAttribute('val') || '∑';
      }
      const subEl = findChildByLocal(el, 'sub');
      const supEl = findChildByLocal(el, 'sup');
      const eEl = findChildByLocal(el, 'e');
      const sub = subEl ? ommlToLatex(subEl).trim() : '';
      const sup = supEl ? ommlToLatex(supEl).trim() : '';
      const base = eEl ? ommlToLatex(eEl).trim() : '';
      let sym = chr;
      if (chr === '∑') sym = '\\sum';
      else if (chr === '∫') sym = '\\int';
      return `${sym}_{${sub}}^{${sup}} ${base}`;
    }
    default: {
      let res = '';
      for (let i = 0; i < el.childNodes.length; i++) {
        res += ommlToLatex(el.childNodes[i]);
      }
      return res;
    }
  }
}

function findChildByLocal(parent: Element, name: string): Element | null {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];
    const local = (child.localName || child.nodeName.replace(/^.*:/, '')).toLowerCase();
    if (local === name.toLowerCase()) {
      return child;
    }
  }
  return null;
}

/**
 * Extracts complete document text directly from Word XML:
 * 1. Preserves all normal paragraphs and headings
 * 2. Injects {{IMAGE_SLOT_X}} directly at the exact paragraph/run location where it occurs
 * 3. Converts all OMML math equations to LaTeX `$formula$` so no formulas are lost
 * 4. Extracts table structures accurately
 */
function extractCleanTextAndSlotsFromDocXml(xmlDoc: Document, rIdToSlotMap: Record<string, string>): string {
  const body = xmlDoc.querySelector('w\\:body, body');
  if (!body) return '';

  const blocks: string[] = [];

  function processContainer(container: Element) {
    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i];
      const tag = (child.localName || child.nodeName.replace(/^.*:/, '')).toLowerCase();

      if (tag === 'p') {
        const pText = processParagraph(child);
        if (pText.trim().length > 0) {
          blocks.push(pText.trim());
        }
      } else if (tag === 'tbl') {
        processTable(child);
      }
    }
  }

  function processParagraph(p: Element): string {
    let result = '';
    
    function extractImages(node: Element) {
      const blips = node.querySelectorAll('a\\:blip, blip');
      for (let b = 0; b < blips.length; b++) {
        const rId = blips[b].getAttribute('r:embed') || blips[b].getAttribute('embed');
        if (rId && rIdToSlotMap[rId]) {
          result += `\n${rIdToSlotMap[rId]}\n`;
        }
      }
      const imgs = node.querySelectorAll('v\\:imagedata, imagedata');
      for (let m = 0; m < imgs.length; m++) {
        const rId = imgs[m].getAttribute('r:id') || imgs[m].getAttribute('id');
        if (rId && rIdToSlotMap[rId]) {
          result += `\n${rIdToSlotMap[rId]}\n`;
        }
      }
    }

    for (let i = 0; i < p.childNodes.length; i++) {
      const node = p.childNodes[i];
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = node as Element;
      const local = (el.localName || el.nodeName.replace(/^.*:/, '')).toLowerCase();

      if (local === 'r') {
        // Check for images embedded in drawing or pict
        extractImages(el);

        // Text
        const tEls = el.querySelectorAll('w\\:t, t');
        for (let j = 0; j < tEls.length; j++) {
          result += tEls[j].textContent || '';
        }
        if (el.querySelector('w\\:br, br')) {
          result += '\n';
        }
      } else if (local === 'drawing' || local === 'pict' || local === 'alternatecontent') {
        extractImages(el);
      } else if (local === 'omath' || local === 'omathpara') {
        const formula = ommlToLatex(el);
        if (formula.trim()) {
          result += ` $${formula.trim()}$ `;
        }
      } else if (local === 'hyperlink' || local === 'sdt' || local === 'smarttag') {
        result += processParagraph(el);
      }
    }
    return result;
  }

  function processTable(tbl: Element) {
    const rows = tbl.querySelectorAll('w\\:tr, tr');
    for (let r = 0; r < rows.length; r++) {
      const cells = rows[r].querySelectorAll('w\\:tc, tc');
      const cellTexts: string[] = [];
      for (let c = 0; c < cells.length; c++) {
        const pEls = cells[c].querySelectorAll('w\\:p, p');
        const cLines: string[] = [];
        for (let p = 0; p < pEls.length; p++) {
          const pt = processParagraph(pEls[p]);
          if (pt.trim()) cLines.push(pt.trim());
        }
        cellTexts.push(cLines.join(' '));
      }
      if (cellTexts.some(ct => ct.trim().length > 0)) {
        blocks.push(`| ${cellTexts.join(' | ')} |`);
      }
    }
  }

  processContainer(body);
  return blocks.join('\n\n');
}

function detectMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'emf':
    case 'wmf':
      return 'image/x-emf';
    default:
      return 'image/png';
  }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
