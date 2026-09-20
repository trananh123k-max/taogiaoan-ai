import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Users,
  Shield,
  UserCheck,
  UserX,
  Plus,
  Search,
  KeyRound,
  Laptop,
  RefreshCw,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldCheck,
  Clock,
  Sparkles,
  Smartphone,
  Layers,
  ChevronDown,
  Monitor,
  Activity,
  History,
  LogIn,
  RotateCcw,
  Download,
  Upload,
  HardDrive,
  Cloud,
  Database,
  Share2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  LayoutList,
  TableProperties,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import {
  ManagedUserAccount,
  AuthorizedDevice,
  LoginHistoryLog,
  saveUserAccountToFirestore,
  deleteUserAccountFromFirestore,
  toggleUserAccountStatusInFirestore,
  resetUserDevicesInFirestore,
  removeUserDeviceInFirestore,
  updateUserMaxDevicesInFirestore,
  resetUserLoginCountTodayInFirestore,
  sanitizeUserAccounts,
  formatActiveTime,
  exportAccountsToJSONFile,
  importAccountsFromJSON,
  deduplicateAllUserAccountsDevicesInFirestore,
  registerDeletedUserKeys,
  isExplicitGrantedDate,
  parseDateToTimestamp,
} from '../utils/firebase';
import { deduplicateAuthorizedDevices } from '../utils/deviceManager';
import { getUserInitials } from '../utils/avatarUtils';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userAccounts: ManagedUserAccount[];
  onAccountsUpdated: (accounts: ManagedUserAccount[]) => void;
  currentUser?: ManagedUserAccount | null;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  userAccounts,
  onAccountsUpdated,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'teacher'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'active' | 'locked'>('all');

  // Fullscreen modal state - default TRUE as requested by user ("tôi muốn cửa sổ này full hết màn hình")
  const [isFullscreen, setIsFullscreen] = useState(true);

  // Compact view state - default TRUE to hide bulky columns and show more accounts at once
  const [compactView, setCompactView] = useState(true);

  // Toggle metrics overview banner to maximize screen space for accounts table
  const [showMetrics, setShowMetrics] = useState(false);

  // Toggle show password in edit modal
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Form state for creating / editing user
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ManagedUserAccount | null>(null);

  // Quick Password Reset Modal
  const [passwordResetUser, setPasswordResetUser] = useState<ManagedUserAccount | null>(null);
  const [quickNewPassword, setQuickNewPassword] = useState('');

  // Delete Confirmation Modal
  const [deletingAccountUser, setDeletingAccountUser] = useState<ManagedUserAccount | null>(null);

  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formAccessCode, setFormAccessCode] = useState('');
  const [formSchoolName, setFormSchoolName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'teacher' | 'admin'>('teacher');
  const [formAccessMode, setFormAccessMode] = useState<'trial' | 'date' | 'permanent'>('trial');
  const [formExpiresAt, setFormExpiresAt] = useState('');
  const [formMaxDevices, setFormMaxDevices] = useState(2);
  const [formTrialGenerations, setFormTrialGenerations] = useState(0);
  const [formMaxTrialGenerations, setFormMaxTrialGenerations] = useState(5);
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'locked' | 'new'>('active');

  // Device & Login History detail modal
  const [viewingDevicesUser, setViewingDevicesUser] = useState<ManagedUserAccount | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'devices' | 'loginLogs'>('devices');

  // 1-second live clock ticker so displayed active time updates in real-time
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Status notification
  const [statusNotice, setStatusNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);
  const [isDeduplicating, setIsDeduplicating] = useState(false);

  // Local accounts state for immediate synchronous updates
  const [localAccounts, setLocalAccounts] = useState<ManagedUserAccount[]>(() => sanitizeUserAccounts(userAccounts));

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalAccounts(sanitizeUserAccounts(userAccounts));
  }, [userAccounts]);

  if (!isOpen) return null;

  const showNotice = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusNotice({ text, type });
    setTimeout(() => {
      setStatusNotice(null);
    }, 4000);
  };

  // Sanitized unique user list from local state
  const sanitizedList = sanitizeUserAccounts(localAccounts);

  // Filter accounts
  const filteredAccounts = sanitizedList
    .filter((acc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        acc.fullName?.toLowerCase().includes(q) ||
        acc.username?.toLowerCase().includes(q) ||
        acc.schoolName?.toLowerCase().includes(q) ||
        acc.phone?.includes(q) ||
        acc.notes?.toLowerCase().includes(q);

      const matchRole = roleFilter === 'all' || acc.role === roleFilter;
      const matchStatus = statusFilter === 'all' || acc.status === statusFilter;

      return matchQuery && matchRole && matchStatus;
    })
    .sort((a, b) => {
      // Đưa tài khoản Quản trị gốc lên trên cùng
      if (a.username === 'admin@123') return -1;
      if (b.username === 'admin@123') return 1;
      
      // Tiếp theo là các tài khoản Admin khác
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      
      return 0;
    });

  // Statistics
  const totalUsers = sanitizedList.length;
  const totalNewAccounts = sanitizedList.filter((a) => a.status === 'new').length;
  const totalTeachers = sanitizedList.filter((a) => a.role === 'teacher').length;
  const totalAdmins = sanitizedList.filter((a) => a.role === 'admin').length;
  const totalActiveDevices = sanitizedList.reduce(
    (sum, a) => sum + (Array.isArray(a.authorizedDevices) ? a.authorizedDevices.length : 0),
    0
  );
  const totalLoginsToday = sanitizedList.reduce(
    (sum, a) => sum + (a.loginCountToday || 0),
    0
  );
  const totalActiveSecondsToday = sanitizedList.reduce(
    (sum, a) => sum + (a.activeSecondsToday !== undefined ? a.activeSecondsToday : (a.activeMinutesToday ? a.activeMinutesToday * 60 : 0)),
    0
  );
  const usersLoggedInToday = sanitizedList.filter((a) => (a.loginCountToday || 0) > 0).length;

  // Compute future date, either from today or extending an existing valid future expiration date
  const getDefaultFutureDate = (months = 12, fromDateStr?: string): string => {
    let d = new Date();
    if (fromDateStr && isExplicitGrantedDate(fromDateStr)) {
      const ts = parseDateToTimestamp(fromDateStr);
      if (ts > Date.now()) {
        d = new Date(ts);
      }
    }
    d.setMonth(d.getMonth() + months);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Quick 1-Click Grant Trial Turns (e.g. 5 turns)
  const handleQuickGrantTrials = async (acc: ManagedUserAccount, maxTurns: number = 5) => {
    setIsProcessing(true);
    try {
      const updatedAccount: ManagedUserAccount = {
        ...acc,
        status: 'active',
        maxTrialGenerations: maxTurns,
        trialGenerations: 0,
        expiresAt: 'Chưa cấp',
        updatedAt: new Date().toISOString(),
      };
      await saveUserAccountToFirestore(updatedAccount, true);
      const updatedList = sanitizeUserAccounts(
        sanitizedList.map((a) => (a.id === acc.id || a.username === acc.username ? updatedAccount : a))
      );
      setLocalAccounts(updatedList);
      onAccountsUpdated(updatedList);
      showNotice(`Đã cấp ${maxTurns} lượt dùng thử thành công cho ${acc.fullName}!`, 'success');
    } catch {
      showNotice('Không thể cấp quyền. Vui lòng thử lại!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick 1-Click Grant Date Duration (e.g. 1 Year)
  const handleQuickGrantDate = async (acc: ManagedUserAccount, months: number = 12) => {
    setIsProcessing(true);
    try {
      const targetDate = getDefaultFutureDate(months, acc.expiresAt);
      const updatedAccount: ManagedUserAccount = {
        ...acc,
        status: 'active',
        expiresAt: targetDate,
        maxTrialGenerations: 9999,
        trialGenerations: 0,
        updatedAt: new Date().toISOString(),
      };
      await saveUserAccountToFirestore(updatedAccount, true);
      const updatedList = sanitizeUserAccounts(
        sanitizedList.map((a) => (a.id === acc.id || a.username === acc.username ? updatedAccount : a))
      );
      setLocalAccounts(updatedList);
      onAccountsUpdated(updatedList);
      showNotice(`Đã cấp hạn dùng 1 năm (đến ngày ${targetDate}) cho ${acc.fullName}!`, 'success');
    } catch {
      showNotice('Không thể cấp quyền. Vui lòng thử lại!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick 1-Click Grant Permanent Access
  const handleQuickGrantPermanent = async (acc: ManagedUserAccount) => {
    setIsProcessing(true);
    try {
      const updatedAccount: ManagedUserAccount = {
        ...acc,
        status: 'active',
        expiresAt: 'Vĩnh viễn',
        maxTrialGenerations: 9999,
        trialGenerations: 0,
        updatedAt: new Date().toISOString(),
      };
      await saveUserAccountToFirestore(updatedAccount, true);
      const updatedList = sanitizeUserAccounts(
        sanitizedList.map((a) => (a.id === acc.id || a.username === acc.username ? updatedAccount : a))
      );
      setLocalAccounts(updatedList);
      onAccountsUpdated(updatedList);
      showNotice(`Đã cấp quyền sử dụng Vĩnh viễn cho ${acc.fullName}!`, 'success');
    } catch {
      showNotice('Không thể cấp quyền. Vui lòng thử lại!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render Account Expiration Badge prominently
  const renderAccountExpiryBadge = (acc: ManagedUserAccount) => {
    const isGranted = isExplicitGrantedDate(acc.expiresAt);
    if (!isGranted) {
      const remaining = Math.max(0, (acc.maxTrialGenerations ?? 5) - (acc.trialGenerations || 0));
      const isDepleted = remaining <= 0;
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black border shadow-2xs ${
                isDepleted
                  ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              {isDepleted ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Hết lượt dùng thử (0 còn lại)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Dùng thử: <strong>Còn {remaining} lượt</strong></span>
                </>
              )}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Đã tạo: <strong className="text-slate-800">{acc.trialGenerations || 0}</strong> / {acc.maxTrialGenerations ?? 5} bài • <span className="text-rose-600 font-bold">Chưa cấp hạn năm</span>
          </div>
        </div>
      );
    }

    if (acc.expiresAt === 'Vĩnh viễn') {
      return (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold bg-indigo-50 text-indigo-900 border border-indigo-300 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Thời hạn: <strong className="text-indigo-800">Vĩnh viễn</strong></span>
            </span>
          </div>
          <div className="text-[10px] text-indigo-600 font-medium">
            Không giới hạn thời gian & số lượt
          </div>
        </div>
      );
    }

    const ts = parseDateToTimestamp(acc.expiresAt);
    const diffDays = Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
    const isExpired = diffDays <= 0;

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black border shadow-2xs ${
              isExpired
                ? 'bg-rose-50 text-rose-950 border-rose-300'
                : 'bg-emerald-50 text-emerald-950 border-emerald-300'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 shrink-0 ${isExpired ? 'text-rose-600' : 'text-emerald-700'}`} />
            <span>Ngày hết hạn: <strong className="underline decoration-2 font-black">{acc.expiresAt}</strong></span>
          </span>
        </div>
        <div className="text-[10.5px] font-bold flex items-center gap-1">
          {isExpired ? (
            <span className="text-rose-600 flex items-center gap-1 font-extrabold">
              <AlertCircle className="w-3 h-3" />
              Đã hết hạn ({Math.abs(diffDays)} ngày trước)
            </span>
          ) : (
            <span className="text-emerald-700 flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>Còn {diffDays} ngày ({diffDays >= 300 ? 'Gói 1 Năm' : diffDays >= 150 ? 'Gói 6 Tháng' : 'Gói theo ngày'})</span>
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleSetDatePreset = (months: number) => {
    const newDate = getDefaultFutureDate(months, formExpiresAt);
    setFormExpiresAt(newDate);
    setFormAccessMode('date');
  };

  const handleAccessModeChange = (mode: 'trial' | 'date' | 'permanent') => {
    setFormAccessMode(mode);
    if (mode === 'date') {
      if (!formExpiresAt || formExpiresAt === 'Chưa cấp' || formExpiresAt === 'Vĩnh viễn') {
        setFormExpiresAt(getDefaultFutureDate(12));
      }
    } else if (mode === 'permanent') {
      setFormExpiresAt('Vĩnh viễn');
    } else if (mode === 'trial') {
      setFormExpiresAt('Chưa cấp');
    }
  };

  const handleOpenCreateForm = () => {
    setEditingAccount(null);
    setFormFullName('');
    setFormUsername('');
    setFormAccessCode('123456');
    setFormSchoolName('');
    setFormPhone('');
    setFormRole('teacher');
    setFormAccessMode('date');
    setFormExpiresAt(getDefaultFutureDate(12));
    setFormMaxDevices(2);
    setFormTrialGenerations(0);
    setFormMaxTrialGenerations(9999);
    setFormNotes('');
    setFormStatus('active');
    setShowFormPassword(false);
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEditForm = (acc: ManagedUserAccount) => {
    setEditingAccount(acc);
    setShowFormPassword(false);
    setFormFullName(acc.fullName);
    setFormUsername(acc.username);
    setFormAccessCode(acc.accessCode || '');
    setFormSchoolName(acc.schoolName);
    setFormPhone(acc.phone || '');
    setFormRole(acc.role);
    if (!acc.expiresAt || acc.expiresAt === 'Chưa cấp' || acc.expiresAt.toLowerCase().includes('dùng thử')) {
      setFormAccessMode('trial');
      setFormExpiresAt('Chưa cấp');
    } else if (acc.expiresAt === 'Vĩnh viễn') {
      setFormAccessMode('permanent');
      setFormExpiresAt('Vĩnh viễn');
    } else {
      setFormAccessMode('date');
      setFormExpiresAt(acc.expiresAt || getDefaultFutureDate(12));
    }
    setFormMaxDevices(acc.maxDevices !== undefined ? acc.maxDevices : (acc.role === 'admin' ? 10 : 2));
    setFormTrialGenerations(acc.trialGenerations || 0);
    setFormMaxTrialGenerations(acc.maxTrialGenerations !== undefined ? acc.maxTrialGenerations : 5);
    setFormNotes(acc.notes || '');
    setFormStatus(acc.status);
    setIsFormOpen(true);
  };

  // Save or Update Account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFullName = formFullName.trim();
    const cleanUsername = formUsername.trim();

    if (!cleanFullName || !cleanUsername) {
      showNotice('Vui lòng nhập đầy đủ Họ tên và Tên đăng nhập!', 'error');
      return;
    }

    if (/\s/.test(cleanUsername)) {
      showNotice('Tên đăng nhập không được chứa khoảng trắng (dấu cách)!', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const nowFormatted = new Date().toLocaleDateString('vi-VN');
      const accountId = editingAccount ? editingAccount.id : `user_${Date.now()}`;
      
      let finalExpiresAt = 'Chưa cấp';
      if (formAccessMode === 'trial') {
        finalExpiresAt = 'Chưa cấp';
      } else if (formAccessMode === 'permanent') {
        finalExpiresAt = 'Vĩnh viễn';
      } else {
        let rawDate = formExpiresAt.trim();
        if (!rawDate || rawDate === 'Chưa cấp' || rawDate === 'Vĩnh viễn') {
          rawDate = getDefaultFutureDate(12);
        }
        // Handle YYYY-MM-DD format (from input type="date")
        if (rawDate.includes('-') && rawDate.split('-').length === 3) {
          const p = rawDate.split('-');
          if (p[0].length === 4) {
            rawDate = `${String(Number(p[2])).padStart(2, '0')}/${String(Number(p[1])).padStart(2, '0')}/${p[0]}`;
          }
        }
        finalExpiresAt = rawDate;
      }

      const newOrUpdatedAccount: ManagedUserAccount = {
        id: accountId,
        fullName: formFullName.trim(),
        username: formUsername.trim(),
        email: formUsername.includes('@') ? formUsername.trim() : (editingAccount?.email || undefined),
        phone: formPhone.trim() || undefined,
        schoolName: formSchoolName.trim() || editingAccount?.schoolName || 'Chưa cập nhật trường',
        role: formRole,
        status: formStatus,
        accessCode: formAccessCode.trim() || undefined,
        createdAt: editingAccount ? editingAccount.createdAt : nowFormatted,
        expiresAt: finalExpiresAt,
        maxDevices: formMaxDevices !== undefined && !isNaN(Number(formMaxDevices)) ? Number(formMaxDevices) : (formRole === 'admin' ? 10 : 2),
        trialGenerations: formAccessMode === 'trial' ? Number(formTrialGenerations) || 0 : 0,
        maxTrialGenerations: formAccessMode === 'trial' ? (Number(formMaxTrialGenerations) || 5) : 9999,
        notes: formNotes.trim() || undefined,
        apiKey: editingAccount ? (editingAccount.apiKey || editingAccount.customApiKey) : undefined,
        customApiKey: editingAccount ? (editingAccount.apiKey || editingAccount.customApiKey) : undefined,
        avatar: editingAccount ? editingAccount.avatar : undefined,
        lastLogin: editingAccount ? editingAccount.lastLogin : 'Chưa đăng nhập',
        lastLoginDate: editingAccount ? editingAccount.lastLoginDate : undefined,
        loginCountToday: editingAccount ? editingAccount.loginCountToday : 0,
        totalLoginCount: editingAccount ? editingAccount.totalLoginCount : 0,
        activeMinutesToday: editingAccount ? editingAccount.activeMinutesToday : 0,
        activeSecondsToday: editingAccount ? editingAccount.activeSecondsToday : 0,
        loginLogs: editingAccount ? (editingAccount.loginLogs || []) : [],
        authorizedDevices: editingAccount ? (editingAccount.authorizedDevices || []) : [],
        updatedAt: new Date().toISOString(),
      };

      await saveUserAccountToFirestore(newOrUpdatedAccount, true);

      const updatedList = sanitizeUserAccounts([
        newOrUpdatedAccount,
        ...sanitizedList.filter((a) => a.id !== accountId && a.username.toLowerCase() !== newOrUpdatedAccount.username.toLowerCase()),
      ]);

      setLocalAccounts(updatedList);
      onAccountsUpdated(updatedList);
      setIsFormOpen(false);
      showNotice(
        editingAccount
          ? `Đã cập nhật thông tin tài khoản ${newOrUpdatedAccount.fullName} thành công!`
          : `Đã cấp tài khoản mới thành công cho ${newOrUpdatedAccount.fullName}!`,
        'success'
      );
    } catch {
      showNotice('Đã xảy ra lỗi khi lưu tài khoản. Vui lòng thử lại!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Account Status (Lock/Unlock)
  const handleToggleStatus = async (acc: ManagedUserAccount) => {
    const nextStatus: 'active' | 'locked' = acc.status === 'active' ? 'locked' : 'active';
    setIsProcessing(true);
    try {
      await toggleUserAccountStatusInFirestore(acc.id, nextStatus);
      const updatedList: ManagedUserAccount[] = sanitizedList.map((a) =>
        a.id === acc.id || a.username === acc.username ? { ...a, status: nextStatus } : a
      );
      setLocalAccounts(updatedList);
      onAccountsUpdated(updatedList);
      showNotice(
        nextStatus === 'locked'
          ? `Đã tạm khóa tài khoản ${acc.fullName}!`
          : `Đã mở khóa tài khoản ${acc.fullName}!`,
        'info'
      );
    } catch {
      showNotice('Không thể cập nhật trạng thái tài khoản!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete User Account permanently
  const handleDeleteAccount = async (acc: ManagedUserAccount) => {
    if (acc.username === 'admin@123') {
      showNotice('Không thể xóa tài khoản Quản trị viên gốc của hệ thống!', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      // Register all identifier keys to persistent blacklist immediately
      const keysToDelete = [acc.id, acc.username, acc.email].filter(Boolean) as string[];
      registerDeletedUserKeys(keysToDelete);

      const targetUsername = (acc.username || '').trim().toLowerCase();
      const targetEmail = (acc.email || '').trim().toLowerCase();
      const targetId = (acc.id || '').trim().toLowerCase();

      const updatedList = sanitizedList.filter((a) => {
        const aId = (a.id || '').trim().toLowerCase();
        const aUsername = (a.username || '').trim().toLowerCase();
        const aEmail = (a.email || '').trim().toLowerCase();
        return (
          aId !== targetId &&
          aUsername !== targetUsername &&
          (!targetEmail || aEmail !== targetEmail)
        );
      });

      setLocalAccounts(updatedList);
      onAccountsUpdated(updatedList);

      await deleteUserAccountFromFirestore(acc.id, acc);
      showNotice(`Đã xóa vĩnh viễn tài khoản ${acc.fullName} khỏi hệ thống!`, 'success');
    } catch {
      showNotice('Không thể xóa tài khoản!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset Devices for a User (When teacher reinstalls OS or gets new PC)
  const handleResetUserDevices = async (acc: ManagedUserAccount) => {
    setIsProcessing(true);
    // Instant synchronous UI update
    const updatedList = sanitizedList.map((a) =>
      a.id === acc.id || a.username === acc.username || a.email === acc.email
        ? { ...a, authorizedDevices: [] }
        : a
    );
    setLocalAccounts(updatedList);
    onAccountsUpdated(updatedList);

    if (viewingDevicesUser && (viewingDevicesUser.id === acc.id || viewingDevicesUser.username === acc.username)) {
      setViewingDevicesUser({ ...viewingDevicesUser, authorizedDevices: [] });
    }

    try {
      await resetUserDevicesInFirestore(acc.id);
      showNotice(`Đã khôi phục (đặt lại 0 máy) cho ${acc.fullName}! Giáo viên có thể đăng nhập ngay trên máy mới.`, 'success');
    } catch {
      showNotice('Không thể khôi phục thiết bị trên đám mây!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove a single specific device
  const handleRemoveSingleDevice = async (acc: ManagedUserAccount, deviceId: string) => {
    setIsProcessing(true);
    const updatedDevices = (acc.authorizedDevices || []).filter((d) => d.deviceId !== deviceId);
    const updatedList = sanitizedList.map((a) =>
      a.id === acc.id || a.username === acc.username || a.email === acc.email
        ? { ...a, authorizedDevices: updatedDevices }
        : a
    );
    setLocalAccounts(updatedList);
    onAccountsUpdated(updatedList);

    if (viewingDevicesUser && (viewingDevicesUser.id === acc.id || viewingDevicesUser.username === acc.username)) {
      setViewingDevicesUser({ ...viewingDevicesUser, authorizedDevices: updatedDevices });
    }

    try {
      await removeUserDeviceInFirestore(acc.id, deviceId);
      showNotice(`Đã hủy liên kết máy tính (${deviceId}) thành công!`, 'success');
    } catch {
      showNotice('Không thể xóa thiết bị!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick adjust max devices (+1 machine)
  const handleIncreaseMaxDevices = async (acc: ManagedUserAccount) => {
    const currentMax = acc.maxDevices !== undefined ? acc.maxDevices : 2;
    const newMax = currentMax + 1;
    setIsProcessing(true);
    try {
      await updateUserMaxDevicesInFirestore(acc.id, newMax);
      const updatedList = sanitizedList.map((a) =>
        a.id === acc.id || a.username === acc.username ? { ...a, maxDevices: newMax } : a
      );
      onAccountsUpdated(updatedList);
      if (viewingDevicesUser && (viewingDevicesUser.id === acc.id || viewingDevicesUser.username === acc.username)) {
        setViewingDevicesUser({ ...viewingDevicesUser, maxDevices: newMax });
      }
      showNotice(`Đã nâng giới hạn cho ${acc.fullName} lên ${newMax} máy tính!`, 'success');
    } catch {
      showNotice('Không thể cập nhật số máy!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick adjust max devices (-1 machine down to 0)
  const handleDecreaseMaxDevices = async (acc: ManagedUserAccount) => {
    const currentMax = acc.maxDevices !== undefined ? acc.maxDevices : 2;
    const newMax = Math.max(0, currentMax - 1);
    setIsProcessing(true);
    try {
      await updateUserMaxDevicesInFirestore(acc.id, newMax);
      const updatedList = sanitizedList.map((a) =>
        a.id === acc.id || a.username === acc.username ? { ...a, maxDevices: newMax } : a
      );
      onAccountsUpdated(updatedList);
      if (viewingDevicesUser && (viewingDevicesUser.id === acc.id || viewingDevicesUser.username === acc.username)) {
        setViewingDevicesUser({ ...viewingDevicesUser, maxDevices: newMax });
      }
      showNotice(`Đã chỉnh giới hạn cho ${acc.fullName} về ${newMax} máy tính!`, 'info');
    } catch {
      showNotice('Không thể cập nhật số máy!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset daily login count for a user (Admin monitoring feature)
  const handleResetTodayLogins = async (acc: ManagedUserAccount) => {
    setIsProcessing(true);
    try {
      await resetUserLoginCountTodayInFirestore(acc.id);
      const updatedList = sanitizedList.map((a) =>
        a.id === acc.id || a.username === acc.username ? { ...a, loginCountToday: 0 } : a
      );
      onAccountsUpdated(updatedList);
      if (viewingDevicesUser && (viewingDevicesUser.id === acc.id || viewingDevicesUser.username === acc.username)) {
        setViewingDevicesUser({ ...viewingDevicesUser, loginCountToday: 0 });
      }
      showNotice(`Đã đặt lại lượt đăng nhập hôm nay về 0 cho tài khoản ${acc.fullName}!`, 'success');
    } catch {
      showNotice('Có lỗi xảy ra khi đặt lại số lượt đăng nhập!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Password Change for any user by Admin
  const handleOpenQuickPassword = (acc: ManagedUserAccount) => {
    setPasswordResetUser(acc);
    setQuickNewPassword(acc.accessCode || '');
  };

  const handleSaveQuickPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;
    setIsProcessing(true);
    try {
      const updatedUser: ManagedUserAccount = {
        ...passwordResetUser,
        accessCode: quickNewPassword.trim() || undefined,
      };

      await saveUserAccountToFirestore(updatedUser);

      const updatedList = sanitizedList.map((a) =>
        a.id === updatedUser.id || a.username === updatedUser.username ? updatedUser : a
      );
      setLocalAccounts(updatedList);
      onAccountsUpdated(updatedList);
      setPasswordResetUser(null);
      setQuickNewPassword('');
      showNotice(`Đã đổi mật khẩu thành công cho tài khoản "${updatedUser.fullName}" trên Firestore!`, 'success');
    } catch {
      showNotice('Có lỗi xảy ra khi cập nhật mật khẩu trên Firestore!', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk sync all accounts to Firestore
  const handleBulkSyncFirestore = async () => {
    setIsSyncingFirestore(true);
    try {
      let count = 0;
      for (const acc of sanitizedList) {
        await saveUserAccountToFirestore(acc);
        count++;
      }
      showNotice(`Đã đồng bộ tức thì toàn bộ ${count} tài khoản lên Firebase Firestore thành công!`, 'success');
    } catch {
      showNotice('Có lỗi xảy ra trong quá trình đồng bộ Firestore!', 'error');
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  // Merge duplicate devices across all accounts in Firestore & Local state
  const handleDeduplicateDevices = async () => {
    setIsDeduplicating(true);
    try {
      const res = await deduplicateAllUserAccountsDevicesInFirestore();
      
      // Update local state immediately with deduplicated devices
      const updatedList = sanitizedList.map((a) => {
        const raw = Array.isArray(a.authorizedDevices) ? a.authorizedDevices : [];
        return { ...a, authorizedDevices: deduplicateAuthorizedDevices(raw) };
      });
      setLocalAccounts(updatedList);
      onAccountsUpdated(updatedList);

      if (viewingDevicesUser) {
        const target = updatedList.find((a) => a.id === viewingDevicesUser.id || a.username === viewingDevicesUser.username);
        if (target) setViewingDevicesUser(target);
      }

      showNotice(
        `Đã rà soát ${res.totalAccounts} tài khoản! Hợp nhất thành công ${res.modifiedCount} tài khoản bị tính trùng thiết bị khi dùng nhiều trình duyệt hoặc ứng dụng trên cùng máy.`,
        'success'
      );
    } catch {
      showNotice('Có lỗi xảy ra khi hợp nhất thiết bị trùng lặp!', 'error');
    } finally {
      setIsDeduplicating(false);
    }
  };

  const handleExportJSON = () => {
    try {
      exportAccountsToJSONFile(sanitizedList);
      showNotice(`Đã tải về tệp sao lưu ${sanitizedList.length} tài khoản thành công! Bạn có thể lưu trữ tệp này vào Google Drive để bảo đảm an toàn 100%.`, 'success');
    } catch {
      showNotice('Không thể xuất tệp sao lưu!', 'error');
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (!text) {
          showNotice('Tệp tải lên không có nội dung!', 'error');
          setIsProcessing(false);
          return;
        }

        const res = await importAccountsFromJSON(text);
        if (res.success) {
          showNotice(`Đã nhập thành công ${res.count} tài khoản từ tệp sao lưu! Dữ liệu đã được đồng bộ an toàn.`, 'success');
          // Reload accounts
          try {
            const saved = localStorage.getItem('khbd_managed_user_accounts');
            if (saved) {
              const parsed = JSON.parse(saved);
              onAccountsUpdated(parsed);
            }
          } catch {}
        } else {
          showNotice(res.error || 'Nhập tệp sao lưu thất bại!', 'error');
        }
        setIsProcessing(false);
      };
      reader.readAsText(file);
    } catch (err: any) {
      showNotice('Có lỗi xảy ra khi đọc tệp sao lưu!', 'error');
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveToGoogleDrive = () => {
    exportAccountsToJSONFile(sanitizedList);
    showNotice('Đã tải tệp JSON về máy. Đang mở Google Drive để bạn tiện lưu trữ tệp sao lưu...', 'info');
    try {
      window.open('https://drive.google.com', '_blank');
    } catch {}
  };

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 flex flex-col w-screen h-screen bg-slate-900 text-slate-800 overflow-hidden animate-fadeIn"
          : "fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
      }
    >
      {/* Hidden File Input for JSON Backup Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      <div
        className={
          isFullscreen
            ? "bg-white w-full h-full flex flex-col overflow-hidden text-slate-800"
            : "bg-white border border-slate-200 rounded-2xl w-full max-w-[1550px] sm:w-[96vw] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800"
        }
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#7c2d12] via-[#9a3412] to-[#78350f] text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/20 p-2 border border-amber-300/40 text-amber-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Quản Trị & Cấp Tài Khoản Người Dùng
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-amber-950">
                  Dành Cho Admin
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Tự động đồng bộ thời gian thực</span>
              <span className="sm:hidden">Đồng bộ</span>
            </div>

            <button
              type="button"
              onClick={handleDeduplicateDevices}
              disabled={isDeduplicating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Tự động rà soát và hợp nhất các thiết bị bị tính trùng do dùng 2 ứng dụng hoặc nhiều trình duyệt (Chrome, Edge, Cốc Cốc) trên cùng một máy"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDeduplicating ? 'animate-spin' : ''}`} />
              <span>{isDeduplicating ? 'Đang hợp nhất...' : 'Hợp Nhất Máy Trùng'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateForm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cấp Tài Khoản Mới</span>
            </button>

            {/* Fullscreen toggle button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình (Full screen)'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Đóng cửa sổ quản trị"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notice */}
        {statusNotice && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all ${
              statusNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : statusNotice.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-b border-rose-200'
                : 'bg-blue-50 text-blue-800 border-b border-blue-200'
            }`}
          >
            {statusNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusNotice.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {statusNotice.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{statusNotice.text}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3 bg-slate-50/50">
          {/* Quick Metrics Bar (Collapsible to give maximum vertical screen space to accounts table) */}
          {showMetrics ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Chỉ số hệ thống tài khoản chi tiết:</span>
                <button
                  type="button"
                  onClick={() => setShowMetrics(false)}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
                >
                  Thu gọn chỉ số ▲
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Tổng tài khoản</div>
                    <div className="text-base font-black text-slate-900">{totalUsers}</div>
                  </div>
                </div>

                <div
                  onClick={() => setStatusFilter(statusFilter === 'new' ? 'all' : 'new')}
                  className={`p-3 rounded-xl border shadow-2xs flex items-center gap-2.5 cursor-pointer transition-all ${
                    totalNewAccounts > 0
                      ? 'bg-amber-50/90 border-amber-300 hover:bg-amber-100 ring-2 ring-amber-400/50'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Click để lọc các tài khoản mới tự đăng ký đang chờ admin cấp quyền"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    totalNewAccounts > 0 ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                      <span>Tài khoản Mới</span>
                      {totalNewAccounts > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      )}
                    </div>
                    <div className={`text-base font-black ${totalNewAccounts > 0 ? 'text-amber-800' : 'text-slate-800'}`}>
                      {totalNewAccounts}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Giáo viên</div>
                    <div className="text-base font-black text-emerald-700">{totalTeachers}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Quản trị viên</div>
                    <div className="text-base font-black text-indigo-700">{totalAdmins}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Máy tính liên kết</div>
                    <div className="text-base font-black text-blue-700">{totalActiveDevices} máy</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Đăng nhập hôm nay</div>
                    <div className="text-base font-black text-amber-700">{totalLoginsToday} lượt <span className="text-[10px] font-semibold text-slate-500">({usersLoggedInToday} user)</span></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  Tổng: <strong className="text-slate-900">{totalUsers}</strong> tài khoản
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Giáo viên: <strong className="text-emerald-700">{totalTeachers}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  Admin: <strong className="text-indigo-700">{totalAdmins}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  Đăng nhập hôm nay: <strong className="text-amber-700">{totalLoginsToday}</strong> lượt ({usersLoggedInToday} user)
                </span>
                {totalNewAccounts > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setStatusFilter(statusFilter === 'new' ? 'all' : 'new')}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 cursor-pointer animate-pulse"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      {totalNewAccounts} tài khoản mới chờ duyệt
                    </button>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowMetrics(true)}
                className="text-slate-500 hover:text-amber-800 text-[11px] font-bold cursor-pointer transition-colors"
              >
                Mở rộng thẻ chỉ số ▼
              </button>
            </div>
          )}

          {/* Search & Filters Toolbar */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nhanh theo họ tên, tên đăng nhập, email, trường học..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2 shrink-0">
              {/* View mode toggle: compact vs full */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCompactView(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    compactView
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Chế độ xem gọn: Ẩn bớt các cột để quan sát được nhiều tài khoản nhất. Chỉ hiển thị tên và thời gian đăng nhập. Bấm vào cây bút để xem chi tiết đầy đủ và sửa."
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Xem gọn (Tên & Đăng nhập)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCompactView(false)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    !compactView
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Chế độ xem đầy đủ: Hiển thị chi tiết tất cả các cột trên bảng"
                >
                  <TableProperties className="w-3.5 h-3.5" />
                  <span>Xem đầy đủ cột</span>
                </button>
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-600 cursor-pointer"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="teacher">Chỉ Giáo viên</option>
                <option value="admin">Chỉ Admin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-600 cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="new">🌟 Mới (Chờ cấp quyền)</option>
                <option value="active">Đang kích hoạt</option>
                <option value="locked">Đang bị khóa</option>
              </select>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold">
                    {compactView ? (
                      <>
                        <th className="py-2.5 px-3 text-center w-12">STT</th>
                        <th className="py-2.5 px-3">Họ Tên & Tài Khoản</th>
                        <th className="py-2.5 px-3">Thời Gian Đăng Nhập & Hoạt Động</th>
                        <th className="py-2.5 px-3">Ngày Hết Hạn Tài Khoản</th>
                        <th className="py-2.5 px-3 text-center w-28">Trạng thái</th>
                        <th className="py-2.5 px-3 text-right w-56">Thao tác</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 px-3.5">Họ tên & Đơn vị</th>
                        <th className="py-3 px-3.5">Tên đăng nhập / Email</th>
                        <th className="py-3 px-3.5">Mật khẩu</th>
                        <th className="py-3 px-3.5 text-center">Vai trò</th>
                        <th className="py-3 px-3.5 text-center">Máy đã đăng nhập</th>
                        <th className="py-3 px-3.5">Ngày Hết Hạn Tài Khoản & Hoạt Động</th>
                        <th className="py-3 px-3.5 text-center">Trạng thái</th>
                        <th className="py-3 px-3.5 text-right">Thao tác</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={compactView ? 6 : 8} className="py-8 text-center text-slate-400">
                        Không tìm thấy tài khoản nào phù hợp với điều kiện tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc, index) => {
                      const devices = Array.isArray(acc.authorizedDevices) ? acc.authorizedDevices : [];
                      const maxAllowed = acc.maxDevices !== undefined ? acc.maxDevices : (acc.role === 'admin' ? 10 : 2);
                      const isFull = devices.length >= maxAllowed;

                      if (compactView) {
                        return (
                          <tr
                            key={`compact-${acc.id}`}
                            className="hover:bg-amber-50/40 transition-colors"
                          >
                            {/* STT */}
                            <td className="py-2.5 px-3 text-center text-slate-400 font-bold">
                              {index + 1}
                            </td>

                            {/* Name & Account */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-slate-900 border border-amber-300 overflow-hidden flex items-center justify-center shadow-xs shrink-0">
                                  {acc.avatar ? (
                                    <img src={acc.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <div
                                      className={`w-full h-full flex items-center justify-center font-bold text-[11px] text-white ${
                                        acc.role === 'admin'
                                          ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-amber-100'
                                          : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-emerald-100'
                                      }`}
                                    >
                                      {acc.role === 'admin' ? (
                                        <Shield className="w-3.5 h-3.5 text-amber-200" />
                                      ) : (
                                        <span>{getUserInitials(acc.fullName, acc.username)}</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                                    <span className="truncate">{acc.fullName}</span>
                                    {acc.username === 'admin@123' && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black shrink-0">
                                        GỐC
                                      </span>
                                    )}
                                    {acc.role === 'admin' && acc.username !== 'admin@123' && (
                                      <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[9px] font-black shrink-0">
                                        ADMIN
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 flex-wrap">
                                    <span className="font-mono text-slate-700 font-semibold">{acc.username}</span>
                                    {acc.schoolName && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-500 truncate max-w-[240px]">{acc.schoolName}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Thời Gian Đăng Nhập & Hoạt Động */}
                            <td className="py-2.5 px-3">
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                  <LogIn className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Đăng nhập: <strong className="font-bold text-slate-900">{acc.lastLogin || 'Chưa đăng nhập'}</strong></span>
                                </div>
                                <div className="text-[11px] font-medium text-purple-700 flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-purple-500 shrink-0" />
                                  <span>Hôm nay: <strong className="font-bold text-purple-900">{formatActiveTime(acc.activeSecondsToday !== undefined ? acc.activeSecondsToday : (acc.activeMinutesToday ? acc.activeMinutesToday * 60 : 0))}</strong></span>
                                  {(acc.loginCountToday || 0) > 0 && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-slate-600 font-semibold">{acc.loginCountToday} lượt</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Ngày Hết Hạn Tài Khoản / Gói Cấp */}
                            <td className="py-2.5 px-3">
                              {renderAccountExpiryBadge(acc)}
                            </td>

                            {/* Trạng thái */}
                            <td className="py-2.5 px-3 text-center">
                              {acc.status === 'new' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] border border-amber-300 shadow-2xs animate-pulse">
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  Mới
                                </span>
                              ) : acc.status === 'active' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Hoạt động
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Đã khóa
                                </span>
                              )}
                            </td>

                            {/* Thao tác */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Nút cấp / gia hạn nhanh 1 năm */}
                                {acc.status !== 'locked' && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickGrantDate(acc, 12)}
                                    disabled={isProcessing}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-black text-xs shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
                                      isExplicitGrantedDate(acc.expiresAt)
                                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    }`}
                                    title={
                                      isExplicitGrantedDate(acc.expiresAt)
                                        ? `Gia hạn thêm 1 năm (cộng tiếp vào hạn hiện tại: ${acc.expiresAt})`
                                        : 'Cấp ngay hạn dùng 1 năm theo ngày'
                                    }
                                  >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>+1 Năm</span>
                                  </button>
                                )}

                                {/* NÚT CÁI BÚT - Ấn vào sẽ hiển thị đầy đủ để sửa và xem */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditForm(acc)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                  title="Ấn vào cây bút để xem chi tiết đầy đủ và sửa tài khoản này"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-white" />
                                  <span>Xem & Sửa</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenQuickPassword(acc)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
                                  title="Đổi mật khẩu nhanh"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(acc)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    acc.status === 'active'
                                      ? 'text-slate-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200'
                                      : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                  title={acc.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                >
                                  {acc.status === 'active' ? (
                                    <Lock className="w-3.5 h-3.5" />
                                  ) : (
                                    <Unlock className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {acc.username !== 'admin@123' && (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingAccountUser(acc)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                                    title={`Xóa tài khoản ${acc.fullName}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={`full-${acc.id}`}
                          className="hover:bg-amber-50/30 transition-colors"
                        >
                          {/* Name & School */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2.5">
                              {/* Avatar display */}
                              <div className="w-8 h-8 rounded-full bg-slate-900 border border-amber-300 overflow-hidden flex items-center justify-center shadow-xs shrink-0">
                                {acc.avatar ? (
                                  <img src={acc.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <div
                                    className={`w-full h-full flex items-center justify-center font-bold text-[11px] text-white ${
                                      acc.role === 'admin'
                                        ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-amber-100'
                                        : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-emerald-100'
                                    }`}
                                  >
                                    {acc.role === 'admin' ? (
                                      <Shield className="w-3.5 h-3.5 text-amber-200" />
                                    ) : (
                                      <span>{getUserInitials(acc.fullName, acc.username)}</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                  <span>{acc.fullName}</span>
                                  {acc.username === 'admin@123' && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black">
                                      GỐC
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Building className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[180px]">{acc.schoolName}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Username */}
                          <td className="py-3 px-3.5">
                            <div className="font-mono font-semibold text-slate-800">{acc.username}</div>
                            {acc.phone && (
                              <div className="text-[10px] text-slate-500">{acc.phone}</div>
                            )}
                          </td>

                          {/* Password */}
                          <td className="py-3 px-3.5">
                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700">
                              <KeyRound className="w-3 h-3 text-slate-400" />
                              <span>{acc.accessCode || '******'}</span>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-3.5 text-center">
                            {acc.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px]">
                                <Shield className="w-3 h-3 text-amber-700" />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px]">
                                <UserCheck className="w-3 h-3 text-emerald-700" />
                                Giáo viên
                              </span>
                            )}
                          </td>

                          {/* Devices Count & Actions */}
                          <td className="py-3 px-3.5 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                    isFull
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : devices.length > 0
                                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  }`}
                                  title={`${devices.length} máy đã đăng nhập trong tổng số tối đa ${maxAllowed} máy`}
                                >
                                  <Laptop className="w-3 h-3" />
                                  <span>
                                    {devices.length} / {maxAllowed} máy
                                  </span>
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-[11px]">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setViewingDevicesUser(acc);
                                  }}
                                  className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 border border-blue-200 font-semibold transition-colors cursor-pointer"
                                  title="Xem danh sách máy và lịch sử đăng nhập"
                                >
                                  Chi tiết máy
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleResetUserDevices(acc);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 hover:text-amber-950 border border-amber-300 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                                  title="Khôi phục/Đặt lại về 0 máy ngay lập tức khi người dùng cài lại Windows/Mac"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>Khôi phục</span>
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Expiry Date & Active Duration Monitoring */}
                          <td className="py-3 px-3.5">
                            {renderAccountExpiryBadge(acc)}

                            <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                              <LogIn className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Đăng nhập gần nhất: {acc.lastLogin || 'Chưa có'}</span>
                            </div>
                            <div className="text-[10px] font-semibold text-purple-700 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-purple-500 shrink-0 animate-pulse" />
                              <span>Thời gian dùng hôm nay: <strong className="font-bold text-purple-900">{formatActiveTime(acc.activeSecondsToday !== undefined ? acc.activeSecondsToday : (acc.activeMinutesToday ? acc.activeMinutesToday * 60 : 0))}</strong></span>
                            </div>
                            <div className="mt-1 flex items-center gap-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingDevicesUser(acc);
                                  setActiveDetailTab('loginLogs');
                                }}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                  (acc.loginCountToday || 0) > 10
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 animate-pulse'
                                    : (acc.loginCountToday || 0) > 5
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                                    : (acc.loginCountToday || 0) > 0
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                                }`}
                                title={`Đã đăng nhập ${acc.loginCountToday || 0} lượt hôm nay. Tổng thời gian dùng: ${formatActiveTime(acc.activeMinutesToday)}. Click để xem chi tiết.`}
                              >
                                <Activity className="w-3 h-3" />
                                <span>{acc.loginCountToday || 0} lượt hôm nay</span>
                              </button>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3.5 text-center">
                            {acc.status === 'new' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] border border-amber-300 shadow-2xs animate-pulse">
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                Mới (Chờ cấp)
                              </span>
                            ) : acc.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Đã khóa
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Quick grant / extension shortcuts */}
                              {acc.status !== 'locked' && (
                                <div className="inline-flex items-center gap-1 mr-1">
                                  {(acc.status === 'new' || !isExplicitGrantedDate(acc.expiresAt)) ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickGrantDate(acc, 12)}
                                        disabled={isProcessing}
                                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                                        title="Cấp 1 năm sử dụng theo ngày tháng (Tính từ hôm nay)"
                                      >
                                        +1 Năm
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickGrantPermanent(acc)}
                                        disabled={isProcessing}
                                        className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-extrabold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                                        title="Cấp quyền sử dụng Vĩnh viễn"
                                      >
                                        Vĩnh viễn
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickGrantTrials(acc, 5)}
                                        disabled={isProcessing}
                                        className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10.5px] font-bold border border-amber-300 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                                        title="Cấp nhanh 5 lượt dùng thử bài dạy"
                                      >
                                        +5 Lượt
                                      </button>
                                    </>
                                  ) : acc.expiresAt !== 'Vĩnh viễn' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickGrantDate(acc, 12)}
                                      disabled={isProcessing}
                                      className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10.5px] font-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                                      title={`Gia hạn thêm 1 năm (cộng tiếp vào hạn dùng hiện tại: ${acc.expiresAt})`}
                                    >
                                      +1 Năm (Gia hạn)
                                    </button>
                                  ) : null}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenQuickPassword(acc)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
                                title="Đổi mật khẩu nhanh cho tài khoản này"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditForm(acc)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
                                title="Sửa chi tiết thông tin tài khoản"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(acc)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                  acc.status === 'active'
                                    ? 'text-slate-600 hover:text-rose-700 hover:bg-rose-50 border-slate-200'
                                    : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                                }`}
                                title={acc.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              >
                                {acc.status === 'active' ? (
                                  <Lock className="w-3.5 h-3.5" />
                                ) : (
                                  <Unlock className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {acc.username !== 'admin@123' && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingAccountUser(acc)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                                  title={`Xóa tài khoản ${acc.fullName}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 text-slate-600 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Mỗi tài khoản được giới hạn số máy theo cấu hình cấp phát (Admin 10 máy, Giáo viên từ 1 - 10 máy). Khi người dùng đổi máy tính hoặc cài lại Windows/macOS, Quản trị viên chỉ cần bấm <strong>"Khôi phục"</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* MODAL 1: CREATE / EDIT & FULL ACCOUNT DETAILS VIEW */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-800">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#7c2d12] via-[#9a3412] to-[#78350f] text-white">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-300" />
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {editingAccount ? 'Chi Tiết & Chỉnh Sửa Tài Khoản' : 'Cấp Tài Khoản Người Dùng Mới'}
                  </h4>
                  {editingAccount && (
                    <div className="text-[11px] text-amber-200 font-medium">
                      {editingAccount.fullName} ({editingAccount.username})
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-amber-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* If viewing existing account, show detailed information card */}
              {editingAccount && (
                <div className="p-3.5 bg-gradient-to-br from-amber-50/70 via-slate-50 to-orange-50/40 border border-amber-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Thông tin giám sát & tình trạng hiện tại
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      ID: {editingAccount.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {/* Log in status */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                        <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đăng nhập lần cuối:</span>
                      </div>
                      <div className="text-slate-900 font-black">
                        {editingAccount.lastLogin || 'Chưa đăng nhập'}
                      </div>
                      <div className="text-[11px] text-purple-700 font-bold flex items-center gap-1 pt-1 border-t border-slate-100">
                        <Clock className="w-3 h-3 text-purple-500" />
                        <span>Hôm nay: {formatActiveTime(editingAccount.activeSecondsToday !== undefined ? editingAccount.activeSecondsToday : (editingAccount.activeMinutesToday ? editingAccount.activeMinutesToday * 60 : 0))} ({editingAccount.loginCountToday || 0} lượt)</span>
                      </div>
                    </div>

                    {/* Expiry Date or Generation Count info */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Hạn dùng / Số lượt:</span>
                      </div>
                      {(!editingAccount.expiresAt || editingAccount.expiresAt === 'Chưa cấp' || editingAccount.expiresAt.toLowerCase().includes('dùng thử')) ? (
                        <div>
                          <div className="text-amber-800 font-black flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>Còn {Math.max(0, (editingAccount.maxTrialGenerations ?? 5) - (editingAccount.trialGenerations || 0))} lượt</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-semibold pt-1 border-t border-slate-100">
                            Đã tạo: <strong className="text-slate-800">{editingAccount.trialGenerations || 0}</strong> / {editingAccount.maxTrialGenerations ?? 5} bài dạy
                          </div>
                        </div>
                      ) : editingAccount.expiresAt === 'Vĩnh viễn' ? (
                        <div>
                          <div className="text-emerald-700 font-black flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Vĩnh viễn</span>
                          </div>
                          <div className="text-[11px] text-emerald-600 font-medium pt-1 border-t border-slate-100">
                            Không giới hạn thời gian & lượt
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-slate-900 font-black flex items-center gap-1">
                            <span>{editingAccount.expiresAt}</span>
                          </div>
                          <div className="text-[11px] text-amber-800 font-semibold pt-1 border-t border-slate-100 flex items-center gap-1">
                            <span>Tài khoản có thời hạn</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Devices info */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="text-[11px] text-slate-500 font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Laptop className="w-3.5 h-3.5 text-blue-600" />
                          <span>Máy đã liên kết:</span>
                        </span>
                        <span className="font-extrabold text-blue-700">
                          {editingAccount.authorizedDevices?.length || 0} / {editingAccount.maxDevices ?? 2} máy
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setViewingDevicesUser(editingAccount);
                            setActiveDetailTab('devices');
                          }}
                          className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10.5px] font-bold border border-blue-200 cursor-pointer"
                        >
                          Xem danh sách máy
                        </button>
                        {(editingAccount.authorizedDevices?.length || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => handleResetUserDevices(editingAccount)}
                            disabled={isProcessing}
                            className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10.5px] font-bold border border-amber-300 cursor-pointer"
                          >
                            Khôi phục (0 máy)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form inputs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên giáo viên / người dùng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Ví dụ: Thầy Trần Quang Huy"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên đăng nhập / Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="Ví dụ: quanghuy.toan@edu.vn"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Mật khẩu truy cập
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                    >
                      {showFormPassword ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Ẩn mật khẩu</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Hiện mật khẩu</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showFormPassword ? 'text' : 'password'}
                      value={formAccessCode}
                      onChange={(e) => setFormAccessCode(e.target.value)}
                      placeholder="Ví dụ: 123456 hoặc GVToan@2025"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-16 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formAccessCode) {
                          navigator.clipboard.writeText(formAccessCode);
                          alert(`Đã sao chép mật khẩu: ${formAccessCode}`);
                        }
                      }}
                      className="absolute right-1.5 top-1.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                      title="Sao chép mật khẩu vào bộ nhớ tạm"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trường học / Đơn vị công tác
                  </label>
                  <input
                    type="text"
                    value={formSchoolName}
                    onChange={(e) => setFormSchoolName(e.target.value)}
                    placeholder="Ví dụ: THPT Chuyên Châu Văn Liêm"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Ví dụ: 0912 345 678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phân quyền
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  >
                    <option value="teacher">Giáo viên</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trạng thái tài khoản
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  >
                    <option value="active">🟢 Đang hoạt động (Cho phép sử dụng)</option>
                    <option value="new">🌟 Mới (Chờ cấp quyền)</option>
                    <option value="locked">🔒 Tạm khóa (Khóa truy cập)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giới hạn số máy
                  </label>
                  <select
                    value={formMaxDevices}
                    onChange={(e) => setFormMaxDevices(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  >
                    <option value={0}>0 máy (Tạm khóa đăng nhập)</option>
                    <option value={1}>1 máy</option>
                    <option value={2}>2 máy (Chuẩn)</option>
                    <option value={3}>3 máy</option>
                    <option value={4}>4 máy</option>
                    <option value={5}>5 máy</option>
                    <option value={10}>10 máy (VIP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hình thức cấp quyền
                  </label>
                  <select
                    value={formAccessMode}
                    onChange={(e) => handleAccessModeChange(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  >
                    <option value="trial">Dùng thử (Cấp theo lượt)</option>
                    <option value="date">Theo thời hạn (Cấp ngày hết hạn)</option>
                    <option value="permanent">Vĩnh viễn (Không giới hạn)</option>
                  </select>
                </div>
              </div>

              {formAccessMode === 'date' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                      <span>Ngày hết hạn tài khoản (Định dạng: DD/MM/YYYY)</span>
                    </label>
                    <span className="text-[11px] text-amber-800 font-semibold">
                      Tự động tính ngày khóa
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block mb-1">Nhập trực tiếp (DD/MM/YYYY):</span>
                      <input
                        type="text"
                        value={formExpiresAt}
                        onChange={(e) => setFormExpiresAt(e.target.value)}
                        placeholder="Ví dụ: 31/12/2026"
                        className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block mb-1">Hoặc chọn nhanh từ lịch:</span>
                      <input
                        type="date"
                        onChange={(e) => {
                          if (e.target.value) {
                            const p = e.target.value.split('-');
                            if (p.length === 3) {
                              setFormExpiresAt(`${String(Number(p[2])).padStart(2, '0')}/${String(Number(p[1])).padStart(2, '0')}/${p[0]}`);
                            }
                          }
                        }}
                        className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Quick Preset Extension Buttons */}
                  <div>
                    <span className="text-[10.5px] text-slate-600 font-bold block mb-1.5">
                      Gia hạn nhanh từ hôm nay:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSetDatePreset(1)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                      >
                        +1 Tháng
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetDatePreset(3)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                      >
                        +3 Tháng
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetDatePreset(6)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                      >
                        +6 Tháng
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetDatePreset(12)}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                      >
                        +1 Năm (Chuẩn)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetDatePreset(24)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                      >
                        +2 Năm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetDatePreset(36)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                      >
                        +3 Năm
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {formAccessMode === 'trial' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số lượt tối đa cho phép
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formMaxTrialGenerations}
                        onChange={(e) => setFormMaxTrialGenerations(Number(e.target.value))}
                        className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Số lượt đã dùng
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formTrialGenerations}
                        onChange={(e) => setFormTrialGenerations(Number(e.target.value))}
                        className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10.5px] text-slate-600 font-bold block mb-1.5">
                      Gia hạn / cấp thêm lượt nhanh:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setFormMaxTrialGenerations((prev) => Math.max(5, (prev || 5) + 5))}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                      >
                        +5 Lượt
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormMaxTrialGenerations((prev) => Math.max(10, (prev || 5) + 10))}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                      >
                        +10 Lượt
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormMaxTrialGenerations((prev) => Math.max(20, (prev || 5) + 20))}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                      >
                        +20 Lượt
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormTrialGenerations(0)}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                        title="Đặt lại số lượt đã dùng về 0 để người dùng tiếp tục sử dụng trọn vẹn số lượt được cấp"
                      >
                        Đặt lại đã dùng (0 lượt)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú quản trị
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ghi chú về tổ bộ môn, môn giảng dạy, thông tin liên hệ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isProcessing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>{editingAccount ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INSPECT & MANAGE DEVICES / LOGIN LOGS MODAL */}
      {viewingDevicesUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
              <div className="flex items-center gap-2.5">
                <Laptop className="w-5 h-5 text-blue-300" />
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Chi Tiết Tài Khoản: {viewingDevicesUser.fullName}
                  </h4>
                  <p className="text-[11px] text-blue-200">
                    Tên đăng nhập: {viewingDevicesUser.username} • Trường: {viewingDevicesUser.schoolName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDevicesUser(null)}
                className="p-1 text-blue-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100/80 px-4 pt-2.5">
              <button
                type="button"
                onClick={() => setActiveDetailTab('devices')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                  activeDetailTab === 'devices'
                    ? 'border-blue-600 text-blue-800 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Máy Liên Kết ({(viewingDevicesUser.authorizedDevices || []).length}/{viewingDevicesUser.maxDevices || 2})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDetailTab('loginLogs')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                  activeDetailTab === 'loginLogs'
                    ? 'border-amber-600 text-amber-800 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Giám Sát Đăng Nhập (Hôm nay: {viewingDevicesUser.loginCountToday || 0} lượt)</span>
              </button>
            </div>

            {/* Modal Body Tab 1: Devices */}
            {activeDetailTab === 'devices' && (
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Device Overview Banner */}
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-blue-900 flex items-center gap-2">
                      <span>Trạng thái liên kết: {(viewingDevicesUser.authorizedDevices || []).length} / {viewingDevicesUser.maxDevices || 2} máy</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                        Chuẩn máy vật lý
                      </span>
                    </div>
                    <div className="text-[11px] text-blue-700 mt-0.5">
                      {(viewingDevicesUser.authorizedDevices || []).length >= (viewingDevicesUser.maxDevices || 2)
                        ? '⚠️ Tài khoản đã đầy số máy cho phép. Các máy thứ 3 sẽ bị từ chối đăng nhập.'
                        : '✅ Tài khoản còn chỗ đăng nhập cho máy tính khác.'}
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5">
                    {/* Quick deduplicate button for this user if they have multiple devices */}
                    {(viewingDevicesUser.authorizedDevices || []).length > 1 && (
                      <button
                        type="button"
                        onClick={async () => {
                          const deduped = deduplicateAuthorizedDevices(viewingDevicesUser.authorizedDevices || []);
                          if (deduped.length !== (viewingDevicesUser.authorizedDevices || []).length) {
                            const updatedUser = { ...viewingDevicesUser, authorizedDevices: deduped };
                            await saveUserAccountToFirestore(updatedUser);
                            const updatedList = sanitizedList.map((a) => (a.id === updatedUser.id ? updatedUser : a));
                            setLocalAccounts(updatedList);
                            onAccountsUpdated(updatedList);
                            setViewingDevicesUser(updatedUser);
                            showNotice(`Đã hợp nhất các thiết bị trùng lặp của tài khoản ${viewingDevicesUser.fullName || viewingDevicesUser.username} thành công!`, 'success');
                          } else {
                            showNotice('Các thiết bị của tài khoản này là các máy vật lý hoàn toàn khác nhau (không trùng lặp).', 'info');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                        title="Tự động gộp nếu người dùng này từng đăng nhập 2 ứng dụng hoặc 2 trình duyệt trên cùng 1 máy"
                      >
                        Gộp máy trùng
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDecreaseMaxDevices(viewingDevicesUser)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      title="Giảm 1 máy được phép đăng nhập (có thể giảm về 0 máy)"
                    >
                      -1 Máy
                    </button>

                    <button
                      type="button"
                      onClick={() => handleIncreaseMaxDevices(viewingDevicesUser)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      title="Tăng thêm 1 máy được phép đăng nhập"
                    >
                      +1 Máy
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResetUserDevices(viewingDevicesUser)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      title="Xóa toàn bộ máy đã đăng ký (khôi phục về 0 máy) để người dùng đăng nhập lại từ đầu"
                    >
                      Khôi phục (0 máy)
                    </button>
                  </div>
                </div>

                {/* Information Rule banner */}
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Quy định nhận diện máy: </span>
                    <span>1 máy tính vật lý được phép mở đồng thời nhiều ứng dụng (KHBD AI PRO, Trắc nghiệm...) hoặc nhiều trình duyệt (Chrome, Edge, Cốc Cốc...) và chỉ tính là <strong>1 máy duy nhất</strong>, không bao giờ bị trừ 2 lượt máy.</span>
                  </div>
                </div>

                {/* Devices List */}
                <div className="space-y-2.5">
                  <h5 className="font-bold text-xs text-slate-700">
                    Danh Sách Máy Tính Đã Nhận Diện ({(viewingDevicesUser.authorizedDevices || []).length} máy):
                  </h5>

                  {(!viewingDevicesUser.authorizedDevices || viewingDevicesUser.authorizedDevices.length === 0) ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                      Chưa có máy tính nào đăng nhập vào tài khoản này. Người dùng có thể đăng nhập trên máy tính bất kỳ.
                    </div>
                  ) : (
                    viewingDevicesUser.authorizedDevices.map((dev, dIdx) => (
                      <div
                        key={`${dev.deviceId}-${dIdx}`}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition-colors shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                            <Monitor className="w-4.5 h-4.5" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-slate-900">{dev.deviceName}</span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                {dev.os || 'Hệ điều hành'}
                              </span>
                              {dev.browser && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                                  Trình duyệt: {dev.browser}
                                </span>
                              )}
                              {(dev.usedApps && dev.usedApps.length > 0) ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                                  Ứng dụng: {dev.usedApps.join(', ')}
                                </span>
                              ) : dev.appName ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                                  Ứng dụng: {dev.appName}
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Mã máy: {dev.deviceId}
                            </div>
                            <div className="text-[10px] text-slate-600">
                              Đăng nhập đầu: <span className="font-medium text-slate-800">{dev.firstLogin}</span> • Gần nhất: <span className="font-medium text-slate-800">{dev.lastActive}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSingleDevice(viewingDevicesUser, dev.deviceId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer shrink-0"
                          title="Hủy liên kết máy này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Modal Body Tab 2: Login Logs & Telemetry */}
            {activeDetailTab === 'loginLogs' && (
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Stats Summary Banner */}
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-amber-900">Giám sát tần suất & Thời gian sử dụng</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px]">
                        Hôm nay: {viewingDevicesUser.loginCountToday || 0} lượt
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-extrabold text-[10px] border border-purple-200">
                        Thời gian dùng hôm nay: {formatActiveTime(viewingDevicesUser.activeSecondsToday !== undefined ? viewingDevicesUser.activeSecondsToday : (viewingDevicesUser.activeMinutesToday ? viewingDevicesUser.activeMinutesToday * 60 : 0))}
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-800">
                      Tổng số lượt đăng nhập tích lũy: <strong className="text-amber-950">{viewingDevicesUser.totalLoginCount || 0} lượt</strong> • Lượt đăng nhập gần nhất: <span className="font-semibold text-slate-800">{viewingDevicesUser.lastLogin || 'Chưa có'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleResetTodayLogins(viewingDevicesUser)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    title="Đặt lại số lượt đăng nhập & thời gian hoạt động trong ngày về 0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đặt lại hôm nay về 0</span>
                  </button>
                </div>

                {/* Session tracking explanation info box */}
                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] text-blue-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-blue-950">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Cơ chế tự động đếm lượt & đo thời gian khi người dùng KHÔNG bấm Đăng xuất:</span>
                  </div>
                  <div className="text-[10px] leading-relaxed text-blue-800 grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5">
                    <div>
                      • <strong>Tự động đếm phiên mới:</strong> Nếu tắt tab/đóng máy &gt; 30 phút hoặc sang ngày mới rồi mở lại, hệ thống sẽ tự động đếm 1 lượt đăng nhập mới.
                    </div>
                    <div>
                      • <strong>Đo thời gian dùng thực tế:</strong> Hệ thống dùng nhịp tim 60s/lần (Heartbeat) để tích lũy chính xác tổng thời gian ứng dụng đang chạy.
                    </div>
                  </div>
                </div>

                {/* Login History Log List */}
                <div className="space-y-2">
                  <h5 className="font-bold text-xs text-slate-700 flex items-center justify-between">
                    <span>Nhật Ký Lịch Sử Đăng Nhập (Tối đa 50 lượt gần nhất):</span>
                    <span className="text-[10px] text-slate-400 font-normal">Tự động cập nhật</span>
                  </h5>

                  {(!viewingDevicesUser.loginLogs || viewingDevicesUser.loginLogs.length === 0) ? (
                    <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                      Chưa có nhật ký đăng nhập chi tiết nào được ghi nhận cho tài khoản này.
                    </div>
                  ) : (
                    <div className="space-y-2 divide-y divide-slate-100">
                      {viewingDevicesUser.loginLogs.map((log, idx) => (
                        <div
                          key={`${log.timestamp}-${idx}`}
                          className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                              <LogIn className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-[11px]">
                                {log.timestamp}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Thiết bị: <span className="font-medium text-slate-700">{log.deviceName || 'Thiết bị chưa rõ'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {log.date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-100 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setViewingDevicesUser(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK PASSWORD RESET MODAL */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-300" />
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Đổi Mật Khẩu Nhanh
                  </h4>
                  <p className="text-[11px] text-amber-200 truncate max-w-[280px]">
                    Tài khoản: {passwordResetUser.fullName} ({passwordResetUser.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordResetUser(null)}
                className="p-1 text-amber-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPassword} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={quickNewPassword}
                    onChange={(e) => setQuickNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới cho người dùng..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Mật khẩu mới sẽ được đồng bộ ngay lập tức lên Firestore và người dùng có thể dùng để đăng nhập ngay.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordResetUser(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isProcessing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Lưu Mật Khẩu Lên Firestore</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM DELETE ACCOUNT MODAL */}
      {deletingAccountUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
            <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900 text-white">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <h4 className="font-bold text-sm text-white">
                  Xác Nhận Xóa Tài Khoản
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setDeletingAccountUser(null)}
                className="p-1 text-rose-200 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-950 text-xs">
                <p className="font-semibold leading-relaxed">
                  Bạn có chắc chắn muốn xóa tài khoản người dùng này khỏi hệ thống không?
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-rose-200 space-y-1">
                  <div className="font-bold text-slate-900 text-sm">
                    {deletingAccountUser.fullName}
                  </div>
                  <div className="text-slate-600 font-medium">
                    Tên đăng nhập: <strong className="text-rose-700">{deletingAccountUser.username}</strong>
                  </div>
                  {deletingAccountUser.schoolName && (
                    <div className="text-slate-500 text-[11px]">
                      Trường/Đơn vị: {deletingAccountUser.schoolName}
                    </div>
                  )}
                  <div className="text-slate-500 text-[11px]">
                    Thời hạn hiện tại: <span className="font-bold text-slate-800">{deletingAccountUser.expiresAt || 'Chưa cấp'}</span>
                  </div>
                </div>
                <p className="text-[11px] text-rose-700 leading-normal">
                  ⚠️ Lưu ý: Sau khi xóa, tài khoản sẽ bị thu hồi toàn bộ quyền truy cập hệ thống.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingAccountUser(null)}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const accToDelete = deletingAccountUser;
                    setDeletingAccountUser(null);
                    await handleDeleteAccount(accToDelete);
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isProcessing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Xác Nhận Xóa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
