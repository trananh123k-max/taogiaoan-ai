import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  setLogLevel,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';
import { CustomUploadedBook, CustomUploadedPPCT } from '../types';
import { SEED_SAMPLE_BOOKS, SEED_SAMPLE_PPCT } from '../data/seedData';
import {
  isSamePhysicalMachine,
  deduplicateAuthorizedDevices,
  DeviceInfo,
} from './deviceManager';

// Mute harmless internal WebChannel transport reconnection warnings in sandboxed iframe environment
try {
  setLogLevel('silent');
} catch {}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(config) : getApp();

// Initialize Firestore with resilient connection options
// Using experimentalAutoDetectLongPolling ensures reliable connection in sandboxed iframes,
// proxies, and restrictive networks without transport stream disconnect alerts.
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      config.firestoreDatabaseId || undefined
    );
  } catch {
    return getFirestore(app, config.firestoreDatabaseId || undefined);
  }
})();

/**
 * Recursively removes all `undefined` properties from an object or array.
 * Firestore strict validation throws an unhandled runtime error if any property (even nested or inside arrays) is `undefined`.
 */
export function sanitizeForFirestore<T>(val: T): T {
  if (val === undefined) {
    return null as any;
  }
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (val instanceof Date) {
    return val.toISOString() as any;
  }
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(val as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeForFirestore(value);
    }
  }
  return cleaned as T;
}

/**
 * Safe wrapper around Firestore `setDoc` that recursively sanitizes any `undefined` values
 * and catches synchronous/asynchronous errors defensively so it never throws an Uncaught FirebaseError.
 */
export async function safeFirestoreSetDoc(
  docRef: any,
  data: any,
  options: { merge?: boolean } = { merge: true }
): Promise<boolean> {
  try {
    if (!docRef || !data) return false;
    const cleanData = sanitizeForFirestore(data);
    await setDoc(docRef, cleanData, options);
    return true;
  } catch (err: any) {
    console.warn(`[Firestore] safeFirestoreSetDoc caught error on ${docRef?.path || 'document'}:`, err?.message || err);
    return false;
  }
}

// Managed User Account Model for Firebase Authentication & User Management
export interface AuthorizedDevice {
  deviceId: string;
  deviceName: string;
  firstLogin: string;
  lastActive: string;
  os?: string;
  browser?: string;
  appName?: string;
  usedApps?: string[]; // E.g. ['KHBD AI PRO', 'Soạn đề kiểm tra']
  hardwareSig?: string;
}

export interface LoginHistoryLog {
  timestamp: string;
  date: string;
  deviceName: string;
}

export interface ManagedUserAccount {
  id: string;
  username: string; // Tên đăng nhập hoặc Email
  fullName: string; // Họ và tên giáo viên / người dùng
  avatar?: string; // Ảnh đại diện (Data URL Base64 hoặc URL ảnh) lưu trữ trên Firestore
  email?: string;
  phone?: string;
  schoolName: string; // Đơn vị công tác / Trường học
  role: 'admin' | 'teacher'; // Phân quyền
  status: 'active' | 'locked' | 'new'; // Trạng thái tài khoản: active (hoạt động), locked (bị khóa), new (mới tạo/chờ cấp quyền)
  accessCode?: string; // Mật khẩu / Mã kích hoạt
  createdAt: string; // Ngày cấp tài khoản
  expiresAt?: string; // Ngày hết hạn (hoặc 'Vĩnh viễn')
  notes?: string; // Ghi chú của Admin
  lastLogin?: string; // Đăng nhập gần nhất
  maxDevices?: number; // Giới hạn số máy đăng nhập (mặc định 2 máy)
  authorizedDevices?: AuthorizedDevice[]; // Danh sách các máy đã liên kết
  loginCountToday?: number; // Số lần đăng nhập trong ngày
  lastLoginDate?: string; // Ngày đăng nhập gần nhất (dd/mm/yyyy)
  totalLoginCount?: number; // Tổng số lượt đăng nhập tích lũy
  loginLogs?: LoginHistoryLog[]; // Nhật ký chi tiết lịch sử các lần đăng nhập
  activeMinutesToday?: number; // Tổng thời gian hoạt động trong ngày (phút)
  activeSecondsToday?: number; // Tổng thời gian hoạt động trong ngày (giây) - Đếm giờ thực tế
  lastActiveDate?: string; // Ngày hoạt động gần nhất (dd/mm/yyyy)
  lastActiveTimestamp?: number; // Timestamp ms của nhịp tim gần nhất
  trialGenerations?: number; // Số lần dùng thử tạo giáo án (mặc định 0, max 5)
  maxTrialGenerations?: number; // Số lượt dùng thử tối đa được phép (mặc định 5, tài khoản mới là 0)
  updatedAt?: string; // Thời điểm cập nhật cuối cùng (ISO string)
}

// Default initial user accounts (System Administrators)
export const DEFAULT_USER_ACCOUNTS: ManagedUserAccount[] = [
  {
    id: 'user_admin_01',
    username: 'admin@123',
    fullName: 'Quản Trị Viên Hệ Thống (Admin)',
    email: 'admin@123',
    phone: '0978468986',
    schoolName: 'Ban Quản Trị Hệ Thống KHBD AI PRO',
    role: 'admin',
    status: 'active',
    accessCode: '111111',
    createdAt: '01/01/2025',
    expiresAt: 'Vĩnh viễn',
    notes: 'Tài khoản Quản trị viên cấp cao - Toàn quyền quản lý.',
    lastLogin: 'Hôm nay, 10:30',
    maxDevices: 10,
    authorizedDevices: [],
    maxTrialGenerations: 9999,
    trialGenerations: 0,
    loginCountToday: 0,
    activeSecondsToday: 0,
    activeMinutesToday: 0,
    totalLoginCount: 1,
    loginLogs: [],
  },
];

// Persistent Deleted Users Blacklist (Prevents deleted accounts from ever reappearing on client sync)
export function getDeletedUserKeys(): Set<string> {
  const keys = new Set<string>();

  try {
    const saved = localStorage.getItem('khbd_deleted_user_ids');
    if (saved) {
      const arr: string[] = JSON.parse(saved);
      if (Array.isArray(arr)) {
        // System admin account that must NEVER be deleted
        const activeProtectedKeys = new Set<string>(['admin@123', 'user_admin_01']);

        arr.forEach((k) => {
          const clean = String(k).trim().toLowerCase();
          if (clean && !activeProtectedKeys.has(clean)) {
            keys.add(clean);
          }
        });
      }
    }
  } catch {}
  return keys;
}

export function registerDeletedUserKeys(keys: string[]) {
  try {
    const current = Array.from(getDeletedUserKeys());
    const newKeys = keys.map((k) => String(k).trim().toLowerCase()).filter(Boolean);
    const updated = Array.from(new Set([...current, ...newKeys]));
    localStorage.setItem('khbd_deleted_user_ids', JSON.stringify(updated));
  } catch {}
}

