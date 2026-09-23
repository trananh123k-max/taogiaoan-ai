import { PRESCHOOL_CURRICULUM_MATRIX, PRESCHOOL_LESSON_PLAN_DOMAINS_GUIDE } from './src/data/preschoolCurriculum.js';
import { formatPreschoolMusicActivities, formatPreschoolActivities, isPreschoolMusicPlan, sanitizeStandardActivity, isPreschoolNew8Activity, stripPreschoolCodes, sanitizePreschoolObjectives, analyzePreschoolAgeProfile } from './src/utils/preschoolUtils.js';
import { NLS_DICTIONARY } from './src/data/nlsDictionary';
import { getVerifiedLessons } from './src/data/verifiedCurriculumList';
import { getTextbookLessonStructure } from './src/data/textbookStructureDictionary';
import { SEED_SAMPLE_BOOKS, SEED_SAMPLE_PPCT } from './src/data/seedData';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Helper to extract custom API Key from request headers or body
function extractApiKeyFromReq(req: express.Request): string | undefined {
  const headerKey = req.headers['x-gemini-api-key'] as string;
  if (headerKey && headerKey.trim()) return headerKey.trim();
  if (req.body && req.body.customApiKey && typeof req.body.customApiKey === 'string') {
    return req.body.customApiKey.trim();
  }
  return undefined;
}

// Clean and parse multiple keys from an input string (supports comma, semicolon, newline, whitespace)
// Automatically filters UI copy artifacts like 'content_copy', 'content_cop', etc.
function extractKeysFromInput(inputStr?: string): string[] {
  if (!inputStr || typeof inputStr !== 'string') return [];
  return inputStr
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    .replace(/\b(content_copy|content_cop|copied|copy|api_key|apikey|key)\b/gi, ' ')
    .split(/[,;\n\r\s]+/)
    .map((k) => k.trim().replace(/^["':=]+|["':=]+$/g, ''))
    .filter((k) => {
      if (k.length < 15) return false;
      if (/^(content_copy|content_cop|copied|copy|null|undefined)$/i.test(k)) return false;
      return true;
    });
}

// Collect all server-configured Gemini API Keys (Render / Environment)
function getServerApiKeys(): string[] {
  const keys: string[] = [];

  if (process.env.GEMINI_API_KEY) {
    keys.push(...extractKeysFromInput(process.env.GEMINI_API_KEY));
  }
  if (process.env.GEMINI_API_KEYS) {
    keys.push(...extractKeysFromInput(process.env.GEMINI_API_KEYS));
  }
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`] || process.env[`GEMINI_API_KEY-${i}`] || process.env[`GEMINI_API_KEY${i}`];
    if (k && k.trim()) {
      keys.push(...extractKeysFromInput(k));
    }
  }

  // Deduplicate and filter non-empty
  return Array.from(new Set(keys)).filter(Boolean);
}

// Cache of GoogleGenAI instances by API Key to avoid re-allocating
const geminiClientCache = new Map<string, GoogleGenAI>();

function getGeminiClient(apiKey: string): GoogleGenAI {
  const cleanKey = (apiKey || '').trim();
  if (!cleanKey) {
    throw new Error('Chưa có mã Gemini API Key hợp lệ.');
  }
  if (!geminiClientCache.has(cleanKey)) {
    geminiClientCache.set(
      cleanKey,
      new GoogleGenAI({
        apiKey: cleanKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    );
  }
  return geminiClientCache.get(cleanKey)!;
}

/**
 * Strict Access & API Key Resolver:
 * - Admin accounts: Can use server environment keys (Render.com) or their own custom keys.
 * - Trial accounts ("thư theo lượt như 5 lượt", e.g. expiresAt === 'Chưa cấp' or contains 'dùng thử', or x-user-is-trial === 'true'):
 *     ALLOWED to use shared server API keys with Admin if they don't have a personal key.
 * - Duration accounts ("được cấp thời hạn sử dụng", e.g. expiresAt is a date or 'Vĩnh viễn'):
 *     MUST provide their own personal Gemini API Key.
 *     If no personal API key is provided, LOCK and REJECT the request!
 */
function resolveGeminiAuth(req: express.Request): {
  allowed: boolean;
  error?: string;
  keys: string[];
  isAdmin: boolean;
  isTrial: boolean;
  isSubscription: boolean;
  isCustom: boolean;
} {
  const customKeyInput = extractApiKeyFromReq(req);
  const customKeys = customKeyInput ? extractKeysFromInput(customKeyInput) : [];

  let userRole = ((req.headers['x-user-role'] as string) || req.body?.userRole || '').trim();
  try { userRole = decodeURIComponent(userRole); } catch {}

  let userEmail = ((req.headers['x-user-email'] as string) || req.body?.userEmail || '').trim();
  try { userEmail = decodeURIComponent(userEmail); } catch {}

  const isAdmin = userRole === 'admin' || userEmail === 'admin@123' || userEmail.toLowerCase() === 'admin@123';

  // 1. User provided personal custom API key(s)
  if (customKeys.length > 0) {
    const serverKeys = getServerApiKeys();
    // Prioritize user's personal keys first; append server keys as emergency backup if personal keys hit quota limits
    const allCandidateKeys = Array.from(new Set([...customKeys, ...serverKeys]));
    return {
      allowed: true,
      keys: allCandidateKeys,
      isAdmin,
      isTrial: false,
      isSubscription: true,
      isCustom: true,
    };
  }

  // 2. Admin account can use server environment keys
  if (isAdmin) {
    const serverKeys = getServerApiKeys();
    return {
      allowed: true,
      keys: serverKeys,
      isAdmin: true,
      isTrial: false,
      isSubscription: false,
      isCustom: false,
    };
  }

  // 3. Check trial status vs duration
  const isTrialHeader = req.headers['x-user-is-trial'] as string;
  let rawExpiresAt = ((req.headers['x-user-expires-at'] as string) || req.body?.userExpiresAt || '').trim();
  try { rawExpiresAt = decodeURIComponent(rawExpiresAt); } catch {}

  const isTrial =
    isTrialHeader === 'true' ||
    rawExpiresAt === 'Chưa cấp' ||
    rawExpiresAt.toLowerCase().includes('dùng thử') ||
    (!rawExpiresAt && isTrialHeader !== 'false');

  if (isTrial) {
    // Trial users ("thư theo lượt như 5 lượt") are permitted to use shared Admin API keys
    const serverKeys = getServerApiKeys();
    return {
      allowed: true,
      keys: serverKeys,
      isAdmin: false,
      isTrial: true,
      isSubscription: false,
      isCustom: false,
    };
  }

  // 4. User has been granted duration of use ("được cấp thời hạn sử dụng")
  // MUST provide personal API key. If not provided, LOCK generation!
  return {
    allowed: false,
    error: `Tài khoản của Thầy/Cô đã được kích hoạt thời hạn sử dụng (${rawExpiresAt || 'Có thời hạn'}). Theo quy định hệ thống, tài khoản có thời hạn bắt buộc phải tự nhập API Key Gemini cá nhân (miễn phí từ Google AI Studio) để sử dụng tính năng AI. Vui lòng mở mục "API Key" trên thanh tiêu đề để nhập mã khóa cá nhân!`,
    keys: [],
    isAdmin: false,
    isTrial: false,
    isSubscription: true,
    isCustom: false,
  };
}

function resolveCandidateKeys(req: express.Request): {
  keys: string[];
  isAdmin: boolean;
  isCustom: boolean;
} {
  const auth = resolveGeminiAuth(req);
  return {
    keys: auth.keys,
    isAdmin: auth.isAdmin,
    isCustom: auth.isCustom,
  };
}

// Task-Specific Model Hierarchies
// 1. Phục vụ Soạn bài dạy (KHBD), Tinh chỉnh hoạt động CV 5512, Gợi ý sư phạm:
// Ưu tiên model có Quota rộng, tốc độ siêu tốc và khả năng chống nghẽn Rate Limit cao nhất:
const PEDAGOGICAL_MODELS = [
  'gemini-3.1-flash-lite',  // Quota RPM/TPM cao nhất, độ trễ thấp nhất (1.2s - 2s), chống Rate Exceeded tốt nhất
  'gemini-3.8-flash',       // Chuẩn chính xác, năng lực sư phạm cao cấp
  'gemini-flash-latest',    // Chuẩn tốc độ cao & ổn định
  'gemini-3.7-flash',       // Trí tuệ sư phạm cao cấp
];

// 2. Phục vụ Trợ lý Trò chuyện Sư phạm (Chatbot):
const CHAT_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

// 3. Phục vụ Tác vụ Tiện ích phụ, Kiểm tra thông tin, Ping, Quét mục lục SGK:
const UTILITY_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

/**
 * Resilient Multi-Key & Multi-Model Execution Engine:
 * 1. Executes with highest/best candidate model for the specific task and iterates candidate keys.
 * 2. If encountering transient 503 (high demand) or 429 (rate spike), retries with exponential backoff & jitter.
 * 3. If a Key fails permanently or quota exceeded, automatically switches to next Key.
 * 4. If ALL keys fail on this model, automatically downgrades to next fallback Model in hierarchy.
 * 5. Repeats through all keys on the downgraded model until a working combination succeeds.
 */
async function generateContentWithRetryAndFallback(options: {
  systemInstruction?: string;
  contents: any;
  config?: any;
  primaryModel?: string;
  taskType?: 'pedagogical' | 'utility' | 'chat';
  candidateModels?: string[];
  candidateKeys?: string[];
  apiKey?: string;
}) {
  let keysToTry: string[] = [];
  if (options.candidateKeys && options.candidateKeys.length > 0) {
    keysToTry = options.candidateKeys;
  } else if (options.apiKey && options.apiKey.trim()) {
    keysToTry = extractKeysFromInput(options.apiKey);
  } else {
    keysToTry = getServerApiKeys();
  }

  if (keysToTry.length === 0) {
    throw new Error(
      'Tài khoản Giáo viên cần sử dụng Gemini API Key cá nhân (Khóa hệ thống Render chỉ dành riêng cho Quản trị viên). Vui lòng nhấn vào biểu tượng "API Key" ở thanh trên cùng để nhập mã khóa miễn phí từ Google AI Studio.'
    );
  }

  // Determine model hierarchy according to taskType
  let defaultModelList: string[];
  if (options.candidateModels && options.candidateModels.length > 0) {
    defaultModelList = options.candidateModels;
  } else if (options.taskType === 'utility') {
    defaultModelList = UTILITY_MODELS;
  } else if (options.taskType === 'chat') {
    defaultModelList = CHAT_MODELS;
  } else {
    // Default is pedagogical (soạn bài dạy, tinh chỉnh, nâng cấp hoạt động)
    defaultModelList = PEDAGOGICAL_MODELS;
  }

  const models = (options.primaryModel && options.primaryModel !== 'auto' && (options.taskType !== 'pedagogical' || options.primaryModel !== 'gemini-flash-latest'))
    ? [options.primaryModel, ...defaultModelList.filter((m) => m !== options.primaryModel)]
    : defaultModelList;

  let lastError: any = null;

  // Always attempt from highest/best model downwards
  for (let mIdx = 0; mIdx < models.length; mIdx++) {
    const currentModel = models[mIdx];

    // Try all candidate keys on currentModel
    for (let kIdx = 0; kIdx < keysToTry.length; kIdx++) {
      const currentKey = keysToTry[kIdx];

      // Retry up to 3 attempts for transient spike (503 / 429) before switching key/model
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const client = getGeminiClient(currentKey);
          const response = await client.models.generateContent({
            model: currentModel,
            contents: options.contents,
            config: {
              ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
              ...options.config,
            },
          });

          if (response && response.text) {
            // Success! Return immediately with optimal result
            return response;
          }
        } catch (err: any) {
          lastError = err;
          const rawErrMsg = err?.message || String(err);
          const errMsgLower = rawErrMsg.toLowerCase();
          const isRateLimit = errMsgLower.includes('rate') || errMsgLower.includes('429') || errMsgLower.includes('quota') || errMsgLower.includes('resource_exhausted') || errMsgLower.includes('too many requests');
          const isTransient = isRateLimit || errMsgLower.includes('503') || errMsgLower.includes('unavailable') || errMsgLower.includes('high demand') || errMsgLower.includes('overloaded');

          if (isTransient && attempt < 2) {
            // Exponential backoff + jitter for rate limit recovery
            const delayMs = isRateLimit
              ? 1200 * (attempt + 1) + Math.random() * 800
              : 600 * (attempt + 1) + Math.random() * 400;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }

          const keyPreview =
            currentKey.length > 8
              ? `${currentKey.substring(0, 5)}...${currentKey.substring(currentKey.length - 4)}`
              : 'Key';

          console.warn(
            `[Auto-Failover] Key [${kIdx + 1}/${keysToTry.length} - ${keyPreview}] gặp lỗi/hết quota trên model "${currentModel}": ${rawErrMsg.substring(0, 100)}`
          );

          if (kIdx < keysToTry.length - 1) {
            console.log(
              `[Auto-Failover] -> Tự động chuyển sang Key dự phòng [${kIdx + 2}/${keysToTry.length}] trên model "${currentModel}"...`
            );
          }
          break; // break retry loop to move to next key
        }
      }
    }

    // All keys failed or exhausted quota on currentModel, automatically downgrade model
    if (mIdx < models.length - 1) {
      const nextModel = models[mIdx + 1];
      console.warn(
        `[Auto-Failover] -> Toàn bộ Key gặp lỗi/hết quota trên model "${currentModel}". Tự động hạ cấp sang Model dự phòng tiếp theo: "${nextModel}"...`
      );
    }
  }

  throw lastError || new Error('Tất cả các API Key và Model dự phòng đều gặp sự cố hoặc hết hạn ngạch. Vui lòng kiểm tra lại mã khóa.');
}

/**
 * Sanitizer: Cleans worksheet content so it NEVER contains image slots or NLS / AI technical competence codes,
 * and ensures markdown tables and sections have clean line breaks.
 */
function cleanWorksheetContent(text: string): string {
  if (!text) return '';
  let cleaned = text;
  // Remove image slots and image placeholders completely
  cleaned = cleaned.replace(/\[\s*Vị trí ảnh minh họa[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\[\s*Vị trí ảnh[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\{\{IMAGE_SLOT_\d+\}\}/gi, '');
  cleaned = cleaned.replace(/\{\{IMAGESLOT\d*\}\}/gi, '');
  cleaned = cleaned.replace(/\[\s*Ảnh minh họa[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\[\s*Hình ảnh[^\]]*\]/gi, '');
  // Remove NLS and NL AI competence codes from student worksheet
  cleaned = cleaned.replace(/\[(NLS|NL\s*AI|Năng lực số|Năng lực AI)[^\]]*\]/gi, '');

  // Separate major headers / metadata ONLY if text precedes table header on same line without pipe
  cleaned = cleaned.replace(/^([^|\n]+)(\|\s*(?:STT|Nhiệm vụ|Câu hỏi|Bước|Nội dung)[\s|])/gim, '$1\n\n$2');
  cleaned = cleaned.replace(/\|\s*(PHẦN\s+\d+|###|##|#|Họ và tên|HỌ VÀ TÊN|BẢNG GỢI Ý|HƯỚNG DẪN)/gi, '|\n\n$1');
  cleaned = cleaned.replace(/(PHẦN\s+\d+[^:\n]*:[^\n.]+[\.\:])\s*(Họ và tên|Họ tên|Tên học sinh)/gi, '$1\n$2');
  cleaned = cleaned.replace(/(PHIẾU HỌC TẬP[^\n.]+[\.\:])\s*(Họ và tên|Họ tên|Tên học sinh)/gi, '$1\n$2');

  // Separate inline table rows joined on same line
  cleaned = cleaned.replace(/(^\|[^\n]+\|)\s*(?=\|[^\n]+\|)/gim, '$1\n');

  // Process line by line to ensure clean table headers and row structures
  const lines = cleaned.split('\n');
  const resultLines: string[] = [];
  let currentSection: 'student' | 'teacher' | 'other' = 'other';

  const defaultDots = '....................................................................................<br>....................................................................................<br>....................................................................................<br>....................................................................................';

  for (let idx = 0; idx < lines.length; idx++) {
    let line = lines[idx].trim();
    if (!line) {
      resultLines.push('');
      continue;
    }

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

      if (/^\|?[\s\-:]+\|/.test(line)) {
        resultLines.push(line);
        continue;
      }

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

  return resultLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Strips ghost image placeholders and sanitizes all fields of LessonPlanOutput
 */
function sanitizeLessonPlanOutput(plan: any, config: any): any {
  if (!plan) return plan;
  const hasImageSlots = config?.imageSlots && config.imageSlots.length > 0;
  
  const cleanStr = (s: string) => {
    if (!s || typeof s !== 'string') return s;
    let res = s;
    if (!hasImageSlots) {
      res = res.replace(/\{\{IMAGE_SLOT_\d+\}\}/gi, '');
      res = res.replace(/\{\{IMAGESLOT\d*\}\}/gi, '');
      res = res.replace(/\[\s*Vị trí ảnh[^\]]*\]/gi, '');
      res = res.replace(/\[\s*Ảnh minh họa[^\]]*\]/gi, '');
    }
    return res.trim();
  };

  const cleanArr = (arr: any[]) => {
    if (!Array.isArray(arr)) return arr;
    return arr
      .map(item => (typeof item === 'string' ? cleanStr(item) : item))
      .filter(item => typeof item !== 'string' || (item.length > 0 && item !== '-' && item !== '•'));
  };

  if (plan.objectives) {
    plan.objectives.knowledge = cleanArr(plan.objectives.knowledge);
    plan.objectives.generalCompetencies = cleanArr(plan.objectives.generalCompetencies);
    plan.objectives.subjectCompetencies = cleanArr(plan.objectives.subjectCompetencies);
    if (plan.objectives.digitalCompetencies) plan.objectives.digitalCompetencies = cleanArr(plan.objectives.digitalCompetencies);
    if (plan.objectives.aiCompetencies) plan.objectives.aiCompetencies = cleanArr(plan.objectives.aiCompetencies);
    if (plan.objectives.stemCompetencies) plan.objectives.stemCompetencies = cleanArr(plan.objectives.stemCompetencies);
    if (plan.objectives.qualities) plan.objectives.qualities = cleanArr(plan.objectives.qualities);
  }

  if (plan.equipment) {
    plan.equipment.teacher = cleanArr(plan.equipment.teacher);
    plan.equipment.student = cleanArr(plan.equipment.student);
    if (plan.equipment.digitalAssets) plan.equipment.digitalAssets = cleanArr(plan.equipment.digitalAssets);
    if (plan.equipment.stemMaterials) plan.equipment.stemMaterials = cleanArr(plan.equipment.stemMaterials);
  }

  if (Array.isArray(plan.activities)) {
    plan.activities.forEach((act: any) => {
      act.name = cleanStr(act.name);
      act.objective = cleanStr(act.objective);
      act.content = cleanStr(act.content);
      act.productSummary = cleanStr(act.productSummary);
      ['step1', 'step2', 'step3', 'step4'].forEach(stepKey => {
        if (act[stepKey]) {
          act[stepKey].teacherAction = cleanStr(act[stepKey].teacherAction);
          act[stepKey].studentAction = cleanStr(act[stepKey].studentAction);
          act[stepKey].productExpected = cleanStr(act[stepKey].productExpected);
        }
      });
    });
  }

  if (plan.appendix?.worksheetContent) {
    plan.appendix.worksheetContent = cleanWorksheetContent(plan.appendix.worksheetContent);
  }

  return plan;
}

function repairJsonString(input: string): string {
  if (!input) return '';
  let str = input.trim();

  // 1. Extract markdown code block if present
  const markdownMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (markdownMatch && markdownMatch[1]) {
    str = markdownMatch[1].trim();
  } else {
    str = str.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  // 2. Find outermost JSON object or array
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  let startIdx = -1;
  let isArray = false;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    isArray = false;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    isArray = true;
  }

  if (startIdx !== -1) {
    str = str.substring(startIdx);
  }

  // 3. Fix unescaped control characters inside string literals
  let inString = false;
  let escaped = false;
  let sanitized = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '\\') {
      escaped = !escaped;
      sanitized += ch;
    } else if (ch === '"' && !escaped) {
      inString = !inString;
      sanitized += ch;
    } else {
      escaped = false;
      if (inString) {
        if (ch === '\n') {
          sanitized += '\\n';
        } else if (ch === '\r') {
          // ignore or \\r
        } else if (ch === '\t') {
          sanitized += '\\t';
        } else {
          sanitized += ch;
        }
      } else {
        sanitized += ch;
      }
    }
  }
  str = sanitized;

  // 4. Remove trailing commas
  str = str.replace(/,\s*([\}\]])/g, '$1');

  return str;
}

function parseJSONRobust(text: any): any {
  if (!text) return {};
  if (typeof text !== 'string') {
    if (typeof text === 'object') return text;
    return {};
  }

  // 1. Quick try
  try {
    return JSON.parse(text);
  } catch (e) {
    // Continue to robust repair
  }

  const repaired = repairJsonString(text);
  if (!repaired) return {};

  // 2. Try direct parse of repaired
  try {
    return JSON.parse(repaired);
  } catch (e) {
    // Continue to closure attempts
  }

  // 3. Try balancing unclosed brackets and quotes
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let cleaned = '';

  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (ch === '\\') {
      escaped = !escaped;
      cleaned += ch;
    } else if (ch === '"' && !escaped) {
      inString = !inString;
      cleaned += ch;
    } else {
      escaped = false;
      cleaned += ch;
      if (!inString) {
        if (ch === '{') stack.push('}');
        else if (ch === '[') stack.push(']');
        else if (ch === '}' || ch === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === ch) {
            stack.pop();
          }
        }
      }
    }
  }

  // If ended inside a string, close quote
  let balanced = cleaned;
  if (inString) {
    balanced += '"';
  }
  // Remove any trailing comma before adding closures
  balanced = balanced.replace(/,\s*$/, '');
  // Close remaining open structures
  while (stack.length > 0) {
    balanced += stack.pop();
  }

  try {
    return JSON.parse(balanced);
  } catch (e) {
    // Continue to progressive truncation
  }

  // 4. Progressive truncation repair: find last valid closing delimiter or comma
  const closures = ['', '}', ']}', '}]', '}}', ']}}', '}]}', '}}]', '}}]}', ']}}]}', '"]}', '"}', '"}}', '"}]'];
  for (const closure of closures) {
    try {
      return JSON.parse(repaired + closure);
    } catch (err) {}
  }

  for (let i = repaired.length - 1; i >= 0; i--) {
    const ch = repaired[i];
    if (ch === '}' || ch === ']') {
      const sub = repaired.substring(0, i + 1);
      try {
        return JSON.parse(sub);
      } catch (err) {}
    }
    if (ch === ',') {
      const sub = repaired.substring(0, i);
      for (const closure of ['', '}', ']}', '}]', '}}', ']}}']) {
        try {
          return JSON.parse(sub + closure);
        } catch (err) {}
      }
    }
  }

  // 5. If everything fails, extract key-value fragments via regex fallback
  const fallbackObj: any = {};
  try {
    const objMatches = text.match(/"([^"]+)":\s*("([^"\\]*(\\.[^"\\]*)*)"|\[[\s\S]*?\]|\{[\s\S]*?\}|[0-9.]+|true|false|null)/g);
    if (objMatches && objMatches.length > 0) {
      for (const match of objMatches) {
        try {
          const pair = JSON.parse(`{${match}}`);
          Object.assign(fallbackObj, pair);
        } catch {}
      }
      if (Object.keys(fallbackObj).length > 0) {
        return fallbackObj;
      }
    }
  } catch (err) {}

  console.warn('parseJSONRobust: Exhausted all repair strategies. Returning empty object.');
  return {};
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ==========================================
// SERVER-SIDE GLOBAL REPOSITORY STORAGE (Books, PPCT, Users)
// ==========================================
const REPO_FILE = path.join(process.cwd(), 'data_repository.json');
const SEED_REPO_FILE = path.join(process.cwd(), 'data_repository.seed.json');

function getStoredRepository(): { books: any[]; ppcts: any[]; userAccounts: any[]; deletedUserIds: string[] } {
  try {
    let sourceFile = REPO_FILE;
    if (!fs.existsSync(REPO_FILE) && fs.existsSync(SEED_REPO_FILE)) {
      sourceFile = SEED_REPO_FILE;
    }

    if (fs.existsSync(sourceFile)) {
      const raw = fs.readFileSync(sourceFile, 'utf-8');
      const parsed = JSON.parse(raw);
      const deletedUserIds: string[] = Array.isArray(parsed.deletedUserIds) ? parsed.deletedUserIds : [];
      const deletedSet = new Set(deletedUserIds.map((k: string) => String(k).trim().toLowerCase()));

      const rawPpcts = Array.isArray(parsed.ppcts) ? parsed.ppcts : [];
      // Clean out any old erroneous converted textbooks or outdated lesson lists in PPCTs
      const cleanedPpcts = rawPpcts.filter(
        (p: any) =>
          !p.fileName?.includes('ChuanKNTT.xlsx') &&
          !p.id?.startsWith('ppct_toán_') &&
          !p.id?.startsWith('ppct_ngữ_văn_') &&
          !p.id?.startsWith('ppct_khoa_học_') &&
          p.lessonConfigs?.length !== 14 // filter out old erroneous 14-lesson Tin 9
      );
      const finalPpcts = cleanedPpcts.length >= 4 ? cleanedPpcts : SEED_SAMPLE_PPCT;
      
      const rawBooks = Array.isArray(parsed.books) ? parsed.books : [];
      let finalBooks = rawBooks;
      if (rawBooks.length === 0 || rawBooks.length > 12) {
        finalBooks = SEED_SAMPLE_BOOKS;
      }

      let rawUsers = Array.isArray(parsed.userAccounts) ? parsed.userAccounts : [];
      // If active REPO_FILE had 0 users but SEED_REPO_FILE has users, recover them!
      if (rawUsers.length === 0 && sourceFile !== SEED_REPO_FILE && fs.existsSync(SEED_REPO_FILE)) {
        try {
          const seedParsed = JSON.parse(fs.readFileSync(SEED_REPO_FILE, 'utf-8'));
          if (Array.isArray(seedParsed.userAccounts) && seedParsed.userAccounts.length > 0) {
            rawUsers = seedParsed.userAccounts;
          }
        } catch {}
      }

      const cleanedUsers = rawUsers.filter((u: any) => {
        if (!u) return false;
        const id = (u.id || '').trim().toLowerCase();
        const username = (u.username || '').trim().toLowerCase();
        const email = (u.email || '').trim().toLowerCase();
        return !deletedSet.has(id) && !deletedSet.has(username) && (!email || !deletedSet.has(email));
      });

      return {
        books: finalBooks,
        ppcts: finalPpcts,
        userAccounts: cleanedUsers,
        deletedUserIds,
      };
    }
  } catch (e) {
    console.error('[Server Repo] Error reading data_repository.json:', e);
  }
  return { books: SEED_SAMPLE_BOOKS, ppcts: SEED_SAMPLE_PPCT, userAccounts: [], deletedUserIds: [] };
}

function saveStoredRepository(data: { books?: any[]; ppcts?: any[]; userAccounts?: any[]; deletedUserIds?: string[] }) {
  try {
    const current = getStoredRepository();
    const deletedUserIds = Array.from(
      new Set([
        ...(current.deletedUserIds || []),
        ...(data.deletedUserIds || []),
      ])
    );
    const deletedSet = new Set(deletedUserIds.map((k: string) => String(k).trim().toLowerCase()));

    let rawUsers = data.userAccounts !== undefined ? data.userAccounts : current.userAccounts;
    // Guard: When updating accounts, preserve existing granted dates, API keys, and login logs!
    if (data.userAccounts && current.userAccounts && current.userAccounts.length > 0) {
      const currentMap = new Map<string, any>();
      for (const cu of current.userAccounts) {
        if (cu) {
          if (cu.id) currentMap.set(String(cu.id).toLowerCase(), cu);
          if (cu.username) currentMap.set(String(cu.username).toLowerCase(), cu);
        }
      }

      rawUsers = rawUsers.map((nu: any) => {
        if (!nu) return nu;
        const key = String(nu.id || nu.username || '').toLowerCase();
        const cu = currentMap.get(key);
        if (!cu) return nu;

        // Preserve API key
        const apiKey = nu.apiKey || nu.customApiKey || cu.apiKey || cu.customApiKey;
        // Preserve granted expiresAt
        const isGranted = (d?: string) => d && d !== 'Chưa cấp' && !String(d).toLowerCase().includes('dùng thử');
        let expiresAt = nu.expiresAt;
        if (!isGranted(expiresAt) && isGranted(cu.expiresAt)) {
          expiresAt = cu.expiresAt;
        }

        // Merge login history logs
        const cLogs = Array.isArray(cu.loginLogs) ? cu.loginLogs : [];
        const nLogs = Array.isArray(nu.loginLogs) ? nu.loginLogs : [];
        const combinedLogs = [...nLogs, ...cLogs];
        const seenLogKeys = new Set<string>();
        const mergedLogs: any[] = [];
        for (const l of combinedLogs) {
          if (!l || !l.timestamp) continue;
          const k = `${l.timestamp}_${l.deviceName || ''}_${l.action || ''}`;
          if (!seenLogKeys.has(k)) {
            seenLogKeys.add(k);
            mergedLogs.push(l);
          }
        }

        return {
          ...cu,
          ...nu,
          expiresAt: expiresAt || cu.expiresAt,
          apiKey,
          customApiKey: apiKey,
          loginLogs: mergedLogs.slice(0, 50),
          totalLoginCount: Math.max(nu.totalLoginCount || 0, cu.totalLoginCount || 0, mergedLogs.length),
        };
      });
    }

    const cleanedUsers = rawUsers.filter((u: any) => {
      if (!u) return false;
      const uId = (u.id || '').trim().toLowerCase();
      const uUsername = (u.username || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      return !deletedSet.has(uId) && !deletedSet.has(uUsername) && (!uEmail || !deletedSet.has(uEmail));
    });

    const updated = {
      books: data.books !== undefined ? data.books : current.books,
      ppcts: data.ppcts !== undefined ? data.ppcts : current.ppcts,
      userAccounts: cleanedUsers,
      deletedUserIds,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(REPO_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    // Also save backup to seed file for Render container migrations
    try {
      fs.writeFileSync(SEED_REPO_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    } catch {}
  } catch (e) {
    console.error('[Server Repo] Error writing to data_repository.json:', e);
  }
}

const readRepositoryStorage = getStoredRepository;
const writeRepositoryStorage = saveStoredRepository;

// Get all repository data from server
app.get('/api/repository/all', (req, res) => {
  try {
    const repo = getStoredRepository();
    res.json({
      success: true,
      books: repo.books,
      ppcts: repo.ppcts,
      userAccounts: repo.userAccounts,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Save a textbook to server
app.post('/api/repository/save-book', (req, res) => {
  try {
    const book = req.body;
    if (!book || !book.id) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin sách' });
    }
    const repo = getStoredRepository();
    const updatedBooks = [book, ...repo.books.filter((b) => b.id !== book.id)];
    saveStoredRepository({ books: updatedBooks });
    res.json({ success: true, count: updatedBooks.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Delete a textbook from server
app.post('/api/repository/delete-book', (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Thiếu ID sách' });
    const repo = getStoredRepository();
    const updatedBooks = repo.books.filter((b) => b.id !== id);
    saveStoredRepository({ books: updatedBooks });
    res.json({ success: true, count: updatedBooks.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Save a PPCT to server
app.post('/api/repository/save-ppct', (req, res) => {
  try {
    const ppct = req.body;
    if (!ppct || !ppct.id) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin PPCT' });
    }
    const repo = getStoredRepository();
    const updatedPPCTs = [ppct, ...repo.ppcts.filter((p) => p.id !== ppct.id)];
    saveStoredRepository({ ppcts: updatedPPCTs });
    res.json({ success: true, count: updatedPPCTs.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Delete a PPCT from server
app.post('/api/repository/delete-ppct', (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Thiếu ID PPCT' });
    const repo = getStoredRepository();
    const updatedPPCTs = repo.ppcts.filter((p) => p.id !== id);
    saveStoredRepository({ ppcts: updatedPPCTs });
    res.json({ success: true, count: updatedPPCTs.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Save a user account to server

// Update user activity (partial update)
app.post('/api/repository/update-user-activity', (req, res) => {
  try {
    const { id, ...activityData } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Thiếu ID tài khoản' });

    const repo = getStoredRepository();
    const existing = repo.userAccounts.find((u) => u.id === id);
    if (existing) {
      const updated = { ...existing, ...activityData };
      const updatedUsers = [updated, ...repo.userAccounts.filter((u) => u.id !== id)];
      saveStoredRepository({ userAccounts: updatedUsers });
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'User not found' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

app.post('/api/repository/save-user', (req, res) => {
  try {
    const account = req.body;
    if (!account || !account.id) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin tài khoản' });
    }
    const repo = getStoredRepository();
    const existing = repo.userAccounts.find(
      (u) =>
        u.id === account.id ||
        (u.username && account.username && u.username.toLowerCase() === account.username.toLowerCase())
    );

    let finalAccount = account;
    if (existing) {
      const apiKey = account.apiKey || account.customApiKey || existing.apiKey || existing.customApiKey;
      const isGranted = (d?: string) => d && d !== 'Chưa cấp' && !String(d).toLowerCase().includes('dùng thử');
      let expiresAt = account.expiresAt;
      if (!isGranted(expiresAt) && isGranted(existing.expiresAt)) {
        expiresAt = existing.expiresAt;
      }
      const cLogs = Array.isArray(existing.loginLogs) ? existing.loginLogs : [];
      const nLogs = Array.isArray(account.loginLogs) ? account.loginLogs : [];
      const combinedLogs = [...nLogs, ...cLogs];
      const seenLogKeys = new Set<string>();
      const mergedLogs: any[] = [];
      for (const l of combinedLogs) {
        if (!l || !l.timestamp) continue;
        const k = `${l.timestamp}_${l.deviceName || ''}_${l.action || ''}`;
        if (!seenLogKeys.has(k)) {
          seenLogKeys.add(k);
          mergedLogs.push(l);
        }
      }

      finalAccount = {
        ...existing,
        ...account,
        expiresAt: expiresAt || existing.expiresAt,
        apiKey,
        customApiKey: apiKey,
        loginLogs: mergedLogs.slice(0, 50),
        totalLoginCount: Math.max(account.totalLoginCount || 0, existing.totalLoginCount || 0, mergedLogs.length),
      };
    }

    const updatedUsers = [
      finalAccount,
      ...repo.userAccounts.filter(
        (u) =>
          u.id !== finalAccount.id &&
          (!finalAccount.username || !u.username || u.username.toLowerCase() !== finalAccount.username.toLowerCase())
      ),
    ];
    
    const toUnban = [account.id, account.username, account.email].filter(Boolean).map(k => String(k).trim().toLowerCase());
    const updatedDeletedIds = (repo.deletedUserIds || []).filter(id => !toUnban.includes(String(id).trim().toLowerCase()));
    
    saveStoredRepository({ userAccounts: updatedUsers, deletedUserIds: updatedDeletedIds });
    res.json({ success: true, count: updatedUsers.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Reset authorized devices for a user on server
app.post('/api/repository/reset-devices', (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Thiếu ID tài khoản' });
    const repo = getStoredRepository();
    const updatedUsers = repo.userAccounts.map((u: any) =>
      u.id === id || u.username === id || u.email === id
        ? { ...u, authorizedDevices: [] }
        : u
    );
    saveStoredRepository({ userAccounts: updatedUsers });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Delete a user account from server
app.post('/api/repository/delete-user', (req, res) => {
  try {
    const { id, keys } = req.body;
    if (!id) return res.status(400).json({ success: false, error: 'Thiếu ID tài khoản' });
    const repo = getStoredRepository();
    const toDelete = new Set<string>();
    const addKey = (k?: string) => {
      if (k && typeof k === 'string') {
        const clean = k.trim().toLowerCase();
        if (clean && clean !== 'admin@123' && clean !== 'user_admin_01') {
          toDelete.add(clean);
        }
      }
    };

    addKey(id);
    if (Array.isArray(keys)) {
      keys.forEach((k: string) => addKey(k));
    }

    const target = repo.userAccounts.find(
      (a: any) =>
        (a.id && a.id.toLowerCase() === id.toLowerCase()) ||
        (a.username && a.username.toLowerCase() === id.toLowerCase()) ||
        (a.email && a.email.toLowerCase() === id.toLowerCase())
    );
    if (target) {
      addKey(target.id);
      addKey(target.username);
      addKey(target.email);
    }

    const updatedDeletedIds = Array.from(new Set([...(repo.deletedUserIds || []), ...Array.from(toDelete)]));
    const updatedUsers = repo.userAccounts.filter((u: any) => {
      const uId = (u.id || '').trim().toLowerCase();
      const uUsername = (u.username || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      return !toDelete.has(uId) && !toDelete.has(uUsername) && (!uEmail || !toDelete.has(uEmail));
    });

    saveStoredRepository({ userAccounts: updatedUsers, deletedUserIds: updatedDeletedIds });
    res.json({ success: true, count: updatedUsers.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Bulk sync / Import all repository data to server
app.post('/api/repository/bulk-sync', (req, res) => {
  try {
    const { books, ppcts, userAccounts } = req.body;
    const current = getStoredRepository();
    const deletedSet = new Set((current.deletedUserIds || []).map((k: string) => String(k).toLowerCase()));

    const mergedBooks = books && Array.isArray(books) ? books : current.books;
    const mergedPPCTs = ppcts && Array.isArray(ppcts) ? ppcts : current.ppcts;
    
    let mergedUsers = current.userAccounts;
    if (userAccounts && Array.isArray(userAccounts)) {
      const userMap = new Map<string, any>();
      for (const u of current.userAccounts) {
        if (u && (u.id || u.username)) {
          const uId = (u.id || '').toLowerCase();
          const uUsername = (u.username || '').toLowerCase();
          const uEmail = (u.email || '').toLowerCase();
          if (!deletedSet.has(uId) && !deletedSet.has(uUsername) && (!uEmail || !deletedSet.has(uEmail))) {
            userMap.set(u.id || uUsername, u);
          }
        }
      }
      for (const u of userAccounts) {
        if (u && (u.id || u.username)) {
          const uId = (u.id || '').toLowerCase();
          const uUsername = (u.username || '').toLowerCase();
          const uEmail = (u.email || '').toLowerCase();
          // Reject deleted accounts
          if (deletedSet.has(uId) || deletedSet.has(uUsername) || (uEmail && deletedSet.has(uEmail))) {
            continue;
          }
          const key = u.id || uUsername;
          userMap.set(key, { ...(userMap.get(key) || {}), ...u });
        }
      }
      mergedUsers = Array.from(userMap.values());
    }

    saveStoredRepository({
      books: mergedBooks,
      ppcts: mergedPPCTs,
      userAccounts: mergedUsers,
    });

    res.json({
      success: true,
      message: `Đã đồng bộ thành công ${mergedBooks.length} SGK, ${mergedPPCTs.length} PPCT và ${mergedUsers.length} tài khoản lên máy chủ.`,
      booksCount: mergedBooks.length,
      ppctsCount: mergedPPCTs.length,
      usersCount: mergedUsers.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Export complete system backup as JSON
app.get('/api/repository/export-backup', (req, res) => {
  try {
    const data = getStoredRepository();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=khbd_backup_${Date.now()}.json`);
    res.json({
      appName: 'KHBD AI PRO',
      exportedAt: new Date().toISOString(),
      ...data,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Import system backup from JSON
app.post('/api/repository/import-backup', (req, res) => {
  try {
    const { userAccounts, books, ppcts } = req.body;
    const current = getStoredRepository();

    const mergedAccountsMap = new Map<string, any>();
    for (const a of current.userAccounts) {
      if (a && (a.id || a.username)) mergedAccountsMap.set(a.id || a.username.toLowerCase(), a);
    }
    if (Array.isArray(userAccounts)) {
      for (const a of userAccounts) {
        if (a && (a.id || a.username)) {
          const key = a.id || a.username.toLowerCase();
          mergedAccountsMap.set(key, { ...(mergedAccountsMap.get(key) || {}), ...a });
        }
      }
    }

    const updated = {
      userAccounts: Array.from(mergedAccountsMap.values()),
      books: Array.isArray(books) && books.length > 0 ? books : current.books,
      ppcts: Array.isArray(ppcts) && ppcts.length > 0 ? ppcts : current.ppcts,
    };

    saveStoredRepository(updated);
    res.json({ success: true, userAccountsCount: updated.userAccounts.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * Check Gemini API Key validity, connectivity and quota status
 */
app.post('/api/check-api-key', async (req, res) => {
  try {
    const rawCustom = (req.body?.customApiKey || req.body?.apiKey || req.headers['x-custom-api-key'] || '') as string;
    
    // Parse raw input into individual tokens (handling spaces, newlines, commas, semicolons)
    const customKeyTokens = rawCustom
      ? rawCustom
          .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
          .replace(/\b(content_copy|content_cop|copied|copy|api_key|apikey|key)\b/gi, ' ')
          .split(/[,;\n\r\s]+/)
          .map((k) => k.trim().replace(/^["':=]+|["':=]+$/g, ''))
          .filter((k) => k.length > 0 && !/^(content_copy|content_cop|copied|copy|null|undefined)$/i.test(k))
      : [];

    const userRole = (req.headers['x-user-role'] as string) || req.body?.userRole;
    const userEmail = (req.headers['x-user-email'] as string) || req.body?.userEmail || '';
    const isAdmin = userRole === 'admin' || userEmail === 'admin@123' || userEmail.toLowerCase() === 'admin@123';

    // Case 1: Testing explicit user-provided custom key(s)
    if (customKeyTokens.length > 0) {
      const results: { key: string; preview: string; valid: boolean; isQuota: boolean; error?: string }[] = [];

      for (let i = 0; i < customKeyTokens.length; i++) {
        const k = customKeyTokens[i];
        const preview = k.length > 8 ? `${k.substring(0, 6)}...${k.substring(k.length - 4)}` : `${k.substring(0, 4)}***`;
        
        // Basic length check (avoid empty or 1-2 char noise)
        if (k.length < 10) {
          results.push({
            key: k,
            preview,
            valid: false,
            isQuota: false,
            error: 'Mã API Key quá ngắn hoặc không đúng cấu trúc'
          });
          continue;
        }

        try {
          const client = new GoogleGenAI({ apiKey: k });
          let success = false;
          let lastErr: any = null;
          // Fast and resilient models to test in priority order
          const testModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.7-flash'];
          
          for (const m of testModels) {
            try {
              await client.models.generateContent({
                model: m,
                contents: 'Ping',
              });
              success = true;
              break;
            } catch (err: any) {
              lastErr = err;
              const errMsg = err?.message || String(err);
              const status = err?.status;
              // If project denied (403), invalid key (400), or quota (429), stop testing other models
              if (
                status === 403 ||
                errMsg.includes('403') ||
                errMsg.includes('denied access') ||
                status === 400 ||
                errMsg.includes('API_KEY_INVALID') ||
                errMsg.includes('API key not valid') ||
                status === 429 ||
                errMsg.includes('429') ||
                errMsg.includes('RESOURCE_EXHAUSTED')
              ) {
                break;
              }
            }
          }

          if (success) {
            results.push({ key: k, preview, valid: true, isQuota: false });
          } else {
            throw lastErr || new Error('Không thể kết nối Gemini API');
          }
        } catch (apiErr: any) {
          const errMsg = apiErr?.message || String(apiErr);
          const status = apiErr?.status;
          const isQuota = status === 429 || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('rate limit');
          const isDenied = status === 403 || errMsg.includes('403') || errMsg.includes('denied access') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('access denied');
          const isInvalid = status === 400 || errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid') || errMsg.includes('API key expired') || errMsg.includes('INVALID_ARGUMENT') || errMsg.includes('not valid');

          let cleanError = 'Lỗi kết nối';
          if (isQuota) {
            cleanError = 'Key đã hết hạn mức Quota (429 Resource Exhausted)';
          } else if (isDenied) {
            cleanError = 'Dự án Google của Key này đã bị khóa quyền truy cập (403 Project Denied)';
          } else if (isInvalid) {
            cleanError = 'Sai mã khóa hoặc key đã bị vô hiệu hóa (400 Invalid Key)';
          } else {
            cleanError = errMsg.length > 80 ? errMsg.substring(0, 80) + '...' : errMsg;
          }

          results.push({
            key: k,
            preview,
            valid: false,
            isQuota,
            error: cleanError,
          });
        }
      }

      const validCount = results.filter(r => r.valid).length;
      const totalCount = customKeyTokens.length;

      // Build short, clear per-key report
      let shortMessage = '';
      if (totalCount === 1) {
        const r = results[0];
        if (r.valid) {
          shortMessage = `Key 1 (${r.preview}): Hoạt động tốt. Sẵn sàng sử dụng.`;
        } else {
          shortMessage = `Key 1 (${r.preview}): Lỗi - ${r.error}.`;
        }
      } else {
        // Multi-key format: Key 1: ..., Key 2: ...
        const lines = results.map((r, idx) => {
          if (r.valid) {
            return `• Key ${idx + 1} (${r.preview}): Hoạt động tốt`;
          } else {
            return `• Key ${idx + 1} (${r.preview}): ${r.error}`;
          }
        });
        shortMessage = lines.join('\n');
      }

      let status: 'valid' | 'invalid' | 'quota_exceeded' = 'valid';
      if (validCount === totalCount) {
        status = 'valid';
      } else if (validCount > 0) {
        status = 'valid';
      } else if (results.some(r => !r.valid && !r.isQuota)) {
        status = 'invalid';
      } else {
        status = 'quota_exceeded';
      }

      return res.json({
        success: validCount > 0,
        status,
        message: shortMessage,
        results: results.map((r, idx) => ({
          index: idx + 1,
          preview: r.preview,
          valid: r.valid,
          isQuota: r.isQuota,
          error: r.error,
        })),
        keyPreview: results[0]?.preview,
        keyCount: validCount,
        totalKeys: totalCount,
        isDefault: false,
        isAdmin,
      });
    }

    // Case 2: Testing server environment keys (Admin or Trial)
    const serverKeys = getServerApiKeys();
    if (serverKeys.length === 0) {
      return res.json({
        success: false,
        status: 'missing',
        message: 'Chưa có mã API Key nào được cấu hình trong hệ thống hoặc nhập bởi người dùng.',
        isAdmin,
      });
    }

    if (!isAdmin) {
      const isTrialHeader = req.headers['x-user-is-trial'] as string;
      let rawExpiresAt = ((req.headers['x-user-expires-at'] as string) || req.body?.userExpiresAt || '').trim();
      try { rawExpiresAt = decodeURIComponent(rawExpiresAt); } catch {}
      const isTrial = isTrialHeader === 'true' || rawExpiresAt === 'Chưa cấp' || rawExpiresAt.toLowerCase().includes('dùng thử') || (!rawExpiresAt && isTrialHeader !== 'false');

      if (!isTrial) {
        return res.json({
          success: false,
          status: 'missing',
          message: 'Khóa hệ thống Render.com chỉ dành riêng cho tài khoản Quản trị viên (Admin). Thầy cô vui lòng nhập API Key Gemini cá nhân (hoàn toàn miễn phí từ Google AI Studio) để sử dụng.',
          isAdmin: false,
          requiresCustomApiKey: true,
        });
      }
    }

    // Test server key
    const preview = serverKeys[0].length > 8 ? `${serverKeys[0].substring(0, 6)}...${serverKeys[0].substring(serverKeys[0].length - 4)}` : '***';
    try {
      const client = new GoogleGenAI({ apiKey: serverKeys[0] });
      await client.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: 'Ping test. Trả lời: OK',
      });
      return res.json({
        success: true,
        status: 'valid',
        message: `Mã API Key Quản trị viên Render (${serverKeys.length} khóa dự phòng) hoạt động bình thường! Kết nối sẵn sàng.`,
        keyPreview: preview,
        keyCount: serverKeys.length,
        isDefault: true,
        isAdmin,
      });
    } catch (apiErr: any) {
      const errMsg = apiErr?.message || String(apiErr);
      return res.json({
        success: false,
        status: 'error',
        message: `Lỗi kết nối khóa hệ thống: ${errMsg}`,
        keyPreview: preview,
        isDefault: true,
        isAdmin,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Lỗi máy chủ khi kiểm tra API: ' + (err?.message || String(err)),
    });
  }
});

/**
 * Parse custom indicators pasted by teacher from external documents.
 */
function parseCustomIndicators(rawText?: string): string[] {
  if (!rawText || !rawText.trim()) return [];
  return rawText
    .split(/\r?\n|;/)
    .map(line => line.replace(/^[-*•\d+.\s]+/, '').trim())
    .filter(line => line.length > 0);
}

function extractLessonNumberServer(title: string): string | null {
  if (!title) return null;
  const m = title.match(/(?:bài|tiết|bài\s*học)\s*(\d+[a-z]?)/i);
  return m ? m[1].toLowerCase() : null;
}

function normalizePPCTStrServer(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/bài\s*\d+[a-z]?[:.]?\s*/gi, '')
    .replace(/tiết\s*\d+[:.]?\s*/gi, '')
    .replace(/chủ đề\s*\d+[:.]?\s*/gi, '')
    .replace(/thực hành[:.]?\s*/gi, '')
    .replace(/th[:.]?\s*/gi, '')
    .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/gi, '')
    .trim();
}

function findBestLessonMatchServer(lessonConfigs: any[], userTitle: string) {
  if (!lessonConfigs || !userTitle) return null;
  const userNum = extractLessonNumberServer(userTitle);
  const normUser = normalizePPCTStrServer(userTitle);

  if (userNum) {
    const numMatch = lessonConfigs.find(l => {
      const lNum = extractLessonNumberServer(l.lessonTitle);
      return lNum && lNum === userNum;
    });
    if (numMatch) return numMatch;
  }

  const exactNormMatch = lessonConfigs.find(l => normalizePPCTStrServer(l.lessonTitle) === normUser);
  if (exactNormMatch) return exactNormMatch;

  let bestItem = null;
  let bestScore = 0;
  for (const l of lessonConfigs) {
    const normL = normalizePPCTStrServer(l.lessonTitle);
    if (!normL) continue;
    let score = 0;
    if (normUser === normL) score = 100;
    else if (normUser.startsWith(normL) || normL.startsWith(normUser)) score = 80;
    else if (normUser.includes(normL)) score = 60 + normL.length;
    else if (normL.includes(normUser)) score = 50 + normUser.length;

    if (score > bestScore) {
      bestScore = score;
      bestItem = l;
    }
  }
  return bestItem;
}

function repairAnswerLineBreaks(text: string): string {
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

function dedupeAnswers(text: string): string {
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

function formatHomeworkText(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  let formatted = text.trim();

  // 1. Separate 'a) ...', 'b) ...', 'c) ...' onto new lines
  formatted = formatted.replace(/(?<![\p{L}\p{N}_])([a-eA-E]\))(?=\s|[A-ZÀ-Ỵa-zà-ỹ:])/gu, '\n$1');

  // 2. Break lines before headers like "Nhiệm vụ về nhà:", "Hướng dẫn tự học:", "Đối với bài vừa học:", "Đối với bài học tiếp theo:", etc.
  formatted = formatted.replace(/(?<!\n)\s*([a-eA-E]\)\s*(?:Đối\s*với\s*)?Bài\s*(?:vừa\s*học|học\s*tiếp\s*theo|mới)|Nhiệm\s*vụ\s*về\s*nhà|Hướng\s*dẫn\s*tự\s*học|Chuẩn\s*bị\s*bài\s*mới|Bài\s*học\s*tiếp\s*theo)\s*[:\-–]?/gi, '\n$1:');

  // 3. Separate numbered tasks like "1. ", "2. ", "3. " or "Nhiệm vụ 1:", "Nhiệm vụ 2:"
  formatted = formatted.replace(/(?<=[:\?\.\!\;])\s*(\d+[\.:\)]|Nhiệm\s*vụ\s*\d+[\.:\)]?)\s*/gi, '\n- Nhiệm vụ $1 ');
  formatted = formatted.replace(/(?<!\n)\s*(Nhiệm\s*vụ\s*\d+[\.:\)]?)\s*/gi, '\n- $1 ');

  // 4. Separate "Xem trước nội dung...", "Đọc trước...", "Chuẩn bị...", "Làm bài tập..." if they follow punctuation without line break
  formatted = formatted.replace(/(?<=[\?\.\!])\s*(Xem\s*trước|Đọc\s*trước|Chuẩn\s*bị|Học\s*sinh\s*ôn|Làm\s*các\s*bài\s*tập)\b/gi, '\n- $1');

  // 5. Clean up redundant line breaks and spaces
  const rawLines = formatted.split('\n').map(l => l.trim()).filter(Boolean);
  const cleanLines: string[] = [];

  for (const l of rawLines) {
    let cleanLine = l.replace(/^-\s*Nhiệm\s*vụ\s*Nhiệm\s*vụ\s*/i, '- Nhiệm vụ ');
    cleanLine = cleanLine.replace(/^-\s*Nhiệm\s*vụ\s*(\d+)[\.:\)]?/i, '- Nhiệm vụ $1:');
    cleanLines.push(cleanLine);
  }

  return cleanLines.join('\n');
}

/**
 * Strips any inline NLS codes/indicators (e.g., 1.1.TC1a, [1.1.NC1b], (Mã NLS: ...))
 * from text fields in activities and products as requested by user.
 */
function stripNLSCodes(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  let cleaned = text;

  // 1. Remove bracketed/parenthesized NLS codes/labels: (Mã NLS: 1.1.TC1a), [NLS 1.1.TC1a], (Chỉ báo NLS: 3.1.NC1a), (1.1.TC1a), [3.1.NC1a]
  cleaned = cleaned.replace(/[\[\(]\s*(?:mã\s*)?(?:chỉ\s*báo\s*)?(?:nls|năng\s*lực\s*số)?\s*[:\-–]?\s*\d+\.\d+\.(?:cb|tc|nc)\d+[a-z]?\s*[\]\)]/gi, '');
  cleaned = cleaned.replace(/[\[\(]\s*(?:mã\s*)?(?:chỉ\s*báo\s*)?(?:nls|năng\s*lực\s*số)\s*[:\-–]?\s*[a-z0-9._\-]+\s*[\]\)]/gi, '');

  // 2. Remove unbracketed prefixes: "Mã NLS: 1.1.TC1a", "Chỉ báo NLS: 1.1.TC1a", "Mã chỉ báo NLS: 1.1.TC1a"
  cleaned = cleaned.replace(/(?:mã\s*)?(?:chỉ\s*báo\s*)?(?:nls|năng\s*lực\s*số)\s*[:\-–]?\s*\d+\.\d+\.(?:cb|tc|nc)\d+[a-z]?\s*[:\-–]?/gi, '');

  // 3. Remove standalone indicator codes like 1.1.TC1a, 3.1.NC1b, 1.1.CB2a
  cleaned = cleaned.replace(/(?<=\s|^)\d+\.\d+\.(?:cb|tc|nc)\d+[a-z]?(?=\s|[.,;:!?]|$)/gi, '');

  // 4. Cleanup dangling empty parens/brackets or duplicate punctuation
  cleaned = cleaned.replace(/\(\s*\)/g, '');
  cleaned = cleaned.replace(/\[\s*\]/g, '');
  cleaned = cleaned.replace(/:\s*:/g, ':');
  cleaned = cleaned.replace(/-\s*-/g, '-');
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');

  const repaired = repairAnswerLineBreaks(cleaned.split('\n').map(l => l.trim()).join('\n').trim());
  return dedupeAnswers(repaired);
}

function separateNlsBlocks(text: string): string {
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
      newLines.push(`HS thực hiện thao tác trên thiết bị số/học liệu số hoặc tra cứu số liệu (NLS ${nlsMatch[1]}).`);
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

function stripNlsIntegrationTags(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  let lines = text.split('\n').filter(line => {
    const trimmed = line.trim();
    if (/^(\*|-|•)?\s*\[\s*Tích\s*hợp[^\]]*\]\s*$/i.test(trimmed)) {
      return false;
    }
    return true;
  });
  lines = lines.map(line => line.replace(/\[\s*Tích\s*hợp[^\]]*\]/gi, '').trim());
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function getSubjectNLSDescription(subject: string, code: string): string {
  const s = (subject || '').toLowerCase();
  if (s.includes('toán') || s.includes('math')) {
    return `HS sử dụng MTCT bấm kiểm tra kết quả, hoặc sử dụng phần mềm GeoGebra khảo sát đồ thị/hình học (NLS ${code}).`;
  }
  if (s.includes('văn') || s.includes('ngữ văn')) {
    return `HS tra cứu tư liệu số trực tuyến, tìm kiếm hình ảnh/video minh họa và soạn thảo bài trình bày số (NLS ${code}).`;
  }
  if (s.includes('khtn') || s.includes('khoa học tự nhiên') || s.includes('vật lí') || s.includes('hóa') || s.includes('sinh')) {
    return `HS quan sát video thí nghiệm ảo/mô phỏng số và tra cứu bảng số liệu khoa học trên thiết bị số (NLS ${code}).`;
  }
  if (s.includes('sử') || s.includes('địa') || s.includes('lịch sử')) {
    return `HS khai thác bản đồ số tương tác, tư liệu số hóa và tra cứu dữ liệu địa lý - lịch sử (NLS ${code}).`;
  }
  if (s.includes('anh') || s.includes('ngoại ngữ') || s.includes('tiếng anh')) {
    return `HS tra từ điển số, luyện nghe phát âm qua ứng dụng học tập số và tương tác bài tập trực tuyến (NLS ${code}).`;
  }
  if (s.includes('công nghệ')) {
    return `HS tra cứu sơ đồ nguyên lý số, quan sát mô hình 3D hoặc quy trình kỹ thuật trên thiết bị số (NLS ${code}).`;
  }
  if (s.includes('gdcd') || s.includes('kinh tế và pháp luật')) {
    return `HS tra cứu văn bản quy phạm pháp luật trên cổng thông tin điện tử và thảo luận tình huống số (NLS ${code}).`;
  }
  return `HS khai thác học liệu số, tra cứu thông tin và sử dụng phần mềm tương tác để hoàn thành nhiệm vụ học tập (NLS ${code}).`;
}

function getSubjectAIDescription(subject: string, code: string): string {
  const s = (subject || '').toLowerCase();
  if (s.includes('toán') || s.includes('math')) {
    return `HS sử dụng trợ lý AI giải thích trực quan và khám phá các bài toán thực tiễn liên quan (AI ${code}).`;
  }
  if (s.includes('văn') || s.includes('ngữ văn')) {
    return `HS thực hành đặt prompt cho trợ lý AI tìm kiếm ý tưởng phân tích, sau đó chọn lọc và đối chiếu ngữ liệu thực tế (AI ${code}).`;
  }
  if (s.includes('khtn') || s.includes('khoa học tự nhiên') || s.includes('vật lí') || s.includes('hóa') || s.includes('sinh')) {
    return `HS tương tác với trợ lý AI để tìm hiểu cơ chế hiện tượng tự nhiên và kiểm chứng thông tin khoa học (AI ${code}).`;
  }
  if (s.includes('sử') || s.includes('địa') || s.includes('lịch sử')) {
    return `HS sử dụng trợ lý AI tổng hợp các mốc sự kiện/đặc điểm địa lý và kiểm tra độ tin cậy của thông tin (AI ${code}).`;
  }
  if (s.includes('anh') || s.includes('ngoại ngữ') || s.includes('tiếng anh')) {
    return `HS tương tác hội thoại với trợ lý AI bằng tiếng Anh và nhờ AI gợi ý cách diễn đạt tự nhiên (AI ${code}).`;
  }
  if (s.includes('công nghệ')) {
    return `HS sử dụng trợ lý AI tra cứu thông số kỹ thuật và so sánh các giải pháp công nghệ hiện đại (AI ${code}).`;
  }
  return `HS tương tác với công cụ AI để mở rộng hiểu biết, đối chiếu thông tin và hỗ trợ hoàn thành nhiệm vụ học tập (AI ${code}).`;
}

function cleanActivityNLSCodes(act: any, isIntegratedSubject: boolean = false, isMath4Column: boolean = false): any {
  if (!act) return act;
  const cleanedAct = { ...act };

  if (cleanedAct.content) {
    cleanedAct.content = isIntegratedSubject ? (isMath4Column ? stripNlsIntegrationTags(cleanedAct.content) : cleanedAct.content) : stripNLSCodes(cleanedAct.content);
  }
  if (cleanedAct.productSummary) {
    cleanedAct.productSummary = isIntegratedSubject ? (isMath4Column ? stripNlsIntegrationTags(cleanedAct.productSummary) : cleanedAct.productSummary) : stripNLSCodes(cleanedAct.productSummary);
  }

  ['step1', 'step2', 'step3', 'step4'].forEach((stepKey) => {
    if (cleanedAct[stepKey] && typeof cleanedAct[stepKey] === 'object') {
      cleanedAct[stepKey] = {
        ...cleanedAct[stepKey],
        teacherAction: isIntegratedSubject 
          ? (isMath4Column ? stripNlsIntegrationTags(cleanedAct[stepKey].teacherAction || '') : separateNlsBlocks(cleanedAct[stepKey].teacherAction || '')) 
          : stripNLSCodes(cleanedAct[stepKey].teacherAction || ''),
        studentAction: isIntegratedSubject 
          ? (isMath4Column ? stripNlsIntegrationTags(cleanedAct[stepKey].studentAction || '') : separateNlsBlocks(cleanedAct[stepKey].studentAction || '')) 
          : stripNLSCodes(cleanedAct[stepKey].studentAction || ''),
        productExpected: stripNLSCodes(cleanedAct[stepKey].productExpected || ''),
        digitalOrAiTool: cleanedAct[stepKey].digitalOrAiTool || '',
      };
    }
  });

  return cleanedAct;
}

/**
 * Strictly enforce authentic PPCT or custom competency indicators (NLS, AI, STEM)
 * and eliminate any hallucinated or fabricated codes.
 */
function enforcePPCTCompetencies(
  plan: any,
  config: any,
  effectiveNLSIndicators: string[],
  effectiveAIIndicators: string[]
) {
  if (!plan) return plan;
  if (!plan.objectives) plan.objectives = {};
  if (!plan.competencyMatrix) plan.competencyMatrix = { nlsItems: [], aiItems: [] };

  const isPreschool = config.schoolLevel === 'Mầm non';
  if (isPreschool) {
    const isNew8 = isPreschoolNew8Activity(config.subject || plan.subject, config.lessonTitle || plan.lessonTitle);
    if (!isNew8 && plan.objectives) {
      sanitizePreschoolObjectives(plan.objectives);
    }
  }
  const isHighSchool = config.schoolLevel === 'THPT' || /thpt/i.test(config.schoolLevel || '') || /lớp\s*(?:10|11|12)/i.test(config.grade || plan.grade || '');
  const isMiddleSchool = config.schoolLevel === 'THCS' || /thcs/i.test(config.schoolLevel || '') || /lớp\s*(?:6|7|8|9)/i.test(config.grade || plan.grade || '');
  const isMiddleOrHighSchool = isMiddleSchool || isHighSchool;
  const isMathSubject = /toán|math/i.test(config.subject || plan.subject || '') || /toán|math/i.test(config.lessonTitle || plan.lessonTitle || '');
  const isTinHoc = /tin\s*học|tin\s*hoc|computer|informatics/i.test(config.subject || plan.subject || '') || /tin\s*học|tin\s*hoc/i.test(config.lessonTitle || plan.lessonTitle || '');
  const isMath4Column = config.tableLayout === 'math_4_column';

  // For all THCS and THPT subjects and Math: integrate NLS & AI into Hoạt động của GV/HS like Math!
  // Keep Tin học unchanged.
  const isIntegratedSubject = (isMathSubject || isMiddleOrHighSchool || config.enableNLS || config.enableAI) && !isTinHoc;
  const shouldIntegrateIntoTable = (isMathSubject || isMiddleOrHighSchool) && !isTinHoc;

  // Process activities
  if (Array.isArray(plan.activities)) {
    plan.activities = plan.activities.map((act: any) => cleanActivityNLSCodes(act, isIntegratedSubject, isMath4Column));

    // Ensure lesson with NLS enabled has the required [Tích hợp NLS] indicator in teacher/student action ONLY for 2-column templates
    if (shouldIntegrateIntoTable && config.enableNLS && plan.activities.length > 0 && !isMath4Column) {
      const hasNlsTag = plan.activities.some((act: any) =>
        ['step1', 'step2', 'step3', 'step4'].some((sk) =>
          act[sk] && (
            /\[Tích hợp [^\]]*NLS[^\]]*\]/i.test(act[sk].teacherAction || '') ||
            /\[Tích hợp [^\]]*NLS[^\]]*\]/i.test(act[sk].studentAction || '') ||
            /\(NLS\s+[a-z0-9._\-]+\)/i.test(act[sk].studentAction || '') ||
            /\(NLS\s+[a-z0-9._\-]+\)/i.test(act[sk].teacherAction || '')
          )
        )
      );

      if (!hasNlsTag) {
        const primaryCode = (effectiveNLSIndicators && effectiveNLSIndicators.length > 0)
          ? (effectiveNLSIndicators[0].split(':')[0].trim() || (isHighSchool ? '1.1.NC1a' : '1.1.TC1a'))
          : (isHighSchool ? '1.1.NC1a' : '1.1.TC1a');
        const targetAct = plan.activities[1] || plan.activities[0];
        const targetStep = targetAct.step2 ? 'step2' : (targetAct.step1 ? 'step1' : null);
        if (targetStep && targetAct[targetStep]) {
          const subjectDesc = getSubjectNLSDescription(config.subject || plan.subject || '', primaryCode);
          const nlsBlock = `\n\n[Tích hợp NLS]\n${subjectDesc}`;
          if (targetAct[targetStep].studentAction) {
            targetAct[targetStep].studentAction += nlsBlock;
          } else if (targetAct[targetStep].teacherAction) {
            targetAct[targetStep].teacherAction += nlsBlock;
          }
        }
      }
    }

    // Ensure lesson with AI enabled has the required [Tích hợp AI] indicator in teacher/student action ONLY for 2-column templates
    if (shouldIntegrateIntoTable && config.enableAI && plan.activities.length > 0 && !isMath4Column) {
      const hasAiTag = plan.activities.some((act: any) =>
        ['step1', 'step2', 'step3', 'step4'].some((sk) =>
          act[sk] && (
            /\[Tích hợp [^\]]*AI[^\]]*\]/i.test(act[sk].teacherAction || '') ||
            /\[Tích hợp [^\]]*AI[^\]]*\]/i.test(act[sk].studentAction || '') ||
            /\(AI\s+[a-z0-9._\-]+\)/i.test(act[sk].studentAction || '') ||
            /\(AI\s+[a-z0-9._\-]+\)/i.test(act[sk].teacherAction || '')
          )
        )
      );

      if (!hasAiTag) {
        const primaryAICode = (effectiveAIIndicators && effectiveAIIndicators.length > 0)
          ? (effectiveAIIndicators[0].split(':')[0].trim() || '6.A1.1')
          : '6.A1.1';
        const targetAct = plan.activities[plan.activities.length - 1] || plan.activities[1] || plan.activities[0];
        const targetStep = targetAct.step2 ? 'step2' : (targetAct.step1 ? 'step1' : null);
        if (targetStep && targetAct[targetStep]) {
          const subjectAIDesc = getSubjectAIDescription(config.subject || plan.subject || '', primaryAICode);
          const aiBlock = `\n\n[Tích hợp AI]\n${subjectAIDesc}`;
          if (targetAct[targetStep].studentAction) {
            targetAct[targetStep].studentAction += aiBlock;
          } else if (targetAct[targetStep].teacherAction) {
            targetAct[targetStep].teacherAction += aiBlock;
          }
        }
      }
    }
  }

  // 1. Digital Competencies (NLS)
  if (config.enableNLS && !isPreschool) {
    if (config.nlsMode === 'custom') {
      const customList = parseCustomIndicators(config.customNLS);
      if (customList.length > 0) {
        plan.objectives.digitalCompetencies = customList;
      }
    } else if (config.nlsMode === 'ai_generated') {
      // Keep AI-generated digital competencies intact (filter bad codes)
      if (Array.isArray(plan.objectives.digitalCompetencies)) {
        plan.objectives.digitalCompetencies = plan.objectives.digitalCompetencies.filter(
          (item: string) => !/^NLS[-_]NL\./i.test(item.trim())
        );
      }
      if (!Array.isArray(plan.objectives.digitalCompetencies) || plan.objectives.digitalCompetencies.length === 0) {
        plan.objectives.digitalCompetencies = [
          'Khai thác và sử dụng công cụ kỹ thuật số trong tìm kiếm thông tin và giải quyết nhiệm vụ học tập.',
          'Ứng dụng phần mềm chuyên ngành và học liệu điện tử để tạo lập và trình bày sản phẩm học tập.'
        ];
      }
    } else {
      // PPCT mode
      if (effectiveNLSIndicators && effectiveNLSIndicators.length > 0) {
        plan.objectives.digitalCompetencies = effectiveNLSIndicators;
      } else if (Array.isArray(plan.objectives.digitalCompetencies)) {
        plan.objectives.digitalCompetencies = plan.objectives.digitalCompetencies.filter(
          (item: string) => !/^NLS[-_]NL\./i.test(item.trim())
        );
      }
    }
  } else if (!config.enableNLS && !isPreschool) {
    plan.objectives.digitalCompetencies = [];
  }

  // 2. AI Competencies
  if (config.enableAI && !isPreschool) {
    if (config.aiMode === 'custom') {
      const customList = parseCustomIndicators(config.customAI);
      if (customList.length > 0) {
        plan.objectives.aiCompetencies = customList;
      }
    } else if (config.aiMode === 'ai_generated') {
      // Keep AI-generated AI competencies intact
      if (Array.isArray(plan.objectives.aiCompetencies)) {
        plan.objectives.aiCompetencies = plan.objectives.aiCompetencies.filter(
          (item: string) => !/^AI[-_]NL\./i.test(item.trim())
        );
      }
    } else {
      // PPCT mode
      if (effectiveAIIndicators && effectiveAIIndicators.length > 0) {
        plan.objectives.aiCompetencies = effectiveAIIndicators;
      } else if (Array.isArray(plan.objectives.aiCompetencies)) {
        plan.objectives.aiCompetencies = plan.objectives.aiCompetencies.filter(
          (item: string) => !/^AI[-_]NL\./i.test(item.trim())
        );
      }
    }
  } else if (!config.enableAI && !isPreschool) {
    plan.objectives.aiCompetencies = [];
  }

  // 3. Competency Matrix NLS Items
  if (config.enableNLS && !isPreschool) {
    if (config.nlsMode === 'custom') {
      const customList = parseCustomIndicators(config.customNLS);
      const generatedItems = Array.isArray(plan.competencyMatrix?.nlsItems) ? plan.competencyMatrix.nlsItems : [];
      if (customList.length > 0) {
        const updatedNlsItems: any[] = [];
        customList.forEach((indicatorStr: string, idx: number) => {
          const parts = indicatorStr.split(':');
          const code = parts.length > 1 ? parts[0].trim() : `NLS.${idx + 1}`;
          const desc = parts.length > 1 ? parts.slice(1).join(':').trim() : indicatorStr;
          const matchedGen = generatedItems[idx] || generatedItems.find((g: any) =>
            (g.indicatorCode && g.indicatorCode.toLowerCase() === code.toLowerCase()) ||
            (g.competencyDescription && g.competencyDescription.toLowerCase().includes(desc.toLowerCase().substring(0, 15)))
          );

          updatedNlsItems.push({
            activityName: matchedGen?.activityName || `Hoạt động ${Math.min(idx + 2, 4)}: ${idx === 0 ? 'Hình thành kiến thức mới' : 'Luyện tập & Vận dụng'}`,
            teachingOrganization: matchedGen?.teachingOrganization || 'Giáo viên hướng dẫn và giao nhiệm vụ khai thác công cụ số; học sinh thực hiện thao tác và hoàn thành sản phẩm.',
            indicatorCode: code,
            competencyDescription: desc,
            domain: matchedGen?.domain || 'Năng lực số',
            component: matchedGen?.component || 'Ứng dụng công nghệ số',
            indicator: code,
            activityRef: matchedGen?.activityRef || `HĐ ${Math.min(idx + 2, 4)}`,
            digitalToolUsed: matchedGen?.digitalToolUsed || 'Máy tính, phần mềm và học liệu điện tử'
          });
        });
        plan.competencyMatrix.nlsItems = updatedNlsItems;
      }
    } else if (config.nlsMode === 'ai_generated') {
      // Retain AI generated matrix items if present
      if (Array.isArray(plan.competencyMatrix?.nlsItems) && plan.competencyMatrix.nlsItems.length > 0) {
        plan.competencyMatrix.nlsItems = plan.competencyMatrix.nlsItems.filter(
          (item: any) => !/^NLS[-_]NL\./i.test((item.indicatorCode || '').trim())
        );
      }
    } else {
      // PPCT mode
      if (effectiveNLSIndicators && effectiveNLSIndicators.length > 0) {
        const generatedItems = Array.isArray(plan.competencyMatrix?.nlsItems) ? plan.competencyMatrix.nlsItems : [];
        const updatedNlsItems: any[] = [];

        effectiveNLSIndicators.forEach((indicatorStr: string, idx: number) => {
          const parts = indicatorStr.split(':');
          const code = parts[0]?.trim() || '';
          const desc = parts.slice(1).join(':').trim() || indicatorStr;

          const matchedGen = generatedItems.find((g: any) => 
            (g.indicatorCode && g.indicatorCode.toLowerCase() === code.toLowerCase()) ||
            (g.competencyDescription && g.competencyDescription.toLowerCase().includes(code.toLowerCase()))
          );

          if (matchedGen) {
            updatedNlsItems.push({
              activityName: matchedGen.activityName || `Hoạt động ${idx + 2}: Hình thành kiến thức / Luyện tập`,
              teachingOrganization: matchedGen.teachingOrganization || 'Giáo viên giao nhiệm vụ qua máy tính/học liệu số; học sinh thao tác, thu thập và xử lý dữ liệu chuẩn.',
              indicatorCode: code,
              competencyDescription: desc,
              domain: matchedGen.domain || 'Năng lực số',
              component: matchedGen.component || 'Ứng dụng công nghệ số',
              indicator: code,
              activityRef: matchedGen.activityRef || `HĐ ${idx + 2}`,
              digitalToolUsed: matchedGen.digitalToolUsed || 'Máy tính, phần mềm học tập, học liệu số'
            });
          } else {
            updatedNlsItems.push({
              activityName: `Hoạt động ${Math.min(idx + 2, 4)}: ${idx === 0 ? 'Hình thành kiến thức mới' : 'Luyện tập & Vận dụng'}`,
              teachingOrganization: 'Giáo viên tổ chức cho học sinh khai thác tài liệu, thực hành thao tác trên thiết bị số và hoàn thiện sản phẩm học tập.',
              indicatorCode: code,
              competencyDescription: desc,
              domain: 'Năng lực số',
              component: 'Ứng dụng công nghệ số',
              indicator: code,
              activityRef: `HĐ ${Math.min(idx + 2, 4)}`,
              digitalToolUsed: 'Phần mềm và thiết bị số dạy học'
            });
          }
        });
        plan.competencyMatrix.nlsItems = updatedNlsItems;
      } else if (Array.isArray(plan.competencyMatrix?.nlsItems)) {
        plan.competencyMatrix.nlsItems = plan.competencyMatrix.nlsItems.filter(
          (item: any) => !/^NLS[-_]NL\./i.test((item.indicatorCode || '').trim())
        );
      }
    }

    // For Math: omit Section V NLS table
    if (isMathSubject && plan.competencyMatrix) {
      plan.competencyMatrix.nlsItems = [];
    }
  } else {
    if (plan.competencyMatrix) plan.competencyMatrix.nlsItems = [];
  }

  // 4. Competency Matrix AI Items
  if (config.enableAI && !isPreschool) {
    if (effectiveAIIndicators && effectiveAIIndicators.length > 0) {
      const generatedAiItems = Array.isArray(plan.competencyMatrix?.aiItems) ? plan.competencyMatrix.aiItems : [];
      const updatedAiItems: any[] = [];

      effectiveAIIndicators.forEach((aiStr: string, idx: number) => {
        const parts = aiStr.split(':');
        const code = parts[0]?.trim() || '';
        const desc = parts.slice(1).join(':').trim() || aiStr;

        const matchedGen = generatedAiItems.find((g: any) => 
          (g.indicatorCode && g.indicatorCode.toLowerCase() === code.toLowerCase()) ||
          (g.competencyDescription && g.competencyDescription.toLowerCase().includes(code.toLowerCase()))
        );

        if (matchedGen) {
          updatedAiItems.push({
            activityName: matchedGen.activityName || `Hoạt động ${idx + 2}: Khám phá / Luyện tập ứng dụng AI`,
            teachingOrganization: matchedGen.teachingOrganization || 'Giáo viên hướng dẫn tìm hiểu nguyên lý và trải nghiệm công cụ Trí tuệ nhân tạo.',
            indicatorCode: code,
            competencyDescription: desc,
            domain: matchedGen.domain || 'Giáo dục Trí tuệ nhân tạo',
            component: matchedGen.component || 'Nhận thức và ứng dụng AI',
            indicator: code,
            activityRef: matchedGen.activityRef || `HĐ ${idx + 2}`,
            digitalToolUsed: matchedGen.digitalToolUsed || 'Công cụ AI và phần mềm trực quan'
          });
        } else {
          updatedAiItems.push({
            activityName: `Hoạt động ${idx + 2}: Tìm hiểu và thực hành ứng dụng Trí tuệ nhân tạo (AI)`,
            teachingOrganization: 'Giáo viên thị phạm và hướng dẫn học sinh nhận diện, ứng dụng công cụ AI an toàn, hiệu quả.',
            indicatorCode: code,
            competencyDescription: desc,
            domain: 'Giáo dục Trí tuệ nhân tạo',
            component: 'Nhận thức và ứng dụng AI',
            indicator: code,
            activityRef: `HĐ ${idx + 2}`,
            digitalToolUsed: 'Ứng dụng AI giáo dục'
          });
        }
      });
      plan.competencyMatrix.aiItems = updatedAiItems;
    }
  } else {
    if (plan.competencyMatrix) plan.competencyMatrix.aiItems = [];
  }

  if (plan.appendix && plan.appendix.assignmentPrompt) {
    plan.appendix.assignmentPrompt = formatHomeworkText(plan.appendix.assignmentPrompt);
  }

  return plan;
}

/**
 * Sectional Generator helper: Solves high-demand 503 spikes by breaking large plans
 * into 4 compact, parallel sub-tasks and merging them into the standard LessonPlanOutput schema.
 */
async function generateKHBDSectional(
  config: any,
  onProgress?: (step: number, status: string) => void,
  candidateKeysOrApiKey?: string[] | string,
  primaryModel?: string
) {
  let keysList: string[] = [];
  if (Array.isArray(candidateKeysOrApiKey)) {
    keysList = candidateKeysOrApiKey;
  } else if (typeof candidateKeysOrApiKey === 'string' && candidateKeysOrApiKey.trim()) {
    keysList = extractKeysFromInput(candidateKeysOrApiKey);
  }
  const modelToUse = (primaryModel && primaryModel !== 'gemini-flash-latest' && primaryModel !== 'auto')
    ? primaryModel
    : (config.aiModel && config.aiModel !== 'gemini-flash-latest' && config.aiModel !== 'auto')
      ? config.aiModel
      : 'gemini-3.1-flash-lite';

  const subject = config.subject || 'Tin học';
  const grade = config.grade || 'Lớp 6';
  const lessonTitle = config.lessonTitle || 'Bài học';
  const periods = config.periods || 2;
  const totalPeriods = Number(config.lessonTotalPeriods) || periods;
  const targetPeriodDetail = (config.targetPeriodDetail || '').trim();
  const periodDistributionInfo = targetPeriodDetail 
    ? `${periods} tiết (${targetPeriodDetail}${totalPeriods > periods ? ` / Tổng số ${totalPeriods} tiết của bài` : ''})`
    : `${periods} tiết`;
  const bookSeries = config.bookSeries || 'Kết nối tri thức với cuộc sống';

  const isHDTN = (subject || '').toLowerCase().includes('hoạt động trải nghiệm') ||
                 (subject || '').toLowerCase().includes('hđtn') ||
                 (lessonTitle || '').toLowerCase().includes('sinh hoạt dưới cờ') ||
                 (lessonTitle || '').toLowerCase().includes('sinh hoạt lớp');

  const isTinHoc = (subject || '').toLowerCase().includes('tin') ||
                   (subject || '').toLowerCase().includes('công nghệ thông tin') ||
                   (lessonTitle || '').toLowerCase().includes('tin học');

  const isMath = (subject || '').toLowerCase().includes('toán') ||
                 (lessonTitle || '').toLowerCase().includes('toán');

  const isPreschool = config.schoolLevel === 'Mầm non';
  const isElementary = config.schoolLevel === 'Tiểu học';
  const isMiddleSchool = config.schoolLevel === 'THCS';
  const isHighSchool = config.schoolLevel === 'THPT';

  const hasUploadedSample = Boolean(config.oldPlanContent && config.oldPlanContent.trim().length > 0);

  // Phân vùng vị trí các thẻ ảnh theo từng phần hoạt động trong giáo án mẫu gốc
  function getSlotsForActivityRange(part: 'act1_2' | 'act3_4'): { slots: any[]; promptText: string } {
    const allSlots = config.imageSlots || [];
    if (allSlots.length === 0) {
      return { slots: [], promptText: 'Không có hình ảnh nào trong bài dạy này.' };
    }
    const oldText = config.oldPlanContent || '';
    if (!oldText) {
      const mid = Math.ceil(allSlots.length / 2);
      const sub = part === 'act1_2' ? allSlots.slice(0, mid) : allSlots.slice(mid);
      return {
        slots: sub,
        promptText: sub.length > 0 
          ? `DANH SÁCH THẺ HÌNH ẢNH CẦN BẢO TỒN VỊ TRÍ:\n${sub.map(s => `- ${s.slotTag}: ${s.name || ''}`).join('\n')}`
          : 'Không có hình ảnh nào thuộc phần này.'
      };
    }

    const splitKeywords = [
      /hoạt\s*động\s*3/i,
      /hoạt\s*động\s*luyện\s*tập/i,
      /\b3\.\s*luyện\s*tập/i,
      /\bluyện\s*tập\b/i,
      /\bc\.\s*hoạt\s*động\s*luyện\s*tập/i,
      /\biii\.\s*luyện\s*tập/i,
      /\btiết\s*2\b/i,
    ];

    let splitIndex = -1;
    for (const re of splitKeywords) {
      const match = re.exec(oldText);
      if (match && match.index > 0) {
        if (splitIndex === -1 || match.index < splitIndex) {
          splitIndex = match.index;
        }
      }
    }
    if (splitIndex === -1) {
      splitIndex = Math.floor(oldText.length * 0.55);
    }

    const part1Text = oldText.substring(0, splitIndex);
    const part2Text = oldText.substring(splitIndex);

    const matchedSlots = allSlots.filter((slot: any) => {
      const tag = slot.slotTag;
      if (part === 'act1_2') {
        return part1Text.includes(tag);
      } else {
        return part2Text.includes(tag);
      }
    });

    const finalSlots = matchedSlots.length > 0 ? matchedSlots : (part === 'act1_2' ? allSlots.slice(0, Math.ceil(allSlots.length / 2)) : allSlots.slice(Math.ceil(allSlots.length / 2)));
    return {
      slots: finalSlots,
      promptText: finalSlots.length > 0
        ? `DANH SÁCH THẺ HÌNH ẢNH GỐC THUỘC PHẦN NÀY (BẮT BUỘC ĐẶT ĐÚNG VÀO CÂU HỎI/BÀI TẬP TƯƠNG ỨNG TRONG FILE GỐC):\n${finalSlots.map((s: any) => `- ${s.slotTag}: ${s.name || ''}`).join('\n')}`
        : 'Không có hình ảnh nào thuộc phần này.'
    };
  }

  const samplePlanInstruction = hasUploadedSample ? `
=============================================================================
ĐẶC BIỆT BẮT BUỘC - KHI CÓ GIÁO ÁN MẪU / TÀI LIỆU ĐƯỢC TẢI LÊN (oldPlanContent):
=============================================================================
MỤC ĐÍCH DUY NHẤT: BẢO TỒN NGUYÊN VẸN NỘI DUNG, HÌNH ẢNH, BÀI TẬP VÀ CẤU TRÚC FILE MẪU CŨ, CHỈ TÍCH HỢP NĂNG LỰC SỐ (NLS) VÀ BẢNG MA TRẬN NĂNG LỰC SỐ VÀO ĐÚNG VỊ TRÍ.

1. ĐỂ NGUYÊN NỘI DUNG GỐC CỦA GIÁO ÁN MẪU:
   - Toàn bộ các hoạt động, nội dung bài học, đề mục, câu hỏi khám phá, nhiệm vụ học tập, ví dụ minh họa, bài tập luyện tập, bài tập vận dụng, câu hỏi trắc nghiệm, các bước giải, lời thoại của GV & HS và ĐÁP ÁN CHI TIẾT từ giáo án mẫu BẮT BUỘC PHẢI ĐƯỢC GIỮ NGUYÊN VĂN BẢN VÀ ĐẦY ĐỦ 100%.
   - TUYỆT ĐỐI KHÔNG được tự ý thay thế nội dung bằng bài khác, không tóm tắt cụt ngủn làm mất kiến thức, không bịa đặt các câu chữ thừa thãi không có trong giáo án mẫu.

2. CHỈ ĐỂ MẪU MỚI (CHUYỂN SANG KHUNG MẪU MỚI CHUẨN HIỆN HÀNH):
   - Đưa toàn bộ nội dung của file cũ vào KHUNG MẪU MỚI CHUẨN:
     + Cấp THCS & THPT: Khung Kế hoạch bài dạy theo Công văn 5512/BGDĐT (I. Mục tiêu, II. Thiết bị dạy học, III. Tiến trình dạy học gồm 4 hoạt động: Hoạt động 1: Mở đầu / Khởi động, Hoạt động 2: Hình thành kiến thức mới, Hoạt động 3: Luyện tập, Hoạt động 4: Vận dụng; mỗi hoạt động chia 4 bước chuẩn; Cột Sản phẩm chứa toàn bộ đề mục và kiến thức cốt lõi/đáp án chi tiết).
     + Cấp Tiểu học: Khung Kế hoạch bài dạy theo Công văn 2345/BGDĐT.
     + Cấp Mầm non: Khung Kế hoạch giáo dục theo Chương trình mới (QĐ 388/QĐ-BGDĐT), bảng 2 cột Hoạt động của cô / Hoạt động của trẻ.
   - CHỈ CHỈNH SỬA NHẸ CHO PHÙ HỢP VỚI CÁC ĐỀ MỤC KHUNG MẪU MỚI. TUYỆT ĐỐI KHÔNG TÁC ĐỘNG QUÁ NHIỀU, KHÔNG LÀM THAY ĐỔI DẠNG BÀI HAY NỘI DUNG CỦA FILE CŨ.

3. ĐẶC BIỆT BẢO TỒN CÁC HÌNH ẢNH VÀ CÔNG THỨC TOÁN HỌC (KHÔNG THAY ĐỔI VỊ TRÍ):
   - BẢO TỒN VỊ TRÍ HÌNH ẢNH: Toàn bộ các thẻ giữ chỗ ảnh {{IMAGE_SLOT_1}}, {{IMAGE_SLOT_2}}... trích xuất từ file Word gốc BẮT BUỘC PHẢI ĐƯỢC ĐẶT ĐÚNG VỊ TRÍ TƯƠNG ỨNG trong từng câu hỏi/bài tập/bước của file gốc. Tuyệt đối không làm mất thẻ ảnh, không đổi tên thẻ ảnh, không dồn tất cả thẻ ảnh vào một chỗ sai vị trí.
   - BẢO TỒN CÔNG THỨC TOÁN HỌC & KÝ HIỆU KHOA HỌC: Toàn bộ công thức toán học (phân số \\frac{a}{b}, căn thức, số mũ, phương trình, hình học...): BẮT BUỘC BẢO TỒN NGUYÊN VẸN 100% CÔNG THỨC GỐC, KHÔNG ĐƯỢC TỰ Ý SỬA ĐỔI HAY LÀM BIẾN DẠNG.

4. ĐỊNH DẠNG CÂU HỎI VÀ ĐÁP ÁN TRẮC NGHIỆM TRONG CỘT SẢN PHẨM:
   Bắt buộc trình bày rõ ràng, mỗi đáp án nằm trên MỘT DÒNG RIÊNG BIỆT theo đúng mẫu chuẩn:
   Câu 1. Đáp án B.
   Câu 2. Đáp án C.
   Câu 3. Đáp án A.

5. TÍCH HỢP NĂNG LỰC SỐ (NLS) VÀ BẢNG NĂNG LỰC SỐ:
   - Tích hợp các chỉ báo NLS vào đúng vị trí hoạt động học tập nơi có sử dụng thiết bị số, học liệu điện tử, phần mềm tương tác.
   - Tạo Bảng ma trận NLS đầy đủ, chuẩn xác ở phần cuối giáo án/phụ lục.
   - TUYỆT ĐỐI KHÔNG làm biến dạng hay thay đổi nội dung file mẫu cũ.` : '';

  if (isHDTN) {
    config.enableAI = false;
    config.enableNLS = false;
    config.enableSTEM = false;
  }

  // Automatic lookup for PPCT indicators if not provided directly
  let matchingPPCTConfig: any = null;
  const matchingPPCTGroup = SEED_SAMPLE_PPCT.find(
    (p) => p.subject?.toLowerCase().trim() === subject?.toLowerCase().trim() &&
           p.grade?.toLowerCase().trim() === grade?.toLowerCase().trim()
  );
  if (matchingPPCTGroup && matchingPPCTGroup.lessonConfigs) {
    matchingPPCTConfig = findBestLessonMatchServer(matchingPPCTGroup.lessonConfigs, lessonTitle);
  }

  let effectiveNLSIndicators: string[] = [];
  if (config.nlsMode === 'custom') {
    effectiveNLSIndicators = parseCustomIndicators(config.customNLS);
  } else if (config.nlsMode === 'ai_generated') {
    effectiveNLSIndicators = [];
  } else {
    effectiveNLSIndicators = (config.integratedNLSFromPPCT && config.integratedNLSFromPPCT.length > 0)
      ? config.integratedNLSFromPPCT
      : (matchingPPCTConfig?.integratedNLS || []);
  }

  let effectiveAIIndicators: string[] = [];
  if (config.aiMode === 'custom') {
    effectiveAIIndicators = parseCustomIndicators(config.customAI);
  } else if (config.aiMode === 'ai_generated') {
    effectiveAIIndicators = [];
  } else {
    effectiveAIIndicators = (config.integratedAIFromPPCT && config.integratedAIFromPPCT.length > 0)
      ? config.integratedAIFromPPCT
      : (matchingPPCTConfig?.integratedAI || []);
  }

  const hasStem = (Boolean(config.enableSTEM) || Boolean(matchingPPCTConfig?.hasStemIntegration)) && !isHDTN;
  const stemTopic = (config.stemTopic && config.stemTopic.trim().length > 0)
    ? config.stemTopic.trim()
    : (matchingPPCTConfig?.stemTopic || (lessonTitle.toLowerCase().includes('stem') ? lessonTitle : 'Ứng dụng & Sản phẩm giải pháp STEM liên môn'));

  const MAM_NON_STANDARDS = {
    // Nhà trẻ (12 - 36 tháng)
    'Đi trong đường hẹp mang vật trên tay; Bật tại chỗ': '[TC 3.1, TC 3.3] Giữ thăng bằng di chuyển và bật nhảy chân.',
    'Lăn bóng, bắt bóng cùng cô; Xâu vòng hoa to': '[TC 3.2, TC 4.1] Phối hợp tay - mắt, khéo léo cơ ngón tay.',
    'Bé nhận biết tên mình, đồ dùng cá nhân của bé': '[TX 1.1, TX 3.2] Nhận biết bản thân, gọi tên đồ dùng cá nhân.',
    'Bé chơi ngoan cùng bạn, chào hỏi lễ phép': '[TX 6.1, TX 7.1] Chơi cạnh bạn không tranh giành; biết chào cô.',
    'Nghe và phát âm các từ đơn giản; Xem sách tranh': '[NN 2.1, NN 4.1] Phát âm rõ tiếng quen thuộc; chủ động lật sách.',
    'Thơ/Đồng dao: Lời chào của bé, Giờ ăn': '[NN 3.2, NN 2.5] Đọc theo nhịp điệu, dùng từ ngữ lễ phép.',
    'Nhận biết đồ vật màu Đỏ - Vàng; Hình tròn': '[NT 3.1, NT 3.3] Nhận biết màu sắc nổi bật và hình phẳng.',
    'Nhận biết số lượng: 1 và nhiều; Đồ vật To - Nhỏ': '[NT 3.2, NT 4.1] Phân biệt kích thước và số lượng đơn giản.',
    'Hát và nhún nhảy theo nhạc: Bé đi nhà trẻ': '[NgT 2.2, NgT 2.3] Hát theo bài ngắn, vận động nhún nhảy.',
    'Di màu tự do, vò giấy, chấm màu trang trí': '[NgT 3.1, NgT 3.2] Thao tác tạo hình cơ bản với sáp màu/giấy.',

    // Mẫu giáo bé (3 - 4 tuổi)
    'Đi thăng bằng trên ghế thể dục; Bò chui qua cổng': '[TC 3.1, TC 3.2] Giữ thăng bằng thân người; phối hợp tay chân.',
    'Tung bóng lên cao và bắt bóng; Rửa tay bằng xà phòng': '[TC 3.2, TC 6.1] Bắt bóng khéo léo; thực hành vệ sinh cá nhân.',
    'Nhận biết cảm xúc Vui - Buồn của bản thân và bạn': '[TX 2.1, TX 5.1] Gọi tên cảm xúc cơ bản của mình và người khác.',
    'Bé cất đồ chơi đúng nơi quy định, biết xin phép': '[TX 8.1, TX 4.2] Chấp hành quy định của lớp; ứng xử thân thiện.',
    'Truyện: Đôi bạn nhỏ, Gấu con chia quà': '[NN 1.2, NN 2.3] Lắng nghe, trả lời được câu hỏi và kể lại sự việc.',
    'Làm quen tư thế ngồi xem sách, lật giở từng trang': '[NN 4.1, NN 5.2] Giở sách đúng cách từ trước ra sau.',
    'Nhận biết phân biệt: Hình vuông - Hình chữ nhật': '[NT 3.4, NT 4.1] Chỉ ra đặc điểm phẳng của các hình cơ bản.',
    'Đếm đến 3, nhận biết chữ số 3; So sánh Cao - Thấp': '[NT 3.4, NT 4.4] Đếm số lượng trong phạm vi 3; so sánh kích thước.',
    'Dạy hát: Trường chúng cháu là trường mầm non': '[NgT 2.1, NgT 2.5] Hát đúng giai điệu, thể hiện tình cảm vui tươi.',
    'Xé dán dải màu, nặn quả tròn quen thuộc': '[NgT 3.2, NgT 6.1] Kỹ năng nặn, xé dán tạo sản phẩm theo gợi ý.',

    // Mẫu giáo nhỡ (4 - 5 tuổi) - Full 20 lessons
    'Tung bóng lên cao và bắt bóng bằng 2 tay': '[TC 3.2] Phối hợp tay - mắt, kiểm soát bóng khi bắt.',
    'Tung bắt bóng với người đối diện': '[TC 3.2] Vận động với người khác, phối hợp nhịp nhàng.',
    'Bật liên tục về phía trước': '[TC 3.1] Bật tiến liên tục, tiếp đất giữ thăng bằng.',
    'Đập và bắt bóng bằng 2 tay': '[TC 3.2] Đập bóng xuống sàn nảy lên và bắt bóng khéo léo.',
    'Trò chuyện về trường mầm non Tân Thành của bé': '[TX 3.1, TX 4.3] Nhận biết vị trí của trẻ trong trường, lớp.',
    'Trò chuyện về cô giáo và các cô các bác trong trường': '[TX 3.2, TX 3.4] Nhận biết các thành viên và công việc trong trường.',
    'Bé vui Tết Trung thu': '[TX 3.3, TX 5.2] Nhận biết lễ hội truyền thống, gắn kết bạn bè.',
    'Quy tắc lớp học của bé': '[TX 8.1, TX 6.4] Thực hiện quy định lớp học, nền nếp văn minh.',
    'Đếm đến 1, làm quen chữ số 1': '[NT 3.4, NT 4.4] Đếm số lượng 1 và nhận biết chữ số 1.',
    'Xếp tương ứng 1-1, ghép đôi': '[NT 3.5, NT 4.4] Ghép đôi tương ứng 1-1 giữa 2 nhóm đối tượng.',
    'So sánh hình tròn - hình tam giác': '[NT 3.4, NT 4.1] Nhận biết và so sánh hình dạng đặc trưng.',
    'Đếm đến 2, làm quen chữ số 2': '[NT 3.4, NT 4.4] Đếm tạo nhóm số lượng 2 và nhận biết chữ số 2.',
    'Truyện: Vì sao bé Bin nín khóc': '[NN 1.2, NN 3.1] Nghe hiểu truyện, kể lại hành động nhân vật.',
    'Thơ: Nghe lời cô giáo': '[NN 2.1, NN 3.2] Đọc thơ diễn cảm, phát âm rõ ràng, lễ phép.',
    'Truyện: Sự tích Tết Trung thu': '[NN 1.2, NN 2.3] Nghe hiểu câu chuyện dân gian, kể sự việc chính.',
    'Thơ: Cảm ơn (Lời cảm ơn)': '[NN 2.5, NN 3.2] Sử dụng từ ngữ nghi thức, chào hỏi lễ phép.',
    'Dạy hát: Vui đến trường': '[NgT 2.1, NgT 2.5] Hát đúng nhạc, thể hiện tình cảm rộn ràng.',
    'Làm khung tranh tặng cô giáo': '[NgT 3.1, NgT 6.1] Phối hợp vật liệu, kỹ năng dán/đính sáng tạo.',
    'Nhạc kịch: Câu chuyện Trăng Trung thu': '[NgT 4.2, NgT 7.2] Vận động theo nhạc kết hợp đóng vai hoạt cảnh.',
    'Trang trí bông hoa quy tắc lớp học': '[NgT 3.2, NgT 6.3] Tạo hình bông hoa trang trí lớp học đẹp mắt.',

    // Mẫu giáo lớn (5 - 6 tuổi)
    'Ném trúng đích thẳng đứng xa 2m; Bật sâu 30cm': '[TC 3.2, TC 1.4] Thực hiện vận động thử thách có độ chính xác cao.',
    'Chuyền bắt bóng qua đầu qua chân; Chuỗi liên hoàn 3 vận động': '[TC 3.4, TC 1.3] Phối hợp nhóm; thực hiện chuỗi vận động liền mạch.',
    'Bé chuẩn bị tâm thế vào lớp Một; Ý thức trách nhiệm': '[TX 7.3, TX 6.1] Thích ứng môi trường mới; hiểu quyền và bổn phận.',
    'Hợp tác làm việc nhóm, thương lượng giải quyết mâu thuẫn': '[TX 4.4, TX 4.5] Kỹ năng thương lượng, hòa giải tích cực không bạo lực.',
    'Làm quen 29 chữ cái tiếng Việt: Chữ O, Ô, Ơ, A, Ă, Â...': '[NN 5.1, NN 7.1] Nhận biết chữ cái, hiểu chữ viết thay thế lời nói.',
    'Tập tô nét cơ bản, sao chép tên của mình đúng dòng kẻ': '[NN 7.2, NN 7.3] Cầm bút chuẩn, sao chép chữ từ trái sang phải.',
    'Tách gộp nhóm 10 đối tượng; Đo độ dài bằng thước đo': '[NT 4.4, NT 4.5] Thành thạo tách gộp trong PV 10; kỹ năng đo lường.',
    'Khám phá quy trình công nghệ đơn giản; Thí nghiệm STEM': '[NT 3.3, NT 5.3] Ứng dụng khoa học kỹ thuật giải quyết vấn đề.',
    'Hát ngẫu hứng, sáng tạo lời ca mới theo bài quen thuộc': '[NgT 5.1, NgT 5.2] Sáng tạo âm nhạc, múa ngẫu hứng bộc lộ ý tưởng.',
    'Đóng kịch phân vai theo cốt truyện sáng tạo của nhóm': '[NgT 4.2, NgT 7.3] Biểu cảm diễn xuất, tự chủ đạo cụ và lời thoại vai kịch.',
  };


  const isNew8Activity = isPreschoolNew8Activity(subject, lessonTitle);

  const yccdPreschoolRaw = MAM_NON_STANDARDS[lessonTitle] || '';
  const yccdPreschool = isNew8Activity ? yccdPreschoolRaw : stripPreschoolCodes(yccdPreschoolRaw);
  const yccdInstruction = yccdPreschool ? `\n- BẮT BUỘC sử dụng nguyên văn nội dung sau làm Yêu cầu cần đạt (Kiến thức/Kỹ năng): "${yccdPreschool}". KHÔNG ĐƯỢC TỰ BỊA THÊM.` : '';

  const nlsInstruction = config.enableNLS ? `\n- TÍCH HỢP NĂNG LỰC SỐ (NLS): Nếu người dùng chọn tích hợp NLS, BẮT BUỘC xuất vào mảng digitalCompetencies để hiển thị ở Mục "5. Tích hợp Năng lực số (NLS)". Mô tả rõ: Các hoạt động ứng dụng công nghệ, thiết bị số, màn hình tương tác hoặc hình ảnh/video mô phỏng phù hợp lứa tuổi mầm non (tuyệt đối KHÔNG dùng mã chỉ báo phổ thông).` : '';
  const aiInstruction = config.enableAI ? `\n- TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI): Nếu người dùng chọn tích hợp AI, BẮT BUỘC xuất vào mảng aiCompetencies để hiển thị ở Mục "6. Tích hợp Trí tuệ nhân tạo (AI)". Mô tả rõ: Giáo viên ứng dụng trợ lý AI tạo ra hình ảnh, âm thanh, câu chuyện, tranh ảnh minh họa sống động hoặc nhân vật ảo Robot trò chuyện với trẻ. Trẻ tương tác với AI thông qua sự hướng dẫn của giáo viên (tuyệt đối KHÔNG dùng mã chỉ báo phổ thông).` : '';

  const preschoolAgeProfile = isPreschool ? analyzePreschoolAgeProfile(grade || 'Mẫu giáo lớn (5-6 tuổi)') : null;
  const isMixedAgeClass = preschoolAgeProfile?.category === 'MIXED_AGE';

  const customCodesFromUser = (config.preschoolCustomCodes || '').trim();
  const preschoolObjectivesInstruction = isNew8Activity
    ? `- ĐỐI VỚI NỘI DUNG MỚI TÍCH HỢP (ÁP DỤNG CHUẨN YÊU CẦU THEO QUYẾT ĐỊNH 388/QĐ-BGDĐT):
  + CÁC MÃ TIÊU CHÍ CHỈ BÁO THEO QUYẾT ĐỊNH 388 ĐƯỢC CHỈ ĐỊNH CHO BÀI DẠY NÀY (DO NGƯỜI DÙNG THIẾT LẬP HOẶC MẶC ĐỊNH):
    ${customCodesFromUser ? `"${customCodesFromUser}"` : 'Các mã chuẩn theo QĐ 388 (ví dụ: NT 3.1, TX 4.4, TC 1.2, NN 2.2...)'}
  + BẮT BUỘC ĐƯA CÁC TIÊU CHÍ YÊU CẦU CẦN ĐẠT CỦA BÀI VÀO CÁC GẠCH ĐẦU DÒNG CỦA MỤC TIÊU theo đúng các mã chỉ báo trên.
  + 1. Kiến thức: Gắn mã tiêu chí yêu cầu cần đạt (ví dụ: "- Trẻ biết/nhận biết... (Mã: NT 1.1)")
  + 2. Kỹ năng: Gắn mã tiêu chí yêu cầu cần đạt (ví dụ: "- Trẻ thực hiện được kỹ năng... (Mã: TC 1.1)")`
    : `- ĐỐI VỚI GIÁO ÁN MẦM NON CŨ/TRUYỀN THỐNG (Văn học thơ/truyện, Làm quen chữ cái, Khám phá khoa học, Xã hội, Toán, Tạo hình, Âm nhạc, Thể chất, Tình cảm - KNXH...):
  + BẮT BUỘC LẤY LẠI ĐÚNG MẪU GIÁO ÁN BAN ĐẦU TRƯỚC KHI CẬP NHẬT 8 LĨNH VỰC MỚI, GIỮ NGUYÊN ĐỊNH DẠNG BAN ĐẦU.
  + TUYỆT ĐỐI KHÔNG ĐIỀN MÃ TIÊU CHÍ NÀO: KHÔNG ghi "(Mã: NN 5.1)", KHÔNG ghi "(Mã: NT 1.1)", KHÔNG ghi bất kỳ mã chỉ báo nào trong phần Kiến thức và Kỹ năng.
  + 1. Kiến thức: Các gạch đầu dòng mô tả những gì trẻ biết, hiểu (TUYỆT ĐỐI KHÔNG GẮN MÃ).
${isMixedAgeClass ? `    * ĐỐI VỚI LỚP GHÉP / ĐA ĐỘ TUỔI (${grade}): BẮT BUỘC PHÂN HÓA RÕ RÀNG KIẾN THỨC THEO TỪNG ĐỘ TUỔI (Ví dụ nếu lớp ghép 3-4-5 tuổi:
      - 5 tuổi: Trẻ nhận biết nhóm có số lượng X, đếm đến X, nhận biết chữ số X biểu thị cho các nhóm có số lượng X. Trẻ đếm từ 1 đến X, đọc được số X và các số nhỏ hơn X. So sánh 2 nhóm đối tượng, biết thêm bớt để có số lượng bằng nhau.
      - 4 tuổi: Trẻ biết đếm đến X, nhận biết các nhóm có X đối tượng. Trẻ biết tạo nhóm, xếp tương ứng 1- 1, biết so sánh 2 nhóm đồ vật, biết đếm đúng số lượng và sử dụng đúng chữ số tương ứng theo cô và các bạn.
      - 3 tuổi: Trẻ đếm số lượng trong phạm vi X theo cô, đếm cùng các bạn.)` : '    Ví dụ: "- Trẻ biết tên bài thơ/bài hát...", "- Trẻ hiểu nội dung bài...".'}
  + 2. Kỹ năng: Các gạch đầu dòng rèn luyện kỹ năng (TUYỆT ĐỐI KHÔNG GẮN MÃ).
${isMixedAgeClass ? `    * ĐỐI VỚI LỚP GHÉP / ĐA ĐỘ TUỔI (${grade}): BẮT BUỘC PHÂN HÓA RÕ RÀNG KỸ NĂNG THEO TỪNG ĐỘ TUỔI (Ví dụ nếu lớp ghép 3-4-5 tuổi:
      - 5 tuổi: Rèn kỹ năng đếm thành thạo, so sánh số lượng giữa 2 nhóm, thêm bớt tạo sự bằng nhau trong phạm vi X, chọn và gắn thẻ số X chính xác, nhanh nhẹn.
      - 4 tuổi: Rèn kỹ năng xếp tương ứng 1-1 thẳng hàng từ trái sang phải, đếm theo thứ tự không bỏ sót đối tượng, tìm đúng thẻ số X theo cô và bạn.
      - 3 tuổi: Rèn kỹ năng chú ý quan sát, chỉ tay và đếm theo cô, phát âm rõ từ chỉ số lượng.)` : '    Ví dụ: "- Rèn kỹ năng phát âm...", "- Phát triển kỹ năng vận động...".'}`;
  const ageSpecificInstruction = preschoolAgeProfile ? `
=============================================================================
ĐẶC BIỆT CHÚ Ý - PHÂN TÍCH VÀ CĂN CHỈNH TOÀN BỘ GIÁO ÁN THEO ĐỘ TUỔI: "${preschoolAgeProfile.rawGrade}" (${preschoolAgeProfile.standardName})
=============================================================================
- ĐỘ TUỔI THỰC TẾ CỦA LỚP: "${preschoolAgeProfile.rawGrade}".
- THỜI LƯỢNG HOẠT ĐỘNG CHUẨN ĐÚNG ĐỘ TUỔI: ${preschoolAgeProfile.recommendedDuration}.
- ĐẶC ĐIỂM TÂM SINH LÝ & MỨC ĐỘ TẬP TRUNG: ${preschoolAgeProfile.developmentalTraits.join('; ')}.
- TRỌNG TÂM NHẬN THỨC & PHÁT TRIỂN: ${preschoolAgeProfile.cognitiveFocus}.
- ĐẶC ĐIỂM NGÔN NGỮ, LỜI NÓI CÔ VÀ TRẺ: ${preschoolAgeProfile.languageAndSpeech}.
- VẬN ĐỘNG & THAO TÁC HỌC LIỆU: ${preschoolAgeProfile.motorSkills}.
- PHƯƠNG PHÁP SƯ PHẠM ĐỀ XUẤT: ${preschoolAgeProfile.pedagogicalStrategy}.
- HƯỚNG DẪN BIÊN SOẠN RIÊNG BIỆT CHO ĐỘ TUỔI NÀY:
${preschoolAgeProfile.promptGuidance}
- BẮT BUỘC TUÂN THỦ: Mọi câu hỏi của cô, thao tác của trẻ, mức độ kiến thức, kỹ năng và sản phẩm dự kiến trong giáo án BẮT BUỘC PHẢI VỪA SỨC, ĐÚNG VỚI ĐẶC ĐIỂM TÂM LÝ LỨA TUỔI "${preschoolAgeProfile.rawGrade}". Cột "Hoạt động của trẻ" phải phản ánh đúng từ ngữ, phản xạ và hành động chân thực của trẻ ở lứa tuổi này.
=============================================================================
` : '';

  const hasPreschoolTheme = isPreschool && (config.preschoolCategoryMode === 'theme' || Boolean(config.preschoolMainTheme));
  const preschoolThemeInstruction = hasPreschoolTheme ? `
=============================================================================
CHỦ ĐỀ GIÁO DỤC MẦM NON (BẮT BUỘC BÁM SÁT 100%):
- CHỦ ĐỀ LỚN: "${config.preschoolMainTheme || 'Trường mầm non'}"
${config.preschoolSubTheme ? `- CHỦ ĐỀ NHỎ (CHỦ ĐỀ NHÁNH / SỰ KIỆN): "${config.preschoolSubTheme}"` : ''}
- YÊU CẦU NỘI DUNG VÀ HỌC LIỆU: Mọi câu chuyện, hình ảnh, bài hát, câu hỏi gợi mở, học cụ, trò chơi và tình huống khởi động BẮT BUỘC phải lồng ghép khéo léo và bám sát Chủ đề lớn "${config.preschoolMainTheme || 'Trường mầm non'}" ${config.preschoolSubTheme ? `và Chủ đề nhỏ "${config.preschoolSubTheme}"` : ''}.
=============================================================================
` : '';

  const preschoolPrompt = `\nĐẶC BIỆT QUAN TRỌNG ĐỐI VỚI CẤP MẦM NON:
${PRESCHOOL_CURRICULUM_MATRIX}
${PRESCHOOL_LESSON_PLAN_DOMAINS_GUIDE}
${ageSpecificInstruction}
${preschoolThemeInstruction}
${yccdInstruction}${nlsInstruction}${aiInstruction}

- BẮT BUỘC soạn theo Kế hoạch tổ chức hoạt động giáo dục Mầm non, TUYỆT ĐỐI KHÔNG dùng Công văn 5512.
${preschoolObjectivesInstruction}
- Ngôn ngữ, hoạt động phải phù hợp với tâm lý lứa tuổi mầm non (cô và trẻ).
- Tích hợp phát triển 4 phẩm chất cốt lõi: Yêu thương, Tôn trọng, Trung thực, Trách nhiệm.
- Tích hợp phát triển 5 năng lực nền tảng: Giao tiếp, Hợp tác, Giải quyết vấn đề, Tự lực, Thích ứng.
- BẮT BUỘC NHẬN DIỆN CHÍNH XÁC HOẠT ĐỘNG / LĨNH VỰC BÀI DẠY (Âm nhạc, Khoa học, Xã hội, Thơ, Truyện, Toán, Chữ cái, Thể chất, Tạo hình, Hoạt động vui chơi trong lớp, Hoạt động ngoài trời, Trò chơi vận động, Hoạt động giáo dục kỹ năng, Trò chơi dân gian, Hoạt động tăng cường tiếng Việt, Hoạt động tập tô chữ cái, Hoạt động trò chơi chữ cái) VÀ ÁP DỤNG ĐÚNG CẤU TRÚC MẪU CHUẨN TIẾN TRÌNH CỦA HOẠT ĐỘNG ĐÓ TRONG PRESCHOOL_LESSON_PLAN_DOMAINS_GUIDE.
- NGHIÊM CẤM THAY ĐỔI CẤU TRÚC PHẦN PHẨM CHẤT VÀ NĂNG LỰC CỦA MỤC I. MỤC ĐÍCH - YÊU CẦU:
  3. Phẩm chất:
  - Yêu thương: ...
  - Tôn trọng: ...
  4. Năng lực:
  - Tự lực: ...
  - Thích ứng: ...
- CẤU TRÚC GIÁO ÁN PHẢI TUÂN THỦ NGHIÊM NGẶT FORM SAU:
I. Mục đích - yêu cầu
${isNew8Activity ? `1. Kiến thức: Gắn mã tiêu chí yêu cầu cần đạt theo QĐ 388 (ví dụ: "- Trẻ biết/nhận biết... (Mã: NT 1.1)")
2. Kỹ năng: Gắn mã tiêu chí yêu cầu cần đạt theo QĐ 388 (ví dụ: "- Trẻ thực hiện được kỹ năng... (Mã: TC 1.1)")` : `1. Kiến thức: (TUYỆT ĐỐI KHÔNG GẮN MÃ CHỈ BÁO, giữ nguyên định dạng mẫu giáo án ban đầu)
2. Kỹ năng: (TUYỆT ĐỐI KHÔNG GẮN MÃ CHỈ BÁO, giữ nguyên định dạng mẫu giáo án ban đầu)`}
3. Phẩm chất (Gắn với Yêu thương, Tôn trọng...):
4. Năng lực (Gắn với Tự lực, Thích ứng...):
5. Tích hợp Năng lực số (NLS): (Đưa vào trường digitalCompetencies nếu người dùng chọn tích hợp NLS, nếu không chọn để [])
6. Tích hợp Trí tuệ nhân tạo (AI): (Đưa vào trường aiCompetencies nếu người dùng chọn tích hợp AI, nếu không chọn để [])
II. Chuẩn bị: (BẮT BUỘC ĐÚNG 100% CẤU TRÚC 3 MỤC SAU)
1. Chuẩn bị của cô:
- Môi trường: [Mô tả chi tiết môi trường lớp học, không gian bài trí theo chủ đề, an toàn, sạch sẽ, thoáng mát]
- Đồ dùng của cô: [Mô tả cụ thể giáo án điện tử, máy tính/tivi, bài giảng tương tác, đồ dùng trực quan, học cụ, tranh ảnh, nhạc nền]
2. Chuẩn bị của trẻ:
- Trang phục: [Trang phục gọn gàng, phù hợp thời tiết, thoải mái, thuận tiện cho vận động và trải nghiệm]
- Đồ dùng của trẻ: [Mỗi trẻ hoặc nhóm trẻ có đủ rổ đồ dùng, học cụ trải nghiệm phù hợp với bài học]
- Tâm sinh lý của trẻ: [Tâm thế vui tươi, hào hứng, tự tin, sẵn sàng tham gia hoạt động cùng cô và các bạn]
3. Phối hợp với phụ huynh:
- [Nội dung cụ thể phối hợp phụ huynh: hỗ trợ nguyên vật liệu mở/tái chế an toàn, trao đổi thông tin, củng cố rèn luyện cho trẻ tại nhà]
III. Tiến trình hoạt động
Bảng chia 2 cột: "Hoạt động của giáo viên" và "Hoạt động của trẻ" (Tiến trình 5 bước theo đúng chuẩn của Hoạt động / Lĩnh vực bài dạy).
- KHỔNG ĐƯỢC BỎ BẤT KỲ NỘI DUNG NÀO TỪ FILE GIÁO ÁN CŨ TẢI LÊN (oldPlanContent). Tái cấu trúc chuẩn hóa nội dung giáo án cũ khớp đúng 5 bước của Lĩnh vực bài dạy.
- YÊU CẦU ĐẶC BIỆT CHO PHẦN "2. Khám phá - Trải nghiệm": BẮT BUỘC thiết kế theo hướng trải nghiệm. Giáo viên cho trẻ trải nghiệm/thực hiện thử nhiệm vụ trước -> Đặt câu hỏi gợi mở để trẻ tự suy nghĩ và nêu lên cách thực hiện -> SAU ĐÓ giáo viên mới thực hiện làm mẫu và chuẩn hóa lại kỹ năng. Tuyệt đối KHÔNG làm mẫu hoặc giải thích cách làm trước khi trẻ được trải nghiệm.
- TRÌNH BÀY RÕ RÀNG VÀ CHI TIẾT: Các hoạt động 1, 2, 3, 4, 5 (Tiến trình hoạt động) PHẢI SOẠN RẤT CHI TIẾT, ĐẦY ĐỦ VÀ SÂU SẮC. Bắt buộc mô tả cụ thể từng lời nói, câu lệnh, câu hỏi gợi mở của giáo viên và hành động, lời đáp, thái độ dự kiến của trẻ. Không viết chung chung sơ sài.
- RIÊNG ĐỐI VỚI TIẾT THỂ DỤC / LĨNH VỰC PHÁT TRIỂN THỂ CHẤT (VẬN ĐỘNG):
  + Bước 1 BẮT BUỘC là "1. Khởi động – Tạo hứng thú": Đi kết hợp các kiểu đi/chạy theo hiệu lệnh và nhạc, xoay các khớp cổ tay, cổ chân, bả vai, hông, khớp gối. Chuyển về đội hình hàng ngang dãn cách đều chuẩn bị tập BTPTC. (TUYỆT ĐỐI KHÔNG tập BTPTC ở bước 1 này).
  + Bước 2 BẮT BUỘC là "2. Khám phá – Trải nghiệm nhiệm vụ vận động.":
    * BẮT BUỘC CÓ NỘI DUNG VÀ ĐỀ MỤC "* Bài tập phát triển chung:" Ở DƯỚI MỤC "2. Khám phá – Trải nghiệm nhiệm vụ vận động.":
      - Tập theo nhạc bài hát chủ đề (ví dụ: bài hát theo chủ đề hoặc “Trường chúng cháu là trường mầm non”):
      + Động tác Tay: Mô tả cụ thể (2 lần x 8 nhịp; nếu là động tác bổ trợ/nhấn mạnh thì 3 lần x 8 nhịp).
      + Động tác Bụng/Lưng: Mô tả cụ thể (2 lần x 8 nhịp).
      + Động tác Chân: Mô tả cụ thể (2 lần x 8 nhịp).
      + Động tác Bật: Mô tả cụ thể (2 lần x 8 nhịp).
      - Cho trẻ chuyển về đội hình 2 hàng đối diện nhau dãn cách cách nhau 3 - 4m để chuẩn bị VĐCB.
    * TIẾP THEO LÀ ĐỀ MỤC "* Vận động cơ bản:" (hoặc "* Vận động cơ bản (VĐCB): [Tên bài học vận động]"):
      - Cô giới thiệu sơ đồ sân tập / dụng cụ vận động và gợi mở tình huống thử thách.
      - Mời 1 - 2 trẻ lên thử trải nghiệm thực hiện vận động theo cách của mình trước; Cô và cả lớp quan sát, gợi mở tư thế đứng, hướng nhìn (tuyệt đối KHÔNG làm mẫu trước ở bước 2 này).
  + Bước 3 BẮT BUỘC là "3. Chia sẻ – Hình thành cách thực hiện": Mời trẻ chia sẻ cách thực hiện; Cô làm mẫu 2 - 3 lần (lần 1 toàn phần, lần 2 phân tích kỹ thuật vận động chi tiết, lần 3 nhấn mạnh điểm mấu chốt); Mời 2 trẻ lên thực hiện lại để cô và cả lớp chuẩn hóa.
  + Bước 4 BẮT BUỘC là "4. Thực hành – Vận dụng": Trẻ lần lượt thực hành theo hàng/nhóm từ dễ đến khó (cá nhân -> nhóm -> thi đua giữa các tổ); Cô bao quát sửa sai; Tổ chức trò chơi vận động củng cố hào hứng.
  + Bước 5 BẮT BUỘC là "5. Chia sẻ – Đánh giá và Hồi tĩnh": Trao đổi cảm nhận của trẻ sau buổi tập, cô nhận xét tuyên dương; Hồi tĩnh: Cho trẻ đi nhẹ nhàng 1 - 2 vòng quanh sân/phòng tập theo nhạc êm dịu, làm động tác chim bay thả lỏng cơ thể, hít thở sâu.
- RIÊNG ĐỐI VỚI MÔN ÂM NHẠC (LĨNH VỰC NGHỆ THUẬT): Soạn RẤT CHI TIẾT VÀ KỸ LƯỠNG. Dùng VĂN PHONG SƯ PHẠM MẦM NON NGỌT NGÀO, DỊU DÀNG, TRÌU MẾN, GIÀU TÍNH NGHỆ THUẬT VÀ CẢM XÚC. QUY ĐỊNH BẮT BUỘC: Ở Mục "3. Chia sẻ – Thảo luận" BẮT BUỘC PHẢI CÓ ĐẦY ĐỦ 2 NỘI DUNG VỚI ĐÚNG ĐỀ MỤC: "a. Dạy hát: [Tên bài hát trọng tâm] (TT)" và "b. Nghe hát: [Tên bài nghe hát]" (KHÔNG CÓ LÀ SAI YÊU CẦU NGHIÊM TRỌNG). Trong cột Hoạt động của trẻ tuyệt đối KHÔNG chứa nhãn "a." hay "b." đứng riêng lẻ, chỉ ghi các gạch đầu dòng mô tả phản ứng, hành động của trẻ tương ứng cho từng phần dạy hát và nghe hát.
- RIÊNG ĐỐI VỚI HOẠT ĐỘNG TẬP TÔ CHỮ CÁI (VÀ TẬP TÔ, ĐỒ, SAO CHÉP NÉT CƠ BẢN/CHỮ CÁI):
  BẮT BUỘC tuân thủ đúng 5 bước chuẩn mực:
  + Bước 1: "1. Gợi hứng thú – Hình thành và lựa chọn ý tưởng": Trò chơi ngón tay "Ngón tay nhảy múa", tạo tình huống nhân vật Bạn Bút Chì, quan sát hình ảnh thực tế chứa nét/chữ (ngôi nhà, hàng rào, tia nắng...), đàm thoại gợi mở tư thế ngồi và đặc điểm nét/chữ, dẫn dắt vào bài.
  + Bước 2: "2. Thỏa thuận - Lập kế hoạch thực hiện": BẮT BUỘC có 3 nội dung trọng tâm rõ ràng: "* Hướng dẫn tư thế và cách cầm bút:" (ngồi thẳng lưng, mắt cách vở 25-30cm, cầm bút 3 ngón tay cái-trỏ-giữa, tay kia giữ vở), "* Hướng dẫn tô, đồ nét / chữ cái:" (cô làm mẫu đặt bút tại điểm bắt đầu, kéo theo đường chấm mờ đến điểm kết thúc, không đưa bút lung tung), "* Hướng dẫn sao chép nét / chữ cái:" (nhìn mẫu -> xác định điểm bắt đầu -> đưa bút đúng hướng -> dừng đúng điểm; quy tắc 4 bước: "Nhìn mẫu – Đặt bút – Đúng hướng – Dừng đúng điểm").
  + Bước 3: "3. Thực hiện hoạt động": Trẻ thực hành từng bước (tư thế ngồi, đặt vở, cầm bút, tay giữ vở, tô/đồ/sao chép); Cô quan sát đến từng bàn nhẹ nhàng sửa tư thế ngồi, cách cầm bút và nét vẽ; khuyến khích trẻ tự kiểm tra.
  + Bước 4: "4. Mở rộng và phát triển kỹ năng": Trò chơi 1 "Nét nào biến mất?" (hoặc "Chữ cái nào biến mất?"), Trò chơi 2 "Bé làm họa sĩ nhí" (vận dụng nét vẽ tranh đơn giản) hoặc "Tìm chữ trong từ/tranh".
  + Bước 5: "5. Chia sẻ – Đánh giá – Kết thúc": BẮT BUỘC gồm 3 nội dung: "* Chia sẻ:" (trẻ đặt bút, thả lỏng ngón tay, giới thiệu và nhận xét sản phẩm), "* Đánh giá:" (khen ngợi tư thế ngồi, cách cầm bút, nét tô đồ đúng hướng; khắc sâu bí quyết "Ngồi đúng – Cầm bút đúng – Nhìn mẫu kỹ – Đưa bút đúng hướng"), "* Kết thúc:" (thu dọn đồ dùng, vận động nhẹ ngón tay/cổ tay).
- ĐỐI VỚI LĨNH VỰC NHẬN THỨC (KHÁM PHÁ KHOA HỌC / KHÁM PHÁ XÃ HỘI / TOÁN) VÀ CÁC LĨNH VỰC KHÁC: Áp dụng đúng 5 bước tiến trình: 1. Khởi động – Tạo tình huống, 2. Khám phá – Trải nghiệm, 3. Chia sẻ – Thảo luận, 4. Vận dụng – Mở rộng, 5. Đánh giá – Điều chỉnh. Trẻ được trực tiếp thao tác, làm thí nghiệm, trải nghiệm thực tế trước; giáo viên quan sát, gợi mở và tổng kết sau. Toàn bộ nằm trong 1 bảng 2 cột duy nhất (Hoạt động của Cô | Hoạt động của Trẻ). Tuyệt đối KHÔNG chèn các đề mục âm nhạc (a. Dạy hát, b. Nghe hát) vào các môn khoa học/xã hội/toán/thơ/truyện.
- Mỗi mục, mỗi ý BẮT BUỘC phải xuống dòng. Sử dụng gạch đầu dòng (-) rõ ràng ở mỗi ý con.`;

  const textbookStructure = (!hasUploadedSample) ? getTextbookLessonStructure(subject, grade, lessonTitle) : null;
  const textbookStructureInstruction = textbookStructure ? `
CẤU TRÚC VÀ NỘI DUNG SÁCH GIÁO KHOA CHUẨN XÁC (${textbookStructure.bookSeries} - ${textbookStructure.lessonTitle}):
BẮT BUỘC DẬP KHUÔN TOÀN BỘ CÁC ĐỀ MỤC LA MÃ (I., II...), TIỂU MỤC (1., 2...) VÀ NỘI DUNG SGK NÀY VÀO CỘT SẢN PHẨM (productExpected) TRONG BẢNG:
${textbookStructure.sections.map((sec, idx) => `
* PHẦN ${idx + 1}: ${sec.romanNumeral} ${sec.subHeading}
- ĐƯA VÀO CỘT SẢN PHẨM TRONG BẢNG (productExpected): Tên đề mục đứng trên 1 dòng riêng, kèm các gạch đầu dòng kiến thức ghi vở:
${sec.romanNumeral}
${sec.subHeading}
${sec.coreKnowledge.map(k => `- ${k}`).join('\n')}
- Nhiệm vụ khám phá SGK đưa vào các bước tổ chức của GV và HS (cột Hoạt động của GV và HS):
${sec.explorationTasks.map(t => `- ${t}`).join('\n')}
`).join('\n')}
${textbookStructure.practiceExercises ? `
* LUYỆN TẬP (HOẠT ĐỘNG 3):
- Trò chơi/bài tập: ${textbookStructure.practiceExercises.gameOrExerciseName || 'Luyện tập SGK'}
- Câu hỏi:
${textbookStructure.practiceExercises.questions.map(q => `  + ${q}`).join('\n')}
- Đáp án chi tiết ở Cột Sản phẩm trong bảng:
${textbookStructure.practiceExercises.answers.map(a => `  + ${a}`).join('\n')}
` : ''}
${textbookStructure.applicationQuestions ? `
* VẬN DỤNG (HOẠT ĐỘNG 4):
${textbookStructure.applicationQuestions.map(q => `- ${q}`).join('\n')}
` : ''}
${textbookStructure.nextLessonPreparation ? `
* HƯỚNG DẪN TỰ HỌC VÀ CHUẨN BỊ BÀI TIẾP THEO:
- ${textbookStructure.nextLessonPreparation}
` : ''}
` : '';

  const baseContext = `Bài dạy: "${lessonTitle}", Môn: ${subject}, Khối: ${grade}, Thời lượng thực hiện: ${periodDistributionInfo}.
Bộ sách: ${bookSeries} (BẮT BUỘC bám sát 100% SGK Kết nối tri thức).
${textbookStructureInstruction}
${samplePlanInstruction}
${totalPeriods > periods && targetPeriodDetail ? `LƯU Ý QUAN TRỌNG VỀ PHÂN BỔ TIẾT: Đây là Kế hoạch bài dạy soạn riêng cho "${targetPeriodDetail}" (Thời lượng ${periods} tiết trong tổng số ${totalPeriods} tiết của bài học "${lessonTitle}"). Hãy thiết kế các hoạt động học tập (Khởi động, Khám phá kiến thức, Luyện tập, Vận dụng) với dung lượng và trọng tâm khớp đúng nội dung và thời lượng của tiết/phần được phân công này.` : ''}
${config.ppctContent ? `THAM KHẢO PHÂN PHỐI CHƯƠNG TRÌNH (PPCT):\n"""\n${config.ppctContent.substring(0, 5000)}\n"""\nHãy tham khảo nội dung PPCT trên để xác định đúng chuẩn yêu cầu, các nội dung trọng tâm cần dạy và số tiết của bài.` : ''}
Tích hợp Năng lực số (NLS): ${config.enableNLS ? `CÓ TÍCH HỢP (Chế độ: ${config.nlsMode === 'custom' ? 'Dán tùy chọn ngoài' : config.nlsMode === 'ai_generated' ? 'AI tự thiết kế sáng tạo' : 'Chuẩn PPCT / TT 02/2025'})` : 'KHÔNG TÍCH HỢP (để mảng rỗng [])'}.
Tích hợp AI: ${config.enableAI ? `CÓ TÍCH HỢP (Chế độ: ${config.aiMode === 'custom' ? 'Dán tùy chọn ngoài' : config.aiMode === 'ai_generated' ? 'AI tự thiết kế sáng tạo' : 'Chuẩn PPCT / QĐ 2422'})` : 'KHÔNG TÍCH HỢP (để mảng rỗng [])'}.
Tích hợp STEM: ${hasStem ? `CÓ TÍCH HỢP CHỦ ĐỀ STEM: "${stemTopic}"` : 'KHÔNG TÍCH HỢP STEM'}.

${config.enableNLS && !isPreschool ? `
=============================================================================
${config.nlsMode === 'custom' && config.customNLS && config.customNLS.trim() ? `
QUY TẮC NĂNG LỰC SỐ (NLS) - NGƯỜI DÙNG DÁN TÙY CHỌN NỘI DUNG NGOÀI:
Nội dung Năng lực số người dùng cung cấp để tích hợp:
"""
${config.customNLS.trim()}
"""
(BẮT BUỘC: Đưa trực tiếp toàn bộ các yêu cầu/biểu hiện NLS tự dán này vào mục digitalCompetencies trong Mục I, phân tích gắn cụ thể vào từng hoạt động dạy học và sinh Bảng ma trận NLS tương ứng).
` : config.nlsMode === 'ai_generated' ? `
QUY TẮC NĂNG LỰC SỐ (NLS) - AI TỰ THIẾT KẾ ĐỀ XUẤT SÁNG TẠO:
- AI tự động phân tích sâu bài dạy "${lessonTitle}", môn ${subject}, khối ${grade} để tự thiết kế và đề xuất các mục tiêu Năng lực số (digitalCompetencies) và Bảng ma trận NLS (competencyMatrix.nlsItems) thực tế, phong phú, phù hợp nhất với học sinh (như tìm kiếm thông tin, công cụ tương tác số, giải quyết vấn đề với công nghệ số).
- Không bị giới hạn hay gò bó bởi kho có sẵn hay văn bản dán.
` : `
QUY TẮC BẮT BUỘC VỀ NĂNG LỰC SỐ (NLS) THEO TT 02/2025/TT-BGDĐT VÀ CV 3456:
${effectiveNLSIndicators.length > 0 ? `
CHỈ BÁO NLS BẮT BUỘC TỪ PHÂN PHỐI CHƯƠNG TRÌNH (PPCT) CHO BÀI HỌC NÀY:
${effectiveNLSIndicators.map((ind: string) => `- ${ind}`).join('\n')}
(BẮT BUỘC: Sử dụng đúng 100% các mã và nội dung chỉ báo NLS ở trên vào mục digitalCompetencies và bảng ma trận NLS. TUYỆT ĐỐI KHÔNG TỰ BỊA MÃ LẠ NHƯ "NLS-NL.1.1", "NLS-NL.2.2"!).
` : `
BẮT BUỘC CHỈ SỬ DỤNG CÁC MÃ CHỈ BÁO TRONG TỪ ĐIỂN NLS CHUẨN (dạng 1.1.TC1a, 1.2.TC1a, 3.1.TC1a, 5.1.TC1a... cho cấp THCS, hoặc 1.1.NC1a cho THPT, 1.1.CB1a cho Tiểu học).
TUYỆT ĐỐI CẤM TỰ BỊA CÁC MÃ DẠNG "NLS-NL.1.1", "NLS-NL.2.2", "NLS-1.1".
`}
`}
=============================================================================
` : ''}

${config.enableAI && !isPreschool ? `
=============================================================================
${config.aiMode === 'custom' && config.customAI && config.customAI.trim() ? `
QUY TẮC GIÁO DỤC TRÍ TUỆ NHÂN TẠO (AI) - NGƯỜI DÙNG DÁN TÙY CHỌN NỘI DUNG NGOÀI:
Nội dung Giáo dục AI người dùng cung cấp để tích hợp:
"""
${config.customAI.trim()}
"""
(BẮT BUỘC: Đưa trực tiếp toàn bộ các yêu cầu/biểu hiện AI tự dán này vào mục aiCompetencies trong Mục I, phân tích gắn cụ thể vào từng hoạt động dạy học và sinh Bảng ma trận AI tương ứng).
` : config.aiMode === 'ai_generated' ? `
QUY TẮC GIÁO DỤC TRÍ TUỆ NHÂN TẠO (AI) - AI TỰ THIẾT KẾ ĐỀ XUẤT SÁNG TẠO:
- AI tự động phân tích sâu bài dạy để tự thiết kế và đề xuất các mục tiêu Giáo dục AI (aiCompetencies) và Bảng ma trận AI (competencyMatrix.aiItems) phù hợp nhất theo tinh thần Quyết định 2422/QĐ-BGDĐT.
` : `
QUY TẮC BẮT BUỘC VỀ GIÁO DỤC AI THEO QUYẾT ĐỊNH 2422/QĐ-BGDĐT:
${effectiveAIIndicators.length > 0 ? `
CHỈ BÁO AI BẮT BUỘC TỪ PHÂN PHỐI CHƯƠNG TRÌNH (PPCT) CHO BÀI HỌC NÀY:
${effectiveAIIndicators.map((ind: string) => `- ${ind}`).join('\n')}
(BẮT BUỘC: Sử dụng đúng 100% các mã và nội dung chỉ báo AI ở trên).
` : `
Quy ước mã hoá YCCĐ AI chuẩn: [Lớp].[Mã chủ đề].[Số thứ tự] (Ví dụ: 6.A1.1, 6.C1.1, 7.C5.1, 8.A1.1, 9.A1.1, 10.C3.1...).
`}
`}
=============================================================================
` : ''}
${isPreschool ? preschoolPrompt : ''}
${isHDTN ? `\nĐẶC BIỆT ĐỐI VỚI MÔN HOẠT ĐỘNG TRẢI NGHIỆM, HƯỚNG NGHIỆP (HĐTN - HN):
- BẮT BUỘC soạn thuần tuý theo chuẩn mẫu Công văn 5512/BGDĐT.
- Năng lực chung: Năng lực tự chủ và tự học; Năng lực giao tiếp và hợp tác; Năng lực giải quyết vấn đề và sáng tạo.
- Năng lực đặc thù môn HĐTN-HN: Năng lực thích ứng với cuộc sống; Năng lực thiết kế và tổ chức hoạt động; Năng lực định hướng nghề nghiệp.
- Phẩm chất: Yêu nước, nhân ái, chăm chỉ, trung thực, trách nhiệm.
- TIẾN TRÌNH DẠY HỌC / HOẠT ĐỘNG: Tuân thủ 4 hoạt động theo chuẩn 4 bước của CV 5512 (Bước 1: Chuyển giao nhiệm vụ; Bước 2: Thực hiện nhiệm vụ; Bước 3: Báo cáo, thảo luận; Bước 4: Kết luận, nhận định).
- TUYỆT ĐỐI KHÔNG tích hợp AI, không tích hợp Năng lực số, không tạo ma trận AI hay các phụ lục mở rộng không thuộc chuẩn Công văn 5512.` : ''}
${hasStem ? `\nĐẶC BIỆT: BÀI HỌC CÓ TÍCH HỢP NỘI DUNG GIÁO DỤC STEM THEO PHÂN PHỐI CHƯƠNG TRÌNH:
- Tên chủ đề STEM tích hợp: "${stemTopic}"
- BẮT BUỘC thiết kế và biên soạn bài dạy tích hợp STEM theo đúng hướng dẫn của Bộ GD&ĐT (Công văn 3089/BGDĐT-GDTrH và Công văn 5512):
  + Định hướng liên môn Khoa học (S), Công nghệ (T), Kỹ thuật (E), Toán học (M) gắn liền chủ đề "${stemTopic}".
  + Hoạt động học phải hướng tới quy trình thiết kế kỹ thuật, chế tạo, thử nghiệm, báo cáo và nghiệm thu sản phẩm STEM "${stemTopic}".` : ''}
${config.oldPlanContent ? `NỘI DUNG GIÁO ÁN MẪU TẢI LÊN (BẢO TỒN ĐẦY ĐỦ NỘI DUNG, HÌNH ẢNH VÀ CÔNG THỨC TOÁN HỌC):
"""
${config.oldPlanContent.substring(0, 80000)}
"""

CHÚ Ý VÔ CÙNG QUAN TRỌNG KHI CÓ GIÁO ÁN MẪU TẢI LÊN:
- ĐỂ NGUYÊN NỘI DUNG GỐC: Kế thừa trọn vẹn 100% nội dung gốc từ file giáo án mẫu đã tải lên (tên bài học, tình huống khởi động, các câu hỏi khám phá, các đề mục SGK, các bài tập thực hành, ví dụ minh họa, câu hỏi trắc nghiệm, đáp án chi tiết, câu thoại GV & HS, công thức toán học và thẻ ảnh).
- CHỈ ĐỂ MẪU MỚI: Đưa toàn bộ nội dung của file cũ vào KHUNG MẪU MỚI CHUẨN HIỆN HÀNH của Bộ GD&ĐT (CV 5512 với THCS/THPT; CV 2345 với Tiểu học; Kế hoạch giáo dục Mầm non với Mầm non).
- CHỈ CHỈNH SỬA NHẸ CHO PHÙ HỢP KHUNG MẪU MỚI, KHÔNG TÁC ĐỘNG QUÁ NHIỀU, KHÔNG LÀM THAY ĐỔI CẤU TRÚC BÀI HỌC VÀ CÁC CÔNG THỨC TOÁN CỦA FILE CŨ.
- BẢO TỒN NGUYÊN VẸN CÔNG THỨC TOÁN HỌC (LaTeX hoặc ký hiệu chuẩn, không làm biến dạng công thức) VÀ CÁC THẺ GIỮ CHỖ ẢNH {{IMAGE_SLOT_X}} ĐÚNG TỪNG BƯỚC.
- TÍCH HỢP NLS, AI, STEM VÀO ĐÚNG VỊ TRÍ THÍCH HỢP CHỈ KHI NGƯỜI DÙNG TÍCH CHỌN.` : ''}
${config.imageSlots && config.imageSlots.length > 0 ? `DANH SÁCH THẺ HÌNH ẢNH CẦN BẢO TỒN VỊ TRÍ (TUYỆT ĐỐI KHÔNG ĐƯỢC BỎ XÓT):\n${config.imageSlots.map((s) => `- ${s.slotTag}: ${s.name}`).join('\n')}\n\nCHÚ Ý QUAN TRỌNG: Nếu văn bản gốc có các thẻ như {{IMAGE_SLOT_1}}, {{IMAGE_SLOT_2}}... Bạn BẮT BUỘC phải đặt các thẻ {{IMAGE_SLOT_X}} này vào đúng ngữ cảnh, đúng bước của Hoạt động tương ứng (thường nằm ở teacherAction hoặc studentAction). KHÔNG ĐƯỢC tự ý xóa bỏ thẻ hình ảnh của giáo viên.` : ''}

${(config.additionalRequirements || config.additionalNotes) && (config.additionalRequirements || config.additionalNotes).trim() ? `
=============================================================================
YÊU CẦU ĐẶC BIỆT & GHI CHÚ THÊM CỦA GIÁO VIÊN SOẠN BÀI:
"""
${(config.additionalRequirements || config.additionalNotes).trim()}
"""
CHỈ ĐẠO BẮT BUỘC DÀNH CHO AI:
- Phân tích kỹ nội dung ghi chú/yêu cầu sư phạm của giáo viên ở trên.
- TÌM CHUẨN XÁC VỊ TRÍ THÍCH HỢP NHẤT trong toàn bộ giáo án (Mục tiêu, Thiết bị/Học liệu, Hoạt động 1 Khởi động, Hoạt động 2 Khám phá/Hình thành kiến thức, Hoạt động 3 Luyện tập, Hoạt động 4 Vận dụng, hoặc Phương pháp Đánh giá) để biên soạn và tích hợp chuẩn xác 100% đúng theo ý của giáo viên.
- Tuyệt đối không bỏ sót hay làm sai lệch yêu cầu của giáo viên.
=============================================================================
` : ''}

QUY TẮC CẤM DẤU SAO VÀ ĐỊNH DẠNG:
- TUYỆT ĐỐI KHÔNG DÙNG DẤU SAO (*) ĐỂ LIỆT KÊ HOẶC TRÌNH BÀY. Mọi danh sách gạch đầu dòng BẮT BUỘC dùng dấu gạch ngang (-).
- CỘT SẢN PHẨM (productExpected): CHỈ NÊU TÊN ĐỀ MỤC VÀ NỘI DUNG CỐT LÕI CẦN GHI CHÉP VÀO VỞ (định nghĩa, công thức, lời giải, kết quả chuẩn xác). TUYỆT ĐỐI KHÔNG lặp lại câu hỏi của GV hay ghi chú rườm rà.
- TRÌNH BÀY CÂU HỎI TRẮC NGHIỆM VÀ ĐÁP ÁN: Trong cột Sản phẩm, đối với các câu hỏi trắc nghiệm/lựa chọn, BẮT BUỘC phải đưa ra đáp án cụ thể (Ví dụ: "Câu 1. Đáp án B.", "Câu 2. Đáp án C.").

QUY ĐỊNH BẮT BUỘC VỀ VỊ TRÍ ĐỀ MỤC SGK THEO CHUẨN CÔNG VĂN 5512:
1. PHÍA TRÊN BẢNG (MỤC a, b, c TRƯỚC d. TỔ CHỨC THỰC HIỆN):
   - "objective" (a. Mục tiêu): Nêu ngắn gọn mục tiêu cần đạt của hoạt động (HS nhận biết, phân biệt, vận dụng kiến thức gì).
   - "content" (b. Nội dung): Nêu ngắn gọn KHÁI QUÁT NHIỆM VỤ/NỘI DUNG HỌC TẬP của học sinh (Ví dụ: "Học sinh đọc SGK, quan sát hình ảnh, thảo luận nhóm để nhận biết sự có mặt của các thiết bị có gắn bộ xử lí thông tin ở khắp nơi và trong nhiều lĩnh vực.").
     -> TUYỆT ĐỐI KHÔNG ĐƯỢC ĐƯA TÊN ĐỀ MỤC LA MÃ (I., II.) HAY DANH SÁCH TIỂU MỤC (1., 2...) VÀO MỤC b) NỘI DUNG PHÍA TRÊN BẢNG NÀY!
   - "productSummary" (c. Sản phẩm): Nêu ngắn gọn KHÁI QUÁT SẢN PHẨM ĐẦU RA TỔNG THỂ (Ví dụ: "Câu trả lời của học sinh về các thiết bị có gắn bộ xử lí thông tin; nội dung ghi nhớ cốt lõi về thế giới kĩ thuật số.").
     -> TUYỆT ĐỐI KHÔNG DÁN TOÀN BỘ ĐỀ MỤC HOẶC NỘI DUNG GHI VỞ DÀI DÒNG VÀO MỤC c) SẢN PHẨM PHÍA TRÊN BẢNG NÀY!

2. TRONG BẢNG (KHUNG SẢN PHẨM / CỘT 2: SẢN PHẨM HOẶC DỰ KIẾN SẢN PHẨM):
   - ĐÂY LÀ NƠI DUY NHẤT CHỨA TÊN ĐỀ MỤC SGK VÀ TOÀN BỘ NỘI DUNG KIẾN THỨC CỐT LÕI CẦN GHI VỞ!
   - TÊN ĐỀ MỤC SGK (Ví dụ: "1. Thế giới kĩ thuật số" hoặc "I. THÔNG TIN VÀ DỮ LIỆU:", "1. Thấy gì? Biết gì ?") BẮT BUỘC PHẢI NẰM Ở ĐẦU CỘT SẢN PHẨM TRONG BẢNG.
   - Mỗi đề mục SGK phải đứng riêng trên 1 dòng.
   - Ngay dưới tên đề mục là các gạch đầu dòng (-) ghi kiến thức trọng tâm cần ghi vở (khái niệm, định nghĩa, công thức, phân tích, câu trả lời SGK chuẩn xác).
   - TUYỆT ĐỐI KHÔNG VIẾT DÍNH LIỀN TÙ TÌ TRÊN CÙNG MỘT DÒNG.
   - TUYỆT ĐỐI KHÔNG để các câu văn thủ tục rườm rà (như "Các câu hỏi trong SGK về...", "Kết quả thảo luận nhóm...") lên đầu cột sản phẩm làm che khuất tên đề mục.

3. TIẾN TRÌNH DẠY HỌC (CỘT HOẠT ĐỘNG CỦA GV VÀ HS):
   - Giáo viên giao nhiệm vụ tìm hiểu, phân tích tình huống khám phá theo đúng từng mục La Mã và tiểu mục của SGK.
   - Học sinh đọc SGK, quan sát tranh ảnh, thảo luận nhóm và báo cáo kết quả theo đúng từng mục.
   - Giáo viên kết luận nhận định chốt kiến thức và yêu cầu học sinh ghi nhớ nội dung của từng mục vào vở.`;

  // Task 1: Objectives & Equipment
  const taskObjectivesEquipment = async () => {
    let prompt = '';
    const isNew8 = isPreschoolNew8Activity(subject, lessonTitle);
    if (isPreschool) {
      const nlsReq = config.enableNLS
        ? `- NẾU NGƯỜI DÙNG CHỌN TÍCH HỢP NLS (config.enableNLS = true): BẮT BUỘC đưa nội dung tích hợp NLS vào trường "digitalCompetencies" (để hiển thị mục 5. Tích hợp Năng lực số (NLS)). Mô tả rõ hoạt động ứng dụng công nghệ, thiết bị số, màn hình tương tác hoặc hình ảnh/video mô phỏng phù hợp lứa tuổi mầm non (tuyệt đối KHÔNG dùng mã chỉ báo phổ thông).`
        : `- KHÔNG chọn tích hợp NLS: Để "digitalCompetencies": [].`;
      const aiReq = config.enableAI
        ? `- NẾU NGƯỜI DÙNG CHỌN TÍCH HỢP AI (config.enableAI = true): BẮT BUỘC đưa nội dung tích hợp AI vào trường "aiCompetencies" (để hiển thị mục 6. Tích hợp Trí tuệ nhân tạo (AI)). Mô tả rõ giáo viên ứng dụng AI tạo tranh ảnh, âm thanh, câu chuyện sinh động hoặc nhân vật ảo Robot trò chuyện tương tác với trẻ dưới sự hướng dẫn của cô (tuyệt đối KHÔNG dùng mã chỉ báo phổ thông).`
        : `- KHÔNG chọn tích hợp AI: Để "aiCompetencies": [].`;

      if (isNew8) {
        const customCodesFromUser = (config.preschoolCustomCodes || '').trim();
        prompt = `${baseContext}
Hãy soạn Mục I (MỤC ĐÍCH - YÊU CẦU) và Mục II (CHUẨN BỊ) cho NỘI DUNG MỚI TÍCH HỢP MẦM NON (ÁP DỤNG CHUẨN YÊU CẦU THEO QUYẾT ĐỊNH 388/QĐ-BGDĐT).
${customCodesFromUser ? `
CÁC MÃ TIÊU CHÍ CHỈ BÁO THEO QUYẾT ĐỊNH 388 ĐƯỢC CHỈ ĐỊNH CHO BÀI DẠY NÀY (DO NGƯỜI DÙNG THIẾT LẬP HOẶC MẶC ĐỊNH):
"${customCodesFromUser}"
BẮT BUỘC ĐƯA CHÍNH XÁC CÁC MÃ TRÊN VÀO CÁC GẠCH ĐẦU DÒNG CỦA MỤC TIÊU:
- Kiến thức (knowledge): Trẻ nhận biết, hiểu được gì... gắn với mã tiêu chí tương ứng (ví dụ: "- Trẻ nhận biết và gọi tên được... (Mã: NT 3.1)").
- Kỹ năng (subjectCompetencies): Các kỹ năng vận động, kỹ năng tư duy, thao tác... gắn với mã tiêu chí tương ứng (ví dụ: "- Trẻ thực hiện được kỹ năng... (Mã: TC 1.2, TX 4.4)").
` : `
YÊU CẦU BẮT BUỘC:
1. ĐƯA CÁC TIÊU CHÍ YÊU CẦU CẦN ĐẠT CỦA BÀI VÀO CÁC GẠCH ĐẦU DÒNG CỦA MỤC TIÊU theo đúng mã chỉ báo của Quyết định số 388/QĐ-BGDĐT (ví dụ: NT 1.1, NT 1.2, TC 1.1, TC 1.2, TC 3.1, TX 3.2, TX 4.3, TX 4.4, NN 1.2, NN 2.2...).
- Kiến thức (knowledge): Trẻ nhận biết, hiểu được gì... gắn với mã tiêu chí yêu cầu cần đạt (ví dụ: "- Trẻ nhận biết và gọi tên được... (Mã: NT 1.1)", "- Trẻ hiểu được nội dung... (Mã: NT 1.2)").
- Kỹ năng (subjectCompetencies): Các kỹ năng vận động, kỹ năng tư duy, thao tác... gắn với mã tiêu chí yêu cầu cần đạt (ví dụ: "- Trẻ thực hiện được kỹ năng... (Mã: TC 1.1)", "- Trẻ phối hợp khéo léo... (Mã: TC 1.2, TX 4.4)").
`}
- Phẩm chất (qualities): BẮT BUỘC gắn với 4 phẩm chất cốt lõi (Yêu thương, Tôn trọng, Trung thực, Trách nhiệm). Ví dụ: "Yêu thương: ...", "Tôn trọng: ...".
- Năng lực (generalCompetencies): BẮT BUỘC gắn với 5 năng lực nền tảng (Giao tiếp, Hợp tác, Giải quyết vấn đề, Tự lực, Thích ứng). Ví dụ: "Tự lực: ...", "Thích ứng: ...".
2. TÍCH HỢP NĂNG LỰC SỐ VÀ TRÍ TUỆ NHÂN TẠO:
${nlsReq}
${aiReq}
3. CHUẨN BỊ:
- Chuẩn bị của cô (equipment.teacher): Bắt buộc có "- Môi trường và không gian: ...", "- Đồ dùng, học liệu của giáo viên: ...".
- Chuẩn bị của trẻ (equipment.student): Trang phục, đồ dùng, tâm thế...

Yêu cầu: Trả về JSON với cấu trúc:
{
  "objectives": {
    "knowledge": ["- ... (Mã: NT 1.1)"],
    "subjectCompetencies": ["- ... (Mã: TC 1.1)"],
    "generalCompetencies": ["Tự lực: ...", "Thích ứng: ...", "Giao tiếp: ..."],
    "qualities": ["Yêu thương: ...", "Tôn trọng: ...", "Trung thực: ...", "Trách nhiệm: ..."],
    "digitalCompetencies": ${config.enableNLS ? '["Mô tả hoạt động tích hợp Năng lực số (NLS) cho trẻ..."]' : '[]'},
    "aiCompetencies": ${config.enableAI ? '["Mô tả hoạt động ứng dụng Trí tuệ nhân tạo (AI)..."]' : '[]'},
    "stemCompetencies": []
  },
  "equipment": {
    "teacher": ["- Môi trường và không gian: ...", "- Đồ dùng, học liệu của giáo viên: ..."],
    "student": ["Trang phục, đồ dùng, tâm thế..."],
    "digitalAssets": [],
    "stemMaterials": []
  }
}`;
      } else {
        const isMixed345 = isMixedAgeClass && grade.includes('3') && grade.includes('4') && grade.includes('5');
        prompt = `${baseContext}
Hãy soạn Mục I (MỤC ĐÍCH - YÊU CẦU) và Mục II (CHUẨN BỊ) theo ĐÚNG MẪU GIÁO ÁN MẦM NON TRUYỀN THỐNG/BAN ĐẦU TRƯỚC KHI CẬP NHẬT 8 LĨNH VỰC MỚI.
YÊU CẦU BẮT BUỘC:
1. MỤC ĐÍCH - YÊU CẦU:
- TUYỆT ĐỐI KHÔNG ĐIỀN MÃ TIÊU CHÍ NÀO: KHÔNG ghi "(Mã: NN 5.1)", KHÔNG ghi "(Mã: NT 1.1)", KHÔNG ghi bất kỳ mã chỉ báo nào trong phần Kiến thức và Kỹ năng. Giữ nguyên định dạng giáo án mầm non ban đầu.
- Kiến thức (knowledge): Trẻ nhận biết, biết tên, hiểu nội dung... (TUYỆT ĐỐI KHÔNG GẮN MÃ).
${isMixedAgeClass ? `- ĐỐI VỚI LỚP GHÉP / ĐA ĐỘ TUỔI (${grade}): BẮT BUỘC PHÂN HÓA RÕ RÀNG KIẾN THỨC THEO TỪNG ĐỘ TUỔI:
${isMixed345 ? `  Ví dụ chuẩn phân hóa 3 độ tuổi:
  [
    "- 5 tuổi: Trẻ nhận biết nhóm có số lượng X, đếm đến X, nhận biết chữ số X biểu thị cho các nhóm có số lượng X. Trẻ đếm từ 1 đến X, đọc được số X và các số nhỏ hơn X. So sánh 2 nhóm đối tượng, biết thêm bớt để có số lượng bằng nhau",
    "- 4 tuổi: Trẻ biết đếm đến X, nhận biết các nhóm có X đối tượng. Trẻ biết tạo nhóm, xếp tương ứng 1- 1, biết so sánh 2 nhóm đồ vật, biết đếm đúng số lượng và sử dụng đúng chữ số tương ứng theo cô và các bạn",
    "- 3 tuổi: Trẻ đếm số lượng trong phạm vi X theo cô, đếm cùng các bạn."
  ]` : `  Tách rõ từng gạch đầu dòng tương ứng với các độ tuổi có trong lớp.`}` : `Ví dụ: "- Trẻ biết tên bài thơ/bài hát/câu chuyện...", "- Trẻ hiểu nội dung bài học...".`}
- Kỹ năng (subjectCompetencies): Rèn luyện và phát triển các kỹ năng (TUYỆT ĐỐI KHÔNG GẮN MÃ).
${isMixedAgeClass ? `- ĐỐI VỚI LỚP GHÉP / ĐA ĐỘ TUỔI (${grade}): BẮT BUỘC PHÂN HÓA RÕ RÀNG KỸ NĂNG THEO TỪNG ĐỘ TUỔI:
${isMixed345 ? `  Ví dụ chuẩn phân hóa 3 độ tuổi:
  [
    "- 5 tuổi: Rèn kỹ năng đếm thành thạo từ 1 đến X từ trái sang phải, so sánh số lượng giữa 2 nhóm, thêm bớt tạo sự bằng nhau trong phạm vi X, chọn và gắn thẻ số X chính xác, nhanh nhẹn.",
    "- 4 tuổi: Rèn kỹ năng xếp tương ứng 1-1 thẳng hàng từ trái sang phải, đếm theo thứ tự không bỏ sót đối tượng, tìm đúng thẻ số X theo cô và bạn.",
    "- 3 tuổi: Rèn kỹ năng chú ý quan sát, chỉ tay và đếm theo cô, phát âm rõ từ chỉ số lượng."
  ]` : `  Tách rõ từng gạch đầu dòng rèn luyện kỹ năng cho từng độ tuổi tương ứng trong lớp.`}` : `Ví dụ: "- Rèn kỹ năng phát âm rõ ràng, trả lời trọn câu...", "- Rèn kỹ năng vận động nhịp nhàng...", "- Phát triển khả năng chú ý và ghi nhớ có chủ định...".`}
- Phẩm chất (qualities): BẮT BUỘC gắn với 4 phẩm chất cốt lõi (Yêu thương, Tôn trọng, Trung thực, Trách nhiệm). Ví dụ: "Yêu thương: ...", "Tôn trọng: ...".
- Năng lực (generalCompetencies): BẮT BUỘC gắn với 5 năng lực nền tảng (Giao tiếp, Hợp tác, Giải quyết vấn đề, Tự lực, Thích ứng). Ví dụ: "Tự lực: ...", "Thích ứng: ...".
2. TÍCH HỢP NĂNG LỰC SỐ VÀ TRÍ TUỆ NHÂN TẠO:
${nlsReq}
${aiReq}
3. CHUẨN BỊ:
- Chuẩn bị của cô (equipment.teacher): Bắt buộc có "- Môi trường và không gian: ...", "- Đồ dùng, học liệu của giáo viên: ...".
- Chuẩn bị của trẻ (equipment.student): Trang phục, đồ dùng, tâm thế...${isMixedAgeClass ? ' (Bắt buộc phân loại học liệu cụ thể cho từng nhóm tuổi).' : ''}

Yêu cầu: Trả về JSON với cấu trúc:
{
  "objectives": {
    "knowledge": ${isMixedAgeClass ? `[
      "- 5 tuổi: Trẻ nhận biết...",
      "- 4 tuổi: Trẻ biết...",
      "- 3 tuổi: Trẻ đếm..."
    ]` : `["- Trẻ biết...", "- Trẻ hiểu..."]`},
    "subjectCompetencies": ${isMixedAgeClass ? `[
      "- 5 tuổi: Rèn kỹ năng...",
      "- 4 tuổi: Rèn kỹ năng...",
      "- 3 tuổi: Rèn kỹ năng..."
    ]` : `["- Rèn kỹ năng...", "- Phát triển khả năng..."]`},
    "generalCompetencies": ["Tự lực: ...", "Thích ứng: ...", "Giao tiếp: ..."],
    "qualities": ["Yêu thương: ...", "Tôn trọng: ...", "Trung thực: ...", "Trách nhiệm: ..."],
    "digitalCompetencies": ${config.enableNLS ? '["Mô tả hoạt động tích hợp Năng lực số (NLS) cho trẻ..."]' : '[]'},
    "aiCompetencies": ${config.enableAI ? '["Mô tả hoạt động ứng dụng Trí tuệ nhân tạo (AI)..."]' : '[]'},
    "stemCompetencies": []
  },
  "equipment": {
    "teacher": ["- Môi trường và không gian: ...", "- Đồ dùng, học liệu của giáo viên: ..."],
    "student": ["Trang phục, đồ dùng, tâm thế..."],
    "digitalAssets": [],
    "stemMaterials": []
  }
}`;
      }
    } else {
      prompt = `${baseContext}
Hãy soạn Mục I (MỤC TIÊU theo GDPT 2018, Công văn 5512, Thông tư 02/2025/TT-BGDĐT, Quyết định 2422/QĐ-BGDĐT) và Mục II (THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU).
${hasUploadedSample ? `
=============================================================================
QUY TẮC BẢO TỒN MỤC TIÊU VÀ THIẾT BỊ TỪ GIÁO ÁN MẪU:
=============================================================================
1. Trích xuất và bảo tồn 100% mục tiêu kiến thức, năng lực chung, năng lực đặc thù, phẩm chất và thiết bị dạy học của GV/HS từ oldPlanContent.
2. TUYỆT ĐỐI KHÔNG tự ý thay thế mục tiêu bài học bằng mục tiêu bài khác.
` : ''}
QUY ĐỊNH BẮT BUỘC VỀ NĂNG LỰC CHUNG (generalCompetencies):
BẮT BUỘC có đủ 3 năng lực chung với đúng các tiêu đề sau:
- "Năng lực tự chủ và tự học: [mô tả cụ thể]"
- "Năng lực giao tiếp và hợp tác: [mô tả cụ thể]"
- "Năng lực giải quyết vấn đề và sáng tạo: [mô tả cụ thể]"

QUY ĐỊNH BẮT BUỘC VỀ NĂNG LỰC ĐẶC THÙ (subjectCompetencies):
${isTinHoc ? `
ĐẶC BIỆT ĐỐI VỚI MÔN TIN HỌC (CHUẨN CÁC THÀNH PHẦN NĂNG LỰC TIN HỌC GDPT 2018):
- TÙY THEO TỪNG BÀI HỌC CỤ THỂ, CHỈ CHỌN 1 ĐẾN 3 THÀNH PHẦN NĂNG LỰC TIN HỌC THẬT SỰ PHÙ HỢP VỚI NỘI DUNG VÀ HOẠT ĐỘNG CỦA BÀI ĐÓ (TUYỆT ĐỐI KHÔNG BÊ NGUYÊN TOÀN BỘ CẢ 5 THÀNH PHẦN VÀO TẤT CẢ CÁC BÀI).
- Các thành phần năng lực được chọn BẮT BUỘC biên soạn theo đúng cú pháp chuẩn sau (mỗi gạch đầu dòng bắt đầu bằng tên năng lực và mã thành phần viết hoa ở đầu, TUYỆT ĐỐI KHÔNG để mã ở giữa hay cuối câu):
  * "Năng lực A (NLa): Phát triển năng lực sử dụng và quản lý các phương tiện công nghệ thông tin và truyền thông. [Mô tả cụ thể biểu hiện của học sinh trong bài học này]" (Khi bài học liên quan đến thiết bị, phần mềm, phần cứng, hệ thống thông tin)
  * "Năng lực B (NLb): Phát triển năng lực ứng xử phù hợp trong môi trường số. [Mô tả cụ thể biểu hiện nếu bài học có nội dung về an toàn, đạo đức, văn hóa mạng, bản quyền]"
  * "Năng lực C (NLc): Phát triển năng lực nhận biết và hình thành nhu cầu tìm kiếm thông tin từ nguồn dữ liệu số khi giải quyết công việc. [Mô tả cụ thể biểu hiện trong bài học này]" (hoặc "Năng lực C (NLc): Năng lực giải quyết vấn đề với sự trợ giúp của công nghệ thông tin và truyền thông. [Mô tả biểu hiện]") (Khi bài học về thông tin, dữ liệu, tìm kiếm, thuật toán, lập trình, giải quyết vấn đề)
  * "Năng lực D (NLd): Năng lực ứng dụng công nghệ thông tin và truyền thông trong học và tự học. [Mô tả cụ thể biểu hiện trong bài học này]" (Khi học sinh sử dụng công cụ CNTT phục vụ học tập, tự tìm kiếm tài liệu và thực hành)
  * "Năng lực E (NLe): Năng lực hợp tác trong môi trường số. [Mô tả cụ thể biểu hiện trong bài học này]" (Khi bài học có làm việc nhóm, chia sẻ dữ liệu hoặc cộng tác trên môi trường mạng)
(Lưu ý: Chỉ chọn đúng từ 1 đến 3 thành phần phù hợp nhất với bài học, TUYỆT ĐỐI KHÔNG viết dạng "- Năng lực sử dụng và quản lý... (NLa):", BẮT BUỘC LUÔN VIẾT ĐÚNG: "Năng lực A (NLa): ...", "Năng lực C (NLc): ...", "Năng lực D (NLd): ...", "Năng lực E (NLe): ...").
` : `
Biên soạn đúng các thành phần năng lực đặc thù của môn học theo Chương trình GDPT 2018 (mỗi ý gạch đầu dòng ghi rõ tên năng lực và biểu hiện cụ thể).
`}

QUY ĐỊNH VỀ CÁC NĂNG LỰC TÍCH HỢP:
- Năng lực số (digitalCompetencies): ${config.enableNLS ? 'Sinh các mã chỉ báo NLS chuẩn theo TT 02/2025 và CV 3456 kèm mô tả' : 'Trả về mảng rỗng [] vì không tích hợp NLS'}
- Năng lực AI (aiCompetencies): ${config.enableAI ? 'Sinh các mã chỉ báo AI chuẩn theo QĐ 2422 (dạng [Lớp].[Mã chủ đề].[Số thứ tự]) kèm mô tả' : 'Trả về mảng rỗng [] vì không tích hợp AI'}
- Năng lực STEM (stemCompetencies): ${hasStem ? `Sinh các mục tiêu S-T-E-M liên môn gắn với chủ đề "${stemTopic}"` : 'Trả về mảng rỗng [] vì không tích hợp STEM'}

${hasStem ? `LƯU Ý: Bài học có TÍCH HỢP STEM với chủ đề "${stemTopic}". Hãy sinh mảng "stemCompetencies" trong objectives, "stemMaterials" trong equipment, và đối tượng "stemIntegration" ({ "topicTitle": "${stemTopic}", "stemGoals": [...], "stemMaterials": [...], "stemProcess": [...], "expectedProduct": "...", "evaluationCriteria": "..." }).` : ''}
Yêu cầu: Trả về JSON với cấu trúc:
{
  "objectives": {
    "knowledge": ["- ..."],
    "generalCompetencies": [
      "Năng lực tự chủ và tự học: ...",
      "Năng lực giao tiếp và hợp tác: ...",
      "Năng lực giải quyết vấn đề và sáng tạo: ..."
    ],
    "subjectCompetencies": ["- ..."],
    "digitalCompetencies": ${config.enableNLS ? '["Mã chỉ báo NLS chuẩn kèm mô tả..."]' : '[]'},
    "aiCompetencies": ${config.enableAI ? '["Mã chỉ báo AI chuẩn (ví dụ 6.A1.1, 10.C3.1) kèm mô tả..."]' : '[]'},
    "stemCompetencies": ${hasStem ? `["Mục tiêu năng lực STEM liên môn gắn với chủ đề ${stemTopic}..."]` : '[]'},
    "qualities": ["- ..."]
  },
  "equipment": {
    "teacher": ["- ..."],
    "student": ["- ..."],
    "digitalAssets": ["- ..."],
    "stemMaterials": ${hasStem ? '["Dụng cụ và vật liệu thực hành STEM..."]' : '[]'}
  }${hasStem ? `,
  "stemIntegration": {
    "topicTitle": "${stemTopic}",
    "stemGoals": ["Khoa học (S): ...", "Công nghệ (T): ...", "Kỹ thuật (E): ...", "Toán học (M): ..."],
    "stemMaterials": ["Dụng cụ và vật liệu thí nghiệm/chế tạo/thực hành..."],
    "stemProcess": ["Bước 1: Xác định vấn đề...", "Bước 2: Thiết kế giải pháp...", "Bước 3: Chế tạo/thực hành...", "Bước 4: Thử nghiệm và đánh giá...", "Bước 5: Báo cáo và nghiệm thu..."],
    "expectedProduct": "Mô tả sản phẩm STEM cụ thể...",
    "evaluationCriteria": "Tiêu chí đánh giá, nghiệm thu sản phẩm STEM..."
  }` : ''}
}`;
    }
    const res = await generateContentWithRetryAndFallback({
      contents: prompt,
      candidateKeys: keysList,
      primaryModel: modelToUse,
      taskType: 'pedagogical',
      config: { responseMimeType: 'application/json' },
    });
    const parsed = parseJSONRobust(res.text);
    if (isPreschool && !isNew8 && parsed?.objectives) {
      sanitizePreschoolObjectives(parsed.objectives);
    }
    return parsed;
  };

  // Task 2: Activity 1 (Khởi động) & Activity 2 (Hình thành kiến thức mới)
  const taskActivities1And2 = async () => {
    const periodNote = config.periods >= 2 ? 'LƯU Ý PHÂN PHỐI TIẾT: Hoạt động 1 và Hoạt động 2 thuộc TIẾT 1. Đặt tên hoạt động có tiền tố "[TIẾT 1]" (ví dụ "[TIẾT 1] Hoạt động 1: Mở đầu / Khởi động", "[TIẾT 1] Hoạt động 2: Hình thành kiến thức mới").' : '';
    let prompt = '';
    
    if (isPreschool) {
      const s = (subject || '').toLowerCase();
      const t = (lessonTitle || '').toLowerCase();
      const extra = ((config.oldPlanContent || '') + ' ' + (config.topic || '')).toLowerCase();
      const isScience = s.includes('khoa học') || s.includes('kham pha khoa hoc') || s.includes('khám phá khoa học') || t.includes('thí nghiệm') || t.includes('khoa học');
      const isSocial = s.includes('xã hội') || s.includes('khám phá xã hội') || s.includes('kỹ năng sống') || s.includes('tình cảm');
      const isMath = s.includes('toán') || s.includes('số học') || s.includes('hình học') || s.includes('đo lường');
      const isCognitive = isScience || isSocial || isMath;
      const isPhysical = s.includes('thể chất') || s.includes('vận động') || s.includes('thể dục') || s.includes('gdtc') ||
        t.includes('vđcb') || t.includes('btptc') || t.includes('đi thăng bằng') || t.includes('bật') || t.includes('ném') ||
        t.includes('bò chui') || t.includes('tung bóng') || t.includes('chuyền bóng') || t.includes('bắt bóng') ||
        t.includes('trèo thang') || t.includes('rửa tay') || t.includes('chạy') || t.includes('bò') || t.includes('trườn') ||
        t.includes('thể dục') || t.includes('thể chất') || t.includes('vận động cơ bản') || t.includes('bài tập phát triển chung') ||
        extra.includes('thể chất') || extra.includes('btptc') || extra.includes('vđcb') || extra.includes('bài tập phát triển chung');

      const isLetterTracing = s.includes('tập tô') || s.includes('to chu cai') || t.includes('tập tô') || t.includes('tô chữ cái') || t.includes('tô nét') || t.includes('sao chép nét') || s.includes('sao chép nét') || t.includes('tô, đồ') || t.includes('tô đồ') || extra.includes('tập tô chữ cái') || extra.includes('tô, đồ, sao chép');
      const isLetterGame = s.includes('trò chơi chữ cái') || t.includes('trò chơi chữ cái') || t.includes('chơi với chữ cái') || t.includes('tc chữ cái') || extra.includes('trò chơi chữ cái');
      const isLearningGame = s.includes('trò chơi học tập') || t.includes('trò chơi học tập') || t.includes('tìm bạn thân') || extra.includes('trò chơi học tập');
      const isSocialExploration = s.includes('khám phá xã hội') || s.includes('kpxh') || t.includes('khám phá xã hội') || t.includes('đồ dùng, đồ chơi') || t.includes('lớp học của bé') || (s.includes('nhận thức') && (s.includes('xã hội') || t.includes('đồ dùng')));

      let act1Name = isCognitive ? "1. Khởi động – Tạo hứng thú và giao nhiệm vụ" : "1. Khởi động – Tạo tình huống";
      let act2Name = "2. Khám phá – Trải nghiệm";

      if (isPhysical) {
        act1Name = "1. Khởi động – Tạo hứng thú";
        act2Name = "2. Khám phá – Trải nghiệm nhiệm vụ vận động.";
      } else if (isLetterTracing) {
        act1Name = "1. Gợi hứng thú – Hình thành và lựa chọn ý tưởng";
        act2Name = "2. Thỏa thuận - Lập kế hoạch thực hiện";
      } else if (isLetterGame || isLearningGame) {
        act1Name = "1. Gợi hứng thú – hình thành và lựa chọn ý tưởng chơi";
        act2Name = "2. Thỏa thuận – Lập kế hoạch chơi";
      } else if (isSocialExploration) {
        act1Name = "1. Khởi động - Tạo tình huống";
        act2Name = "2. Khám phá và trải nghiệm";
      }

      const letterTracingGuidancePart1 = isLetterTracing ? `
BẮT BUỘC ĐẶC BIỆT CHO HOẠT ĐỘNG TẬP TÔ CHỮ CÁI (VÀ TẬP TÔ, ĐỒ, SAO CHÉP NÉT/CHỮ):
- Tên Hoạt động 1: "1. Gợi hứng thú – Hình thành và lựa chọn ý tưởng":
  + Trò chơi khởi động vận động ngón tay: "Ngón tay nhảy múa" (hoặc "Các ngón tay ngoan").
  + Tạo tình huống gợi mở (nhân vật Bạn Bút Chì muốn vẽ tranh/viết chữ đẹp...).
  + Cho trẻ quan sát hình ảnh thực tế (ngôi nhà, hàng rào, mái nhà, tia nắng... hoặc tranh chữ cái) có chứa các nét/chữ.
  + Đàm thoại gợi mở về đặc điểm các nét/chữ cái, đồ dùng và tư thế ngồi học đúng.
  + Dẫn dắt vào bài học tập tô, đồ và sao chép.
- Tên Hoạt động 2: "2. Thỏa thuận - Lập kế hoạch thực hiện":
  + BẮT BUỘC trong teacherAction của mục 2 phải có đầy đủ 3 nội dung trọng tâm với đúng các đề mục:
    * Hướng dẫn tư thế và cách cầm bút:
      - Tư thế ngồi: Lưng thẳng, không tì ngực vào bàn, đầu hơi cúi, mắt cách vở khoảng 25-30cm.
      - Cách cầm bút: Cầm bằng ba ngón tay (ngón cái, ngón trỏ và ngón giữa), cầm vừa phải không quá chặt cũng không quá lỏng. Tay còn lại giữ mép giấy/vở.
    * Hướng dẫn tô, đồ nét / chữ cái:
      - Giới thiệu phiếu/vở có các nét hoặc chữ cái in chấm mờ.
      - Cô làm mẫu từng nét/chữ: Đặt bút tại điểm bắt đầu, đưa/kéo bút chậm rãi theo đường chấm mờ đến điểm kết thúc.
      - Nhấn mạnh quy tắc: Đưa bút theo đường chấm mờ từ điểm bắt đầu đến điểm kết thúc, không đưa bút chệch ra ngoài hoặc lung tung.
    * Hướng dẫn sao chép nét / chữ cái:
      - Cho trẻ quan sát mẫu trên bảng.
      - Cô làm mẫu các thao tác: Nhìn mẫu -> Xác định điểm bắt đầu -> Đưa bút đúng hướng -> Dừng ở điểm kết thúc.
      - Thống nhất quy tắc 4 bước: "Nhìn mẫu – Đặt bút – Đúng hướng – Dừng đúng điểm."
` : '';

      const letterGameGuidancePart1 = isLetterGame ? `
BẮT BUỘC ĐẶC BIỆT CHO HOẠT ĐỘNG TRÒ CHƠI CHỮ CÁI:
- Tên Hoạt động 1: "1. Gợi hứng thú – hình thành và lựa chọn ý tưởng chơi":
  + Cho trẻ hát/vận động bài hát ngắn có từ chứa chữ cái trọng tâm (ví dụ o, ô, ơ).
  + Đưa chữ cái ra gợi ý và hỏi trẻ muốn chơi những trò chơi gì với chữ cái đó.
  + Gợi ý các trò chơi hấp dẫn (Ai tìm chữ nhanh, Về đúng nhà, Chuyền chữ tiếp sức, Ghép chữ tạo từ, Săn tìm chữ cái...) và cho trẻ lựa chọn.
- Tên Hoạt động 2: "2. Thỏa thuận – Lập kế hoạch chơi":
  + Chia trẻ thành các nhóm/đội chơi.
  + Cùng trẻ thống nhất: Chơi trò gì? Chơi ở đâu? Chơi như thế nào? Luật chơi ra sao?
  + Nhắc nhở trẻ chơi vui vẻ, không tranh giành, biết chờ lượt và giúp đỡ bạn.
` : '';

      const learningGameGuidancePart1 = isLearningGame ? `
BẮT BUỘC ĐẶC BIỆT CHO TRÒ CHƠI HỌC TẬP (VÍ DỤ TÌM BẠN THÂN):
- Tên Hoạt động 1: "1. Gợi hứng thú – hình thành và lựa chọn ý tưởng chơi":
  + Vận động theo điệu nhạc vui tươi về tình bạn / chủ đề bài học.
  + Đàm thoại khơi gợi cảm xúc và câu hỏi gợi mở về cách tìm bạn, chơi với bạn.
- Tên Hoạt động 2: "2. Thỏa thuận – Lập kế hoạch chơi":
  + Thống nhất Cách chơi và Luật chơi rõ ràng.
  + Cách chơi: Mỗi trẻ nhận một thẻ hình/dấu hiệu bí mật; khi nhạc bật đi nhẹ nhàng; khi nhạc dừng trao đổi hỏi đáp tìm bạn có thẻ tương ứng.
  + Luật chơi văn minh: Không giành bạn, không kéo đẩy, không nhìn trộm thẻ, chờ đến lượt, tôn trọng bạn.
` : '';

      const socialExplorationGuidancePart1 = isSocialExploration ? `
BẮT BUỘC ĐẶC BIỆT CHO HOẠT ĐỘNG KHÁM PHÁ XÃ HỘI (LĨNH VỰC NHẬN THỨC):
- Tên Hoạt động 1: "1. Khởi động - Tạo tình huống":
  + Hát và vận động theo bài hát chủ đề (ví dụ "Lớp chúng mình đoàn kết").
  + Tạo tình huống bất ngờ với "Chiếc túi bí mật" chứa các đồ dùng, đồ chơi quen thuộc để trẻ sờ đoán và tạo hứng thú.
  + Dẫn dắt vào bài học khám phá một cách tự nhiên.
- Tên Hoạt động 2: "2. Khám phá và trải nghiệm":
  + Chia trẻ thành các nhóm nhỏ khám phá các góc trong lớp (học tập, xây dựng, phân vai, nghệ thuật, sách truyện...).
  + Đặt câu hỏi gợi mở về tên gọi, đặc điểm, công dụng của từng đồ dùng, đồ chơi.
  + Cho trẻ trực tiếp trải nghiệm sử dụng an toàn, nhẹ nhàng (cầm bút, mở sách, xếp hình, nặn đất...).
  + Đặt các tình huống giả định lựa chọn đồ dùng phù hợp với hoạt động.
` : '';

      const physicalGuidancePart1 = isPhysical ? `
BẮT BUỘC ĐẶC BIỆT CHO LĨNH VỰC PHÁT TRIỂN THỂ CHẤT (TIẾT THỂ DỤC / VẬN ĐỘNG):
- Tên Hoạt động 1: "1. Khởi động – Tạo hứng thú":
  + Cho trẻ đi vòng tròn kết hợp các kiểu đi/chạy theo hiệu lệnh và nhạc: đi thường -> đi bằng mũi bàn chân -> đi thường -> đi bằng gót bàn chân -> đi thường -> chạy chậm -> chạy nhanh -> chạy chậm -> đi thường.
  + Cho trẻ xoay các khớp cổ tay, bả vai, hông, khớp gối.
  + Cho trẻ chuyển về đội hình 3 hàng dọc -> chuyển thành 3 (hoặc 2/4) hàng ngang dãn cách đều chuẩn bị tập BTPTC. (TUYỆT ĐỐI KHÔNG tập BTPTC ở bước 1 này).
- Tên Hoạt động 2: "2. Khám phá – Trải nghiệm nhiệm vụ vận động."
  + BẮT BUỘC trong teacherAction của mục 2 phải có nội dung và đề mục "* Bài tập phát triển chung:" ở ngay dưới mục 2:
    * Bài tập phát triển chung:
    - Tập theo nhạc bài hát chủ đề (ví dụ: “Trường chúng cháu là trường mầm non” hoặc bài hát theo chủ đề):
    + Tay: [Mô tả chi tiết động tác tay] (2 lần x 8 nhịp; nếu là động tác bổ trợ/nhấn mạnh thì 3 lần x 8 nhịp).
    + Bụng: [Mô tả chi tiết động tác bụng/lưng] (2 lần x 8 nhịp).
    + Chân: [Mô tả chi tiết động tác chân] (2 lần x 8 nhịp).
    + Bật: [Mô tả chi tiết động tác bật nhảy] (2 lần x 8 nhịp).
    - Cho trẻ chuyển về đội hình 2 hàng đối diện nhau dãn cách cách nhau 3 - 4m để chuẩn bị VĐCB.
    * Vận động cơ bản:
    - Cô giới thiệu sơ đồ sân tập / dụng cụ vận động và gợi mở tình huống thử thách.
    - Mời 1 - 2 trẻ lên thử trải nghiệm thực hiện vận động theo cách của mình trước; Cô và cả lớp quan sát, gợi mở tư thế đứng, hướng nhìn (tuyệt đối KHÔNG làm mẫu trước ở bước 2 này).
  + Trong studentAction của mục 2:
    - Trẻ đứng theo hàng dãn cách, lắng nghe nhạc và tập đều các động tác Tay, Bụng, Chân, Bật cùng cô.
    - Trẻ chú ý chuyển đội hình về 2 hàng đối diện nhau theo hiệu lệnh của cô.
    - Trẻ quan sát sơ đồ/dụng cụ và bạn lên thử trải nghiệm thực hiện vận động theo cách của mình.
` : '';

      const preschoolCreativityGuidance = `
YÊU CẦU SÁNG TẠO ĐỔI MỚI VÀ ĐA DẠNG HÓA PHƯƠNG PHÁP (MẦM NON THỜI ĐẠI MỚI):
- HÃY LÀ MỘT GIÁO VIÊN MẦM NON ĐẦY TÂM HUYẾT, SÁNG TẠO VÀ ĐỔI MỚI HIỆN ĐẠI: Không rập khuôn máy móc, không lặp lại nguyên văn cùng một trò chơi hay kịch bản cho mọi bài học!
- THIẾT KẾ HOẠT ĐỘNG LINH HOẠT, ĐỘC ĐÁO THEO ĐÚNG ĐỀ TÀI "${lessonTitle}" VÀ ĐỘ TUỔI "${grade || '5 - 6 tuổi'}":
  + ${act1Name}: Thay đổi linh hoạt các hình thức mở đầu lôi cuốn (Hộp quà bí mật, Chuyến du hành kỳ thú, Bản tin thời sự tí hon, Trò chơi đa giác quan, Câu đố âm thanh/hình bóng, Tình huống kịch nghệ thuật, Bài hát ngẫu hứng, Vũ điệu Flashmob mini...).
  + ${act2Name}: Thiết kế các trạm trải nghiệm, xưởng sáng tạo, phòng thí nghiệm mini, rạp chiếu mini, hoặc không gian tương tác đa giác quan riêng biệt phù hợp 100% với đề tài. Cô đóng vai người đồng hành gợi mở, khơi dậy óc tò mò, tôn trọng tuyệt đối sự khám phá tự nhiên của trẻ.
  + Tích hợp Công nghệ/AI & Phương pháp giáo dục sớm (Reggio Emilia, Montessori, STEM mầm non) một cách tự nhiên, trực quan, không gượng ép.
  + Lời dẫn của cô ngọt ngào, giàu cảm xúc, sử dụng ngôn ngữ kích thích tư duy ("Nếu là con, con sẽ...", "Chúng mình cùng thử xem điều kỳ diệu gì sẽ xảy ra nhé!"). Phản ứng của trẻ sinh động, hồn nhiên, tích cực.
${physicalGuidancePart1}
${letterTracingGuidancePart1}
${letterGameGuidancePart1}
${learningGameGuidancePart1}
${socialExplorationGuidancePart1}
`;

      prompt = `${baseContext}
${preschoolCreativityGuidance}
Hãy soạn chi tiết phần 1 của Tiến trình hoạt động Mầm non (Các bước: ${act1Name}, ${act2Name}). 
BẮT BUỘC giữ đúng khung 5 bước mầm non chuẩn và tuân thủ nghiêm ngặt đề tài "${lessonTitle}". TUY NHIÊN, NẾU CÓ GIÁO ÁN MẪU, PHẢI DÙNG TÊN BƯỚC CỦA GIÁO ÁN MẪU.
TUYỆT ĐỐI KHÔNG dùng 4 bước CV 5512. Mỗi hoạt động chỉ dùng duy nhất step1 để chứa Hoạt động của cô (teacherAction) và Hoạt động của trẻ (studentAction). Để trống step2, 3, 4.
Trả về JSON chứa mảng activities gồm 2 phần tử:
{
  "activities": [
    {
      "id": "act-1",
      "index": 1,
      "name": "${config.oldPlanContent ? '[Thay bằng Tên bước 1 trích xuất từ giáo án mẫu]' : act1Name}",
      "duration": "...",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "step1": { "title": "", "teacherAction": "...", "studentAction": "...", "productExpected": "", "digitalOrAiTool": "" },
      "step2": null, "step3": null, "step4": null
    },
    {
      "id": "act-2",
      "index": 2,
      "name": "${config.oldPlanContent ? '[Thay bằng Tên bước 2 trích xuất từ giáo án mẫu]' : act2Name}",
      "duration": "...",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "step1": { "title": "", "teacherAction": "...", "studentAction": "...", "productExpected": "", "digitalOrAiTool": "" },
      "step2": null, "step3": null, "step4": null
    }
  ]
}`;
    } else {
      const part1Slots = getSlotsForActivityRange('act1_2');
      prompt = `${baseContext}
Hãy soạn chi tiết HOẠT ĐỘNG 1 và HOẠT ĐỘNG 2.
${hasUploadedSample ? `
=============================================================================
QUY TẮC BẢO TỒN TUYỆT ĐỐI GIÁO ÁN MẪU TẢI LÊN CHO HOẠT ĐỘNG 1 & 2:
=============================================================================
1. ĐỂ NGUYÊN NỘI DUNG GỐC: Trích xuất trọn vẹn 100% tình huống khởi động, các câu hỏi khám phá, các đề mục La Mã (I., II.) / tiểu mục (1., 2...), câu lệnh của GV & HS, công thức toán học và nội dung kiến thức cốt lõi từ oldPlanContent.
2. CHỈ ĐỂ MẪU MỚI: Đưa toàn bộ nội dung giáo án cũ vào khung mẫu mới chuẩn (CV 5512 với THCS/THPT, CV 2345 với Tiểu học, Chương trình mới với Mầm non) với 4 bước tổ chức thực hiện chuẩn mực.
3. CHỈ CHỈNH SỬA NHẸ CHO PHÙ HỢP: Tuyệt đối không thay thế nội dung bằng bài khác, không tóm tắt làm cụt mất ý, không thêm các câu từ rườm rà ngoài lề, không làm biến dạng công thức toán học và vị trí các thẻ ảnh {{IMAGE_SLOT_X}}.
4. Đưa toàn bộ tên đề mục và nội dung kiến thức ghi vở vào đầu Cột Sản phẩm (productExpected).
${part1Slots.promptText}
` : `Nếu KHÔNG CÓ giáo án mẫu, hãy soạn theo chuẩn 4 bước của Công văn 5512.`}
${periodNote}
${part1Slots.slots.length > 0 ? 'BẮT BUỘC chèn đúng các thẻ ' + part1Slots.slots.map(s => s.slotTag).join(', ') + ' vào đúng câu hỏi/bài tập tương ứng trong teacherAction hoặc studentAction.' : 'TUYỆT ĐỐI KHÔNG tự bịa thẻ ảnh giữ chỗ như {{IMAGE_SLOT_1}} hay {{IMAGESLOT1}}.'}
- step1: Chuyển giao nhiệm vụ học tập (title: "* Chuyển giao nhiệm vụ học tập", teacherAction, studentAction, productExpected, digitalOrAiTool)
- step2: Thực hiện nhiệm vụ học tập (title: "* HS thực hiện nhiệm vụ học tập", teacherAction, studentAction, productExpected, digitalOrAiTool)
- step3: Báo cáo kết quả và thảo luận (title: "* Báo cáo kết quả và thảo luận", teacherAction, studentAction, productExpected, digitalOrAiTool)
- step4: Kết luận, nhận định (title: "* Kết luận, nhận định", teacherAction, studentAction, productExpected, digitalOrAiTool)

ĐẶC BIỆT BẮT BUỘC CHO HOẠT ĐỘNG 2 (HÌNH THÀNH KIẾN THỨC MỚI) - ÁP DỤNG NGHIÊM NGẶT CHO KHỐI THCS VÀ MỌI BỘ MÔN:
1. PHÍA TRÊN BẢNG:
   - "content" (b. Nội dung): Tóm tắt 1-2 câu ngắn gọn nhiệm vụ/nội dung học sinh thực hiện (Ví dụ: "Học sinh đọc SGK, quan sát tranh ảnh và thảo luận nhóm để tìm hiểu về..."). TUYỆT ĐỐI KHÔNG ghi danh sách đề mục La Mã hay tiểu mục vào đây.
   - "productSummary" (c. Sản phẩm): Tóm tắt 1-2 câu ngắn gọn kết quả chung (Ví dụ: "Câu trả lời của học sinh; kiến thức cốt lõi ghi nhớ về..."). TUYỆT ĐỐI KHÔNG ghi toàn bộ đề mục hay nội dung bài học dài dòng vào đây.

2. CỘT SẢN PHẨM TRONG BẢNG (productExpected):
   - ĐÂY LÀ NƠI DUY NHẤT CHỨA TÊN ĐỀ MỤC VÀ TOÀN BỘ KIẾN THỨC GHI VỞ!
   - BẮT BUỘC TRÍCH XUẤT VÀ HIỂN THỊ ĐẦY ĐỦ, CHÍNH XÁC TỪNG ĐỀ MỤC LA MÃ (I., II.) VÀ TIỂU MỤC (1., 2...) CỦA SGK NGAY ĐẦU CỘT SẢN PHẨM.
   - QUY TẮC XUỐNG DÒNG: Mỗi đề mục La Mã (I., II.) và tiểu mục (1., 2.) PHẢI NẰM RIÊNG TRÊN MỘT DÒNG.
   - Toàn bộ nội dung kiến thức ghi vở, định nghĩa, công thức toán học, bảng biểu hoặc lời giải câu hỏi khám phá dưới mỗi đề mục BẮT BUỘC PHẢI XUỐNG DÒNG và bắt đầu bằng dấu gạch ngang (- ).
   - TUYỆT ĐỐI KHÔNG VIẾT DÍNH LIỀN TÙ TÌ TRÊN CÙNG MỘT DÒNG.
   - Ví dụ chuẩn mẫu trình bày trong Cột Sản phẩm:
     1. Thế giới kĩ thuật số
     - Thiết bị được gắn bộ xử lí hiện diện xung quanh ta. Chúng giúp con người tự động hóa một phần hoạt động xử lí thông tin và xuất hiện trong hầu hết các lĩnh vực kinh tế, xã hội và đời sống...
     - Các thiết bị gắn bộ xử lí thông tin: Máy tính bảng, ti vi kĩ thuật số, điện thoại thông minh, máy chụp cắt lớp, ô tô lái tự động...

3. Ở cột Hoạt động của GV và HS (step1 đến step4): GV giao nhiệm vụ tìm hiểu, phân tích tình huống khám phá theo đúng từng mục La Mã và tiểu mục của SGK; HS thực hiện, thảo luận, báo cáo theo đúng từng đề mục; GV kết luận nhận định chốt kiến thức theo từng mục.
${((isMath || isMiddleSchool || isHighSchool) && !isTinHoc && (config.enableNLS || config.enableAI)) ? `
ĐẶC BIỆT CHO CÁC MÔN HỌC CẤP THCS VÀ THPT KHI TÍCH HỢP NĂNG LỰC SỐ (NLS) VÀ NĂNG LỰC AI (GIỐNG MÔN TOÁN):
- Ở cột Hoạt động của GV và HS (cụ thể trong teacherAction hoặc studentAction của Hoạt động 1 hoặc Hoạt động 2):
  BẮT BUỘC xuống dòng tách riêng thành một khối độc lập bên dưới hoạt động học tập, dạng:
  ${config.enableNLS ? `[Tích hợp NLS]\n  HS sử dụng phần mềm/thiết bị số/tra cứu/MTCT thực hiện nhiệm vụ... (NLS 1.1.TC1a).` : ''}
  ${config.enableAI ? `\n  [Tích hợp AI]\n  HS sử dụng công cụ AI hỗ trợ nhiệm vụ học tập... (AI 6.A1.1).` : ''}
  Thể hiện đúng vị trí các nội dung được tích hợp nơi HS thao tác trên phần mềm, học liệu số hoặc trợ lý AI.
  TUYỆT ĐỐI KHÔNG viết dính liền tù tì vào câu lệnh/nhiệm vụ của GV hay câu trả lời của HS làm đỏ toàn bộ hoạt động.
  TUYỆT ĐỐI KHÔNG chèn mã NLS/AI vào Cột Sản phẩm (productExpected).
(Nội dung môn Tin học cứ giữ nguyên không thay đổi).
` : ''}
Mọi gạch đầu dòng dùng dấu trừ (-).
Trả về JSON dạng:
{
  "activities": [
    {
      "id": "act-1",
      "index": 1,
      "name": "${config.periods >= 2 ? '[TIẾT 1] Hoạt động 1: Mở đầu / Khởi động' : 'Hoạt động 1: Mở đầu / Khởi động'}",
      "duration": "7-10 phút",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "nlsFocus": "...",
      "aiFocus": "...",
      "step1": { "title": "* Chuyển giao nhiệm vụ học tập", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step2": { "title": "* HS thực hiện nhiệm vụ học tập", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step3": { "title": "* Báo cáo kết quả và thảo luận", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step4": { "title": "* Kết luận, nhận định", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." }
    },
    {
      "id": "act-2",
      "index": 2,
      "name": "${config.periods >= 2 ? '[TIẾT 1] Hoạt động 2: Hình thành kiến thức mới' : 'Hoạt động 2: Hình thành kiến thức mới'}",
      "duration": "25-30 phút",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "nlsFocus": "...",
      "aiFocus": "...",
      "step1": { "title": "* Chuyển giao nhiệm vụ học tập", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step2": { "title": "* HS thực hiện nhiệm vụ học tập", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step3": { "title": "* Báo cáo kết quả và thảo luận", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step4": { "title": "* Kết luận, nhận định", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." }
    }
  ]
}`;
    }
    const res = await generateContentWithRetryAndFallback({
      contents: prompt,
      candidateKeys: keysList,
      primaryModel: modelToUse,
      taskType: 'pedagogical',
      config: { responseMimeType: 'application/json' },
    });
    return parseJSONRobust(res.text);
  };
  // Task 3: Activity 3 (Luyện tập) & Activity 4 (Vận dụng & Hướng dẫn về nhà / Bài tiếp theo)
  const taskActivities3And4 = async () => {
    const periodNote = config.periods >= 2 ? 'LƯU Ý PHÂN PHỐI TIẾT: Hoạt động 3 và Hoạt động 4 thuộc TIẾT 2. Đặt tên hoạt động có tiền tố "[TIẾT 2]" (ví dụ "[TIẾT 2] Hoạt động 3: Luyện tập", "[TIẾT 2] Hoạt động 4: Vận dụng & Hướng dẫn tự học").' : '';
    let prompt = '';
    
    if (isPreschool) {
      const s = (subject || '').toLowerCase().trim();
      const t = (lessonTitle || '').toLowerCase().trim();

      const isScience = s.includes('khoa học') || s.includes('kpk') || t.includes('khoa học') ||
        t.includes('màu sắc') || t.includes('thí nghiệm') || t.includes('pha màu') ||
        t.includes('vật chìm') || t.includes('không khí') || t.includes('ánh sáng') ||
        t.includes('nam châm') || t.includes('giác quan') ||
        ((s.includes('nhận thức') || s.includes('kntt') || !s) && (t.includes('khám phá') || t.includes('màu') || t.includes('cây xanh') || t.includes('thực vật') || t.includes('động vật') || t.includes('con vật')));

      const isMath = s.includes('toán') || s.includes('lqvt') || t.includes('toán') ||
        t.includes('đếm') || t.includes('chữ số') || t.includes('số lượng') ||
        t.includes('hình tròn') || t.includes('hình vuông') || t.includes('hình tam giác') ||
        t.includes('cao - thấp') || t.includes('to - nhỏ') || t.includes('dài - ngắn') ||
        t.includes('tách gộp') || t.includes('xếp tương ứng') || t.includes('ghép đôi');

      const isSocial = s.includes('khám phá xã hội') || s.includes('kpxh') ||
        ((s.includes('nhận thức') || s.includes('xã hội')) && (t.includes('cô giáo') || t.includes('trường mầm non') || t.includes('bác cấp dưỡng') || t.includes('chú bộ đội') || t.includes('gia đình') || t.includes('trung thu') || t.includes('lễ hội') || t.includes('quy tắc')));

      const isPoetry = s.includes('thơ') || t.startsWith('thơ:') || t.startsWith('thơ ') || t.includes('bài thơ') || t.includes('đồng dao');
      const isStory = s.includes('truyện') || t.startsWith('truyện:') || t.startsWith('truyện ') || t.includes('câu chuyện') || t.includes('sự tích');
      const isLetter = s.includes('chữ cái') || s.includes('lqcc') || t.includes('chữ cái') || t.includes('tập tô') || t.includes('chữ o') || t.includes('chữ a') || t.includes('chữ e');
      const isArt = s.includes('tạo hình') || t.includes('xé dán') || t.includes('nặn') || t.includes('vẽ tranh') || t.includes('cắt dán') || t.includes('gấp giấy') || t.includes('làm khung tranh');
      
      const extra = ((config.oldPlanContent || '') + ' ' + (config.topic || '')).toLowerCase();
      const isPhysical = s.includes('thể chất') || s.includes('vận động') || s.includes('thể dục') || s.includes('gdtc') ||
        t.includes('vđcb') || t.includes('btptc') || t.includes('đi thăng bằng') || t.includes('bật') || t.includes('ném') ||
        t.includes('bò chui') || t.includes('tung bóng') || t.includes('chuyền bóng') || t.includes('bắt bóng') ||
        t.includes('trèo thang') || t.includes('rửa tay') || t.includes('chạy') || t.includes('bò') || t.includes('trườn') ||
        t.includes('thể dục') || t.includes('thể chất') || t.includes('vận động cơ bản') || t.includes('bài tập phát triển chung') ||
        extra.includes('thể chất') || extra.includes('btptc') || extra.includes('vđcb') || extra.includes('bài tập phát triển chung');

      const isMusic = !isScience && !isMath && !isSocial && !isPoetry && !isStory && !isLetter && !isPhysical &&
        (s.includes('âm nhạc') || s.includes('ấm nhạc') || s.includes('gdam') || s.includes('hát múa') || s.includes('dạy hát') || s.includes('nghe hát') ||
         t.startsWith('dạy hát:') || t.startsWith('dạy hát ') || t.startsWith('dạy hát') || t.startsWith('nghe hát:') || t.includes('dạy hát') || t.includes('nghe hát') ||
         t.includes('hát và nhún nhảy') || t.includes('vận động theo nhạc') ||
         ((s.includes('nghệ thuật') || s.includes('thẩm mỹ') || s.includes('thẩm mĩ')) && (t.includes('hát') || t.includes('nhạc') || extra.includes('hát') || extra.includes('nhạc') || extra.includes('dạy hát'))));

      const isCognitive = isScience || isMath;
      const isSocialSkills = isSocial;
      const isLetterTracing = s.includes('tập tô') || s.includes('to chu cai') || t.includes('tập tô') || t.includes('tô chữ cái') || t.includes('tô nét') || t.includes('sao chép nét') || s.includes('sao chép nét') || t.includes('tô, đồ') || t.includes('tô đồ') || extra.includes('tập tô chữ cái') || extra.includes('tô, đồ, sao chép');
      const isLetterGame = s.includes('trò chơi chữ cái') || t.includes('trò chơi chữ cái') || t.includes('chơi với chữ cái') || t.includes('tc chữ cái') || extra.includes('trò chơi chữ cái');
      const isLearningGame = s.includes('trò chơi học tập') || t.includes('trò chơi học tập') || t.includes('tìm bạn thân') || extra.includes('trò chơi học tập');
      const isSocialExploration = s.includes('khám phá xã hội') || s.includes('kpxh') || t.includes('khám phá xã hội') || t.includes('đồ dùng, đồ chơi') || t.includes('lớp học của bé') || (s.includes('nhận thức') && (s.includes('xã hội') || t.includes('đồ dùng')));

      let act3Name = isCognitive || isSocialSkills ? "3. Chia sẻ - Thảo luận" : "3. Chia sẻ – Thảo luận";
      let act4Name = "4. Vận dụng – Mở rộng";
      let act5Name = isCognitive ? "5. Chia sẻ - Đánh giá" : "5. Đánh giá – Điều chỉnh";

      if (isPhysical) {
        act3Name = "3. Chia sẻ – Hình thành cách thực hiện";
        act4Name = "4. Thực hành – Vận dụng";
        act5Name = "5. Chia sẻ – Đánh giá và Hồi tĩnh";
      } else if (isLetterTracing) {
        act3Name = "3. Thực hiện hoạt động";
        act4Name = "4. Mở rộng và phát triển kỹ năng";
        act5Name = "5. Chia sẻ – Đánh giá – Kết thúc";
      } else if (isLetterGame || isLearningGame) {
        act3Name = "3. Thực hiện hoạt động chơi";
        act4Name = "4. Mở rộng và phát triển";
        act5Name = "5. Chia sẻ – Đánh giá – Kết thúc chơi";
      } else if (isSocialExploration) {
        act3Name = "3. Chia sẻ - Thảo luận";
        act4Name = "4. Vận dụng và mở rộng";
        act5Name = "5. Đánh giá và điều chỉnh";
      }

      let domainSpecificGuidance = '';
      if (isPhysical) {
        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý CHO LĨNH VỰC PHÁT TRIỂN THỂ CHẤT (TIẾT THỂ DỤC / VẬN ĐỘNG):
- TUYỆT ĐỐI KHÔNG DÙNG CÁC ĐỀ MỤC ÂM NHẠC (KHÔNG có a. Dạy hát, KHÔNG có b. Nghe hát, KHÔNG có Trò chơi âm nhạc).
- Hoạt động 3 "${act3Name}":
  + Mời trẻ chia sẻ cách thực hiện, cảm nhận sau khi thử trải nghiệm vận động ở bước 2.
  + Cô làm mẫu chuẩn hóa kỹ năng:
    Lần 1: Làm mẫu toàn phần không giải thích.
    Lần 2: Làm mẫu kết hợp phân tích kỹ thuật vận động chi tiết (tư thế chuẩn bị, hiệu lệnh xuất phát, phối hợp mắt - chân - tay - thân mình, tiếp đất an toàn).
    Lần 3: Nhấn mạnh điểm mấu chốt kỹ thuật (nếu cần).
  + Mời 2 trẻ lên thực hiện lại để cô và cả lớp quan sát, chuẩn hóa.
- Hoạt động 4 "${act4Name}":
  + Trẻ lần lượt thực hành theo hàng/nhóm từ dễ đến khó (cá nhân -> nhóm -> thi đua giữa các đội); Cô bao quát, sửa sai kịp thời, động viên khích lệ trẻ.
  + Trò chơi vận động củng cố: Giới thiệu tên trò chơi vận động phù hợp chủ đề, luật chơi, cách chơi và tổ chức cho trẻ chơi hào hứng.
- Hoạt động 5 "${act5Name}":
  + Trao đổi cảm nhận của trẻ sau buổi tập, cô nhận xét tuyên dương tinh thần tập luyện.
  + Hồi tĩnh: Cho trẻ đi nhẹ nhàng 1 - 2 vòng quanh sân/phòng tập theo nhạc êm dịu, làm động tác chim bay thả lỏng cơ thể, hít thở sâu.`;
      } else if (isMusic) {
        const isFocusListen = s.includes('nghe hát');
        const isFocusMove = s.includes('vận động');
        
        let act3Content = `"a. Dạy hát \\"[Tên bài hát trọng tâm]\\" (TT) (Tác giả: ...)" và "b. Nghe hát \\"[Tên bài nghe hát]\\" (Tác giả: ...)"`;
        if (isFocusListen) {
          act3Content = `"a. Nghe hát \\"[Tên bài hát trọng tâm]\\" (TT) (Tác giả: ...)" và "b. Hát vận động (hoặc Trò chơi âm nhạc) \\"[Tên bài bổ trợ]\\""`;
        } else if (isFocusMove) {
          act3Content = `"a. Hát vận động (Vận động theo nhạc) \\"[Tên bài hát trọng tâm]\\" (TT) (Tác giả: ...)" và "b. Nghe hát \\"[Tên bài nghe hát]\\" (Tác giả: ...)"`;
        }

        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý CHO MÔN ÂM NHẠC: 
- Tên Hoạt động 3 BẮT BUỘC là "3. Chia sẻ – Thảo luận". Trong trường teacherAction của Hoạt động 3 BẮT BUỘC PHẢI CÓ ĐẦY ĐỦ 2 NỘI DUNG VỚI ĐÚNG ĐỀ MỤC: ${act3Content} (BẮT BUỘC có cả a. Dạy hát: và b. Nghe hát:, thiếu một trong hai là sai yêu cầu nghiêm trọng). Trong studentAction tuyệt đối KHÔNG ghi tiêu đề "a." hay "b." đứng riêng lẻ, chỉ ghi các dấu gạch đầu dòng hành động phản hồi của trẻ cho cả 2 phần.
- Tên Hoạt động 4 BẮT BUỘC là "4. Vận dụng – Mở rộng". Trong teacherAction của Hoạt động 4 BẮT BUỘC PHẢI CHỨA phần tổ chức "Trò chơi âm nhạc: \\"[Tên trò chơi âm nhạc]\\"" (ví dụ "Nốt nhạc vui", "Vũ điệu hóa đá", "Tai ai tinh", "Ai nhanh nhất") với cách chơi và luật chơi cụ thể, sinh động.
- Tên Hoạt động 5 BẮT BUỘC là "5. Đánh giá – Điều chỉnh".`;
      } else if (isSocial) {
        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý CHO LĨNH VỰC PHÁT TRIỂN TÌNH CẢM - XÃ HỘI (GIÁO ÁN TÌNH CẢM - XÃ HỘI):
- TUYỆT ĐỐI KHÔNG DÙNG CÁC ĐỀ MỤC ÂM NHẠC (KHÔNG có a. Dạy hát, KHÔNG có b. Nghe hát, KHÔNG có Trò chơi âm nhạc).
- Hoạt động 3 "3. Chia sẻ - Thảo luận": 
  + Cô gõ trống hội/chuông nhẹ nhàng mời trẻ quây quần ngồi thành vòng tròn lớn đầm ấm cùng sản phẩm vừa làm quanh không gian trưng bày/mâm ngũ quả/cành hoa.
  + Cô đặt các câu hỏi khơi gợi sâu sắc để trẻ tự nói ra hiểu biết của mình về đề tài (phong tục, nghề nghiệp, ngày Tết, lễ hội, tình cảm gia đình, cách ứng xử...).
  + Cô trình chiếu video ngắn/hình ảnh chuẩn hóa kiến thức và khái quát ý nghĩa nét đẹp văn hóa, phong tục truyền thống.
- Hoạt động 4 "4. Vận dụng – Mở rộng": 
  + Tình huống giải quyết vấn đề (Ví dụ: "Bé chúc Tết lễ phép", "Bé ứng xử văn minh", "Bé giúp đỡ bạn bè..."): Cô đưa ra tình huống đóng vai thực tế để trẻ rèn luyện kỹ năng ứng xử văn minh, đứng khoanh tay lễ phép, nhận quà bằng 2 tay và nói lời cảm ơn.
  + Trò chơi vận động đồng đội đặc trưng (ví dụ "Chợ Tết quê em", "Tiếp sức chuyển quà", "Gian hàng quê em") có cách chơi và luật chơi rõ ràng.
  + Mở rộng: Cho tất cả trẻ mặc trang phục đẹp (áo dài...), cùng nắm tay nhau thành vòng tròn lớn, hòa vào bài hát múa tập thể gắn kết.
- Hoạt động 5 "5. Đánh giá – Điều chỉnh": 
  + Giáo viên trò chuyện hỏi cảm nhận của trẻ: "Hôm nay con thích hoạt động nào nhất?", "Con đã học được điều gì?", "Con cảm thấy như thế nào?".
  + Quan sát, ghi nhận sự tham gia của trẻ, khuyến khích trẻ tự đánh giá và nhận xét bạn; động viên trẻ tiếp tục thực hiện những hành vi yêu thương, lễ phép trong cuộc sống.
  + Nhắc nhở trẻ tự giác thu dọn đồ dùng các trạm chơi ngăn nắp, cất gọn gàng vào đúng góc quy định.`;
      } else if (isScience) {
        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý CHO LĨNH VỰC NHẬN THỨC (KHÁM PHÁ KHOA HỌC):
- TUYỆT ĐỐI KHÔNG DÙNG CÁC ĐỀ MỤC ÂM NHẠC (KHÔNG có a. Dạy hát, KHÔNG có b. Nghe hát, KHÔNG có Trò chơi âm nhạc).
- Hoạt động 3 "3. Chia sẻ - Thảo luận": Trẻ quây quần chia sẻ kết quả trải nghiệm / thí nghiệm khoa học (pha màu, ánh sáng, vật chìm nổi...); Cô gợi mở câu hỏi đàm thoại và chuẩn hóa kiến thức khoa học bằng hình ảnh/slide/video trực quan.
- Hoạt động 4 "4. Vận dụng – Mở rộng": Tổ chức thử thách khám phá sáng tạo / trò chơi khoa học vận dụng (ví dụ "Vũ hội sắc màu", Trạm pha màu sáng tạo, Săn tìm màu sắc tự nhiên, Phân loại đồ vật).
- Hoạt động 5 "5. Chia sẻ - Đánh giá": Trẻ chia sẻ cảm xúc, cô nhận xét biểu dương tinh thần chủ động tìm tòi và hướng dẫn trẻ tự giác thu dọn đồ dùng học liệu.`;
      } else if (isMath) {
        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý CHO LĨNH VỰC NHẬN THỨC (LÀM QUEN VỚI TOÁN):
- TUYỆT ĐỐI KHÔNG DÙNG CÁC ĐỀ MỤC ÂM NHẠC.
- Hoạt động 3 "3. Chia sẻ - Thảo luận": Trẻ chia sẻ thao tác xếp tương ứng, đếm số lượng; Cô đặt câu hỏi khơi gợi bản chất toán học, khẳng định quy tắc toán, giới thiệu chữ số/hình khối mới và hướng dẫn chọn thẻ số gắn vào nhóm.
- Hoạt động 4 "4. Vận dụng – Mở rộng": Các trạm thử thách toán học (Tìm bạn cho số, Tạo hình chữ số từ đất nặn/sỏi/dây thừng, Vận động tạo hình số).
- Hoạt động 5 "5. Chia sẻ - Đánh giá": Trẻ chia sẻ điều học được, cô nhận xét biểu dương và cùng trẻ cất đồ dùng.`;
      } else if (isPoetry) {
        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý CHO LĨNH VỰC PHÁT TRIỂN NGÔN NGỮ (THƠ) / GIÁO ÁN VĂN HỌC (THƠ):
- TUYỆT ĐỐI KHÔNG DÙNG CÁC ĐỀ MỤC ÂM NHẠC.
- Hoạt động 3 "3. Chia sẻ - Thảo luận" BẮT BUỘC TRÌNH BÀY ĐÚNG CẤU TRÚC SAU:
  + Dưới tên hoạt động, phải chia thành các mục rõ ràng. Trong phần "Hoạt động của Cô" ghi rõ:
    a. Đàm thoại khơi gợi & Giải thích nội dung:
    - Giải thích từ khó: (giải thích các từ khó trong bài)
    - Ý nghĩa nội dung bài thơ: (nêu ý nghĩa bài thơ)
    b) Dạy thuộc thơ: (Cô và lớp cùng đọc, tổ chức thi đua đọc thơ diễn cảm bằng nhiều hình thức...)
- Hoạt động 4 "4. Vận dụng – Mở rộng": Tình huống giả định ứng dụng nội dung bài thơ vào cuộc sống / Nhập vai thể hiện cảm xúc bài thơ / Sáng tạo sản phẩm liên quan bài thơ.
- Hoạt động 5 "5. Chia sẻ - Đánh giá": Trẻ chia sẻ cảm xúc, tự đánh giá nhận xét bạn, cô khen ngợi giọng đọc hay.`;
      } else if (isStory) {
        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý CHO LĨNH VỰC PHÁT TRIỂN NGÔN NGỮ (TRUYỆN) / GIÁO ÁN VĂN HỌC (TRUYỆN):
- TUYỆT ĐỐI KHÔNG DÙNG CÁC ĐỀ MỤC ÂM NHẠC.
- Hoạt động 3 "3. Chia sẻ – Thảo luận": Trẻ quây quần đàm thoại thấu hiểu tính cách nhân vật, bối cảnh và bài học câu chuyện; Luyện nói câu trọn vẹn và thể hiện ngữ điệu giọng nhân vật. Trích dẫn câu nói của nhân vật.
- Hoạt động 4 "4. Vận dụng – Mở rộng": Thử thách nhóm (Ví dụ: Sắp xếp Vòng tuần hoàn của Tí Xíu, Sơ đồ câu chuyện, Tình huống bảo vệ môi trường, Sáng tạo sản phẩm), Phân vai đóng kịch ngắn mô phỏng câu chuyện với mũ nhân vật.
- Hoạt động 5 "5. Chia sẻ - Đánh giá": Trẻ chia sẻ cảm xúc sau hoạt động, cô nhận xét biểu dương tinh thần tự tin và diễn xuất của trẻ.`;
      } else if (isLetterTracing) {
        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý CHO HOẠT ĐỘNG TẬP TÔ CHỮ CÁI:
- TUYỆT ĐỐI KHÔNG DÙNG CÁC ĐỀ MỤC ÂM NHẠC.
- Hoạt động 3 "3. Thực hiện hoạt động":
  + Trẻ ngồi vào bàn chuẩn bị bút, giấy/vở.
  + Trẻ thực hành từng bước: Ngồi đúng tư thế -> Đặt vở ngay ngắn -> Cầm bút 3 ngón tay -> Tay kia giữ vở -> Thực hiện tô, đồ, sao chép theo yêu cầu.
  + Cô đến từng bàn quan sát, nhẹ nhàng sửa tư thế ngồi, cách cầm bút và nét cho trẻ còn lúng túng; Khuyến khích trẻ tự kiểm tra.
- Hoạt động 4 "4. Mở rộng và phát triển kỹ năng":
  + Trò chơi 1: "Nét nào biến mất?" (hoặc "Chữ cái nào biến mất?"): Cô giơ thẻ, trẻ gọi tên và dùng ngón tay vẽ nét/chữ trong không khí.
  + Trò chơi 2: "Bé làm họa sĩ nhí" (hoặc "Tìm chữ trong từ/tranh"): Trẻ vận dụng các nét đã học tạo hình đơn giản (mái nhà, hàng rào, tia nắng, thân cây...) hoặc tìm và khoanh chữ cái.
  + Khuyến khích trẻ vừa thực hiện vừa gọi tên nét/chữ.
- Hoạt động 5 "5. Chia sẻ – Đánh giá – Kết thúc":
  + BẮT BUỘC gồm 3 nội dung với đề mục rõ ràng:
    * Chia sẻ: Trẻ đặt bút xuống, thả lỏng ngón tay; Giới thiệu sản phẩm, đàm thoại nhận xét sản phẩm của mình và bạn.
    * Đánh giá: Nhận xét chung, khen ngợi trẻ ngồi đúng tư thế, cầm bút đúng, tô đồ đúng hướng; Động viên trẻ còn gặp khó khăn; Khắc sâu: "Ngồi đúng – Cầm bút đúng – Nhìn mẫu kỹ – Đưa bút đúng hướng."
    * Kết thúc: Cất bút, vở đúng nơi quy định; Vận động nhẹ các ngón tay, cổ tay thư giãn; Chuyển sang hoạt động tiếp theo.`;
      } else if (isLetterGame) {
        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý CHO HOẠT ĐỘNG TRÒ CHƠI CHỮ CÁI:
- TUYỆT ĐỐI KHÔNG DÙNG CÁC ĐỀ MỤC ÂM NHẠC.
- Hoạt động 3 "3. Thực hiện hoạt động chơi":
  + Tổ chức chuỗi các trò chơi chữ cái hấp dẫn (từ 3 đến 5 trò chơi, ví dụ: Trò chơi 1 "Ai tìm chữ nhanh", Trò chơi 2 "Về đúng nhà", Trò chơi 3 "Chuyền chữ tiếp sức", Trò chơi 4 "Ghép chữ tạo từ", Trò chơi 5 "Săn tìm chữ cái").
  + Với mỗi trò chơi BẮT BUỘC ghi rõ các mục: Cách chơi, Luật chơi, Mục tiêu và diễn biến chơi của trẻ.
  + Trẻ chủ động tương tác, phát âm chuẩn chữ cái, phối hợp đồng đội nhịp nhàng.
- Hoạt động 4 "4. Mở rộng và phát triển":
  + Tăng độ khó: Tìm chữ cái trong từ xung quanh lớp, phân tích nét (nét cong, thêm mũ, thêm râu...).
  + Cho trẻ tự nghĩ thêm từ có chứa chữ cái trong thực tế.
  + Khuyến khích trẻ sáng tạo trò chơi mới với các thẻ chữ cái.
- Hoạt động 5 "5. Chia sẻ – Đánh giá – Kết thúc chơi":
  + Đàm thoại củng cố: Hỏi cảm nhận, tên các trò chơi, những chữ cái đã học và so sánh đặc điểm cấu tạo nét.
  + Cả lớp phát âm lại đồng thanh rõ ràng các chữ cái.
  + Đánh giá tuyên dương tinh thần đoàn kết, chơi trung thực, trách nhiệm; cùng cô thu dọn đồ dùng thẻ chữ vào rổ gọn gàng.`;
      } else if (isLearningGame) {
        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý CHO TRÒ CHƠI HỌC TẬP (VÍ DỤ TÌM BẠN THÂN):
- TUYỆT ĐỐI KHÔNG DÙNG CÁC ĐỀ MỤC ÂM NHẠC.
- Hoạt động 3 "3. Thực hiện hoạt động chơi":
  + Trò chơi "TÌM BẠN THÂN" (hoặc trò chơi học tập tương ứng):
    * Lần 1 – Tìm bạn theo biểu tượng/hình ảnh: Trẻ nhận thẻ bí mật, di chuyển theo nhạc, khi nhạc dừng chủ động hỏi đáp chào hỏi tìm bạn có hình tương ứng. Hai bạn kiểm tra thẻ reo vui "Chúng mình là bạn thân!".
    * Lần 2 – Tìm bạn theo đặc điểm/sở thích: Đổi sang dấu hiệu sở thích (cùng thích màu đỏ, thích vẽ, thích xây dựng...). Trẻ chủ động trao đổi tìm kiếm. Cô hỗ trợ trẻ nhút nhát.
- Hoạt động 4 "4. Mở rộng và phát triển trò chơi":
  + Tình huống giải quyết vấn đề: Bạn thân đang buồn / bạn chưa tìm được bạn, trẻ thảo luận và đưa ra cách xử lý (hỏi thăm, chia sẻ đồ chơi, mời chơi cùng).
  + Mở rộng: Tạo nhóm 3-4 bạn cùng sở thích thực hiện nhiệm vụ chung (xếp hình, vẽ tranh tình bạn...).
- Hoạt động 5 "5. Chia sẻ – Đánh giá – Kết thúc chơi":
  + Chia sẻ: Hỏi cảm xúc khi tìm được bạn, cách hỏi bạn, cách giúp đỡ bạn.
  + Đánh giá: Nhận xét kỹ năng quan sát, giao tiếp, hợp tác, tự lực, trung thực khi chơi.
  + Kết thúc: Giáo dục tình bạn đẹp, cả lớp nắm tay nhau thành vòng tròn hát vang bài ca tình bạn và chuyển hoạt động.`;
      } else if (isSocialExploration) {
        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý CHO HOẠT ĐỘNG KHÁM PHÁ XÃ HỘI (LĨNH VỰC PHÁT TRIỂN NHẬN THỨC):
- TUYỆT ĐỐI KHÔNG DÙNG CÁC ĐỀ MỤC ÂM NHẠC.
- Hoạt động 3 "3. Chia sẻ - Thảo luận":
  + Tập trung trẻ theo nhóm, mời đại diện nhóm chia sẻ đồ dùng đồ chơi đã tìm thấy ở các góc.
  + Đàm thoại về công dụng, cách sử dụng an toàn, so sánh sự giống và khác nhau giữa đồ dùng học tập và đồ chơi.
  + Trò chuyện về các hoạt động diễn ra trong lớp học (học tập, vui chơi, tạo hình, âm nhạc, vệ sinh...).
  + Đặt tình huống chia sẻ đồ dùng đồ chơi khi chơi cùng bạn.
  + Cô khái quát chuẩn hóa kiến thức.
- Hoạt động 4 "4. Vận dụng và mở rộng":
  + Trò chơi "Đưa đồ chơi về đúng nhà" (theo ký hiệu của từng góc chơi).
  + Tình huống giải quyết vấn đề: Dọn dẹp đồ chơi sau giờ chơi, phân loại và sắp xếp đồ dùng theo nhóm ngăn nắp.
  + Mở rộng liên hệ đồ dùng ở nhà và giáo dục ý thức giữ gìn tài sản chung.
- Hoạt động 5 "5. Đánh giá và điều chỉnh":
  + Cô nhận xét quá trình tham gia, hỏi cảm nhận của trẻ và câu hỏi củng cố kiến thức.
  + Đánh giá phân hóa: khích lệ trẻ nhút nhát, nâng cao cho trẻ khá giỏi.
  + Tuyên dương tinh thần hợp tác, biết giữ gìn đồ dùng; cùng trẻ kiểm tra lại các góc và thu dọn gọn gàng.`;
      } else if (isLetter) {
        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý CHO NGÔN NGỮ (CHỮ CÁI):
- TUYỆT ĐỐI KHÔNG DÙNG CÁC ĐỀ MỤC ÂM NHẠC.
- Hoạt động 3 "3. Chia sẻ - Thảo luận": Trẻ chia sẻ trải nghiệm sờ nét/ghép nét chữ cái; Cô đưa thẻ chữ in thường phát âm mẫu, tổ chức cho cả lớp/tổ/nhóm/cá nhân phát âm; Phân tích cấu tạo nét của từng chữ cái (có so sánh điểm giống và khác nhau nếu làm quen 2 chữ cái).
- Hoạt động 4 "4. Vận dụng – Mở rộng": Trò chơi chữ cái sôi nổi vận động (Ví dụ: "Nhanh tay nhanh mắt", "Thử thách đồng đội - Đi tìm chữ cái", "Tạo dáng chữ cái bằng cơ thể").
- Hoạt động 5 "5. Chia sẻ - Đánh giá": Trẻ tự nhận xét, cô khen ngợi tinh thần chủ động khám phá, phát âm chuẩn, nhắc nhở trẻ cất thẻ chữ gọn gàng.`;
      } else if (isArt) {
        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý CHO LĨNH VỰC PHÁT TRIỂN THẨM MỸ (TẠO HÌNH):
- TUYỆT ĐỐI KHÔNG DÙNG CÁC ĐỀ MỤC ÂM NHẠC.
- Hoạt động 3 "3. Chia sẻ – Thảo luận": Trưng bày sản phẩm tạo hình lên kệ/bàn triển lãm; Trẻ tự tin giới thiệu sản phẩm của mình, nêu ý tưởng và kỹ năng đã vận dụng (vẽ, nặn, xé dán...); Cô kết nối, nhận xét động viên và tôn trọng cảm xúc sáng tạo riêng của trẻ.
- Hoạt động 4 "4. Vận dụng – Mở rộng": Gợi mở ứng dụng sản phẩm vào thực tế (lồng ảnh, tặng người thân, trang trí không gian lớp học).
- Hoạt động 5 "5. Đánh giá – Điều chỉnh": Trẻ chia sẻ niềm vui, tự giác thu dọn nguyên vật liệu gọn gàng.`;
      } else {
        domainSpecificGuidance = `ĐẶC BIỆT LƯU Ý: TUYỆT ĐỐI KHÔNG CHÈN ĐỀ MỤC ÂM NHẠC (Dạy hát, Nghe hát, Trò chơi âm nhạc) VÀO CÁC BÀI HỌC KHÔNG PHẢI MÔN ÂM NHẠC.
- Hoạt động 3 "${act3Name}": Trẻ quây quần chia sẻ, thảo luận và cô chuẩn hóa kiến thức/kỹ năng trọng tâm.
- Hoạt động 4 "${act4Name}": Tổ chức trò chơi thử thách / tình huống ứng dụng thực hành phù hợp với đề tài bài học.
- Hoạt động 5 "${act5Name}": Trẻ chia sẻ cảm nhận, cô nhận xét khen ngợi và hướng dẫn thu dọn đồ dùng.`;
      }

      prompt = `${baseContext}
YÊU CẦU SÁNG TẠO ĐỔI MỚI VÀ ĐA DẠNG HÓA HOẠT ĐỘNG (HOẠT ĐỘNG 3, 4, 5):
- Hãy là một giáo viên mầm non đổi mới thời đại: Tạo ra các hoạt động thực hành, trò chơi, tình huống xử lý, câu hỏi đàm thoại phong phú, hấp dẫn, gắn liền mật thiết với chủ đề "${lessonTitle}".
- Hoạt động 3 (${act3Name}): Đàm thoại khơi gợi tư duy phản biện và khả năng ngôn ngữ của trẻ; kết hợp visual/media trực quan hoặc sản phẩm thực tế của trẻ.
- Hoạt động 4 (${act4Name}): Thử thách đóng vai, xử lý tình huống thực tế, trò chơi đồng đội, xưởng sáng tạo ứng dụng sản phẩm vào đời sống.
- Hoạt động 5 (${act5Name}): Tạo không gian mở để trẻ tự do chia sẻ cảm xúc, tự đánh giá và nhận xét bạn bè; cô lắng nghe, khích lệ và giáo dục nề nếp tự giác.
${domainSpecificGuidance}
Hãy soạn chi tiết phần tiếp theo của Tiến trình hoạt động Mầm non (Các bước: ${act3Name}, ${act4Name}, ${act5Name}). NẾU CÓ GIÁO ÁN MẪU, BẮT BUỘC DÙNG TÊN BƯỚC CỦA GIÁO ÁN MẪU.
TUYỆT ĐỐI KHÔNG dùng 4 bước CV 5512. Mỗi hoạt động chỉ dùng duy nhất step1 để chứa Hoạt động của cô (teacherAction) và Hoạt động của trẻ (studentAction). Để trống step2, 3, 4.
Trả về JSON chứa mảng activities gồm 3 phần tử (activity 3, 4, 5):
{
  "activities": [
    {
      "id": "act-3",
      "index": 3,
      "name": "${config.oldPlanContent ? '[Thay bằng Tên bước 3 trích xuất từ giáo án mẫu]' : act3Name}",
      "duration": "...",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "step1": { "title": "", "teacherAction": "...", "studentAction": "...", "productExpected": "", "digitalOrAiTool": "" },
      "step2": null, "step3": null, "step4": null
    },
    {
      "id": "act-4",
      "index": 4,
      "name": "${config.oldPlanContent ? '[Thay bằng Tên bước 4 trích xuất từ giáo án mẫu]' : act4Name}",
      "duration": "...",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "step1": { "title": "", "teacherAction": "...", "studentAction": "...", "productExpected": "", "digitalOrAiTool": "" },
      "step2": null, "step3": null, "step4": null
    },
    {
      "id": "act-5",
      "index": 5,
      "name": "${config.oldPlanContent ? '[Thay bằng Tên bước 5 trích xuất từ giáo án mẫu]' : act5Name}",
      "duration": "...",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "step1": { "title": "", "teacherAction": "...", "studentAction": "...", "productExpected": "", "digitalOrAiTool": "" },
      "step2": null, "step3": null, "step4": null
    }
  ]
}`;
    } else {
      const part2Slots = getSlotsForActivityRange('act3_4');
      prompt = `${baseContext}
Hãy soạn chi tiết HOẠT ĐỘNG 3 và HOẠT ĐỘNG 4.
${hasUploadedSample ? `
=============================================================================
QUY TẮC BẢO TỒN TUYỆT ĐỐI GIÁO ÁN MẪU TẢI LÊN CHO HOẠT ĐỘNG 3 & 4:
=============================================================================
1. ĐỂ NGUYÊN NỘI DUNG GỐC: Trích xuất trọn vẹn 100% toàn bộ câu hỏi, bài tập, trò chơi trắc nghiệm, công thức toán học và câu trả lời/đáp án chi tiết từ oldPlanContent.
2. CHỈ ĐỂ MẪU MỚI: Đưa toàn bộ bài tập, nhiệm vụ học tập của giáo án cũ vào khung mẫu mới chuẩn (CV 5512 với THCS/THPT, CV 2345 với Tiểu học, Chương trình mới với Mầm non) với 4 bước tổ chức thực hiện chuẩn mực.
3. CHỈ CHỈNH SỬA NHẸ CHO PHÙ HỢP: Tuyệt đối không thay thế câu hỏi/bài tập bằng bài khác, không tóm tắt làm mất lời giải chi tiết, không làm biến dạng công thức toán học và vị trí các thẻ ảnh {{IMAGE_SLOT_X}}. TUYỆT ĐỐI KHÔNG BỊA RA CÁC CỤM TỪ BOILERPLATE THỪA THÃI như: "Sẵn sàng tham gia trò chơi", "Đánh giá kết quả trò chơi", "Nội dung chuẩn xác của 5 câu hỏi trắc nghiệm".
4. QUY CÁCH TRÌNH BÀY ĐÁP ÁN TRẮC NGHIỆM TRONG CỘT SẢN PHẨM (productExpected):
   Mỗi đáp án phải nằm trên 1 DÒNG RIÊNG BIỆT, gãy gọn, chuẩn xác:
   Câu 1. Đáp án B. (hoặc Câu 1. B.)
   Câu 2. Đáp án C. (hoặc Câu 2. C.)
   Câu 3. Đáp án A. (hoặc Câu 3. A.)
   Câu 4. Đáp án D. (hoặc Câu 4. D.)
   Câu 5. Đáp án A. (hoặc Câu 5. A.)
   CẤM TUYỆT ĐỐI ngắt dòng vụn vặt làm sai lệch như: "Câu\\n1. B; Câu\\n2. C...".
${part2Slots.promptText}
` : `Nếu KHÔNG CÓ giáo án mẫu, hãy soạn HOẠT ĐỘNG 3 (Luyện tập) và HOẠT ĐỘNG 4 (Vận dụng & Hướng dẫn tự học) theo chuẩn 4 bước của Công văn 5512.`}
${periodNote}
${part2Slots.slots.length > 0 ? 'BẮT BUỘC chèn đúng các thẻ ' + part2Slots.slots.map(s => s.slotTag).join(', ') + ' vào đúng câu hỏi/bài tập tương ứng trong teacherAction hoặc studentAction.' : 'TUYỆT ĐỐI KHÔNG tự bịa thẻ ảnh giữ chỗ như {{IMAGE_SLOT_1}} hay {{IMAGESLOT1}}.'}
ĐẶC BIỆT BẮT BUỘC: Tại Hoạt động 4 (và mục hướng dẫn tự học), GV BẮT BUỘC phải dặn dò học sinh đọc trước SGK và chuẩn bị cụ thể TÊN BÀI HỌC HOẶC NỘI DUNG TIẾP THEO của SGK Kết nối tri thức.
${((isMath || isMiddleSchool || isHighSchool) && !isTinHoc && (config.enableNLS || config.enableAI)) ? `
ĐẶC BIỆT CHO CÁC MÔN HỌC CẤP THCS VÀ THPT KHI TÍCH HỢP NĂNG LỰC SỐ (NLS) VÀ NĂNG LỰC AI (GIỐNG MÔN TOÁN):
- Nếu hoạt động luyện tập / vận dụng có sử dụng thiết bị số, bảng tính, ứng dụng học tập hoặc công cụ AI:
  BẮT BUỘC xuống dòng tách riêng thành một khối độc lập bên dưới hoạt động học tập, dạng:
  ${config.enableNLS ? `[Tích hợp NLS]\n  HS sử dụng công cụ số/bảng tính/phần mềm... (NLS 5.2.TC1b).` : ''}
  ${config.enableAI ? `\n  [Tích hợp AI]\n  HS sử dụng công cụ AI (Prompt/tra cứu/đối chiếu)... (AI 6.A1.1).` : ''}
  Thể hiện đúng vị trí các nội dung được tích hợp nơi HS thao tác.
  TUYỆT ĐỐI KHÔNG viết dính liền tù tì vào câu của GV hay HS.
- TUYỆT ĐỐI KHÔNG chèn mã NLS/AI vào Cột Sản phẩm (productExpected).
(Nội dung môn Tin học cứ giữ nguyên không thay đổi).
` : ''}
Trả về JSON dạng:
{
  "activities": [
    {
      "id": "act-3",
      "index": 3,
      "name": "${config.periods >= 2 ? '[TIẾT 2] Hoạt động 3: Luyện tập' : 'Hoạt động 3: Luyện tập'}",
      "duration": "10-12 phút",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "nlsFocus": "...",
      "aiFocus": "...",
      "step1": { "title": "* Chuyển giao nhiệm vụ học tập", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step2": { "title": "* HS thực hiện nhiệm vụ học tập", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step3": { "title": "* Báo cáo kết quả và thảo luận", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step4": { "title": "* Kết luận, nhận định", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." }
    },
    {
      "id": "act-4",
      "index": 4,
      "name": "${config.periods >= 2 ? '[TIẾT 2] Hoạt động 4: Vận dụng' : 'Hoạt động 4: Vận dụng'}",
      "duration": "5-8 phút",
      "objective": "...",
      "content": "...",
      "productSummary": "...",
      "nlsFocus": "...",
      "aiFocus": "...",
      "step1": { "title": "* Chuyển giao nhiệm vụ học tập", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step2": { "title": "* HS thực hiện nhiệm vụ học tập", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step3": { "title": "* Báo cáo kết quả và thảo luận", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." },
      "step4": { "title": "* Kết luận, nhận định", "teacherAction": "...", "studentAction": "...", "productExpected": "...", "digitalOrAiTool": "..." }
    }
  ]
}`;
    }
    const res = await generateContentWithRetryAndFallback({
      contents: prompt,
      candidateKeys: keysList,
      primaryModel: modelToUse,
      taskType: 'pedagogical',
      config: { responseMimeType: 'application/json' },
    });
    return parseJSONRobust(res.text);
  };
  // Task 4: Competency Matrix & Appendix (Worksheet, Next Lesson Homework)
  const taskMatrixAndAppendix = async () => {
    const prompt = `${baseContext}
Hãy soạn:
1. BẢNG PHÂN TÍCH MA TRẬN NĂNG LỰC SỐ (NLS) & GIÁO DỤC AI:
${isMath ? '- MÔN TOÁN: BỎ Bảng NLS ở cuối (trả về nlsItems là [] mảng rỗng).' : (config.enableNLS ? '- Sinh competencyMatrix.nlsItems cho các hoạt động có ứng dụng NLS.' : '- NLS: Trả về nlsItems là [] (mảng rỗng) vì không tích hợp NLS.')}
${config.enableAI ? '- Sinh competencyMatrix.aiItems cho các hoạt động có ứng dụng AI.' : '- AI: Trả về aiItems là [] (mảng rỗng) vì không tích hợp AI.'}
2. HỒ SƠ DẠY HỌC & PHỤ LỤC (appendix):
   - worksheetContent: ${config.schoolLevel === 'Mầm non' ? 'Không bắt buộc với Mầm non, nếu có thì là bảng/phiếu trò chơi bằng hình ảnh. Nếu không có để chuỗi rỗng' : `BẮT BUỘC TÁCH RÕ THÀNH 2 PHẦN RIÊNG BIỆT DẠNG BẢNG:
     + PHẦN 1: PHIẾU HỌC TẬP DÀNH CHO HỌC SINH
       Tiêu đề: PHIẾU HỌC TẬP: [TÊN BÀI HỌC]
       Họ và tên: ................................................ Lớp: ................. Nhóm: .........
       Bảng bài tập của học sinh:
       | STT | Nhiệm vụ / Câu hỏi học tập | Kết quả / Câu trả lời của học sinh |
       | 1 | [Nội dung câu hỏi / bài tập 1] | ........................................................................ |
       | 2 | [Nội dung câu hỏi / bài tập 2] | ........................................................................ |
       (BẮT BUỘC: Cột Kết quả của học sinh để dòng chấm ........... để học sinh tự điền, KHÔNG điền đáp án sẵn ở bảng này).
     + PHẦN 2: BẢNG GỢI Ý ĐÁP ÁN & HƯỚNG DẪN ĐÁNH GIÁ (DÀNH CHO GIÁO VIÊN)
       Tiêu đề: ### BẢNG GỢI Ý ĐÁP ÁN & HƯỚNG DẪN ĐÁNH GIÁ (DÀNH CHO GIÁO VIÊN)
       | STT | Nhiệm vụ / Câu hỏi học tập | Gợi ý đáp án / Yêu cầu cần đạt | Điểm / Đánh giá |
       | 1 | [Nội dung câu hỏi 1] | [Gợi ý đáp án chi tiết, các bước giải, kết quả] | Đạt / 5.0 điểm |
       | 2 | [Nội dung câu hỏi 2] | [Gợi ý đáp án chi tiết, các bước giải, kết quả] | Đạt / 5.0 điểm |`}
   - assignmentPrompt: ${config.schoolLevel === 'Mầm non' ? 'TUYỆT ĐỐI ĐỂ CHUỖI RỖNG "" (Mầm non không có hướng dẫn tự học & nhiệm vụ về nhà).' : 'Hướng dẫn tự học & nhiệm vụ về nhà: Trình bày từng nhiệm vụ cụ thể rõ ràng theo cấu trúc:\na) Đối với bài vừa học:\n- Nhiệm vụ 1: ...\n- Nhiệm vụ 2: ...\nb) Đối với bài học tiếp theo:\n- Nhiệm vụ 3: Đọc trước và chuẩn bị nội dung [Tên bài học tiếp theo của SGK Kết nối tri thức].\nTUYỆT ĐỐI KHÔNG xuất hiện các dòng gạch đầu dòng (-) rỗng hay dấu gạch nối thừa thãi.'}
Trả về JSON dạng:
{
  "competencyMatrix": {
    "nlsItems": ${!isMath && config.enableNLS ? `[
      {
        "activityName": "Hoạt động 2: Hình thành kiến thức",
        "teachingOrganization": "...",
        "indicatorCode": "3.1.TC1a",
        "competencyDescription": "...",
        "digitalToolUsed": "..."
      }
    ]` : `[]`},
    "aiItems": ${config.enableAI ? `[
      {
        "activityName": "Hoạt động 3: Luyện tập",
        "teachingOrganization": "...",
        "indicatorCode": "6.A1.1",
        "competencyDescription": "...",
        "digitalToolUsed": "..."
      }
    ]` : `[]`}
  },
  "appendix": {
    "worksheetContent": "...",
    "rubricEvaluation": "...",
    "assignmentPrompt": "..."
  }
}   `;
    const res = await generateContentWithRetryAndFallback({
      contents: prompt,
      candidateKeys: keysList,
      primaryModel: modelToUse,
      taskType: 'pedagogical',
      config: { responseMimeType: 'application/json' },
    });
    return parseJSONRobust(res.text);
  };

  // Execute tasks in parallel with error resilience and automatic retry
  const wrap = async (taskFn: any, step: number, initialDelayMs = 0) => {
    if (initialDelayMs > 0) {
      await new Promise((r) => setTimeout(r, initialDelayMs));
    }
    onProgress?.(step, 'start');
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await taskFn();
        if (res && Object.keys(res).length > 0) {
          onProgress?.(step, 'done');
          return res;
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        console.warn(`Task ${step} attempt ${attempt} warning:`, msg);
        if (attempt < 3) {
          const isRateLimit = msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('429') || msg.toLowerCase().includes('quota');
          const delay = isRateLimit ? 1500 * attempt + Math.random() * 800 : 800 * attempt;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    // If still empty after attempts, mark done with fallback to prevent UI hanging
    onProgress?.(step, 'done');
    return {};
  };

  // Execute sections with safe staggered batches to prevent burst 429 Rate Limit
  const res1 = await wrap(taskObjectivesEquipment, 1, 0);
  const [res2, res3, res4] = await Promise.all([
    wrap(taskActivities1And2, 2, 200),
    wrap(taskActivities3And4, 3, 600),
    wrap(async () => { if (isPreschool) return {}; return taskMatrixAndAppendix(); }, 4, 1000),
  ]);


  const rawActivities = [
    ...(res2.activities || []),
    ...(res3.activities || []),
  ].map((act, idx) => ({
    ...act,
    id: `act-${idx + 1}`,
    index: idx + 1
  }));

  const allActivities = isPreschool
    ? (isPreschoolMusicPlan({ schoolLevel: config.schoolLevel, grade, subject, lessonTitle, oldPlanContent: config.oldPlanContent })
        ? formatPreschoolMusicActivities(rawActivities, lessonTitle)
        : formatPreschoolActivities(rawActivities, lessonTitle, subject, config.oldPlanContent || ''))
    : rawActivities.map((act, idx) => sanitizeStandardActivity(act, idx));

  const mergedPlan = {
    schoolName: config.schoolName || '',
    teacherName: config.teacherName || '',
    lessonTitle: lessonTitle,
    subject: subject,
    grade: grade,
    schoolLevel: config.schoolLevel || '',
    duration: isPreschool ? (config.preschoolDuration || preschoolAgeProfile?.recommendedDuration || '30 – 35 phút') : undefined,
    mainTheme: isPreschool ? (config.preschoolMainTheme || undefined) : undefined,
    subTheme: isPreschool ? (config.preschoolSubTheme || undefined) : undefined,
    classSize: isPreschool ? (config.preschoolClassSize || undefined) : undefined,
    preschoolCategoryMode: config.preschoolCategoryMode,
    bookSeries: bookSeries,
    periods: periods,
    lessonTotalPeriods: totalPeriods,
    targetPeriodDetail: targetPeriodDetail,
    objectives: {
      knowledge: res1.objectives?.knowledge || [`Nắm vững kiến thức trọng tâm bài ${lessonTitle}`],
      generalCompetencies: res1.objectives?.generalCompetencies || [
        'Năng lực tự chủ và tự học: Tự giác tìm tòi, nghiên cứu nội dung bài học trong SGK và tài liệu học tập.',
        'Năng lực giao tiếp và hợp tác: Chủ động trao đổi, thảo luận nhóm để hoàn thành nhiệm vụ học tập.',
        'Năng lực giải quyết vấn đề và sáng tạo: Vận dụng linh hoạt kiến thức đã học vào thực tiễn giải quyết bài toán.'
      ],
      subjectCompetencies: res1.objectives?.subjectCompetencies || [`Phát triển năng lực đặc thù môn ${subject}`],
      digitalCompetencies: config.enableNLS ? (res1.objectives?.digitalCompetencies || []) : [],
      aiCompetencies: config.enableAI ? (res1.objectives?.aiCompetencies || []) : [],
      stemCompetencies: hasStem ? (res1.objectives?.stemCompetencies || [`Vận dụng liên môn STEM giải quyết vấn đề thực tiễn gắn với chủ đề ${stemTopic}`]) : [],
      qualities: res1.objectives?.qualities || ['Chăm chỉ, trung thực, trách nhiệm'],
    },
    equipment: {
      teacher: res1.equipment?.teacher || ['Máy tính, máy chiếu, bài giảng điện tử, SGK Kết nối tri thức'],
      student: res1.equipment?.student || ['SGK, vở ghi, thiết bị học tập'],
      digitalAssets: res1.equipment?.digitalAssets || ['Học liệu số tương tác'],
      stemMaterials: hasStem ? (res1.equipment?.stemMaterials || ['Vật liệu chế tạo và thực hành mô hình STEM']) : [],
      parentCollaboration: res1.equipment?.parentCollaboration || [],
      preschoolPreparation: res1.equipment?.preschoolPreparation,
    },
    stemIntegration: hasStem ? (res1.stemIntegration || {
      topicTitle: stemTopic,
      stemGoals: [
        `Khoa học (S): Vận dụng kiến thức khoa học cốt lõi của bài học để giải quyết vấn đề`,
        `Công nghệ (T): Khai thác và ứng dụng công cụ kỹ thuật số trong thiết kế và chế tạo`,
        `Kỹ thuật (E): Thiết kế bản vẽ, lựa chọn vật liệu và chế tạo sản phẩm "${stemTopic}"`,
        `Toán học (M): Đo đạc, tính toán kích thước, định lượng và tối ưu hóa giải pháp`
      ],
      stemMaterials: res1.equipment?.stemMaterials || ['Dụng cụ thực hành, vật liệu chế tạo mô hình/sản phẩm STEM'],
      stemProcess: [
        'Bước 1: Xác định vấn đề thực tiễn và tiêu chí sản phẩm',
        'Bước 2: Nghiên cứu kiến thức nền và đề xuất giải pháp thiết kế',
        'Bước 3: Lựa chọn giải pháp, chế tạo mẫu thử nghiệm',
        'Bước 4: Thử nghiệm, đánh giá chất lượng và điều chỉnh',
        'Bước 5: Báo cáo, thuyết trình và nghiệm thu sản phẩm STEM'
      ],
      expectedProduct: `Sản phẩm / mô hình giải pháp hoàn chỉnh cho chủ đề "${stemTopic}"`,
      evaluationCriteria: `Đạt các tiêu chí kỹ thuật, tính sáng tạo, độ bền, thẩm mỹ và khả năng ứng dụng thực tiễn của sản phẩm "${stemTopic}"`
    }) : undefined,
    activities: allActivities,
    competencyMatrix: {
      nlsItems: config.enableNLS ? (res4.competencyMatrix?.nlsItems || []) : [],
      aiItems: config.enableAI ? (res4.competencyMatrix?.aiItems || []) : [],
    },
    appendix: {
      worksheetContent: cleanWorksheetContent(res4.appendix?.worksheetContent || 'Phiếu học tập và bài tập thực hành'),
      assignmentPrompt: isPreschool ? '' : (res4.appendix?.assignmentPrompt || 'Ôn tập kiến thức đã học và chuẩn bị bài tiếp theo'),
    },
    imageSlotsUsed: config.imageSlots || [],
    generatedAt: new Date().toISOString(),
  };

  const finalPlan = enforcePPCTCompetencies(mergedPlan, config, effectiveNLSIndicators, effectiveAIIndicators);
  return finalPlan;
}

/**
 * Main API: Generate / Upgrade Kế hoạch bài dạy (KHBD)
 * Strictly conforms to GDPT 2018, Công văn 5512/BGDĐT, bộ sách Kết nối tri thức với cuộc sống, Khung NLS & Khung Năng lực AI.
 */
const handleGenerateKHBD = async (req: express.Request, res: express.Response) => {
  try {
    const auth = resolveGeminiAuth(req);
    if (!auth.allowed) {
      return res.status(403).json({
        success: false,
        error: auth.error,
        requiresCustomApiKey: true,
      });
    }

    const config = req.body;

    const isHDTN = (config.subject || '').toLowerCase().includes('hoạt động trải nghiệm') ||
                   (config.subject || '').toLowerCase().includes('hđtn') ||
                   (config.lessonTitle || '').toLowerCase().includes('sinh hoạt dưới cờ') ||
                   (config.lessonTitle || '').toLowerCase().includes('sinh hoạt lớp');
                   
    const isTinHoc = (config.subject || '').toLowerCase().includes('tin') ||
                     (config.subject || '').toLowerCase().includes('công nghệ thông tin') ||
                     (config.lessonTitle || '').toLowerCase().includes('tin học');

    const isPreschool = config.schoolLevel === 'Mầm non';

    if (isHDTN) {
      config.enableAI = false;
      config.enableNLS = false;
      config.enableSTEM = false;
    }

    // Lookup PPCT indicators if not provided
    let matchingPPCTConfig: any = null;
    const matchingPPCTGroup = SEED_SAMPLE_PPCT.find(
      (p) => p.subject?.toLowerCase().trim() === config.subject?.toLowerCase().trim() &&
             p.grade?.toLowerCase().trim() === config.grade?.toLowerCase().trim()
    );
    if (matchingPPCTGroup && matchingPPCTGroup.lessonConfigs) {
      matchingPPCTConfig = findBestLessonMatchServer(matchingPPCTGroup.lessonConfigs, config.lessonTitle || '');
    }

    let effectiveNLSIndicators: string[] = [];
    if (config.nlsMode === 'custom') {
      effectiveNLSIndicators = parseCustomIndicators(config.customNLS);
    } else if (config.nlsMode === 'ai_generated') {
      effectiveNLSIndicators = [];
    } else {
      effectiveNLSIndicators = (config.integratedNLSFromPPCT && config.integratedNLSFromPPCT.length > 0)
        ? config.integratedNLSFromPPCT
        : (matchingPPCTConfig?.integratedNLS || []);
    }

    let effectiveAIIndicators: string[] = [];
    if (config.aiMode === 'custom') {
      effectiveAIIndicators = parseCustomIndicators(config.customAI);
    } else if (config.aiMode === 'ai_generated') {
      effectiveAIIndicators = [];
    } else {
      effectiveAIIndicators = (config.integratedAIFromPPCT && config.integratedAIFromPPCT.length > 0)
        ? config.integratedAIFromPPCT
        : (matchingPPCTConfig?.integratedAI || []);
    }

    // Use Sectional parallel generation if explicit or as primary high-speed resilient pipeline
    if (config.useSectionalGeneration || req.query.sectional === 'true') {
      const sectionalResult = await generateKHBDSectional(config, undefined, auth.keys, config.aiModel || 'gemini-flash-latest');
      return res.json({ success: true, data: sectionalResult, lessonPlan: sectionalResult });
    }

    const isNew8Activity = isPreschoolNew8Activity(config.subject, config.lessonTitle);

    const preschoolAgeProfile = isPreschool ? analyzePreschoolAgeProfile(config.grade || 'Mẫu giáo lớn (5-6 tuổi)') : null;
    const isMixedAgeClass = preschoolAgeProfile?.category === 'MIXED_AGE';

    const customCodesFromUser = (config.preschoolCustomCodes || '').trim();
    const preschoolObjectivesInstruction = isNew8Activity
      ? `- ĐỐI VỚI NỘI DUNG MỚI TÍCH HỢP (ÁP DỤNG CHUẨN YÊU CẦU THEO QUYẾT ĐỊNH 388/QĐ-BGDĐT):
  + CÁC MÃ TIÊU CHÍ CHỈ BÁO THEO QUYẾT ĐỊNH 388 ĐƯỢC CHỈ ĐỊNH CHO BÀI DẠY NÀY (DO NGƯỜI DÙNG THIẾT LẬP HOẶC MẶC ĐỊNH):
    ${customCodesFromUser ? `"${customCodesFromUser}"` : 'Các mã chuẩn theo QĐ 388 (ví dụ: NT 3.1, TX 4.4, TC 1.2, NN 2.2...)'}
  + BẮT BUỘC ĐƯA CÁC TIÊU CHÍ YÊU CẦU CẦN ĐẠT CỦA BÀI VÀO CÁC GẠCH ĐẦU DÒNG CỦA MỤC TIÊU theo đúng các mã chỉ báo trên.
  + 1. Kiến thức: Gắn mã tiêu chí yêu cầu cần đạt (ví dụ: "- Trẻ biết/nhận biết... (Mã: NT 1.1)")
  + 2. Kỹ năng: Gắn mã tiêu chí yêu cầu cần đạt (ví dụ: "- Trẻ thực hiện được kỹ năng... (Mã: TC 1.1)")`
      : `- ĐỐI VỚI GIÁO ÁN MẦM NON CŨ/TRUYỀN THỐNG (Văn học thơ/truyện, Làm quen chữ cái, Khám phá khoa học, Xã hội, Toán, Tạo hình, Âm nhạc, Thể chất, Tình cảm - KNXH...):
  + BẮT BUỘC LẤY LẠI ĐÚNG MẪU GIÁO ÁN BAN ĐẦU TRƯỚC KHI CẬP NHẬT 8 LĨNH VỰC MỚI, GIỮ NGUYÊN ĐỊNH DẠNG BAN ĐẦU.
  + TUYỆT ĐỐI KHÔNG ĐIỀN MÃ TIÊU CHÍ NÀO: KHÔNG ghi "(Mã: NN 5.1)", KHÔNG ghi "(Mã: NT 1.1)", KHÔNG ghi bất kỳ mã chỉ báo nào trong phần Kiến thức và Kỹ năng.
  + 1. Kiến thức: Các gạch đầu dòng mô tả những gì trẻ biết, hiểu (TUYỆT ĐỐI KHÔNG GẮN MÃ).
${isMixedAgeClass ? `    * ĐỐI VỚI LỚP GHÉP / ĐA ĐỘ TUỔI (${config.grade}): BẮT BUỘC PHÂN HÓA RÕ RÀNG KIẾN THỨC THEO TỪNG ĐỘ TUỔI (Ví dụ nếu lớp ghép 3-4-5 tuổi:
      - 5 tuổi: Trẻ nhận biết nhóm có số lượng X, đếm đến X, nhận biết chữ số X biểu thị cho các nhóm có số lượng X. Trẻ đếm từ 1 đến X, đọc được số X và các số nhỏ hơn X. So sánh 2 nhóm đối tượng, biết thêm bớt để có số lượng bằng nhau.
      - 4 tuổi: Trẻ biết đếm đến X, nhận biết các nhóm có X đối tượng. Trẻ biết tạo nhóm, xếp tương ứng 1- 1, biết so sánh 2 nhóm đồ vật, biết đếm đúng số lượng và sử dụng đúng chữ số tương ứng theo cô và các bạn.
      - 3 tuổi: Trẻ đếm số lượng trong phạm vi X theo cô, đếm cùng các bạn.)` : '    Ví dụ: "- Trẻ biết tên bài thơ/bài hát...", "- Trẻ hiểu nội dung bài...".'}
  + 2. Kỹ năng: Các gạch đầu dòng rèn luyện kỹ năng (TUYỆT ĐỐI KHÔNG GẮN MÃ).
${isMixedAgeClass ? `    * ĐỐI VỚI LỚP GHÉP / ĐA ĐỘ TUỔI (${config.grade}): BẮT BUỘC PHÂN HÓA RÕ RÀNG KỸ NĂNG THEO TỪNG ĐỘ TUỔI (Ví dụ nếu lớp ghép 3-4-5 tuổi:
      - 5 tuổi: Rèn kỹ năng đếm thành thạo, so sánh số lượng giữa 2 nhóm, thêm bớt tạo sự bằng nhau trong phạm vi X, chọn và gắn thẻ số X chính xác, nhanh nhẹn.
      - 4 tuổi: Rèn kỹ năng xếp tương ứng 1-1 thẳng hàng từ trái sang phải, đếm theo thứ tự không bỏ sót đối tượng, tìm đúng thẻ số X theo cô và bạn.
      - 3 tuổi: Rèn kỹ năng chú ý quan sát, chỉ tay và đếm theo cô, phát âm rõ từ chỉ số lượng.)` : '    Ví dụ: "- Rèn kỹ năng phát âm...", "- Phát triển kỹ năng vận động...".'}`;
    const ageSpecificInstruction = preschoolAgeProfile ? `
=============================================================================
ĐẶC BIỆT CHÚ Ý - PHÂN TÍCH VÀ CĂN CHỈNH TOÀN BỘ GIÁO ÁN THEO ĐỘ TUỔI: "${preschoolAgeProfile.rawGrade}" (${preschoolAgeProfile.standardName})
=============================================================================
- ĐỘ TUỔI THỰC TẾ CỦA LỚP: "${preschoolAgeProfile.rawGrade}".
- THỜI LƯỢNG HOẠT ĐỘNG CHUẨN ĐÚNG ĐỘ TUỔI: ${preschoolAgeProfile.recommendedDuration}.
- ĐẶC ĐIỂM TÂM SINH LÝ & MỨC ĐỘ TẬP TRUNG: ${preschoolAgeProfile.developmentalTraits.join('; ')}.
- TRỌNG TÂM NHẬN THỨC & PHÁT TRIỂN: ${preschoolAgeProfile.cognitiveFocus}.
- ĐẶC ĐIỂM NGÔN NGỮ, LỜI NÓI CÔ VÀ TRẺ: ${preschoolAgeProfile.languageAndSpeech}.
- VẬN ĐỘNG & THAO TÁC HỌC LIỆU: ${preschoolAgeProfile.motorSkills}.
- PHƯƠNG PHÁP SƯ PHẠM ĐỀ XUẤT: ${preschoolAgeProfile.pedagogicalStrategy}.
- HƯỚNG DẪN BIÊN SOẠN RIÊNG BIỆT CHO ĐỘ TUỔI NÀY:
${preschoolAgeProfile.promptGuidance}
- BẮT BUỘC TUÂN THỦ: Mọi câu hỏi của cô, thao tác của trẻ, mức độ kiến thức, kỹ năng và sản phẩm dự kiến trong giáo án BẮT BUỘC PHẢI VỪA SỨC, ĐÚNG VỚI ĐẶC ĐIỂM TÂM LÝ LỨA TUỔI "${preschoolAgeProfile.rawGrade}". Cột "Hoạt động của trẻ" phải phản ánh đúng từ ngữ, phản xạ và hành động chân thực của trẻ ở lứa tuổi này.
=============================================================================
` : '';

    const preschoolPrompt = `\nĐẶC BIỆT QUAN TRỌNG ĐỐI VỚI CẤP MẦM NON:
${PRESCHOOL_CURRICULUM_MATRIX}
${PRESCHOOL_LESSON_PLAN_DOMAINS_GUIDE}
${ageSpecificInstruction}

- BẮT BUỘC soạn theo Kế hoạch tổ chức hoạt động giáo dục Mầm non, TUYỆT ĐỐI KHÔNG dùng Công văn 5512.
${preschoolObjectivesInstruction}
- Ngôn ngữ, hoạt động phải phù hợp với tâm lý lứa tuổi mầm non (cô và trẻ).
- Tích hợp phát triển 4 phẩm chất cốt lõi: Yêu thương, Tôn trọng, Trung thực, Trách nhiệm.
- Tích hợp phát triển 5 năng lực nền tảng: Giao tiếp, Hợp tác, Giải quyết vấn đề, Tự lực, Thích ứng.
- BẮT BUỘC NHẬN DIỆN CHÍNH XÁC HOẠT ĐỘNG / LĨNH VỰC BÀI DẠY (Âm nhạc, Khoa học, Xã hội, Thơ, Truyện, Toán, Chữ cái, Thể chất, Tạo hình, Hoạt động vui chơi trong lớp, Hoạt động ngoài trời, Trò chơi vận động, Hoạt động giáo dục kỹ năng, Trò chơi dân gian, Hoạt động tăng cường tiếng Việt, Hoạt động tập tô chữ cái, Hoạt động trò chơi chữ cái) VÀ ÁP DỤNG ĐÚNG CẤU TRÚC MẪU CHUẨN TIẾN TRÌNH CỦA HOẠT ĐỘNG ĐÓ TRONG PRESCHOOL_LESSON_PLAN_DOMAINS_GUIDE.
- NGHIÊM CẤM THAY ĐỔI CẤU TRÚC PHẦN PHẨM CHẤT VÀ NĂNG LỰC CỦA MỤC I. MỤC ĐÍCH - YÊU CẦU:
  3. Phẩm chất:
  - Yêu thương: ...
  - Tôn trọng: ...
  4. Năng lực:
  - Tự lực: ...
  - Thích ứng: ...
- CẤU TRÚC GIÁO ÁN PHẢI TUÂN THỦ NGHIÊM NGẶT FORM SAU:
I. Mục đích - yêu cầu
${isNew8Activity ? `1. Kiến thức: Gắn mã tiêu chí yêu cầu cần đạt theo QĐ 388 (ví dụ: "- Trẻ biết/nhận biết... (Mã: NT 1.1)")
2. Kỹ năng: Gắn mã tiêu chí yêu cầu cần đạt theo QĐ 388 (ví dụ: "- Trẻ thực hiện được kỹ năng... (Mã: TC 1.1)")` : `1. Kiến thức: (TUYỆT ĐỐI KHÔNG GẮN MÃ CHỈ BÁO, giữ nguyên định dạng mẫu giáo án ban đầu)
2. Kỹ năng: (TUYỆT ĐỐI KHÔNG GẮN MÃ CHỈ BÁO, giữ nguyên định dạng mẫu giáo án ban đầu)`}
3. Phẩm chất (Gắn với Yêu thương, Tôn trọng...):
4. Năng lực (Gắn với Tự lực, Thích ứng...):
5. Tích hợp Năng lực số (NLS): (Đưa vào trường digitalCompetencies nếu người dùng chọn tích hợp NLS, nếu không chọn để [])
6. Tích hợp Trí tuệ nhân tạo (AI): (Đưa vào trường aiCompetencies nếu người dùng chọn tích hợp AI, nếu không chọn để [])
II. Chuẩn bị: (BẮT BUỘC ĐÚNG 100% CẤU TRÚC 3 MỤC SAU)
1. Chuẩn bị của cô:
- Môi trường: [Mô tả chi tiết môi trường lớp học, không gian bài trí theo chủ đề, an toàn, sạch sẽ, thoáng mát]
- Đồ dùng của cô: [Mô tả cụ thể giáo án điện tử, máy tính/tivi, bài giảng tương tác, đồ dùng trực quan, học cụ, tranh ảnh, nhạc nền]
2. Chuẩn bị của trẻ:
- Trang phục: [Trang phục gọn gàng, phù hợp thời tiết, thoải mái, thuận tiện cho vận động và trải nghiệm]
- Đồ dùng của trẻ: [Mỗi trẻ hoặc nhóm trẻ có đủ rổ đồ dùng, học cụ trải nghiệm phù hợp với bài học]
- Tâm sinh lý của trẻ: [Tâm thế vui tươi, hào hứng, tự tin, sẵn sàng tham gia hoạt động cùng cô và các bạn]
3. Phối hợp với phụ huynh:
- [Nội dung cụ thể phối hợp phụ huynh: hỗ trợ nguyên vật liệu mở/tái chế an toàn, trao đổi thông tin, củng cố rèn luyện cho trẻ tại nhà]
III. Tiến trình hoạt động
Bảng chia 2 cột: "Hoạt động của giáo viên" và "Hoạt động của trẻ" (Tiến trình 5 bước theo đúng chuẩn của Hoạt động / Lĩnh vực bài dạy).
- KHỔNG ĐƯỢC BỎ BẤT KỲ NỘI DUNG NÀO TỪ FILE GIÁO ÁN CŨ TẢI LÊN (oldPlanContent). Tái cấu trúc chuẩn hóa nội dung giáo án cũ khớp đúng 5 bước của Lĩnh vực bài dạy.
- YÊU CẦU ĐẶC BIỆT CHO PHẦN "2. Khám phá - Trải nghiệm": BẮT BUỘC thiết kế theo hướng trải nghiệm. Giáo viên cho trẻ trải nghiệm/thực hiện thử nhiệm vụ trước -> Đặt câu hỏi gợi mở để trẻ tự suy nghĩ và nêu lên cách thực hiện -> SAU ĐÓ giáo viên mới thực hiện làm mẫu và chuẩn hóa lại kỹ năng. Tuyệt đối KHÔNG làm mẫu hoặc giải thích cách làm trước khi trẻ được trải nghiệm.
- TRÌNH BÀY RÕ RÀNG VÀ CHI TIẾT: Các hoạt động 1, 2, 3, 4, 5 (Tiến trình hoạt động) PHẢI SOẠN RẤT CHI TIẾT, ĐẦY ĐỦ VÀ SÂU SẮC. Bắt buộc mô tả cụ thể từng lời nói, câu lệnh, câu hỏi gợi mở của giáo viên và hành động, lời đáp, thái độ dự kiến của trẻ. Không viết chung chung sơ sài.
- RIÊNG ĐỐI VỚI MÔN ÂM NHẠC (LĨNH VỰC NGHỆ THUẬT): Soạn RẤT CHI TIẾT VÀ KỸ LƯỠNG. Dùng VĂN PHONG SƯ PHẠM MẦM NON NGỌT NGÀO, DỊU DÀNG, TRÌU MẾN, GIÀU TÍNH NGHỆ THUẬT VÀ CẢM XÚC. Sử dụng nhiều ngữ điệu tình cảm mầm non ("các con ơi", "nhé", "nhỉ", "nào", "à", "ơi", "nào chúng mình...", "thật là hay đúng không nào!"). QUY ĐỊNH BẮT BUỘC: Ở Mục "3. Chia sẻ – Thảo luận" BẮT BUỘC PHẢI CÓ 2 PHẦN CHI TIẾT Ở CỘT HOẠT ĐỘNG CỦA CÔ theo đúng trọng tâm: Nếu là Dạy hát thì có "a. Dạy hát (TT)" và "b. Nghe hát". Nếu là Nghe hát thì có "a. Nghe hát (TT)" và "b. Hát vận động (hoặc Trò chơi)". Nếu là Hát vận động thì có "a. Hát vận động (TT)" và "b. Nghe hát". Trong cột Hoạt động của trẻ tuyệt đối KHÔNG chứa nhãn "a." hay "b." đứng riêng lẻ, chỉ ghi các gạch đầu dòng. Mô tả chi tiết từng câu thoại truyền cảm của cô, cử chỉ điệu bộ và sự hào hứng của trẻ. KHÔNG ĐƯỢC soạn ngắn gọn khô cứng như môn Thể dục.
- Mỗi mục, mỗi ý BẮT BUỘC phải xuống dòng. Sử dụng gạch đầu dòng (-) rõ ràng ở mỗi ý con.`;

    const systemInstruction = `Bạn là Chuyên gia Cao cấp về Giáo dục số, Phương pháp Dạy học và Đổi mới Sư phạm theo Chương trình GDPT 2018, Công văn số 5512/BGDĐT, Thông tư số 02/2025/TT-BGDĐT, Công văn số 3456/BGDĐT-GDPT và QUYẾT ĐỊNH SỐ 2422/QĐ-BGDĐT (Khung nội dung giáo dục trí tuệ nhân tạo cho học sinh phổ thông) của Bộ Giáo dục và Đào tạo Việt Nam.
ĐẶC BIỆT: Bạn biên soạn bám sát 100% theo Bộ sách giáo khoa "Kết nối tri thức với cuộc sống" (Nhà xuất bản Giáo dục Việt Nam), sử dụng đúng thuật ngữ khoa học, chuỗi bài học, hoạt động khám phá và phong cách sư phạm của bộ sách Kết nối tri thức. Tuyệt đối không pha trộn hoặc sử dụng nội dung của các bộ sách khác.
${isPreschool ? preschoolPrompt : ''}
${isHDTN ? `\nĐẶC BIỆT ĐỐI VỚI MÔN HOẠT ĐỘNG TRẢI NGHIỆM, HƯỚNG NGHIỆP (HĐTN - HN):
- BẮT BUỘC soạn thuần tuý theo chuẩn mẫu Công văn 5512/BGDĐT.
- Năng lực chung: Năng lực tự chủ và tự học; Năng lực giao tiếp và hợp tác; Năng lực giải quyết vấn đề và sáng tạo.
- Năng lực đặc thù môn HĐTN-HN: Năng lực thích ứng với cuộc sống; Năng lực thiết kế và tổ chức hoạt động; Năng lực định hướng nghề nghiệp.
- Phẩm chất: Yêu nước, nhân ái, chăm chỉ, trung thực, trách nhiệm.
- TIẾN TRÌNH DẠY HỌC / HOẠT ĐỘNG: Tuân thủ 4 hoạt động theo chuẩn 4 bước của CV 5512 (Bước 1: Chuyển giao nhiệm vụ; Bước 2: Thực hiện nhiệm vụ; Bước 3: Báo cáo, thảo luận; Bước 4: Kết luận, nhận định).
- TUYỆT ĐỐI KHÔNG tích hợp AI, không tích hợp Năng lực số, không tạo ma trận AI hay các phụ lục mở rộng không thuộc chuẩn Công văn 5512.` : ''}

QUY TẮC CỐT LÕI BẮT BUỘC THEO THỂ THỨC VĂN BẢN VÀ YÊU CẦU CỦA GIÁO VIÊN:
1. TUYỆT ĐỐI KHÔNG TÓM TẮT: Viết đầy đủ, tỉ mỉ từng câu hỏi, lệnh của giáo viên; hành động, thao tác, câu trả lời dự kiến của học sinh.
${!isPreschool ? `2. CHUẨN SƯ PHẠM 4 BƯỚC CHO MỌI HOẠT ĐỘNG (CV 5512):
   - Bước 1: Chuyển giao nhiệm vụ học tập (GV nêu rõ lệnh, câu hỏi; HS tiếp nhận, lắng nghe, chuẩn bị)
   - Bước 2: Thực hiện nhiệm vụ học tập (HS làm việc cá nhân/nhóm; GV theo dõi, hỗ trợ)
   - Bước 3: Báo cáo kết quả và thảo luận (HS/đại diện nhóm thuyết trình, phản biện; HS khác nhận xét)
   - Bước 4: Kết luận, nhận định (GV chính xác hóa kiến thức, đánh giá quá trình và sản phẩm, chốt nội dung cốt lõi)` : `2. TIẾN TRÌNH HOẠT ĐỘNG MẦM NON:
   - Không chia 4 bước.
   - Sử dụng bảng 2 cột: Hoạt động của giáo viên và Hoạt động của trẻ.`}
3. THỂ THỨC VĂN BẢN & ĐỊNH DẠNG:
   - KHÔNG ghi thời lượng vào các hoạt động cụ thể (tuyệt đối không ghi các dòng như "Thời lượng: 7 - 10 phút" hay tương tự vào tên hoặc nội dung hoạt động).
   - Mục I. MỤC TIÊU -> 2. Về năng lực:
     + a) Năng lực chung (generalCompetencies): Bắt buộc đủ 3 năng lực chuẩn (Năng lực tự chủ và tự học, Năng lực giao tiếp và hợp tác, Năng lực giải quyết vấn đề và sáng tạo).
     + b) Năng lực đặc thù môn học (subjectCompetencies):
${isTinHoc ? `       * ĐỐI VỚI MÔN TIN HỌC (GDPT 2018): Tùy theo từng bài học cụ thể, CHỈ LỰA CHỌN TỪ 1 ĐẾN 3 THÀNH PHẦN NĂNG LỰC TIN HỌC phù hợp nhất với nội dung và hoạt động của bài đó (TUYỆT ĐỐI KHÔNG đưa tất cả 5 thành phần vào mọi bài), biên soạn theo đúng cú pháp bắt đầu bằng tên năng lực và mã viết hoa ở đầu (TUYỆT ĐỐI KHÔNG để mã ở giữa hay cuối câu):
         - "Năng lực A (NLa): Phát triển năng lực sử dụng và quản lý các phương tiện công nghệ thông tin và truyền thông. [Mô tả cụ thể biểu hiện ở bài học]" (Khi bài liên quan đến thiết bị, máy tính, phần mềm, phần cứng...)
         - "Năng lực B (NLb): Phát triển năng lực ứng xử phù hợp trong môi trường số. [Mô tả biểu hiện nếu có]" (Khi bài học về văn hóa mạng, an toàn thông tin, đạo đức, bản quyền...)
         - "Năng lực C (NLc): Phát triển năng lực nhận biết và hình thành nhu cầu tìm kiếm thông tin từ nguồn dữ liệu số khi giải quyết công việc. [Mô tả cụ thể biểu hiện ở bài học]" (hoặc "Năng lực C (NLc): Năng lực giải quyết vấn đề với sự trợ giúp của công nghệ thông tin và truyền thông. [Mô tả biểu hiện]") (Khi bài về thông tin, dữ liệu, tìm kiếm, thuật toán, lập trình...)
         - "Năng lực D (NLd): Năng lực ứng dụng công nghệ thông tin và truyền thông trong học và tự học. [Mô tả cụ thể biểu hiện ở bài học]" (Khi học sinh sử dụng phần mềm, công cụ tin học để học tập, tự tra cứu...)
         - "Năng lực E (NLe): Năng lực hợp tác trong môi trường số. [Mô tả cụ thể biểu hiện ở bài học]" (Khi có làm việc nhóm, chia sẻ dữ liệu hoặc cộng tác trực tuyến...)` : `       * Biên soạn các thành phần năng lực đặc thù phù hợp theo Chương trình GDPT 2018 của môn học.`}
     + c) Các Năng lực số (NLS) được phát triển (digitalCompetencies): Chỉ xuất khi giáo viên chọn tích hợp NLS (nếu không chọn thì mảng rỗng []). ${!isPreschool ? 'BẮT BUỘC ghi mã chỉ báo chuẩn theo Công văn 3456 & Thông tư 02/2025/TT-BGDĐT kèm mô tả (ví dụ: "1.1.NC1b: Áp dụng được kỹ thuật tìm kiếm để thu thập dữ liệu...", "3.1.NC1a: Áp dụng được cách tạo và chỉnh sửa nội dung trên GeoGebra...", "5.2.NC1b: Áp dụng công cụ số giải quyết bài toán tối ưu...").' : 'Đối với Mầm non, KHÔNG ĐƯỢC GHI MÃ CHỈ BÁO, chỉ mô tả nội dung.'}
     + d) Năng lực trí tuệ nhân tạo (AI) (aiCompetencies): Chỉ xuất khi giáo viên chọn tích hợp AI (nếu không chọn thì mảng rỗng []). ${!isPreschool ? 'BẮT BUỘC ghi mã chỉ báo chuẩn theo QUYẾT ĐỊNH 2422/QĐ-BGDĐT theo định dạng [Lớp].[Mã chủ đề].[Số thứ tự] (ví dụ lớp 10: "10.C3.1: Mô tả được các yêu cầu để đưa ra prompt phù hợp với mục tiêu cụ thể", "10.C3.2: Thực hành đặt prompt giải quyết vấn đề hiệu quả", "10.A1.2: Nhận thức vai trò con người cần kiểm soát AI", "10.B2.1: Tuân thủ quy định và đạo đức khi sử dụng AI...").' : 'Đối với Mầm non, KHÔNG ĐƯỢC GHI MÃ CHỈ BÁO, chỉ mô tả nội dung.'}
   - Mọi danh sách, ý liệt kê, gạch đầu dòng BẮT BUỘC dùng dấu trừ (-) ở đầu dòng (ví dụ: "- Giáo viên giao nhiệm vụ..."), KHÔNG dùng dấu chấm (.), hoa thị (*) hay bullet dots.
   - Đối với môn Toán, Hóa học, Vật lý: BẮT BUỘC giữ nguyên và trình bày công thức ở dạng LaTeX chuẩn (ví dụ: $y = ax^2 + bx + c (a \\neq 0)$, $I(-\\frac{b}{2a}; -\\frac{\\Delta}{4a})$, $x = -\\frac{b}{2a}$, $Fe_2O_3$, $H_2SO_4$...).
${!isPreschool ? `
4. QUY TẮC MÃ HÓA NĂNG LỰC SỐ (NLS) THEO THÔNG TƯ 02/2025/TT-BGDĐT VÀ CÔNG VĂN 3456/BGDĐT-GDPT:
   - 6 Miền Năng lực số: Miền 1 (Khai thác dữ liệu), Miền 2 (Giao tiếp & hợp tác), Miền 3 (Sáng tạo nội dung số), Miền 4 (An toàn), Miền 5 (Giải quyết vấn đề), Miền 6 (Ứng dụng AI).
   - Ký hiệu cấp độ: Lớp 1-3: CB1; Lớp 4-5: CB2; Lớp 6-7: TC1; Lớp 8-9: TC2; Lớp 10-12: NC1 (ví dụ: 1.1.NC1b, 3.1.NC1a, 5.2.NC1b...).
5. QUY TẮC MÃ HÓA GIÁO DỤC TRÍ TUỆ NHÂN TẠO (AI) THEO QUYẾT ĐỊNH 2422/QĐ-BGDĐT:
   - 4 Mạch nội dung / 4 Thành phần năng lực đặc thù:
     + Mạch A (NLa) - Tư duy lấy con người làm trung tâm: Chủ đề A1 (Tính chủ động), A2 (AI vì sự tiến bộ), A3 (Công dân kỉ nguyên AI).
     + Mạch B (NLb) - Đạo đức AI: Chủ đề B1 (Khía cạnh đạo đức), B2 (Sử dụng AI an toàn & có trách nhiệm), B3 (Nguyên tắc đạo đức & trách nhiệm giải trình).
     + Mạch C (NLc) - Các kĩ thuật và ứng dụng AI: Chủ đề C1 (Đặc điểm chính), C2 (Ứng dụng trong học tập & đời sống), C3 (Công nghệ AI, Prompting, GenAI, LLM), C4 (Dữ liệu trong AI), C5 (Kĩ thuật & thuật toán AI).
     + Mạch D (NLd) - Thiết kế hệ thống AI: Chủ đề D1 (Nhận diện & hình thành giải pháp), D2 (Cấu trúc, tương tác, cải tiến & tác nhân AI agent).
   - Quy ước mã hoá Yêu cầu cần đạt: [Lớp].[Mã chủ đề].[Số thứ tự] (Ví dụ: lớp 1-5: 1.A1.1, 2.A1.1, 3.C5.1, 4.B2.1, 5.C5.2; lớp 6-9: 6.A1.1, 7.A1.1, 8.A1.2, 8.C1.1, 9.A3.1; lớp 10-12: 10.C3.1, 10.C3.2, 10.A1.1, 10.B2.1, 11.C3.1, 12.A1.1, 12.C3.1...).
` : ''}5. QUY TẮC CỘT SẢN PHẨM (SẢN PHẨM HỌC TẬP & NỘI DUNG KIẾN THỨC GHI CHÉP CỦA HỌC SINH):
   - Cột bên phải (SẢN PHẨM) thể hiện KẾT QUẢ THỰC HIỆN NHIỆM VỤ, LỜI GIẢI CHI TIẾT BÀI TOÁN/CÂU HỎI, SẢN PHẨM HỌC TẬP CỤ THỂ VÀ KIẾN THỨC TRỌNG TÂM CẦN GHI CHÉP VÀO VỞ (Nội dung ghi bảng).
   - TUYỆT ĐỐI KHÔNG chia cột sản phẩm thành các tiêu đề "* Bước 1:", "* Bước 2:", "* Bước 3:", "* Bước 4:".
   - Viết chi tiết, chuẩn xác toàn bộ công thức toán học (dạng LaTeX), định nghĩa, tính chất, lời giải chi tiết của bài toán hoặc câu trả lời đầy đủ của học sinh, không viết chung chung như "Học sinh hoàn thành bài tập" hay "Báo cáo kết quả".
6. QUY TẮC PHÂN BỔ TIẾT DẠY KHI THỜI LƯỢNG >= 2 TIẾT (BẮT BUỘC):
   - Khi bài học có thời lượng từ 2 tiết trở lên, bạn BẮT BUỘC ghi cụ thể phân bổ tiết dạy trong dấu ngoặc đơn ở tên hoạt động hoặc các mục nội dung (ví dụ: Hoạt động 1: Khởi động (Tiết 1), Hoạt động 2: Hình thành kiến thức mới (Mục 1, 2 - Tiết 1; Mục 3 - Tiết 2)...).
7. BẢO TỒN THẺ GIỮ CHỖ HÌNH ẢNH {{IMAGE_SLOT_X}}:
   - Nếu trong dữ liệu đầu vào có các thẻ như {{IMAGE_SLOT_1}}, {{IMAGE_SLOT_2}}... hoặc người dùng tải file Word có ảnh, bạn BẮT BUỘC phải đặt các thẻ {{IMAGE_SLOT_X}} này vào đúng ngữ cảnh của Hoạt động tương ứng.
${!isPreschool ? `
8. BẢNG PHÂN TÍCH PHÁT TRIỂN NĂNG LỰC SỐ (NLS) & GIÁO DỤC AI CHO HỌC SINH (MỤC CUỐI CÙNG):
   - Xuất bảng chuẩn 4 cột: TT, Tên hoạt động (activityName), Tổ chức dạy học (teachingOrganization), Năng lực số / Năng lực AI (gồm mã chỉ báo chuẩn indicatorCode và mô tả biểu hiện competencyDescription).
` : ''}9. QUY TẮC BẮT BUỘC CHO PHIẾU HỌC TẬP (appendix.worksheetContent):
   - worksheetContent: Phiếu học tập / Phiếu hướng dẫn thực hành chi tiết. BẮT BUỘC có tiêu đề viết hoa căn giữa ("PHIẾU HỌC TẬP SỐ 1: [TÊN BÀI]", dòng "Họ và tên: ............ Lớp: ........ Nhóm: ........"), và NỘI DUNG PHẢI ĐƯỢC THIẾT KẾ KẺ Ô, KẺ BẢNG MARKDOWN TABLE RÕ RÀNG (| STT/Bước | Nhiệm vụ/Câu hỏi | Kết quả thực hiện/Trả lời của HS |).
${!isPreschool ? `10. QUY TẮC BẮT BUỘC CHO MỤC "3. HƯỚNG DẪN TỰ HỌC & NHIỆM VỤ VỀ NHÀ" (appendix.assignmentPrompt):
   - BẮT BUỘC phải có đầy đủ 2 nội dung sư phạm chuẩn mực:
     + a) Đối với bài học vừa học: Củng cố kiến thức trọng tâm, ghi rõ các bài tập cụ thể cần làm trong SGK/SBT (ghi số bài tập), nhiệm vụ thực hành/sản phẩm số.
     + b) Đối với bài học tiếp theo (BẮT BUỘC): Nhắc học sinh xem, đọc trước SGK và soạn bài học mới. BẮT BUỘC PHẢI GHI RÕ TÊN BÀI HỌC TIẾP THEO hoặc nội dung cụ thể của tiết học sau theo phân phối chương trình SGK Kết nối tri thức (Ví dụ: "Đọc trước và chuẩn bị Bài [Số]: [Tên bài học tiếp theo]", gợi ý câu hỏi/nhiệm vụ cần tìm hiểu trước khi đến lớp).` : `10. ĐỐI VỚI CẤP MẦM NON: TUYỆT ĐỐI KHÔNG CÓ MỤC HƯỚNG DẪN TỰ HỌC VÀ NHIỆM VỤ VỀ NHÀ (bắt buộc để appendix.assignmentPrompt = "").`}
11. QUY TẮC TRÌNH BÀY CÂU HỎI TRẮC NGHIỆM VÀ ĐÁP ÁN:
   - Trong cột Sản phẩm, đối với các câu hỏi trắc nghiệm hoặc câu hỏi có lựa chọn, BẮT BUỘC phải đưa ra đáp án cụ thể (Ví dụ: "Câu 1. Đáp án B.", "Câu 2. Đáp án C.") thay vì mô tả chung chung.
12. QUY TẮC BẮT BUỘC ĐỀ MỤC SÁCH GIÁO KHOA VÀ XUỐNG DÒNG RÕ RÀNG (ĐẶC BIỆT CHO KHỐI THCS VÀ MỌI BỘ MÔN):
   - Trong Hoạt động 2 (Hình thành kiến thức mới) và Cột Sản phẩm: Các mục nội dung kiến thức có đánh số trong SGK Kết nối tri thức (ví dụ: "1. Thế giới kĩ thuật số", "2. Ứng dụng thực tế của máy tính trong khoa học kĩ thuật và đời sống", "3. Tác động của công nghệ thông tin lên giáo dục và xã hội"...) BẮT BUỘC phải được thể hiện chính xác theo đúng thứ tự 1, 2, 3..., đúng tên đề mục và kèm đầy đủ nội dung kiến thức cốt lõi (khái niệm, định nghĩa, công thức, bảng biểu, lời giải câu hỏi khám phá SGK) vào cột Sản phẩm để học sinh ghi vở.
   - QUY TẮC XUỐNG DÒNG BẮT BUỘC: Mỗi đề mục 1., 2., 3... PHẢI NẰM RIÊNG TRÊN MỘT DÒNG. Các ý giải thích, định nghĩa, nội dung chi tiết bên dưới BẮT BUỘC XUỐNG DÒNG và gạch đầu dòng (- ). TUYỆT ĐỐI KHÔNG ĐƯỢC VIẾT DÍNH LIỀN TÙ TÌ TRÊN CÙNG MỘT DÒNG (Ví dụ cấm viết: "1. Thông tin và dữ liệu: Dữ liệu là... 2. Vật mang tin: Là...").
   - TUYỆT ĐỐI KHÔNG được bỏ sót số thứ tự đề mục, không viết gộp chung chung.
   - Cột Hoạt động của GV & HS phải phân chia nhiệm vụ khám phá theo đúng từng đề mục 1, 2, 3... tương ứng.
13. QUY TẮC TRÌNH BÀY TỔ CHỨC THỰC HIỆN (4 BƯỚC):
   - Thay đổi tên 4 bước trong mỗi hoạt động (lưu vào trường "title" của step) chuẩn xác như sau:
     + Bước 1: "* GV giao nhiệm vụ học tập 1" (nếu có nhiều nhiệm vụ, hãy ghi "* GV giao nhiệm vụ học tập 1, 2...").
     + Bước 2: "* HS thực hiện nhiệm vụ"
     + Bước 3: "* Báo cáo, thảo luận"
     + Bước 4: "* Kết luận, nhận định"
   - Trong nội dung các hành động (teacherAction, studentAction), tự thêm tiền tố "- GV: " hoặc "- HS: " ở đầu dòng để phân biệt (nếu bước 1 chỉ có GV giao nhiệm vụ thì ghi trực tiếp nội dung nhiệm vụ bắt đầu bằng dấu "-").
14. Định dạng trả về: JSON thuần tuý theo cấu trúc yêu cầu.`;

    const userPrompt = `Hãy soạn/nâng cấp Kế hoạch bài dạy (KHBD) với các thông tin sau:
- Tên bài dạy: ${config.lessonTitle || 'Bài học'}
- Môn học: ${config.subject || 'Toán học'}
- Lớp: ${config.grade || 'Lớp 10'} (${config.schoolLevel || 'THPT'})
- Bộ sách giáo khoa: Kết nối tri thức với cuộc sống (BẮT BUỘC theo chuẩn bộ sách Kết nối tri thức)
- Thời lượng: ${config.periods || 2} tiết
- Trường: ${config.schoolName || ''}
- Giáo viên: ${config.teacherName || ''}

${config.ppctContent ? `THAM KHẢO PHÂN PHỐI CHƯƠNG TRÌNH (PPCT):\n"""\n${config.ppctContent.substring(0, 5000)}\n"""\nHãy tham khảo nội dung PPCT trên để xác định đúng chuẩn yêu cầu, các nội dung trọng tâm cần dạy và số tiết của bài.\n` : ''}
TÙY CHỌN TÍCH HỢP NÂNG CAO:
- Tích hợp Năng lực số (NLS): ${
      config.enableNLS
        ? config.nlsMode === 'custom' && config.customNLS?.trim()
          ? `BẮT BUỘC TÍCH HỢP THEO NỘI DUNG TỰ DÁN CỦA GIÁO VIÊN:\n"""\n${config.customNLS.trim()}\n"""\n(Đưa vào digitalCompetencies, lồng ghép vào hoạt động dạy học và ma trận NLS).`
          : config.nlsMode === 'ai_generated'
            ? 'AI TỰ THIẾT KẾ VÀ ĐỀ XUẤT NĂNG LỰC SỐ SÁNG TẠO: Phân tích bài học để tự tạo digitalCompetencies và ma trận NLS thực tế, phù hợp nhất với học sinh (không phụ thuộc kho có sẵn hay văn bản dán).'
            : `BẮT BUỘC TÍCH HỢP Năng lực số (NLS) theo TT 02/2025/TT-BGDĐT và CV 3456. ${
                effectiveNLSIndicators.length > 0
                  ? `BẮT BUỘC SỬ DỤNG ĐÚNG 100% CÁC MÃ CHỈ BÁO NLS TỪ PPCT SAU ĐÂY: ${effectiveNLSIndicators.join('; ')}. TUYỆT ĐỐI KHÔNG TỰ BỊA MÃ LẠ NHƯ "NLS-NL.1.1", "NLS-NL.2.2"!`
                  : 'AI phải tự động chọn các mã năng lực chuẩn từ Khung NLS (dạng 1.1.TC1a, 1.2.TC1a...). TUYỆT ĐỐI không được bịa ra mã lạ ngoài Khung NLS chuẩn.'
              } Chỉ rõ công cụ số cụ thể và lập Bảng ma trận chỉ số hành vi NLS chi tiết.`
        : 'Không bắt buộc'
    }
- Tích hợp Giáo dục Trí tuệ Nhân tạo (AI): ${
      config.enableAI
        ? config.aiMode === 'custom' && config.customAI?.trim()
          ? `BẮT BUỘC TÍCH HỢP THEO NỘI DUNG TỰ DÁN CỦA GIÁO VIÊN:\n"""\n${config.customAI.trim()}\n"""\n(Đưa vào aiCompetencies, lồng ghép vào hoạt động dạy học và ma trận AI).`
          : config.aiMode === 'ai_generated'
            ? 'AI TỰ THIẾT KẾ VÀ ĐỀ XUẤT NĂNG LỰC AI SÁNG TẠO: Phân tích bài học để tự tạo aiCompetencies và ma trận AI bám sát QĐ 2422.'
            : `BẮT BUỘC TÍCH HỢP — Bám sát QUYẾT ĐỊNH 2422/QĐ-BGDĐT của Bộ GDĐT. ${
                effectiveAIIndicators.length > 0
                  ? `BẮT BUỘC SỬ DỤNG ĐÚNG 100% CÁC MÃ CHỈ BÁO AI TỪ PPCT SAU ĐÂY: ${effectiveAIIndicators.join('; ')}.`
                  : 'Ghi mã chỉ báo dạng [Lớp].[Mã chủ đề].[Số thứ tự] (ví dụ: 6.A1.1, 10.C3.1, 10.C3.2, 10.A1.2, 10.B2.1...).'
              } Lập Bảng ma trận AI chi tiết.`
        : 'Không bắt buộc'
    }

${config.oldPlanContent ? `NỘI DUNG GIÁO ÁN MẪU / TÀI LIỆU GỐC ĐÃ TẢI LÊN (Bao gồm thẻ giữ chỗ ảnh và công thức toán học):
"""
${config.oldPlanContent.substring(0, 80000)}
"""
QUY ĐỊNH BẮT BUỘC ĐỐI VỚI GIÁO ÁN MẪU TẢI LÊN (ÁP DỤNG CHO MỌI MÔN VÀ MỌI CẤP HỌC):
1. ĐỂ NGUYÊN NỘI DUNG GỐC: Trích xuất chính xác, đầy đủ 100% toàn bộ đề tài, bài tập, câu hỏi trắc nghiệm, các câu trả lời/đáp án, lời thoại GV & HS, công thức toán học từ giáo án mẫu. TUYỆT ĐỐI KHÔNG tự ý thay thế bằng bài khác hay tóm tắt làm mất kiến thức cốt lõi. KHÔNG bịa các cụm từ boilerplate thừa thãi như "Sẵn sàng tham gia trò chơi", "Đánh giá kết quả trò chơi", "Nội dung chuẩn xác của 5 câu hỏi trắc nghiệm".
2. CHỈ ĐỂ MẪU MỚI: Đưa toàn bộ nội dung giáo án cũ vào khung mẫu mới chuẩn (CV 5512 với THCS/THPT, CV 2345 với Tiểu học, Chương trình mới với Mầm non). Chỉ chỉnh sửa nhẹ cho phù hợp các đề mục khung mẫu mới, không tác động quá nhiều làm thay đổi cấu trúc bài học của file cũ.
3. ĐẶC BIỆT BẢO TỒN CÁC HÌNH ẢNH VÀ CÔNG THỨC TOÁN HỌC: Giữ nguyên vẹn 100% công thức toán học (LaTeX hoặc ký hiệu chuẩn), không làm biến dạng công thức. Bảo tồn chính xác vị trí các thẻ ảnh {{IMAGE_SLOT_X}} trong từng hoạt động/bước.
4. TRÌNH BÀY ĐÁP ÁN TRẮC NGHIỆM TRONG CỘT SẢN PHẨM: Mỗi đáp án nằm trên 1 dòng riêng biệt:
   Câu 1. Đáp án B.
   Câu 2. Đáp án C.
   Câu 3. Đáp án A.
   Câu 4. Đáp án D.
   Câu 5. Đáp án A.
   CẤM cắt dòng vụn vặt làm sai lệch như "Câu\n1. B; Câu\n2. C...".
   CẤM TUYỆT ĐỐI lặp lại đáp án 2 lần ở 2 dạng. CHỈ TRÌNH BÀY 1 DẠNG DUY NHẤT: "Câu 1. Đáp án B.", "Câu 2. Đáp án C."...
5. CHỈ BỔ SUNG NĂNG LỰC ĐÃ TÍCH CHỌN: Chỉ bổ sung NLS nếu enableNLS=true, AI nếu enableAI=true, STEM nếu enableSTEM=true vào đúng vị trí thích hợp, và đặt bảng ma trận ở cuối giáo án/phụ lục mà không làm biến dạng nội dung cốt lõi của giáo án mẫu ban đầu.` : ''}

${config.imageSlots && config.imageSlots.length > 0 ? `DANH SÁCH THẺ HÌNH ẢNH CẦN BẢO TỒN VỊ TRÍ:\n${config.imageSlots.map((s: any) => `- ${s.slotTag}: ${s.name}`).join('\n')}` : ''}

${config.additionalRequirements ? `YÊU CẦU BỔ SUNG CỦA GIÁO VIÊN:\n${config.additionalRequirements}` : ''}

${isPreschool 
  ? 'YÊU CẦU: Trả về đối tượng JSON hoàn chỉnh theo mẫu Giáo dục Mầm non, chia 2 cột Hoạt động của giáo viên và Hoạt động của trẻ (Sử dụng duy nhất step1 cho mỗi hoạt động, để trống step2, 3, 4).' 
  : 'YÊU CẦU: Trả về đối tượng JSON hoàn chỉnh với 4 hoạt động sư phạm theo Công văn 5512 (Khởi động, Hình thành kiến thức mới, Luyện tập, Vận dụng), mỗi hoạt động đủ 4 bước chi tiết (Bước 1 đến Bước 4), kèm bảng ma trận NLS và AI, bám sát bộ sách Kết nối tri thức với cuộc sống.'}
ĐẶC BIỆT CHÚ Ý: ${isPreschool ? 'ĐỐI VỚI MẦM NON, TUYỆT ĐỐI KHÔNG CÓ MỤC HƯỚNG DẪN TỰ HỌC VÀ NHIỆM VỤ VỀ NHÀ (bắt buộc để appendix.assignmentPrompt = "").' : 'Tại mục Hướng dẫn tự học & Nhiệm vụ về nhà (appendix.assignmentPrompt và Hoạt động 4), BẮT BUỘC phải xuống dòng từng nhiệm vụ rõ ràng (a) Đối với bài vừa học: Nhiệm vụ 1, Nhiệm vụ 2... b) Đối với bài học tiếp theo: Đọc trước nội dung...), TUYỆT ĐỐI KHÔNG viết dồn ép tất cả vào 1 dòng dài.'}`;

    let responseText = '';
    try {
      const response = await generateContentWithRetryAndFallback({
        systemInstruction,
        candidateKeys: auth.keys,
        primaryModel: (config.aiModel && config.aiModel !== 'gemini-flash-latest' && config.aiModel !== 'auto') ? config.aiModel : 'gemini-3.1-flash-lite',
        taskType: 'pedagogical',
        contents: userPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              schoolName: { type: Type.STRING },
              teacherName: { type: Type.STRING },
              lessonTitle: { type: Type.STRING },
              subject: { type: Type.STRING },
              grade: { type: Type.STRING },
              bookSeries: { type: Type.STRING },
              periods: { type: Type.INTEGER },
              objectives: {
                type: Type.OBJECT,
                properties: {
                  knowledge: { type: Type.ARRAY, items: { type: Type.STRING } },
                  generalCompetencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  subjectCompetencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  digitalCompetencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  aiCompetencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  stemCompetencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                  qualities: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['knowledge', 'generalCompetencies', 'subjectCompetencies', 'digitalCompetencies', 'aiCompetencies', 'qualities'],
              },
              equipment: {
                type: Type.OBJECT,
                properties: {
                  teacher: { type: Type.ARRAY, items: { type: Type.STRING } },
                  student: { type: Type.ARRAY, items: { type: Type.STRING } },
                  digitalAssets: { type: Type.ARRAY, items: { type: Type.STRING } },
                  stemMaterials: { type: Type.ARRAY, items: { type: Type.STRING } },
                  parentCollaboration: { type: Type.ARRAY, items: { type: Type.STRING } },
                  preschoolPreparation: {
                    type: Type.OBJECT,
                    properties: {
                      teacherEnvironment: { type: Type.ARRAY, items: { type: Type.STRING } },
                      teacherTools: { type: Type.ARRAY, items: { type: Type.STRING } },
                      studentCostume: { type: Type.ARRAY, items: { type: Type.STRING } },
                      studentTools: { type: Type.ARRAY, items: { type: Type.STRING } },
                      studentPsychology: { type: Type.ARRAY, items: { type: Type.STRING } },
                      parentCollaboration: { type: Type.ARRAY, items: { type: Type.STRING } },
                    }
                  }
                },
                required: ['teacher', 'student', 'digitalAssets'],
              },
              stemIntegration: {
                type: Type.OBJECT,
                properties: {
                  topicTitle: { type: Type.STRING },
                  stemGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
                  stemMaterials: { type: Type.ARRAY, items: { type: Type.STRING } },
                  stemProcess: { type: Type.ARRAY, items: { type: Type.STRING } },
                  expectedProduct: { type: Type.STRING },
                  evaluationCriteria: { type: Type.STRING },
                },
              },
              activities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    index: { type: Type.INTEGER },
                    name: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    objective: { type: Type.STRING },
                    content: { type: Type.STRING },
                    productSummary: { type: Type.STRING },
                    nlsFocus: { type: Type.STRING },
                    aiFocus: { type: Type.STRING },
                    step1: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        teacherAction: { type: Type.STRING },
                        studentAction: { type: Type.STRING },
                        productExpected: { type: Type.STRING },
                        digitalOrAiTool: { type: Type.STRING },
                      },
                      required: ['title', 'teacherAction', 'studentAction', 'productExpected'],
                    },
                    step2: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        teacherAction: { type: Type.STRING },
                        studentAction: { type: Type.STRING },
                        productExpected: { type: Type.STRING },
                        digitalOrAiTool: { type: Type.STRING },
                      },
                      required: ['title', 'teacherAction', 'studentAction', 'productExpected'],
                    },
                    step3: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        teacherAction: { type: Type.STRING },
                        studentAction: { type: Type.STRING },
                        productExpected: { type: Type.STRING },
                        digitalOrAiTool: { type: Type.STRING },
                      },
                      required: ['title', 'teacherAction', 'studentAction', 'productExpected'],
                    },
                    step4: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        teacherAction: { type: Type.STRING },
                        studentAction: { type: Type.STRING },
                        productExpected: { type: Type.STRING },
                        digitalOrAiTool: { type: Type.STRING },
                      },
                      required: ['title', 'teacherAction', 'studentAction', 'productExpected'],
                    },
                  },
                  required: ['id', 'index', 'name', 'duration', 'objective', 'content', 'productSummary', 'step1', 'step2', 'step3', 'step4'],
                },
              },
              competencyMatrix: {
                type: Type.OBJECT,
                properties: {
                  nlsItems: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        activityName: { type: Type.STRING },
                        teachingOrganization: { type: Type.STRING },
                        indicatorCode: { type: Type.STRING },
                        competencyDescription: { type: Type.STRING },
                        domain: { type: Type.STRING },
                        component: { type: Type.STRING },
                        indicator: { type: Type.STRING },
                        activityRef: { type: Type.STRING },
                        digitalToolUsed: { type: Type.STRING },
                      },
                      required: ['activityName', 'teachingOrganization', 'indicatorCode', 'competencyDescription'],
                    },
                  },
                  aiItems: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        activityName: { type: Type.STRING },
                        teachingOrganization: { type: Type.STRING },
                        indicatorCode: { type: Type.STRING },
                        competencyDescription: { type: Type.STRING },
                        domain: { type: Type.STRING },
                        component: { type: Type.STRING },
                        indicator: { type: Type.STRING },
                        activityRef: { type: Type.STRING },
                        digitalToolUsed: { type: Type.STRING },
                      },
                      required: ['activityName', 'teachingOrganization', 'indicatorCode', 'competencyDescription'],
                    },
                  },
                },
                required: ['nlsItems', 'aiItems'],
              },
              appendix: {
                type: Type.OBJECT,
                properties: {
                  worksheetContent: { type: Type.STRING },
                  assignmentPrompt: { type: Type.STRING },
                },
              },
            },
            required: ['schoolName', 'teacherName', 'lessonTitle', 'subject', 'grade', 'bookSeries', 'periods', 'objectives', 'equipment', 'activities', 'competencyMatrix', 'appendix'],
          },
        },
      });
      responseText = response.text || '{}';
    } catch (monolithicErr: any) {
      console.warn('Monolithic generation hit spike/timeout. Switching to Sectional Assembly pipeline...', monolithicErr?.message);
      // Automatic fallback to sectional pipeline
      const sectionalResult = await generateKHBDSectional(config, undefined, auth.keys, config.aiModel || 'gemini-flash-latest');
      return res.json({ success: true, data: sectionalResult, lessonPlan: sectionalResult });
    }

    const parsed = parseJSONRobust(responseText || '{}');
    if (parsed.appendix?.worksheetContent) {
      parsed.appendix.worksheetContent = cleanWorksheetContent(parsed.appendix.worksheetContent);
    }
    if (config.grade) {
      parsed.grade = config.grade;
    }
    if (isPreschool) {
      parsed.duration = preschoolAgeProfile?.recommendedDuration || parsed.duration || '30 – 35 phút';
    }
    parsed.generatedAt = new Date().toISOString();
    parsed.imageSlotsUsed = config.imageSlots || [];

    const finalParsed = enforcePPCTCompetencies(parsed, config, effectiveNLSIndicators, effectiveAIIndicators);

    res.json({ success: true, data: finalParsed, lessonPlan: finalParsed });
  } catch (error: any) {
    console.error('Error generating KHBD after all fallbacks:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Không thể tạo Kế hoạch bài dạy qua Gemini API.',
    });
  }
};

app.post('/api/gemini/generate-khbd', handleGenerateKHBD);
app.post('/api/gemini/generate-lesson-plan', handleGenerateKHBD);

/**
 * Dedicated Sectional Endpoint
 */
app.post('/api/gemini/generate-lesson-plan-sectional', async (req, res) => {
  try {
    const auth = resolveGeminiAuth(req);
    if (!auth.allowed) {
      return res.status(403).json({ success: false, error: auth.error, requiresCustomApiKey: true });
    }
    const config = req.body;
    const sectionalResult = await generateKHBDSectional(
      config,
      undefined,
      auth.keys,
      (config.aiModel && config.aiModel !== 'gemini-flash-latest' && config.aiModel !== 'auto') ? config.aiModel : 'gemini-3.1-flash-lite'
    );
    res.json({ success: true, data: sectionalResult, lessonPlan: sectionalResult });
  } catch (error: any) {
    console.error('Error in sectional generation:', error);
    res.status(500).json({ success: false, error: 'Hệ thống đang quá tải, vui lòng thử lại sau.' });
  }
});

/**
 * Streaming Sectional Endpoint (Progress Tracking)
 */
app.post('/api/gemini/generate-lesson-plan-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (type: string, data: any) => {
    res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
  };

  try {
    const auth = resolveGeminiAuth(req);
    if (!auth.allowed) {
      sendEvent('error', {
        success: false,
        error: auth.error,
        requiresCustomApiKey: true,
      });
      res.end();
      return;
    }

    const config = req.body;
    const onProgress = (step: number, status: string) => {
      sendEvent('progress', { step, status });
    };

    const result = await generateKHBDSectional(
      config,
      onProgress,
      auth.keys,
      (config.aiModel && config.aiModel !== 'gemini-flash-latest' && config.aiModel !== 'auto') ? config.aiModel : 'gemini-3.1-flash-lite'
    );
    sendEvent('complete', { success: true, lessonPlan: result });
  } catch (error: any) {
    console.error('Error in streaming sectional generation:', error);
    sendEvent('error', { success: false, error: 'Hệ thống đang quá tải, vui lòng thử lại sau.' });
  } finally {
    res.end();
  }
});

/**
 * Smart pedagogical suggestions: games, simulations, AI prompts, warm-ups
 */
app.post('/api/gemini/suggest-ideas', async (req, res) => {
  try {
    const auth = resolveGeminiAuth(req);
    if (!auth.allowed) {
      return res.status(403).json({ success: false, error: auth.error, requiresCustomApiKey: true });
    }

    const { lessonTitle, subject, grade, requestType, aiModel } = req.body;

    const prompt = `Bạn là Trợ lý Sư phạm Giáo dục số. Hãy đưa ra các gợi ý sáng tạo đỉnh cao cho bài học:
- Tên bài: ${lessonTitle}
- Môn học: ${subject}
- Lớp: ${grade}
- Yêu cầu gợi ý: ${requestType || 'Ý tưởng hoạt động khởi động tương tác số và bài tập vận dụng thực tiễn tích hợp AI'}

Hãy cung cấp:
1. 3 ý tưởng Hoạt động Khởi động cực kỳ lôi cuốn (kèm công cụ: Kahoot, Quizizz, Padlet, Mentimeter, hoặc minigame mô phỏng).
2. 2 Kịch bản tích hợp công cụ AI (ChatGPT/Gemini/Canva) cho học sinh thực hành có hướng dẫn Prompting chuẩn.
3. 1 Bài toán vận dụng thực tiễn liên môn.
4. Gợi ý bộ tiêu chí Rubric đánh giá năng lực số.

Viết sinh động, dễ áp dụng ngay vào bài giảng.`;

    const response = await generateContentWithRetryAndFallback({
      contents: prompt,
      candidateKeys: auth.keys,
      primaryModel: aiModel && aiModel !== 'auto' && aiModel !== 'gemini-flash-latest' ? aiModel : 'gemini-3.1-flash-lite',
      taskType: 'pedagogical',
    });

    res.json({ success: true, suggestions: response.text });
  } catch (error: any) {
    console.error('Error suggesting ideas:', error);
    res.status(500).json({ success: false, error: 'Hệ thống đang quá tải, vui lòng thử lại sau.' });
  }
});

/**
 * Refine / Upgrade a specific activity
 */
app.post('/api/gemini/refine-activity', async (req, res) => {
  try {
    const auth = resolveGeminiAuth(req);
    if (!auth.allowed) {
      return res.status(403).json({ success: false, error: auth.error, requiresCustomApiKey: true });
    }

    const { activity, instruction, subject, grade, aiModel, tableLayout } = req.body;

    const isPreschool = grade?.toLowerCase().includes('mầm non') || subject?.toLowerCase().includes('mầm non');
    const isMathSubject = (subject || '').toLowerCase().includes('toán');
    const isTinHoc = (subject || '').toLowerCase().includes('tin học');
    const isMiddleOrHighSchool = (grade || '').toLowerCase().includes('thcs') || (grade || '').toLowerCase().includes('thpt') ||
      /^(?:lớp\s*)?(?:6|7|8|9|10|11|12)(?:\b|$)/i.test(grade || '');
    const isIntegratedSubject = (isMathSubject || isMiddleOrHighSchool) && !isTinHoc;
    const isMath4Column = tableLayout === 'math_4_column';
    const prompt = `Hãy nâng cấp lại Hoạt động sau đây của bài dạy (${subject} - ${grade}) ${isPreschool ? 'dành cho Mầm non (Không dùng CV 5512, giữ nguyên dạng 1 step1 cho cả hoạt động)' : 'theo đúng chuẩn Công văn 5512 (4 bước rõ ràng)'}:

Hoạt động hiện tại:
${JSON.stringify(activity, null, 2)}

Yêu cầu điều chỉnh từ giáo viên:
"${instruction}"

LƯU Ý QUAN TRỌNG VỀ ĐỀ MỤC SGK KHỐI THCS VÀ MỌI BỘ MÔN:
- CỘT SẢN PHẨM TRONG BẢNG (productExpected): ĐÂY LÀ NƠI DUY NHẤT CHỨA TÊN ĐỀ MỤC VÀ KIẾN THỨC GHI VỞ (ví dụ: "1. Thế giới kĩ thuật số" hoặc "I. THÔNG TIN VÀ DỮ LIỆU:", "1. Thấy gì? Biết gì ?"). Tên đề mục phải đứng trên dòng riêng, các ý kiến thức dùng dấu gạch ngang (-) xuống dòng rõ ràng.
- MỤC a, b, c PHÍA TRÊN BẢNG (objective, content, productSummary): Chỉ tóm tắt ngắn gọn mục tiêu, nội dung nhiệm vụ và sản phẩm chung. TUYỆT ĐỐI KHÔNG đưa danh sách đề mục hay nội dung ghi vở dài dòng vào mục b, c phía trên bảng.
- TUYỆT ĐỐI KHÔNG CHÈN/TÍCH HỢP MÃ NĂNG LỰC SỐ (NLS) HOẶC AI (dạng 1.1.TC1a, [NLS 1.1]...) VÀO CỘT SẢN PHẨM (productExpected). ${isIntegratedSubject ? (isMath4Column ? 'Đối với mẫu 4 cột, TUYỆT ĐỐI KHÔNG ghi chữ [Tích hợp NLS] hay [Tích hợp AI] vào cột Hoạt động của GV/HS, mà đưa mã chỉ báo vào trường nlsFocus và aiFocus.' : 'Đối với các môn học cấp THCS và THPT (như môn Toán), thể hiện khối [Tích hợp NLS] hoặc [Tích hợp AI] kèm mã chỉ báo trực tiếp trong cột Hoạt động của GV/HS nếu hoạt động có sử dụng công cụ số/AI (xuống dòng tách khối riêng biệt [Tích hợp NLS] hoặc [Tích hợp AI]).') : 'TUYỆT ĐỐI KHÔNG chèn vào teacherAction hay studentAction.'}

Yêu cầu: Trả về đối tượng JSON cho duy nhất Hoạt động này, giữ nguyên cấu trúc các trường: id, index, name, duration, objective, content, productSummary, step1, step2, step3, step4, nlsFocus, aiFocus. ${isPreschool ? 'Chỉ sử dụng step1, bỏ trống step 2, 3, 4.' : 'Mỗi step phải có: title, teacherAction, studentAction, productExpected, digitalOrAiTool.'}`;

    const response = await generateContentWithRetryAndFallback({
      contents: prompt,
      candidateKeys: auth.keys,
      primaryModel: aiModel && aiModel !== 'auto' && aiModel !== 'gemini-flash-latest' ? aiModel : 'gemini-3.1-flash-lite',
      taskType: 'pedagogical',
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawActivity = parseJSONRobust(response.text || '{}');
    const updatedActivity = cleanActivityNLSCodes(rawActivity, isIntegratedSubject, isMath4Column);
    res.json({ success: true, activity: updatedActivity });
  } catch (error: any) {
    console.error('Error refining activity:', error);
    res.status(500).json({ success: false, error: 'Hệ thống đang quá tải, vui lòng thử lại sau.' });
  }
});

/**
 * Pedagogical AI Assistant Chat
 */
app.post('/api/gemini/ai-assistant-chat', async (req, res) => {
  try {
    const auth = resolveGeminiAuth(req);
    if (!auth.allowed) {
      return res.status(403).json({ success: false, error: auth.error, requiresCustomApiKey: true });
    }

    const { message, chatHistory, aiModel } = req.body;

    const systemInstruction = `Bạn là Trợ lý AI Chuyên gia Giáo dục số của KHBD AI PRO.
Bạn hỗ trợ giáo viên giải đáp mọi thắc mắc về:
- Công văn 5512/BGDĐT (cấu trúc bài dạy, 4 bước tổ chức hoạt động, cách viết mục tiêu theo phẩm chất và năng lực).
- Khung Năng lực số (NLS) cho học sinh theo chuẩn Bộ GD&ĐT / UNESCO.
- Kỹ thuật Giáo dục Trí tuệ Nhân tạo (AI Literacy, Prompt Engineering trong nhà trường, liêm chính học thuật).
- Cách sử dụng các phần mềm: GeoGebra, PhET, Canva, Padlet, Quizizz, Google Workspace.

Trả lời lịch thiệp, sư phạm, chuyên nghiệp, cấu trúc rõ ràng và thiết thực.`;

    const contents: any[] = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach((msg: any) => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await generateContentWithRetryAndFallback({
      systemInstruction,
      candidateKeys: auth.keys,
      primaryModel: aiModel && aiModel !== 'auto' && aiModel !== 'gemini-flash-latest' ? aiModel : 'gemini-3.7-flash',
      taskType: 'chat',
      contents,
    });

    res.json({ success: true, reply: response.text });
  } catch (error: any) {
    console.error('Error in AI Assistant chat:', error);
    res.status(500).json({ success: false, error: 'Hệ thống đang quá tải, vui lòng thử lại sau.' });
  }
});

/**
 * Dynamic on-the-fly Project Source Code Zip Exporter
 */
app.get('/api/export-project-zip', async (_req, res) => {
  try {
    const JSZip = (await import('jszip')).default;
    const fs = await import('fs');
    const path = await import('path');
    const zip = new JSZip();

    function addDirToZip(currentDir: string, zipFolder: any) {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        if (['node_modules', '.git', 'dist', 'build', '.aistudio', '.cache'].includes(item)) continue;
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          addDirToZip(fullPath, zipFolder.folder(item));
        } else {
          if (item.endsWith('.map') || item.endsWith('.log')) continue;
          zipFolder.file(item, fs.readFileSync(fullPath));
        }
      }
    }

    addDirToZip(process.cwd(), zip);
    const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="taogiaoan-ai-pro.zip"');
    res.send(content);
  } catch (err: any) {
    console.error('Error creating source zip:', err);
    res.status(500).json({ error: 'Không thể tạo file nén' });
  }
});

/**
 * AI Scanner: Extract Table of Contents / List of Lesson Titles from textbook PDF (Pages 1 to 10+ / Mục lục)
 * Executed ONLY ONCE when Admin uploads the textbook to save AI Quota permanently.
 */
app.post('/api/extract-textbook-toc', async (req, res) => {
  try {
    const auth = resolveGeminiAuth(req);
    if (!auth.allowed) {
      return res.status(403).json({ success: false, error: auth.error, requiresCustomApiKey: true });
    }

    const { subject, grade, bookSeries, volume, fileTextSnippet, fileName, pdfBase64, aiModel } = req.body;

    const systemInstruction = `Bạn là Trợ lý AI chuyên gia phân tích cấu trúc Sách Giáo Khoa chuẩn bộ sách "Kết nối tri thức với cuộc sống" của Bộ GD&ĐT Việt Nam.
Nhiệm vụ tối quan trọng: Quét trang "MỤC LỤC" (thường nằm ở trang 2, 3, 4, 5, 6... của sách) trong tệp tài liệu PDF hoặc văn bản để trích xuất TOÀN BỘ, ĐẦY ĐỦ VÀ CHÍNH XÁC 100% TẤT CẢ CÁC BÀI HỌC VÀ CHỦ ĐỀ/CHƯƠNG.

QUY TẮC BẮT BUỘC:
1. TUYỆT ĐỐI KHÔNG ĐƯỢC TÓM TẮT HAY CẮT BỚT: Phải lấy đầy đủ từng bài học từ bài đầu tiên đến bài cuối cùng trong Mục lục.
   - Ví dụ SGK Tin học 6 (Kết nối tri thức): BẮT BUỘC phải trích xuất đủ 17 bài học trong 6 chủ đề:
     + Chủ đề 1: Máy tính và cộng đồng (Bài 1: Thông tin và dữ liệu, Bài 2: Xử lí thông tin, Bài 3: Thông tin trong máy tính)
     + Chủ đề 2: Mạng máy tính và Internet (Bài 4: Mạng máy tính, Bài 5: Internet)
     + Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin (Bài 6: Mạng thông tin toàn cầu, Bài 7: Tìm kiếm thông tin trên Internet, Bài 8: Thư điện tử)
     + Chủ đề 4: Đạo đức, pháp luật và văn hoá trong môi trường số (Bài 9: An toàn thông tin trên Internet)
     + Chủ đề 5: Ứng dụng tin học (Bài 10: Sơ đồ tư duy, Bài 11: Định dạng văn bản, Bài 12: Trình bày thông tin ở dạng bảng, Bài 13: Tìm kiếm và thay thế, Bài 14: Thực hành tổng hợp: Hoàn thiện sổ lưu niệm)
     + Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính (Bài 15: Thuật toán, Bài 16: Các cấu trúc điều khiển, Bài 17: Chương trình máy tính)
2. Định dạng JSON bắt buộc:
   {
     "lessons": ["Bài 1: [Tên bài]", "Bài 2: [Tên bài]", ...],
     "themes": ["Chủ đề 1. ...", "Chủ đề 2. ...", ...],
     "totalLessons": 17,
     "detectedGrade": "Lớp 6",
     "detectedSubject": "Toán học",
     "detectedVolume": "Tập 1"
   }
5. NẾU khối lớp, môn học, tập sách chưa rõ ràng, BẮT BUỘC phải nhận diện từ tên file hoặc trang bìa/mục lục.
3. Mỗi bài học có định dạng chuẩn: "Bài [Số]: [Tên bài học]".
4. Tuyệt đối không trả về các bài học chung chung hay mẫu giả lập. Luôn lấy đúng 100% chuẩn tên bài theo Mục lục sách giáo khoa Kết nối tri thức.`;

    const promptText = `Hãy quét trang Mục Lục của sách giáo khoa để trích xuất đầy đủ toàn bộ danh sách tất cả các bài học và chủ đề:
- Môn học: ${subject || 'Tin học'}
- Khối lớp: ${grade || 'Lớp 6'}
- Bộ sách: ${bookSeries || 'Kết nối tri thức với cuộc sống'}
- Tập sách: ${volume || 'Cả năm'}
- Tệp đính kèm: ${fileName || 'sgk.pdf'}
${fileTextSnippet ? `\nĐoạn trích mục lục:\n"""\n${fileTextSnippet.substring(0, 8000)}\n"""` : ''}

Yêu cầu: Lấy đủ 100% tất cả các bài học từ Mục lục (không bỏ sót bất kỳ bài nào) và trả về đối tượng JSON { "lessons": [...], "themes": [...], "totalLessons": number, "detectedGrade": string, "detectedSubject": string, "detectedVolume": string }.`;

    const contents: any[] = [];
    if (pdfBase64 && typeof pdfBase64 === 'string') {
      const cleanBase64 = pdfBase64.includes('base64,') ? pdfBase64.split('base64,')[1] : pdfBase64;
      contents.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64,
        },
      });
    }
    contents.push({
      text: promptText,
    });

    const response = await generateContentWithRetryAndFallback({
      systemInstruction,
      candidateKeys: auth.keys,
      primaryModel: aiModel || 'gemini-flash-latest',
      taskType: 'utility',
      contents,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let parsed: any = parseJSONRobust(response.text || '{}');

    let lessons = Array.isArray(parsed.lessons) ? parsed.lessons : [];
    let themes = Array.isArray(parsed.themes) ? parsed.themes : [];

    const detGrade = parsed.detectedGrade || grade;
    const detSubject = parsed.detectedSubject || subject;
    const detVolume = parsed.detectedVolume || volume;

    // If AI output was empty or failed, seamlessly fallback to the verified curriculum master list
    if (lessons.length === 0) {
      const verified = getVerifiedLessons(detSubject || subject, detGrade || grade, detVolume || volume);
      if (verified && verified.lessons.length > 0) {
        lessons = verified.lessons;
        themes = verified.themes || themes;
      }
    }

    res.json({
      success: true,
      lessons,
      themes,
      totalLessons: lessons.length,
      detectedGrade: detGrade,
      detectedSubject: detSubject,
      detectedVolume: detVolume,
    });
  } catch (error: any) {
    console.error('Error extracting textbook TOC, checking verified fallback:', error);
    try {
      const { subject, grade, volume } = req.body;
      const verified = getVerifiedLessons(subject, grade, volume);
      if (verified && verified.lessons.length > 0) {
        return res.json({
          success: true,
          lessons: verified.lessons,
          themes: verified.themes || [],
          totalLessons: verified.lessons.length,
          detectedGrade: grade,
          detectedSubject: subject,
          detectedVolume: volume,
        });
      }
    } catch {
      // ignore
    }
    res.status(500).json({ success: false, error: error.message, lessons: [] });
  }
});

/**
 * Extract PPCT metadata from file (Word, PDF, Excel)
 */
app.post('/api/extract-ppct', async (req, res) => {
  try {
    const { subject, grade, fileName, fileBase64, mimeType, volume } = req.body;
    const apiKey = extractApiKeyFromReq(req);
    let fileText = '';

    // Handle different formats
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const xlsx = await import('xlsx');
      const cleanBase64 = fileBase64.includes('base64,') ? fileBase64.split('base64,')[1] : fileBase64;
      const buffer = Buffer.from(cleanBase64, 'base64');
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        let csv = xlsx.utils.sheet_to_csv(sheet, { blankrows: false });
        // Clean up excessive empty columns and commas
        csv = csv.replace(/,{2,}/g, ',');
        csv = csv.split('\n').filter(line => line.replace(/,/g, '').trim().length > 0).join('\n');
        
        if (csv.trim().length > 10) { // Only add if sheet has actual content
          fileText += `\n--- Sheet: ${sheetName} ---\n`;
          fileText += csv;
        }
      });
    } else if (fileName.endsWith('.docx') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await import('mammoth');
      const cleanBase64 = fileBase64.includes('base64,') ? fileBase64.split('base64,')[1] : fileBase64;
      const buffer = Buffer.from(cleanBase64, 'base64');
      const result = await mammoth.extractRawText({ buffer });
      fileText = result.value;
    }

    const systemInstruction = `Bạn là Trợ lý AI chuyên gia phân tích Phân phối chương trình (PPCT) giáo dục phổ thông theo chuẩn Bộ GD&ĐT Việt Nam.
Nhiệm vụ: Phân tích nội dung PPCT (Word, Excel) hoặc PDF (đính kèm). Nếu người dùng yêu cầu "Nhiều khối" hoặc file có nhiều sheet/trang chứa các khối lớp khác nhau, hãy tách riêng PPCT cho TỪNG KHỐI LỚP (Ví dụ: Lớp 6, Lớp 7, Lớp 8...).
QUY TẮC:
1. Lấy tất cả bài học trong PPCT.
2. Trích xuất chính xác "số tiết" (periods) tương ứng cho từng bài.
3. Trích xuất các yêu cầu tích hợp Năng lực số (integratedNLS) hoặc Trí tuệ nhân tạo (integratedAI) nếu có nhắc đến trong PPCT cho từng bài (nếu không có, để mảng rỗng).
4. ĐẶC BIỆT QUAN TRỌNG - TÍCH HỢP NỘI DUNG GIÁO DỤC STEM:
   - Quét kỹ toàn bộ bảng PPCT và các dòng cuối bảng / ghi chú ở cuối PPCT (Ví dụ: "Thiết kế hệ thống lọc nước đơn giản (Nghiệm thu Stem)", "Chủ đề Stem: ...", các mục nghiệm thu STEM).
   - Với những bài học có ghi "(tích hợp nội dung Stem)", "(tích hợp STEM)", "(Stem)" hoặc có hoạt động STEM:
     + Đặt "hasStemIntegration": true.
     + Trích xuất tên chủ đề STEM (stemTopic) được tích hợp tương ứng (thường ghi ở cuối PPCT hoặc trong phân phối, ví dụ: "Thiết kế hệ thống lọc nước đơn giản").
5. BẮT BUỘC Trả về đúng định dạng JSON SAU ĐÂY:
{
  "results": [
    {
      "grade": "Lớp 6",
      "lessonConfigs": [
        {
          "lessonTitle": "Tên bài học",
          "periods": 1,
          "integratedNLS": [],
          "integratedAI": [],
          "hasStemIntegration": false,
          "stemTopic": ""
        }
      ]
    }
  ]
}
Chú ý: Nếu PPCT chỉ có 1 khối lớp, hãy vẫn trả về mảng "results" có 1 phần tử.`;

    const promptText = `Trích xuất PPCT:
- Môn học: ${subject}
- Khối lớp: ${grade}
- Tập sách: ${volume || 'Cả năm / Không phân tập'}
- Tệp đính kèm: ${fileName}

${fileText ? `\nNội dung tệp:\n"""\n${fileText.substring(0, 50000)}\n"""` : ''}`;

    const contents: any[] = [];
    if (!fileText && fileBase64 && (fileName.endsWith('.pdf') || mimeType.startsWith('image/'))) {
      const cleanBase64 = fileBase64.includes('base64,') ? fileBase64.split('base64,')[1] : fileBase64;
      contents.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: cleanBase64,
        },
      });
    }
    contents.push({ text: promptText });

    const response = await generateContentWithRetryAndFallback({
      systemInstruction,
      apiKey,
      taskType: 'utility',
      primaryModel: 'gemini-flash-latest',
      contents,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = parseJSONRobust(response.text || '{"results": []}');
    res.json({
      success: true,
      results: parsed.results || (parsed.lessonConfigs ? [{ grade, lessonConfigs: parsed.lessonConfigs }] : []),
    });

  } catch (error: any) {
    console.error('Error in extracting PPCT:', error);
    res.status(500).json({ success: false, error: 'Hệ thống đang quá tải, vui lòng thử lại sau.' });
  }
});

async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(503).send('Application is starting, please refresh in a moment.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KHBD AI PRO Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start the standalone HTTP listener when not running in Vercel Serverless environment
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
