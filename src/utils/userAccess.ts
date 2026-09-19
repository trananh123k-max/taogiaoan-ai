import { ManagedUserAccount } from './firebase';

export interface UserAccessStatus {
  isAllowed: boolean;
  isAdmin: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isOutOfTrials: boolean;
  isLocked: boolean;
  isNewAccount?: boolean;
  isSubscription?: boolean; // Được cấp thời hạn sử dụng (ngày/tháng/năm hoặc vĩnh viễn)
  requiresCustomApiKey?: boolean; // Bắt buộc phải có API Key cá nhân mới được dùng
  hasCustomApiKey?: boolean;
  usedTrials: number;
  maxTrials: number;
  remainingTrials: number;
  expiresAt: string;
  daysRemaining?: number;
  reason?: string;
  badgeText: string;
  badgeVariant: 'success' | 'warning' | 'error' | 'admin';
}

/**
 * Parse date string from various formats (DD/MM/YYYY, D/M/YYYY, YYYY-MM-DD) into Date object
 */
export function parseExpirationDate(dateStr?: string): Date | null {
  if (!dateStr || dateStr === 'Chưa cấp' || dateStr === 'Vĩnh viễn') return null;
  const cleaned = dateStr.trim();
  
  // Format DD/MM/YYYY or D/M/YYYY
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      const day = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const year = Number(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day, 23, 59, 59);
      }
    }
  }

  // Format YYYY-MM-DD or DD-MM-YYYY
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day, 23, 59, 59);
        }
      } else {
        // DD-MM-YYYY
        const day = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const year = Number(parts[2]);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          return new Date(year, month, day, 23, 59, 59);
        }
      }
    }
  }

  return null;
}

/**
 * Evaluates current user's access rights, remaining trials, and expiration status
 */