export function unregisterDeletedUserKeys(keys: string[]) {
  try {
    const current = Array.from(getDeletedUserKeys());
    const keysToRemove = new Set(keys.map((k) => String(k).trim().toLowerCase()).filter(Boolean));
    const updated = current.filter(k => !keysToRemove.has(k));
    localStorage.setItem('khbd_deleted_user_ids', JSON.stringify(updated));
  } catch {}
}

// Helper: Sanitize & Strictly Deduplicate user accounts to eliminate duplicate React keys
export function sanitizeUserAccounts(list: ManagedUserAccount[]): ManagedUserAccount[] {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_USER_ACCOUNTS;
  const deletedKeys = getDeletedUserKeys();
  const seenIds = new Set<string>();
  const seenUsernames = new Set<string>();
  const result: ManagedUserAccount[] = [];
  const todayDateStr = new Date().toLocaleDateString('vi-VN');

  for (const item of list) {
    if (!item || !item.id || !item.username) continue;
    const normalizedId = item.id.trim().toLowerCase();
    const normalizedUsername = item.username.trim().toLowerCase();
    const normalizedEmail = (item.email || '').trim().toLowerCase();

    // STRICTLY REJECT DELETED ACCOUNTS PERMANENTLY
    if (
      deletedKeys.has(normalizedId) ||
      deletedKeys.has(normalizedUsername) ||
      (normalizedEmail && deletedKeys.has(normalizedEmail))
    ) {
      continue;
    }

    // Prevent duplicate user_admin_01 or duplicate usernames
    if (seenIds.has(item.id) || seenUsernames.has(normalizedUsername)) {
      continue;
    }
    seenIds.add(item.id);
    seenUsernames.add(normalizedUsername);

    const isSameDay = item.lastLoginDate === todayDateStr || item.lastActiveDate === todayDateStr;
    const loginCountToday = isSameDay ? (item.loginCountToday || 0) : 0;
    const activeSecondsToday = isSameDay 
      ? (item.activeSecondsToday !== undefined ? item.activeSecondsToday : (item.activeMinutesToday ? item.activeMinutesToday * 60 : 0)) 
      : 0;
    const activeMinutesToday = Math.floor(activeSecondsToday / 60);

    result.push({
      ...item,
      accessCode: item.accessCode || (item as any).password,
      expiresAt: item.expiresAt || (item as any).validUntil || 'Chưa cấp',
      maxDevices: item.maxDevices !== undefined ? item.maxDevices : (item.role === 'admin' ? 10 : 2),
      authorizedDevices: deduplicateAuthorizedDevices(Array.isArray(item.authorizedDevices) ? item.authorizedDevices : []),
      loginCountToday,
      activeSecondsToday,
      activeMinutesToday,
      totalLoginCount: item.totalLoginCount || 0,
      loginLogs: Array.isArray(item.loginLogs) ? item.loginLogs : [],
    });
  }

  // Ensure primary admin@123 always exists once
  if (!seenUsernames.has('admin@123') && !deletedKeys.has('admin@123')) {
    result.unshift(DEFAULT_USER_ACCOUNTS[0]);
  }
  return result;
}

// Helper: fetch from server storage API
async function fetchServerRepo(): Promise<{ books?: any[]; ppcts?: any[]; userAccounts?: any[] } | null> {
  try {
    const res = await fetch('/api/repository/all');
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return data;
      }
    }
  } catch {
    // server API not reachable or running client-only
  }
  return null;
}

// Helper: sync data to server
async function postServerSync(endpoint: string, payload: any): Promise<boolean> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Bulk Sync All Data to Server
export async function bulkSyncToServer(books: CustomUploadedBook[], ppcts: CustomUploadedPPCT[], userAccounts: ManagedUserAccount[]): Promise<boolean> {
  return postServerSync('/api/repository/bulk-sync', { books, ppcts, userAccounts });
}

// Helper to get all locally cached accounts
function getLocalCachedAccounts(): ManagedUserAccount[] {
  try {
    const saved = localStorage.getItem('khbd_managed_user_accounts');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return [];
}

// Helper: Determine if an account's expiresAt represents a genuine granted expiration date or permanent status
export function isExplicitGrantedDate(val?: string): boolean {
  if (!val || typeof val !== 'string') return false;
  const clean = val.trim().toLowerCase();
  if (
    clean === '' ||
    clean === 'chưa cấp' ||
    clean === 'tạm khóa' ||
    clean === 'chờ cấp quyền' ||
    clean === 'hết hạn' ||
    clean.includes('dùng thử') ||
    clean.includes('lượt')
  ) {
    return false;
  }
  if (clean === 'vĩnh viễn') return true;
  // Match DD/MM/YYYY or YYYY-MM-DD
  return /\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(clean);
}

// Helper: Parse date string into numerical timestamp for comparison
export function parseDateToTimestamp(val?: string): number {
  if (!val || typeof val !== 'string') return 0;
  const clean = val.trim();
  if (clean.toLowerCase() === 'vĩnh viễn') return 9999999999999;
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const y = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const d = Number(parts[2]);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d, 23, 59, 59).getTime();
      }
    } else {
      // DD/MM/YYYY
      const d = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const y = Number(parts[2]);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d, 23, 59, 59).getTime();
      }
    }
  }
  const parsed = new Date(clean).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

