/**
 * API Key Manager for KHBD AI PRO
 * Manages custom user/admin Gemini API Keys, status testing, and header injection.
 */

const STORAGE_KEY = 'khbd_custom_gemini_api_key';

export interface ApiKeyStatusResult {
  success: boolean;
  status: 'valid' | 'quota_exceeded' | 'invalid' | 'missing' | 'error';
  message: string;
  keyPreview?: string;
  keyCount?: number;
  isDefault?: boolean;
  isAdmin?: boolean;
}

/**
 * Sanitize API Key input string to eliminate artifacts from copy-pasting
 * from Google AI Studio / GCP Console, such as "content_copy", "content_cop",
 * zero-width spaces, invisible characters, newlines, quotes, etc.
 */
export function sanitizeApiKeyInput(inputStr?: string): string {
  if (!inputStr || typeof inputStr !== 'string') return '';
  const keys = parseKeysFromInput(inputStr);
  return keys.join('\n');
}

/**
 * Parses individual Gemini API Key tokens from any input string format.
 * Filters out common UI copy artifacts like 'content_copy', 'content_cop', 'copy', etc.
 */
export function parseKeysFromInput(inputStr?: string): string[] {
  if (!inputStr || typeof inputStr !== 'string') return [];

  // 1. Normalize zero-width spaces, invisible unicode, and non-breaking spaces
  const normalized = inputStr
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    // Remove known copy artifact labels case-insensitively
    .replace(/\b(content_copy|content_cop|copied|copy|api_key|apikey|key)\b/gi, ' ');

  // 2. Split by comma, semicolon, newline, or whitespace
  const rawTokens = normalized.split(/[,;\n\r\s]+/);

  const validKeys: string[] = [];
  for (let token of rawTokens) {
    // Strip surrounding quotes, colons, equals, or punctuation
    token = token.trim().replace(/^["':=]+|["':=]+$/g, '');

    // Ignore known button labels, artifacts, or keywords
    if (
      !token ||
      /^(content_copy|content_cop|copied|copy|key|api|gemini|null|undefined)$/i.test(token)
    ) {
      continue;
    }

    // Google Gemini API keys are base64url-like alphanumeric with underscores, dashes, dots
    // Typically ~39 chars (AIzaSy...) or 40-55 chars (AQ....)
    // Filter to retain only valid tokens with length >= 15
    const match = token.match(/([A-Za-z0-9_\-\.]{15,})/);
    if (match && match[1]) {
      const candidate = match[1];
      if (!/^(content_copy|content_cop)$/i.test(candidate)) {
        validKeys.push(candidate);
      }
    }
  }

  // Deduplicate keys
  return Array.from(new Set(validKeys));
}

export function getStoredApiKey(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    if (!raw) return '';
    const cleaned = sanitizeApiKeyInput(raw);
    // If the stored value had junk or artifacts, auto-repair it in localStorage
    if (cleaned !== raw.trim()) {
      if (cleaned) {
        localStorage.setItem(STORAGE_KEY, cleaned);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    return cleaned;
  } catch {
    return '';
  }
}

export function getStoredApiKeys(): string[] {
  return parseKeysFromInput(getStoredApiKey());
}

export function setStoredApiKey(key: string): void {
  try {
    const cleanKey = sanitizeApiKeyInput(key);
    if (cleanKey) {
      localStorage.setItem(STORAGE_KEY, cleanKey);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to save API key to localStorage', e);
  }
}

export function clearStoredApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear API key from localStorage', e);
  }
}

/**
 * Returns safe HTTP headers for API requests.
 * Guarantees that no header value contains newlines, control characters,
 * or non-ASCII characters that cause browser Window.fetch "invalid header value" errors.
 */
export function getApiHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 1. Attach custom API keys safely (Strictly ASCII, single line, comma-separated)
  const cleanKeys = parseKeysFromInput(getStoredApiKey());
  if (cleanKeys.length > 0) {
    headers['x-gemini-api-key'] = cleanKeys.join(',').replace(/[^\x21-\x7E,]/g, '');
  }

  // 2. Attach user session metadata safely (URI-encoded to ensure safe ByteString in browsers)
  try {
    const isLogged = localStorage.getItem('khbd_is_logged_in');
    if (isLogged === 'true') {
      const savedUserStr = localStorage.getItem('khbd_current_user');
      if (savedUserStr) {
        const user = JSON.parse(savedUserStr);
        if (user.role) {
          headers['x-user-role'] = encodeURIComponent(String(user.role).trim());
        }
        if (user.email) {
          headers['x-user-email'] = encodeURIComponent(String(user.email).trim());
        }
        if (user.expiresAt) {
          headers['x-user-expires-at'] = encodeURIComponent(String(user.expiresAt).trim());
        }
        const isTrial = (!user.expiresAt || user.expiresAt === 'Chưa cấp' || user.expiresAt.toLowerCase().includes('dùng thử'));
        headers['x-user-is-trial'] = String(isTrial);
      }
    }
  } catch (e) {
    // Ignore localStorage parse errors
  }

  // 3. Merge extraHeaders
  for (const [k, v] of Object.entries(extraHeaders)) {
    if (typeof v === 'string') {
      headers[k] = v;
    }
  }

  // 4. ABSOLUTE SAFETY PASS: Ensure EVERY header key and value is strictly valid ISO-8859-1 / ASCII.
  // This guarantees that window.fetch will NEVER throw 'String contains non ISO-8859-1 code point'.
  const safeHeaders: Record<string, string> = {};
  for (const [rawKey, rawVal] of Object.entries(headers)) {
    if (!rawKey || typeof rawVal !== 'string') continue;
    const cleanKey = rawKey.replace(/[^\x21-\x7E]/g, '');
    let cleanVal = rawVal.replace(/[\r\n]/g, ' ').trim();
    
    // Check if value contains non-ASCII characters (> 127)
    let hasNonAscii = false;
    for (let i = 0; i < cleanVal.length; i++) {
      if (cleanVal.charCodeAt(i) > 127) {
        hasNonAscii = true;
        break;
      }
    }
    if (hasNonAscii) {
      try {
        cleanVal = encodeURIComponent(cleanVal);
      } catch {
        cleanVal = cleanVal.replace(/[^\x20-\x7E]/g, '');
      }
    }
    if (cleanKey && cleanVal) {
      safeHeaders[cleanKey] = cleanVal;
    }
  }

  return safeHeaders;
}

export async function checkApiKeyStatus(customKey?: string): Promise<ApiKeyStatusResult> {
  try {
    const keyToTest = customKey !== undefined ? sanitizeApiKeyInput(customKey) : getStoredApiKey();
    
    const response = await fetch('/api/check-api-key', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ apiKey: keyToTest, customApiKey: keyToTest }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      status: 'error',
      message: 'Không thể kết nối đến máy chủ kiểm tra API: ' + (err.message || String(err)),
    };
  }
}