export function getUserAccessStatus(
  user?: ManagedUserAccount | null,
  customApiKeyProvided?: boolean
): UserAccessStatus {
  const hasCustomKey = customApiKeyProvided !== undefined
    ? customApiKeyProvided
    : (typeof window !== 'undefined' ? Boolean(localStorage.getItem('khbd_custom_gemini_api_key')?.trim()) : false);

  // 1. Admin or null fallback
  if (!user) {
    return {
      isAllowed: false,
      isAdmin: false,
      isTrial: true,
      isExpired: false,
      isOutOfTrials: true,
      isLocked: false,
      isSubscription: false,
      requiresCustomApiKey: false,
      hasCustomApiKey: hasCustomKey,
      usedTrials: 0,
      maxTrials: 5,
      remainingTrials: 0,
      expiresAt: 'Chưa cấp',
      reason: 'Vui lòng đăng nhập để sử dụng tính năng soạn giáo án!',
      badgeText: 'Chưa đăng nhập',
      badgeVariant: 'error',
    };
  }

  if (user.role === 'admin') {
    return {
      isAllowed: true,
      isAdmin: true,
      isTrial: false,
      isExpired: false,
      isOutOfTrials: false,
      isLocked: false,
      isSubscription: false,
      requiresCustomApiKey: false,
      hasCustomApiKey: hasCustomKey,
      usedTrials: user.trialGenerations || 0,
      maxTrials: 9999,
      remainingTrials: 9999,
      expiresAt: 'Vĩnh viễn',
      badgeText: 'Admin (Vĩnh viễn)',
      badgeVariant: 'admin',
    };
  }

  // 2. Locked status
  if (user.status === 'locked') {
    return {
      isAllowed: false,
      isAdmin: false,
      isTrial: false,
      isExpired: false,
      isOutOfTrials: false,
      isLocked: true,
      isNewAccount: false,
      isSubscription: false,
      requiresCustomApiKey: false,
      hasCustomApiKey: hasCustomKey,
      usedTrials: user.trialGenerations || 0,
      maxTrials: user.maxTrialGenerations ?? 5,
      remainingTrials: 0,
      expiresAt: user.expiresAt || 'Tạm khóa',
      reason: 'Tài khoản của bạn đang bị tạm khóa. Vui lòng liên hệ Quản trị viên để được mở lại!',
      badgeText: 'Tài khoản bị khóa',
      badgeVariant: 'error',
    };
  }

  // 2.5. New registered account pending activation
  if (user.status === 'new' || ((user.expiresAt === 'Chưa cấp' || !user.expiresAt) && (!user.maxTrialGenerations || user.maxTrialGenerations === 0))) {
    return {
      isAllowed: false,
      isAdmin: false,
      isTrial: false,
      isExpired: false,
      isOutOfTrials: true,
      isLocked: false,
      isNewAccount: true,
      isSubscription: false,
      requiresCustomApiKey: false,
      hasCustomApiKey: hasCustomKey,
      usedTrials: user.trialGenerations || 0,
      maxTrials: user.maxTrialGenerations || 0,
      remainingTrials: 0,
      expiresAt: 'Chờ cấp quyền',
      reason: 'Tài khoản mới tạo thành công. Vui lòng liên hệ Ban Quản Trị (Admin) để được kích hoạt số lượt dùng thử hoặc ngày sử dụng!',
      badgeText: 'Mới (Chờ cấp quyền)',
      badgeVariant: 'warning',
    };
  }

  const rawExpiresAt = (user.expiresAt || 'Chưa cấp').trim();

  // 3. Permanent Account (Cấp thời hạn Vĩnh viễn -> Bắt buộc nhập API Key cá nhân)
  if (rawExpiresAt === 'Vĩnh viễn') {
    const isAllowed = hasCustomKey;
    return {
      isAllowed,
      isAdmin: false,
      isTrial: false,
      isExpired: false,
      isOutOfTrials: false,
      isLocked: false,
      isSubscription: true,
      requiresCustomApiKey: !hasCustomKey,
      hasCustomApiKey: hasCustomKey,
      usedTrials: user.trialGenerations || 0,
      maxTrials: 9999,
      remainingTrials: 9999,
      expiresAt: 'Vĩnh viễn',
      reason: !hasCustomKey
        ? 'Tài khoản đã được cấp thời hạn sử dụng Vĩnh viễn. Bắt buộc phải tự nhập API Key Gemini cá nhân (miễn phí từ Google AI Studio) để kích hoạt tính năng soạn bài!'
        : undefined,
      badgeText: !hasCustomKey ? 'Cần nhập API Key' : 'Hạn dùng: Vĩnh viễn',
      badgeVariant: !hasCustomKey ? 'error' : 'success',
    };
  }

  // 4. Trial Account (Chưa cấp hoặc chế độ dùng thử -> Được dùng chung API với Admin)
  if (rawExpiresAt === 'Chưa cấp' || rawExpiresAt.toLowerCase().includes('dùng thử')) {
    const maxTrials = user.maxTrialGenerations !== undefined && !isNaN(Number(user.maxTrialGenerations)) ? Number(user.maxTrialGenerations) : 5;
    const usedTrials = Number(user.trialGenerations) || 0;
    const remainingTrials = Math.max(0, maxTrials - usedTrials);
    const isOutOfTrials = remainingTrials <= 0;

    if (isOutOfTrials) {
      return {
        isAllowed: false,
        isAdmin: false,
        isTrial: true,
        isExpired: false,
        isOutOfTrials: true,
        isLocked: false,
        isSubscription: false,
        requiresCustomApiKey: false,
        hasCustomApiKey: hasCustomKey,
        usedTrials,
        maxTrials,
        remainingTrials: 0,
        expiresAt: 'Dùng thử (Hết lượt)',
        reason: `Bạn đã sử dụng hết ${maxTrials} lượt dùng thử soạn giáo án. Vui lòng liên hệ Quản trị viên (Admin) để được cấp quyền hoặc gia hạn tài khoản!`,
        badgeText: `Hết lượt dùng thử (Đã dùng ${usedTrials}/${maxTrials})`,
        badgeVariant: 'error',
      };
    }

    return {
      isAllowed: true,
      isAdmin: false,
      isTrial: true,
      isExpired: false,
      isOutOfTrials: false,
      isLocked: false,
      isSubscription: false,
      requiresCustomApiKey: false, // Được dùng chung API với Admin
      hasCustomApiKey: hasCustomKey,
      usedTrials,
      maxTrials,
      remainingTrials,
      expiresAt: `Dùng thử (Còn ${remainingTrials} lượt)`,
      badgeText: `Dùng thử: Còn ${remainingTrials} lượt`,
      badgeVariant: 'warning',
    };
  }

  // 5. Date-Based Account (Được cấp thời hạn sử dụng theo ngày/tháng/năm -> Bắt buộc nhập API Key cá nhân)
  const expDate = parseExpirationDate(rawExpiresAt);
  if (expDate) {
    const now = new Date();
    const isExpired = expDate.getTime() < now.getTime();
    const diffMs = expDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (isExpired) {
      return {
        isAllowed: false,
        isAdmin: false,
        isTrial: false,
        isExpired: true,
        isOutOfTrials: false,
        isLocked: false,
        isSubscription: true,
        requiresCustomApiKey: false,
        hasCustomApiKey: hasCustomKey,
        usedTrials: user.trialGenerations || 0,
        maxTrials: 9999,
        remainingTrials: 0,
        expiresAt: rawExpiresAt,
        daysRemaining: 0,
        reason: `Tài khoản của bạn đã hết hạn sử dụng vào ngày ${rawExpiresAt}. Vui lòng liên hệ Quản trị viên (Admin) để gia hạn quyền soạn giáo án!`,
        badgeText: `Đã hết hạn (${rawExpiresAt})`,
        badgeVariant: 'error',
      };
    }

    const isAllowed = hasCustomKey;
    return {
      isAllowed,
      isAdmin: false,
      isTrial: false,
      isExpired: false,
      isOutOfTrials: false,
      isLocked: false,
      isSubscription: true,
      requiresCustomApiKey: !hasCustomKey,
      hasCustomApiKey: hasCustomKey,
      usedTrials: user.trialGenerations || 0,
      maxTrials: 9999,
      remainingTrials: 9999,
      expiresAt: rawExpiresAt,
      daysRemaining,
      reason: !hasCustomKey
        ? `Tài khoản đã được kích hoạt thời hạn sử dụng (${rawExpiresAt}). Bắt buộc phải tự nhập API Key Gemini cá nhân (miễn phí từ Google AI Studio) để sử dụng chức năng soạn bài!`
        : undefined,
      badgeText: !hasCustomKey ? 'Cần nhập API Key' : `Hạn dùng: ${rawExpiresAt}`,
      badgeVariant: !hasCustomKey ? 'error' : (daysRemaining <= 7 ? 'warning' : 'success'),
    };
  }

  // Fallback for unparseable expiration date
  return {
    isAllowed: false,
    isAdmin: false,
    isTrial: false,
    isExpired: true,
    isOutOfTrials: false,
    isLocked: false,
    usedTrials: 0,
    maxTrials: 0,
    remainingTrials: 0,
    expiresAt: rawExpiresAt,
    reason: `Thông tin ngày hết hạn (${rawExpiresAt}) không đúng định dạng. Vui lòng liên hệ Admin!`,
    badgeText: `Hạn không hợp lệ (${rawExpiresAt})`,
    badgeVariant: 'error',
  };
}