// Helper: Merge 2 account records cleanly, prioritizing newest timestamp or active granted permissions
export function mergeTwoAccounts(existing: ManagedUserAccount, incoming: ManagedUserAccount): ManagedUserAccount {
  if (!existing) return incoming;
  if (!incoming) return existing;

  const tExisting = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
  const tIncoming = incoming.updatedAt ? new Date(incoming.updatedAt).getTime() : 0;

  let base: ManagedUserAccount;
  if (tIncoming > tExisting) {
    base = { ...existing, ...incoming };
  } else if (tExisting > tIncoming) {
    base = { ...incoming, ...existing };
  } else {
    base = { ...existing, ...incoming };
  }

  // Preserve granted expiration date if one has a valid active date / permanent expiration
  const isExistingGrantedDate = isExplicitGrantedDate(existing.expiresAt);
  const isIncomingGrantedDate = isExplicitGrantedDate(incoming.expiresAt);

  if (isExistingGrantedDate && !isIncomingGrantedDate) {
    base.expiresAt = existing.expiresAt;
    base.maxTrialGenerations = Math.max(existing.maxTrialGenerations ?? 9999, 9999);
    if (existing.status === 'active' && base.status === 'new') {
      base.status = 'active';
    }
  } else if (isIncomingGrantedDate && !isExistingGrantedDate) {
    base.expiresAt = incoming.expiresAt;
    base.maxTrialGenerations = Math.max(incoming.maxTrialGenerations ?? 9999, 9999);
    if (incoming.status === 'active' && base.status === 'new') {
      base.status = 'active';
    }
  } else if (isExistingGrantedDate && isIncomingGrantedDate) {
    if (existing.expiresAt === 'Vĩnh viễn' || incoming.expiresAt === 'Vĩnh viễn') {
      base.expiresAt = 'Vĩnh viễn';
      base.maxTrialGenerations = 9999;
    } else {
      const tE = parseDateToTimestamp(existing.expiresAt);
      const tI = parseDateToTimestamp(incoming.expiresAt);
      // Keep whichever date is later to prevent losing extended subscription periods
      if (tI >= tE) {
        base.expiresAt = incoming.expiresAt;
      } else {
        base.expiresAt = existing.expiresAt;
      }
      base.maxTrialGenerations = 9999;
    }
  }

  // Preserve higher maxTrialGenerations if user was granted 9999 or upgraded turns
  const maxTrials = Math.max(existing.maxTrialGenerations ?? 0, incoming.maxTrialGenerations ?? 0);
  if (maxTrials > 0) {
    base.maxTrialGenerations = maxTrials;
  }

  // Preserve real school name if base holds a placeholder default string
  const isDefaultSchool = (s?: string) => !s || s === 'Trường THCS / THPT' || s === 'Trường THCS & THPT' || s === 'Chưa cập nhật trường' || s === 'Trường THCS';
  if (existing.schoolName && !isDefaultSchool(existing.schoolName) && isDefaultSchool(base.schoolName)) {
    base.schoolName = existing.schoolName;
  } else if (incoming.schoolName && !isDefaultSchool(incoming.schoolName) && isDefaultSchool(base.schoolName)) {
    base.schoolName = incoming.schoolName;
  }

  return base;
}

export function mergeAccountLists(...lists: (ManagedUserAccount[] | undefined)[]): ManagedUserAccount[] {
  const mergedMap = new Map<string, ManagedUserAccount>();
  const deletedKeys = getDeletedUserKeys();

  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const acc of list) {
      if (!acc || (!acc.id && !acc.username)) continue;
      const normalizedId = (acc.id || '').trim().toLowerCase();
      const normalizedUsername = (acc.username || '').trim().toLowerCase();
      const normalizedEmail = (acc.email || '').trim().toLowerCase();

      if (
        (normalizedId && deletedKeys.has(normalizedId)) ||
        (normalizedUsername && deletedKeys.has(normalizedUsername)) ||
        (normalizedEmail && deletedKeys.has(normalizedEmail))
      ) {
        continue;
      }

      const key = normalizedUsername || normalizedId;
      const existing = mergedMap.get(key);
      if (existing) {
        mergedMap.set(key, mergeTwoAccounts(existing, acc));
      } else {
        mergedMap.set(key, acc);
      }
    }
  }

  return sanitizeUserAccounts(Array.from(mergedMap.values()));
}

// Subscribe to user accounts for real-time updates with resilient multi-source merging
export function subscribeToUserAccounts(callback: (accounts: ManagedUserAccount[]) => void): () => void {
  // First, instantly trigger callback with local/server accounts so UI is immediate
  const initialLocal = getLocalCachedAccounts();
  const initialMerged = mergeAccountLists(DEFAULT_USER_ACCOUNTS, initialLocal);
  callback(initialMerged);

  // Sync deleted keys from Firestore system_metadata/deleted_accounts
  let unsubMeta: (() => void) | null = null;
  try {
    const metaRef = doc(db, 'system_metadata', 'deleted_accounts');
    unsubMeta = onSnapshot(metaRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.keys) && data.keys.length > 0) {
          registerDeletedUserKeys(data.keys);
        }
      }
    }, () => {});
  } catch {}

  // Also fetch server storage in background
  fetchServerRepo().then((serverData) => {
    if (serverData && Array.isArray(serverData.userAccounts) && serverData.userAccounts.length > 0) {
      const deletedKeys = getDeletedUserKeys();
      const validServer = serverData.userAccounts.filter((a) => {
        const uId = (a.id || '').trim().toLowerCase();
        const uUsername = (a.username || '').trim().toLowerCase();
        const uEmail = (a.email || '').trim().toLowerCase();
        return !deletedKeys.has(uId) && !deletedKeys.has(uUsername) && (!uEmail || !deletedKeys.has(uEmail));
      });
      const merged = mergeAccountLists(DEFAULT_USER_ACCOUNTS, validServer);
      try {
        localStorage.setItem('khbd_managed_user_accounts', JSON.stringify(merged));
      } catch {}
      callback(merged);
    }
  });

  const usersCol = collection(db, 'user_accounts');
  
  // Real-time listener from Firestore
  const unsubUsers = onSnapshot(usersCol, (snap) => {
    const firestoreAccounts: ManagedUserAccount[] = [];
    snap.forEach((d) => {
      firestoreAccounts.push(d.data() as ManagedUserAccount);
    });

    const deletedKeys = getDeletedUserKeys();
    const validFirestore = firestoreAccounts.filter((a) => {
      const uId = (a.id || '').trim().toLowerCase();
      const uUsername = (a.username || '').trim().toLowerCase();
      const uEmail = (a.email || '').trim().toLowerCase();
      return !deletedKeys.has(uId) && !deletedKeys.has(uUsername) && (!uEmail || !deletedKeys.has(uEmail));
    });

    const local = getLocalCachedAccounts();
    const merged = mergeAccountLists(DEFAULT_USER_ACCOUNTS, local, validFirestore);

    try {
      localStorage.setItem('khbd_managed_user_accounts', JSON.stringify(merged));
    } catch {}

    // Background sync to server disk storage
    postServerSync('/api/repository/bulk-sync', { userAccounts: merged });

    callback(merged);
  }, (error) => {
    // Graceful offline fallback without crashing or spamming console
    console.warn("Firestore user listener operating in offline/fallback mode:", error?.message || error);
    const local = getLocalCachedAccounts();
    callback(mergeAccountLists(DEFAULT_USER_ACCOUNTS, local));
  });

  return () => {
    try { unsubUsers(); } catch {}
    try { if (unsubMeta) unsubMeta(); } catch {}
  };
}

// Load all managed user accounts from Firestore / Server / Local / Defaults with full merging
export async function loadUserAccountsFromFirestore(): Promise<ManagedUserAccount[]> {
  // 1. Fetch from Firestore
  let firestoreAccounts: ManagedUserAccount[] = [];
  try {
    const usersCol = collection(db, 'user_accounts');
    const snap = await getDocs(usersCol);
    snap.forEach((d) => {
      firestoreAccounts.push(d.data() as ManagedUserAccount);
    });
  } catch {}

  const deletedKeys = getDeletedUserKeys();
  const validFirestore = firestoreAccounts.filter((a) => {
    const uId = (a.id || '').trim().toLowerCase();
    const uUsername = (a.username || '').trim().toLowerCase();
    const uEmail = (a.email || '').trim().toLowerCase();
    return !deletedKeys.has(uId) && !deletedKeys.has(uUsername) && (!uEmail || !deletedKeys.has(uEmail));
  });

  const merged = mergeAccountLists(DEFAULT_USER_ACCOUNTS, validFirestore);

  try {
    localStorage.setItem('khbd_managed_user_accounts', JSON.stringify(merged));
  } catch {}
  postServerSync('/api/repository/bulk-sync', { userAccounts: merged });

  return merged;
}

// Export Accounts to a downloadable JSON file for Google Drive or Offline storage
export function exportAccountsToJSONFile(accounts: ManagedUserAccount[]) {
  const exportPayload = {
    appName: 'KHBD AI PRO',
    exportType: 'USER_ACCOUNTS_BACKUP',
    exportedAt: new Date().toISOString(),
    totalAccounts: accounts.length,
    userAccounts: accounts,
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `KHBD_AI_PRO_Danh_Sach_Tai_Khoan_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import accounts from a JSON backup file
export async function importAccountsFromJSON(jsonText: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const data = JSON.parse(jsonText);
    let accountsToImport: ManagedUserAccount[] = [];

    if (Array.isArray(data)) {
      accountsToImport = data;
    } else if (data && Array.isArray(data.userAccounts)) {
      accountsToImport = data.userAccounts;
    } else {
      return { success: false, count: 0, error: 'Tệp không chứa danh sách tài khoản hợp lệ.' };
    }

    if (accountsToImport.length === 0) {
      return { success: false, count: 0, error: 'Tệp rỗng hoặc không có tài khoản nào.' };
    }

    const current = await loadUserAccountsFromFirestore();
    const mergedMap = new Map<string, ManagedUserAccount>();
    for (const a of current) {
      if (a && a.id) mergedMap.set(a.id, a);
    }
    for (const a of accountsToImport) {
      if (a && (a.id || a.username)) {
        const id = a.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const validAcc: ManagedUserAccount = {
          ...a,
          id,
          username: a.username || id,
          accessCode: a.accessCode || (a as any).password || '123456',
          role: a.role === 'admin' ? 'admin' : 'teacher',
          status: a.status === 'locked' ? 'locked' : 'active',
          maxDevices: a.maxDevices !== undefined ? a.maxDevices : (a.role === 'admin' ? 10 : 2),
          authorizedDevices: Array.isArray(a.authorizedDevices) ? a.authorizedDevices : [],
        };
        mergedMap.set(id, validAcc);
      }
    }

    const mergedList = sanitizeUserAccounts(Array.from(mergedMap.values()));
    try {
      localStorage.setItem('khbd_managed_user_accounts', JSON.stringify(mergedList));
    } catch {}

    // Bulk sync to server
    await postServerSync('/api/repository/bulk-sync', { userAccounts: mergedList });

    // Sync all to Firestore
    for (const acc of mergedList) {
      const userRef = doc(db, 'user_accounts', acc.id);
      safeFirestoreSetDoc(userRef, { ...acc, updatedAt: new Date().toISOString() }, { merge: true });
    }

    return { success: true, count: mergedList.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Không thể đọc tệp sao lưu JSON.' };
  }
}

// Save or Update a user account

export async function updateUserActivityInFirestore(accountId: string, activityData: Partial<ManagedUserAccount>): Promise<boolean> {
  try {
    const userRef = doc(db, 'user_accounts', accountId);
    await safeFirestoreSetDoc(userRef, {
      ...activityData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    postServerSync('/api/repository/update-user-activity', { id: accountId, ...activityData });
  } catch {}
  return true;
}

export async function saveUserAccountToFirestore(
  account: ManagedUserAccount,
  isExplicitAdminAction: boolean = false
): Promise<boolean> {
  const nowIso = new Date().toISOString();

  let safeAccount = { ...account };

  // Guard against accidental downgrades:
  // If not an explicit admin operation (e.g. heartbeat, device login, client state save),
  // NEVER downgrade an existing granted expiration date to 'Chưa cấp' or trial!
  if (!isExplicitAdminAction) {
    const localList = getLocalCachedAccounts();
    const existing = localList.find(
      (a) =>
        (a.id && account.id && a.id.toLowerCase() === account.id.toLowerCase()) ||
        (a.username && account.username && a.username.toLowerCase() === account.username.toLowerCase())
    );
    if (existing && isExplicitGrantedDate(existing.expiresAt) && !isExplicitGrantedDate(account.expiresAt)) {
      safeAccount.expiresAt = existing.expiresAt;
      safeAccount.maxTrialGenerations = Math.max(existing.maxTrialGenerations ?? 9999, 9999);
      if (existing.status === 'active' && safeAccount.status === 'new') {
        safeAccount.status = 'active';
      }
    }
  }

  const accountWithTimestamp: ManagedUserAccount = {
    ...safeAccount,
    updatedAt: nowIso,
  };

  const keysToUnban = [account.id, account.username, account.email || ''].filter(Boolean);

  // 0. Unban the keys so this user is not accidentally filtered out if it was previously deleted
  unregisterDeletedUserKeys(keysToUnban);
  try {
    const metaRef = doc(db, 'system_metadata', 'deleted_accounts');
    await safeFirestoreSetDoc(metaRef, { keys: arrayRemove(...keysToUnban), updatedAt: new Date().toISOString() }, { merge: true });
  } catch {}

  // 1. Immediately update Local Storage synchronously so it is instantly persisted
  try {
    const saved = localStorage.getItem('khbd_managed_user_accounts');
    const current: ManagedUserAccount[] = saved ? JSON.parse(saved) : DEFAULT_USER_ACCOUNTS;
    const updated = sanitizeUserAccounts([
      accountWithTimestamp,
      ...current.filter((a) => a.id !== account.id && a.username.toLowerCase() !== account.username.toLowerCase()),
    ]);
    localStorage.setItem('khbd_managed_user_accounts', JSON.stringify(updated));
  } catch {}

  // 2. Sync to Server API repository immediately
  postServerSync('/api/repository/save-user', accountWithTimestamp);

  // 3. Sync to Firestore async
  try {
    const userRef = doc(db, 'user_accounts', accountWithTimestamp.id);
    await safeFirestoreSetDoc(userRef, accountWithTimestamp, { merge: true });
  } catch (error) {
    console.error("Firestore save error:", error);
  }

  return true;
}

// Check & Authorize Device on Login
export async function checkAndAuthorizeDevice(
  account: ManagedUserAccount,
  machine: DeviceInfo | { machineId: string; deviceName: string; os?: string; browser?: string; hardwareSig?: string; appName?: string }
): Promise<{ allowed: boolean; reason?: string; updatedAccount?: ManagedUserAccount }> {
  if (account.status === 'locked') {
    return {
      allowed: false,
      reason: 'Tài khoản này đang bị tạm khóa. Vui lòng liên hệ Quản trị viên để được mở khóa!',
    };
  }

  // Ensure we preserve the freshest active granted date from local cache if account object was stale
  const localList = getLocalCachedAccounts();
  const existingCached = localList.find(
    (a) =>
      (a.id && account.id && a.id.toLowerCase() === account.id.toLowerCase()) ||
      (a.username && account.username && a.username.toLowerCase() === account.username.toLowerCase())
  );
  const effectiveExpiresAt =
    existingCached && isExplicitGrantedDate(existingCached.expiresAt) && !isExplicitGrantedDate(account.expiresAt)
      ? existingCached.expiresAt
      : account.expiresAt;
  const effectiveMaxTrials =
    existingCached && isExplicitGrantedDate(existingCached.expiresAt)
      ? Math.max(existingCached.maxTrialGenerations ?? 9999, 9999)
      : account.maxTrialGenerations;
  const effectiveStatus =
    existingCached && existingCached.status === 'active' && account.status === 'new'
      ? 'active'
      : account.status;

  const nowStr = new Date().toLocaleString('vi-VN');
  const todayDateStr = new Date().toLocaleDateString('vi-VN');
  
  // 1. Always deduplicate existing devices first so duplicate browser/app entries are cleaned up
  const rawDevices = Array.isArray(account.authorizedDevices) ? [...account.authorizedDevices] : [];
  const devices = deduplicateAuthorizedDevices(rawDevices);
  const maxAllowed = account.maxDevices !== undefined ? account.maxDevices : (account.role === 'admin' ? 10 : 2);

  // Compute login counts
  const isSameDay = account.lastLoginDate === todayDateStr;
  const newTodayCount = isSameDay ? (account.loginCountToday || 0) + 1 : 1;
  const newTotalCount = (account.totalLoginCount || 0) + 1;

  const currentAppName = (machine as any).appName || 'KHBD AI PRO';
  const newLog: LoginHistoryLog = {
    timestamp: nowStr,
    date: todayDateStr,
    deviceName: `${machine.deviceName || 'Máy tính'}${machine.browser ? ` (${machine.browser})` : ''}`,
  };
  const existingLogs = Array.isArray(account.loginLogs) ? account.loginLogs : [];
  const updatedLogs = [newLog, ...existingLogs].slice(0, 50);

  // 2. Check if current machine matches any already authorized device on this account:
  // Checks exact deviceId, hardwareSig, or physical hardware specs (same OS, CPU cores, resolution)
  const existingIndex = devices.findIndex((d) => isSamePhysicalMachine(d, machine));

  if (existingIndex >= 0) {
    // Already recognized physical machine! (Could be a 2nd application, different browser, or new tab on the same PC)
    const existing = devices[existingIndex];
    
    // Combine browsers
    const browserList = Array.from(
      new Set([
        ...(existing.browser ? existing.browser.split(/[,/]/).map((s) => s.trim()) : []),
        ...(machine.browser ? [machine.browser.trim()] : []),
      ])
    ).filter(Boolean);

    // Combine used apps
    const usedAppsList = Array.from(
      new Set([
        ...(existing.usedApps || []),
        existing.appName,
        currentAppName,
      ])
    ).filter(Boolean) as string[];

    devices[existingIndex] = {
      ...existing,
      lastActive: nowStr,
      deviceName: machine.deviceName || existing.deviceName,
      os: machine.os || existing.os,
      browser: browserList.length > 0 ? browserList.join(', ') : (machine.browser || existing.browser),
      appName: currentAppName,
      usedApps: usedAppsList.length > 0 ? usedAppsList : ['KHBD AI PRO'],
      hardwareSig: (machine as any).hardwareSig || existing.hardwareSig,
    };

    const updatedAccount: ManagedUserAccount = {
      ...account,
      expiresAt: effectiveExpiresAt,
      maxTrialGenerations: effectiveMaxTrials,
      status: effectiveStatus,
      lastLogin: nowStr,
      lastLoginDate: todayDateStr,
      loginCountToday: newTodayCount,
      totalLoginCount: newTotalCount,
      loginLogs: updatedLogs,
      authorizedDevices: devices,
    };
    await saveUserAccountToFirestore(updatedAccount);
    return { allowed: true, updatedAccount };
  }

  // 3. New physical machine trying to log in
  if (devices.length >= maxAllowed) {
    return {
      allowed: false,
      reason: `Tài khoản của bạn đã được liên kết với tối đa ${maxAllowed} máy tính vật lý (${devices.map(d => d.deviceName).join(', ')}). Mỗi tài khoản chỉ được phép đăng nhập đúng ${maxAllowed} máy tính. Nếu bạn dùng nhiều ứng dụng trên cùng một máy, hệ thống sẽ tự động gộp chung và KHÔNG tính thành 2 máy. Nếu bạn vừa cài lại máy hoặc muốn đổi sang máy mới, vui lòng liên hệ Quản trị viên để được ĐẶT LẠI thiết bị!`,
    };
  }

  // Under limit -> authorize new physical machine
  const newDevice: AuthorizedDevice = {
    deviceId: machine.machineId,
    deviceName: machine.deviceName || `Máy tính #${devices.length + 1}`,
    firstLogin: nowStr,
    lastActive: nowStr,
    os: machine.os,
    browser: machine.browser,
    appName: currentAppName,
    usedApps: [currentAppName],
    hardwareSig: (machine as any).hardwareSig,
  };

  const updatedDevices = [...devices, newDevice];
  const updatedAccount: ManagedUserAccount = {
    ...account,
    expiresAt: effectiveExpiresAt,
    maxTrialGenerations: effectiveMaxTrials,
    status: effectiveStatus,
    lastLogin: nowStr,
    lastLoginDate: todayDateStr,
    loginCountToday: newTodayCount,
    totalLoginCount: newTotalCount,
    loginLogs: updatedLogs,
    authorizedDevices: updatedDevices,
  };

  await saveUserAccountToFirestore(updatedAccount);
  return { allowed: true, updatedAccount };
}

/**
 * Deduplicates all authorized devices across all user accounts in Firestore.
 * Merges duplicate entries where the same physical computer was registered under 2 browsers or 2 applications.
 */
export async function deduplicateAllUserAccountsDevicesInFirestore(): Promise<{ modifiedCount: number; totalAccounts: number }> {
  try {
    const accounts = await loadUserAccountsFromFirestore();
    let modifiedCount = 0;

    for (const acc of accounts) {
      const raw = Array.isArray(acc.authorizedDevices) ? acc.authorizedDevices : [];
      if (raw.length > 1) {
        const deduped = deduplicateAuthorizedDevices(raw);
        if (deduped.length !== raw.length) {
          const updated: ManagedUserAccount = {
            ...acc,
            authorizedDevices: deduped,
          };
          await saveUserAccountToFirestore(updated);
          modifiedCount++;
        }
      }
    }

    return { modifiedCount, totalAccounts: accounts.length };
  } catch (err) {
    console.error('Error deduplicating all accounts devices:', err);
    return { modifiedCount: 0, totalAccounts: 0 };
  }
}

// Reset daily login count & active timer for a user account (Admin monitoring feature)
export async function resetUserLoginCountTodayInFirestore(accountId: string): Promise<boolean> {
  const accounts = await loadUserAccountsFromFirestore();
  const target = accounts.find((a) => a.id === accountId);
  if (!target) return false;

  const updatedAccount: ManagedUserAccount = {
    ...target,
    loginCountToday: 0,
    activeMinutesToday: 0,
    activeSecondsToday: 0,
  };
  return saveUserAccountToFirestore(updatedAccount);
}

// Format active duration in seconds (or minutes) to human readable Vietnamese string with real-time live seconds (e.g., 5 giờ 30 phút 12 giây or 1 phút 25 giây)
export function formatActiveTime(secondsOrMinutes?: number): string {
  if (!secondsOrMinutes || secondsOrMinutes <= 0) return '0 giây';

  const totalSeconds = Math.floor(secondsOrMinutes);
  if (totalSeconds < 60) return `${totalSeconds} giây`;

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h === 0) {
    return s > 0 ? `${m} phút ${s} giây` : `${m} phút`;
  }
  if (m === 0 && s === 0) return `${h} giờ`;
  if (s === 0) return `${h} giờ ${m} phút`;
  return `${h} giờ ${m} phút ${s} giây`;
}

// Session Heartbeat & Continuous Inactivity Gap Tracker
export async function recordUserHeartbeat(account: ManagedUserAccount, addSeconds: number = 0): Promise<ManagedUserAccount> {
  if (!account || !account.id) return account;

  const now = Date.now();
  const nowStr = new Date().toLocaleString('vi-VN');
  const todayDateStr = new Date().toLocaleDateString('vi-VN');
  const lastActiveDate = account.lastActiveDate || account.lastLoginDate;
  const isSameDay = lastActiveDate === todayDateStr;

  let loginCountToday = isSameDay ? (account.loginCountToday || 1) : 1;
  let activeSecondsToday = isSameDay 
    ? (account.activeSecondsToday !== undefined ? account.activeSecondsToday : (account.activeMinutesToday ? account.activeMinutesToday * 60 : 0)) 
    : 0;
  let totalLoginCount = account.totalLoginCount || 1;
  let loginLogs = Array.isArray(account.loginLogs) ? [...account.loginLogs] : [];

  const lastTs = account.lastActiveTimestamp || 0;
  const timeSinceLastActive = now - lastTs;

  // If user returns after > 30 minutes of inactivity or a new day started
  const isNewSessionGap = lastTs > 0 && timeSinceLastActive > 30 * 60 * 1000;
  const isNewDay = !isSameDay;

  if (isNewDay || isNewSessionGap) {
    loginCountToday = isNewDay ? 1 : loginCountToday + 1;
    totalLoginCount += 1;
    const newLog: LoginHistoryLog = {
      timestamp: nowStr,
      date: todayDateStr,
      deviceName: 'Máy tính (Nhận diện phiên quay lại)',
    };
    loginLogs = [newLog, ...loginLogs].slice(0, 50);
  }

  activeSecondsToday += addSeconds;
  const activeMinutesToday = Math.floor(activeSecondsToday / 60);

  const localList = getLocalCachedAccounts();
  const existingCached = localList.find(
    (a) =>
      (a.id && account.id && a.id.toLowerCase() === account.id.toLowerCase()) ||
      (a.username && account.username && a.username.toLowerCase() === account.username.toLowerCase())
  );
  const effectiveExpiresAt =
    existingCached && isExplicitGrantedDate(existingCached.expiresAt) && !isExplicitGrantedDate(account.expiresAt)
      ? existingCached.expiresAt
      : account.expiresAt;
  const effectiveMaxTrials =
    existingCached && isExplicitGrantedDate(existingCached.expiresAt)
      ? Math.max(existingCached.maxTrialGenerations ?? 9999, 9999)
      : account.maxTrialGenerations;
  const effectiveStatus =
    existingCached && existingCached.status === 'active' && account.status === 'new'
      ? 'active'
      : account.status;

  const updatedAccount: ManagedUserAccount = {
    ...account,
    expiresAt: effectiveExpiresAt,
    maxTrialGenerations: effectiveMaxTrials,
    status: effectiveStatus,
    lastLogin: nowStr,
    lastLoginDate: todayDateStr,
    lastActiveDate: todayDateStr,
    lastActiveTimestamp: now,
    loginCountToday,
    activeSecondsToday,
    activeMinutesToday,
    totalLoginCount,
    loginLogs,
  };

  await saveUserAccountToFirestore(updatedAccount);
  return updatedAccount;
}

// Reset/Clear all authorized devices for a user (Admin feature for reinstalled OS or new PC)
export async function resetUserDevicesInFirestore(accountId: string): Promise<boolean> {
  // 1. Immediately update Local Storage
  try {
    const saved = localStorage.getItem('khbd_managed_user_accounts');
    if (saved) {
      const localList: ManagedUserAccount[] = JSON.parse(saved);
      const updatedLocal = localList.map((a) =>
        a.id === accountId || a.username === accountId || a.email === accountId
          ? { ...a, authorizedDevices: [] }
          : a
      );
      localStorage.setItem('khbd_managed_user_accounts', JSON.stringify(updatedLocal));
    }
  } catch {}

  try {
    const currentSaved = localStorage.getItem('khbd_current_user');
    if (currentSaved) {
      const curUser = JSON.parse(currentSaved);
      if (curUser && (curUser.id === accountId || curUser.username === accountId || curUser.email === accountId)) {
        localStorage.setItem('khbd_current_user', JSON.stringify({ ...curUser, authorizedDevices: [] }));
      }
    }
  } catch {}

  // 2. Server Sync
  postServerSync('/api/repository/reset-devices', { id: accountId });

  // 3. Firestore directly
  try {
    const userRef = doc(db, 'user_accounts', accountId);
    await safeFirestoreSetDoc(userRef, { authorizedDevices: [], updatedAt: new Date().toISOString() }, { merge: true });

    // Also update any matching doc by username/email
    const usersCol = collection(db, 'user_accounts');
    const snap = await getDocs(usersCol);
    for (const d of snap.docs) {
      const data = d.data();
      if (d.id === accountId || data.username === accountId || data.email === accountId) {
        await safeFirestoreSetDoc(doc(db, 'user_accounts', d.id), { authorizedDevices: [], updatedAt: new Date().toISOString() }, { merge: true });
      }
    }
  } catch (e) {
    console.error('Error resetting user devices in firestore:', e);
  }

  return true;
}

// Remove a single device from authorized devices list (Admin feature)
export async function removeUserDeviceInFirestore(accountId: string, deviceId: string): Promise<boolean> {
  const accounts = await loadUserAccountsFromFirestore();
  const target = accounts.find((a) => a.id === accountId || a.username === accountId);
  if (!target) return false;

  const updatedDevices = (target.authorizedDevices || []).filter((d) => d.deviceId !== deviceId);
  const updatedAccount: ManagedUserAccount = {
    ...target,
    authorizedDevices: updatedDevices,
  };

  try {
    const userRef = doc(db, 'user_accounts', target.id);
    await safeFirestoreSetDoc(userRef, { authorizedDevices: updatedDevices, updatedAt: new Date().toISOString() }, { merge: true });
  } catch {}

  return saveUserAccountToFirestore(updatedAccount);
}

// Update maximum allowed devices limit for a user (Admin feature)
export async function updateUserMaxDevicesInFirestore(accountId: string, newMax: number): Promise<boolean> {
  const accounts = await loadUserAccountsFromFirestore();
  const target = accounts.find((a) => a.id === accountId || a.username === accountId);
  if (!target) return false;

  const updatedAccount: ManagedUserAccount = {
    ...target,
    maxDevices: Math.max(0, newMax),
  };

  try {
    const userRef = doc(db, 'user_accounts', target.id);
    await safeFirestoreSetDoc(userRef, { maxDevices: Math.max(0, newMax), updatedAt: new Date().toISOString() }, { merge: true });
  } catch {}

  return saveUserAccountToFirestore(updatedAccount);
}

// Delete user account permanently
export async function deleteUserAccountFromFirestore(
  accountId: string,
  accountObj?: Partial<ManagedUserAccount>
): Promise<boolean> {
  const localList = getLocalCachedAccounts();
  const target = localList.find(
    (a) => a.id === accountId || a.username === accountId || a.email === accountId
  );

  const keysToDeleteSet = new Set<string>();
  const addKey = (k?: string) => {
    if (k && typeof k === 'string') {
      const clean = k.trim().toLowerCase();
      if (clean && clean !== 'admin@123' && clean !== 'user_admin_01') {
        keysToDeleteSet.add(clean);
        keysToDeleteSet.add(k.trim());
      }
    }
  };

  addKey(accountId);
  if (accountObj) {
    addKey(accountObj.id);
    addKey(accountObj.username);
    addKey(accountObj.email);
  }
  if (target) {
    addKey(target.id);
    addKey(target.username);
    addKey(target.email);
  }

  const keysToDelete = Array.from(keysToDeleteSet);

  // 1. Register in local deleted users blacklist immediately
  registerDeletedUserKeys(keysToDelete);

  // 2. Sync deleted blacklist to Firestore system_metadata
  try {
    const metaRef = doc(db, 'system_metadata', 'deleted_accounts');
    await safeFirestoreSetDoc(
      metaRef,
      { keys: arrayUnion(...keysToDelete.map((k) => k.toLowerCase())), updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch {}

  // 3. Delete directly from Firestore user_accounts & users collections
  try {
    const userRef = doc(db, 'user_accounts', accountId);
    await deleteDoc(userRef);

    // Also query and delete any doc matching accountId by ID, username or email
    const usersCol = collection(db, 'user_accounts');
    const snap = await getDocs(usersCol);
    for (const d of snap.docs) {
      const data = d.data();
      const docId = d.id.trim().toLowerCase();
      const dUsername = (data.username || '').trim().toLowerCase();
      const dEmail = (data.email || '').trim().toLowerCase();

      if (
        keysToDeleteSet.has(docId) ||
        keysToDeleteSet.has(dUsername) ||
        (dEmail && keysToDeleteSet.has(dEmail)) ||
        docId === accountId.toLowerCase() ||
        dUsername === accountId.toLowerCase()
      ) {
        try {
          await deleteDoc(doc(db, 'user_accounts', d.id));
        } catch {}
      }
    }

    // Also delete any doc in users collection if exists
    try {
      const uRef = doc(db, 'users', accountId);
      await deleteDoc(uRef);
    } catch {}
  } catch (e) {
    console.error('Error deleting user from firestore:', e);
  }

  // 4. Sync deletion to server repository
  postServerSync('/api/repository/delete-user', { id: accountId, keys: keysToDelete });

  // 5. Clean up local storage
  try {
    const saved = localStorage.getItem('khbd_managed_user_accounts');
    if (saved) {
      const current: ManagedUserAccount[] = JSON.parse(saved);
      const updated = current.filter((a) => {
        const uId = (a.id || '').trim().toLowerCase();
        const uUsername = (a.username || '').trim().toLowerCase();
        const uEmail = (a.email || '').trim().toLowerCase();
        return (
          !keysToDeleteSet.has(uId) &&
          !keysToDeleteSet.has(uUsername) &&
          (!uEmail || !keysToDeleteSet.has(uEmail))
        );
      });
      localStorage.setItem('khbd_managed_user_accounts', JSON.stringify(updated));
    }
  } catch {}

  return true;
}

// Toggle user account status (active <-> locked <-> new)
export async function toggleUserAccountStatusInFirestore(
  accountId: string,
  newStatus: 'active' | 'locked' | 'new'
): Promise<boolean> {
  try {
    const userRef = doc(db, 'user_accounts', accountId);
    await safeFirestoreSetDoc(userRef, { status: newStatus }, { merge: true });
  } catch {}

  try {
    const saved = localStorage.getItem('khbd_managed_user_accounts');
    if (saved) {
      const current: ManagedUserAccount[] = JSON.parse(saved);
      const updated = current.map((a) => (a.id === accountId ? { ...a, status: newStatus } : a));
      localStorage.setItem('khbd_managed_user_accounts', JSON.stringify(updated));
      const target = updated.find(a => a.id === accountId);
      if (target) postServerSync('/api/repository/save-user', target);
    }
  } catch {}

  return true;
}

// Save Textbook
export async function saveTextbookToFirestore(book: CustomUploadedBook): Promise<boolean> {
  // 1. Firestore
  try {
    const bookRef = doc(db, 'textbooks', book.id);
    await safeFirestoreSetDoc(bookRef, {
      ...book,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch {}

  // 2. Server API
  postServerSync('/api/repository/save-book', book);

  // 3. Local Storage
  try {
    const saved = localStorage.getItem('khbd_my_firebase_books');
    const current: CustomUploadedBook[] = saved ? JSON.parse(saved) : [];
    const updated = [book, ...current.filter((b) => b.id !== book.id)];
    localStorage.setItem('khbd_my_firebase_books', JSON.stringify(updated));
  } catch {}

  return true;
}

// Helper to sanitize textbook list to the 12 uploaded textbooks
const sanitizeBookList = (list: CustomUploadedBook[]): CustomUploadedBook[] => {
  if (!Array.isArray(list) || list.length === 0) return SEED_SAMPLE_BOOKS;
  // If list contains the old 20+ auto-generated high school books, reset to the 12 uploaded textbooks
  if (list.length > 12 && list.some((b) => b.grade === 'Lớp 10' || b.grade === 'Lớp 11' || b.grade === 'Lớp 12')) {
    return SEED_SAMPLE_BOOKS;
  }
  return list;
};

// Load all Textbooks with multi-layer fallback & Seed Library
export async function loadTextbooksFromFirestore(): Promise<CustomUploadedBook[]> {
  // 1. Try Firestore
  try {
    const booksCol = collection(db, 'textbooks');
    const snap = await getDocs(booksCol);
    const books: CustomUploadedBook[] = [];
    snap.forEach((d) => {
      books.push(d.data() as CustomUploadedBook);
    });
    if (books.length > 0) {
      const sanitized = sanitizeBookList(books);
      localStorage.setItem('khbd_my_firebase_books', JSON.stringify(sanitized));
      postServerSync('/api/repository/bulk-sync', { books: sanitized });
      return sanitized;
    }
  } catch {}

  // 2. Try Server API
  const serverData = await fetchServerRepo();
  if (serverData && serverData.books && serverData.books.length > 0) {
    const sanitized = sanitizeBookList(serverData.books);
    localStorage.setItem('khbd_my_firebase_books', JSON.stringify(sanitized));
    return sanitized;
  }

  // 3. Try Local Storage
  try {
    const saved = localStorage.getItem('khbd_my_firebase_books');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = sanitizeBookList(parsed);
        localStorage.setItem('khbd_my_firebase_books', JSON.stringify(sanitized));
        postServerSync('/api/repository/bulk-sync', { books: sanitized });
        return sanitized;
      }
    }
  } catch {}

  // 4. Auto-Seed Standard Library (12 exact books)
  localStorage.setItem('khbd_my_firebase_books', JSON.stringify(SEED_SAMPLE_BOOKS));
  postServerSync('/api/repository/bulk-sync', { books: SEED_SAMPLE_BOOKS });
  return SEED_SAMPLE_BOOKS;
}

// Delete Textbook
export async function deleteTextbookFromFirestore(bookId: string): Promise<boolean> {
  try {
    const bookRef = doc(db, 'textbooks', bookId);
    await deleteDoc(bookRef);
  } catch {}

  postServerSync('/api/repository/delete-book', { id: bookId });

  try {
    const saved = localStorage.getItem('khbd_my_firebase_books');
    if (saved) {
      const current = JSON.parse(saved);
      const updated = current.filter((b: any) => b.id !== bookId);
      localStorage.setItem('khbd_my_firebase_books', JSON.stringify(updated));
    }
  } catch {}

  return true;
}

// PPCT Functions
export async function savePPCTToFirestore(ppct: CustomUploadedPPCT): Promise<boolean> {
  try {
    const ppctRef = doc(db, 'ppct', ppct.id);
    await safeFirestoreSetDoc(ppctRef, {
      ...ppct,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch {}

  postServerSync('/api/repository/save-ppct', ppct);

  try {
    const saved = localStorage.getItem('khbd_my_firebase_ppct');
    const current = saved ? JSON.parse(saved) : [];
    const updated = [ppct, ...current.filter((p: any) => p.id !== ppct.id)];
    localStorage.setItem('khbd_my_firebase_ppct', JSON.stringify(updated));
  } catch {}

  return true;
}

export async function loadPPCTFromFirestore(): Promise<CustomUploadedPPCT[]> {
  // Helper to filter out old auto-generated erroneous PPCTs and keep verified lessons up to date
  const sanitizePPCTList = (list: CustomUploadedPPCT[]): CustomUploadedPPCT[] => {
    // If it contains the old auto-generated items with ChuanKNTT.xlsx, remove those
    const cleaned = list.filter(
      (p) =>
        !p.fileName?.includes('ChuanKNTT.xlsx') &&
        !p.id?.startsWith('ppct_toán_') &&
        !p.id?.startsWith('ppct_ngữ_văn_') &&
        !p.id?.startsWith('ppct_khoa_học_') &&
        !SEED_SAMPLE_PPCT.some((s) => s.id === p.id) // Exclude old cached seed items to re-insert fresh seeds below
    );
    // Ensure the 4 verified Phụ lục 03 files with accurate KNTT lessons are always present and up to date
    return [...SEED_SAMPLE_PPCT, ...cleaned];
  };

  // 1. Try Firestore
  try {
    const ppctCol = collection(db, 'ppct');
    const snap = await getDocs(ppctCol);
    const ppcts: CustomUploadedPPCT[] = [];
    snap.forEach((d) => {
      ppcts.push(d.data() as CustomUploadedPPCT);
    });
    if (ppcts.length > 0) {
      const sanitized = sanitizePPCTList(ppcts);
      localStorage.setItem('khbd_my_firebase_ppct', JSON.stringify(sanitized));
      postServerSync('/api/repository/bulk-sync', { ppcts: sanitized });
      return sanitized;
    }
  } catch {}

  // 2. Try Server API
  const serverData = await fetchServerRepo();
  if (serverData && serverData.ppcts && serverData.ppcts.length > 0) {
    const sanitized = sanitizePPCTList(serverData.ppcts);
    localStorage.setItem('khbd_my_firebase_ppct', JSON.stringify(sanitized));
    return sanitized;
  }

  // 3. Try Local Storage
  try {
    const saved = localStorage.getItem('khbd_my_firebase_ppct');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = sanitizePPCTList(parsed);
        localStorage.setItem('khbd_my_firebase_ppct', JSON.stringify(sanitized));
        postServerSync('/api/repository/bulk-sync', { ppcts: sanitized });
        return sanitized;
      }
    }
  } catch {}

  // 4. Default: The 4 verified Phụ lục 03 Tin học PPCT files
  localStorage.setItem('khbd_my_firebase_ppct', JSON.stringify(SEED_SAMPLE_PPCT));
  postServerSync('/api/repository/bulk-sync', { ppcts: SEED_SAMPLE_PPCT });
  return SEED_SAMPLE_PPCT;
}

export async function deletePPCTFromFirestore(ppctId: string): Promise<boolean> {
  try {
    const ppctRef = doc(db, 'ppct', ppctId);
    await deleteDoc(ppctRef);
  } catch {}

  postServerSync('/api/repository/delete-ppct', { id: ppctId });

  try {
    const saved = localStorage.getItem('khbd_my_firebase_ppct');
    if (saved) {
      const current = JSON.parse(saved);
      const updated = current.filter((p: any) => p.id !== ppctId);
      localStorage.setItem('khbd_my_firebase_ppct', JSON.stringify(updated));
    }
  } catch {}

  return true;
}
