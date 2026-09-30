import React, { useState, useEffect, useRef } from 'react';
import {
  LessonPlanConfig,
  LessonPlanOutput,
  ActivityDetail,
  TextbookSample,
  CustomUploadedBook,
  CombineWeekConfig,
  SavedCombineItem,
  AiRefineProgress,
} from './types';
import {


} from './data/curriculumData';
import { SEED_SAMPLE_PPCT } from './data/seedData';
import { findMatchInPPCTList } from './utils/ppctMatcher';
import { Header } from './components/Header';
import { LeftConfigPanel } from './components/LeftConfigPanel';
import { RightResultEditor } from './components/RightResultEditor';
import { AiSuggestionModal } from './components/AiSuggestionModal';
import { FirebaseStorageModal } from './components/FirebaseStorageModal';
import { GuideModal } from './components/GuideModal';
import { SourceCodeModal } from './components/SourceCodeModal';
import { LoginModal } from './components/LoginModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { UserManagementModal } from './components/UserManagementModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ContactAdminModal } from './components/ContactAdminModal';
import { getApiHeaders, getStoredApiKey, setStoredApiKey } from './utils/apiKeyManager';
import { getUserAccessStatus } from './utils/userAccess';
import {
  ManagedUserAccount,
  DEFAULT_USER_ACCOUNTS,
  loadUserAccountsFromFirestore,
  subscribeToUserAccounts,
  loadTextbooksFromFirestore,
  loadPPCTFromFirestore,
  sanitizeUserAccounts,
  checkAndAuthorizeDevice,
  recordUserHeartbeat,
  saveUserAccountToFirestore, updateUserActivityInFirestore,
} from './utils/firebase';
import { getMachineHardwareFingerprint } from './utils/deviceManager';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  User,
  Phone,
  MessageCircle,
  Sliders,
  FileText,
  Download,
  Plus,
  Loader2,
  Key,
  Layers,
} from 'lucide-react';
import { exportLessonPlanToDocx, exportMultipleMergedLessonPlansToDocx } from './utils/docxExporter';
import { CombineLessonPlansTab } from './components/CombineLessonPlansTab';
import { isPreschoolPlan, formatPreschoolActivities } from './utils/preschoolUtils';

export type StepProgress = 'pending' | 'start' | 'done';

export default function App() {
  // Active Tab state ('config' for Tab 1, 'result' for Tab 2, 'combine' for Tab 3) - Cố định tab được chọn
  const [activeTab, setActiveTabState] = useState<'config' | 'result' | 'combine'>(() => {
    try {
      const saved = localStorage.getItem('khbd_active_tab');
      if (saved === 'config' || saved === 'result' || saved === 'combine') return saved;
    } catch (e) {
      console.warn('Failed to parse khbd_active_tab:', e);
    }
    return 'config';
  });

  const setActiveTab = (tab: 'config' | 'result' | 'combine') => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('khbd_active_tab', tab);
    } catch {}
  };

  // Tab 3 Combine Saved Plans list state
  const [combineList, setCombineList] = useState<SavedCombineItem[]>(() => {
    try {
      const saved = localStorage.getItem('khbd_combine_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse khbd_combine_list from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('khbd_combine_list', JSON.stringify(combineList));
    } catch (e) {
      console.warn('Failed to save khbd_combine_list to localStorage:', e);
    }
  }, [combineList]);

  // Tab 3: Cấu hình Giáo án Tuần & Ghép Ngày theo mẫu chuẩn
  const [weekConfig, setWeekConfig] = useState<CombineWeekConfig>(() => {
    try {
      const saved = localStorage.getItem('khbd_combine_week_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse khbd_combine_week_config:', e);
    }
    return {
      enabled: true,
      weekTitle: 'TUẦN 1:',
      themeGroup: 'BẢN THÂN',
      subTheme: 'TÔI LÀ AI?',
      dateRangeText: '',
      startDate: '',
      endDate: '',
      startPrepDate: '',
      useAsteriskDivider: true,
      showItemTitleBanner: false,
    };
  });

  const handleUpdateWeekConfig = (patch: Partial<CombineWeekConfig>) => {
    setWeekConfig((prev) => {
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem('khbd_combine_week_config', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Config state
  const [config, setConfig] = useState<LessonPlanConfig>({
    lessonTitle: '',
    subject: 'GIÁO ÁN VĂN HỌC (THƠ)',
    schoolLevel: 'Mầm non',
    grade: 'Mẫu giáo lớn (5-6 tuổi)',
    bookSeries: 'Kết nối tri thức với cuộc sống',
    periods: 2,
    tableLayout: 'two_column',
    mathFormulaFormat: 'word_equation',
    enableNLS: false,
    nlsMode: 'ppct',
    customNLS: '',
    selectedNLSDomains: [],
    enableAI: false,
    aiMode: 'ppct',
    customAI: '',
    selectedAIDomains: [],
    enableSTEM: false,
    oldPlanContent: '',
    imageSlots: [],
    schoolName: 'Chưa cập nhật trường',
    teacherName: 'Giáo viên',
    additionalRequirements: '',
  });

  // Current Lesson Plan Result
  const [currentPlan, setCurrentPlan] = useState<LessonPlanOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRefiningActivity, setIsRefiningActivity] = useState(false);
  const [aiRefineProgress, setAiRefineProgress] = useState<AiRefineProgress>({
    isRefining: false,
    progressPercent: 0,
    stageText: '',
    elapsedSeconds: 0,
    status: 'idle',
  });
  const refineIntervalRef = useRef<any>(null);
  const lastRefineArgsRef = useRef<{ activity: ActivityDetail; instruction: string } | null>(null);
  const [progressSteps, setProgressSteps] = useState<Record<number, StepProgress>>({
    1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending'
  });
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Cancellation and timer refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('khbd_is_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<ManagedUserAccount | null>(() => {
    try {
      const isLogged = localStorage.getItem('khbd_is_logged_in');
      if (isLogged === 'true') {
        const savedUser = localStorage.getItem('khbd_current_user');
        if (savedUser) return JSON.parse(savedUser);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [allUserAccounts, setAllUserAccounts] = useState<ManagedUserAccount[]>(() => sanitizeUserAccounts(DEFAULT_USER_ACCOUNTS));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'register'>('login');
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isContactAdminOpen, setIsContactAdminOpen] = useState(false);
  const [hasCustomApiKey, setHasCustomApiKey] = useState<boolean>(() => Boolean(getStoredApiKey()));

  // User role state ('admin' for textbook upload & warehouse; 'teacher' hides warehouse)
  const [userRole, setUserRole] = useState<'admin' | 'teacher'>(() => {
    try {
      const isLogged = localStorage.getItem('khbd_is_logged_in');
      if (isLogged === 'true') {
        const savedUser = localStorage.getItem('khbd_current_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          return parsed.role || 'teacher';
        }
      }
      return 'teacher';
    } catch {
      return 'teacher';
    }
  });

  // Uploaded textbooks loaded from Firestore
  const [uploadedBooks, setUploadedBooks] = useState<CustomUploadedBook[]>([]);
  const [uploadedPPCTs, setUploadedPPCTs] = useState<any[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem('khbd_my_firebase_ppct');
    if (saved) {
      try {
        setUploadedPPCTs(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'guide' | 'ai_suggestions' | 'cloud_storage' | 'source_code' | null
  >(null);

  // Set document title and favicon
  useEffect(() => {
    document.title = 'KHBD AI PRO';
    try {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = `/logo.svg?v=${Date.now()}`;
      }
    } catch (e) {}
  }, []);

  // Full-width expand state for the lesson plan preview
  const [isExpandedPreview, setIsExpandedPreview] = useState(false);

  // Load user accounts and textbooks on startup from Firebase
  useEffect(() => {
    const unsubscribeUsers = subscribeToUserAccounts((accounts) => {
      if (accounts && accounts.length > 0) {
        setAllUserAccounts(accounts);
        // Only update current user if actively logged in
        try {
          const isLogged = localStorage.getItem('khbd_is_logged_in');
          if (isLogged === 'true') {
            const savedUserStr = localStorage.getItem('khbd_current_user');
            if (savedUserStr) {
              const savedUser = JSON.parse(savedUserStr);
              const fresh = accounts.find((a) => a.username.toLowerCase() === savedUser.username.toLowerCase() || a.id === savedUser.id);
              if (fresh) {
                setCurrentUser(fresh);
                setUserRole(fresh.role);
                setConfig((prev) => {
                  if (prev.teacherName === fresh.fullName && prev.schoolName === (fresh.schoolName || prev.schoolName)) {
                    return prev;
                  }
                  return {
                    ...prev,
                    teacherName: fresh.fullName,
                    schoolName: fresh.schoolName || prev.schoolName,
                  };
                });
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    });

    loadTextbooksFromFirestore().then((books) => {
      if (books && books.length > 0) {
        setUploadedBooks(books);
      }
    });

    loadPPCTFromFirestore().then((ppcts) => {
      if (ppcts && ppcts.length > 0) {
        setUploadedPPCTs(ppcts);
      }
    });

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  // Continuous active usage time & session heartbeat tracker for logged-in user
  // Counts active usage time continuously across the entire app
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) return;

    // Run initial heartbeat check for session gaps or new day start
    recordUserHeartbeat(currentUser, 0).then((acc) => {
      if (acc) {
        setCurrentUser(acc);
        setAllUserAccounts((prev) =>
          prev.map((a) => (a.id === acc.id ? acc : a))
        );
      }
    });

    // 1-second live clock ticker (ticks active usage seconds continuously while using the app)
    const timer = setInterval(() => {
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const todayStr = new Date().toLocaleDateString('vi-VN');
        const isSameDay = (prev.lastActiveDate || prev.lastLoginDate) === todayStr;
        const prevSecs = isSameDay 
          ? (prev.activeSecondsToday !== undefined ? prev.activeSecondsToday : (prev.activeMinutesToday ? prev.activeMinutesToday * 60 : 0)) 
          : 0;
        const nextSecs = prevSecs + 1;
        const updated = {
          ...prev,
          lastActiveDate: todayStr,
          lastActiveTimestamp: Date.now(),
          activeSecondsToday: nextSecs,
          activeMinutesToday: Math.floor(nextSecs / 60),
        };
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoggedIn, currentUser?.id]);

  // Keep allUserAccounts synchronized with currentUser's live active timer
  useEffect(() => {
    if (currentUser?.id) {
      setAllUserAccounts((prev) => {
        const found = prev.find((a) => a.id === currentUser.id);
        if (
          found &&
          found.activeSecondsToday === currentUser.activeSecondsToday &&
          found.activeMinutesToday === currentUser.activeMinutesToday &&
          found.lastActiveTimestamp === currentUser.lastActiveTimestamp &&
          found.lastActiveDate === currentUser.lastActiveDate
        ) {
          return prev;
        }
        return prev.map((a) => (a.id === currentUser.id ? currentUser : a));
      });
    }
  }, [currentUser]);

  // Periodically sync currentUser active usage to Firestore every 10 seconds
  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const saveInterval = setInterval(() => {
      if (currentUserRef.current && currentUserRef.current.id) {
        // ONLY update activity metrics with defined values to prevent overwriting Admin changes or sending undefined to Firestore
        const cur = currentUserRef.current;
        const payload: Partial<ManagedUserAccount> = {};
        if (typeof cur.lastActiveTimestamp === 'number') payload.lastActiveTimestamp = cur.lastActiveTimestamp;
        if (typeof cur.activeSecondsToday === 'number') payload.activeSecondsToday = cur.activeSecondsToday;
        if (typeof cur.activeMinutesToday === 'number') payload.activeMinutesToday = cur.activeMinutesToday;
        if (typeof cur.lastActiveDate === 'string' && cur.lastActiveDate) payload.lastActiveDate = cur.lastActiveDate;

        if (Object.keys(payload).length > 0) {
          updateUserActivityInFirestore(cur.id, payload).catch(() => {});
        }
      }
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [isLoggedIn]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    // Bỏ thông báo đang soạn giáo án hay thông báo đã hoàn tất khi đã soạn xong ở cuối trang theo yêu cầu
    if (/đang soạn|hoàn tất/i.test(text)) {
      return;
    }
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserRole('teacher');
    try {
      localStorage.setItem('khbd_is_logged_in', 'false');
      localStorage.removeItem('khbd_current_user');
    } catch (e) {
      console.error(e);
    }
    showToast('Đã đăng xuất khỏi hệ thống thành công!', 'info');
  };

  const handleLoginSuccess = (account: ManagedUserAccount) => {
    setIsLoggedIn(true);
    setCurrentUser(account);
    setUserRole(account.role);

    // Sync API Key from account: If the account has an API Key, load it immediately into session & state
    const effectiveKey = account.apiKey || account.customApiKey;
    if (effectiveKey) {
      setStoredApiKey(effectiveKey);
      setHasCustomApiKey(true);
    } else {
      const existingLocalKey = getStoredApiKey();
      if (existingLocalKey) {
        account.apiKey = existingLocalKey;
        account.customApiKey = existingLocalKey;
        saveUserAccountToFirestore(account);
      }
    }

    setAllUserAccounts((prev) =>
      sanitizeUserAccounts([
        account,
        ...prev.filter(
          (a) => a.id !== account.id && a.username.toLowerCase() !== account.username.toLowerCase()
        ),
      ])
    );
    try {
      localStorage.setItem('khbd_is_logged_in', 'true');
      localStorage.setItem('khbd_current_user', JSON.stringify(account));
    } catch (e) {
      console.error(e);
    }
    setConfig((prev) => ({
      ...prev,
      teacherName: account.fullName,
      schoolName: account.schoolName || prev.schoolName,
    }));
    showToast(`Đăng nhập thành công! Xin chào ${account.fullName}`, 'success');
  };

  const handleUpdateConfig = (patch: Partial<LessonPlanConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    if (currentPlan) {
      setCurrentPlan((prevPlan) => {
        if (!prevPlan) return prevPlan;
        const updated: any = { ...prevPlan };
        if (patch.lessonTitle !== undefined) updated.lessonTitle = patch.lessonTitle;
        if (patch.preschoolMainTheme !== undefined) {
          updated.mainTheme = patch.preschoolMainTheme;
          updated.preschoolMainTheme = patch.preschoolMainTheme;
        }
        if (patch.preschoolSubTheme !== undefined) {
          updated.subTheme = patch.preschoolSubTheme;
          updated.preschoolSubTheme = patch.preschoolSubTheme;
        }
        if (patch.subject !== undefined) updated.subject = patch.subject;
        if (patch.grade !== undefined) updated.grade = patch.grade;
        return updated;
      });
      setCombineList((prev) =>
        prev.map((item) => {
          if (item.plan.id === currentPlan.id || item.plan.lessonTitle === currentPlan.lessonTitle) {
            const updatedPlan: any = { ...item.plan };
            if (patch.lessonTitle !== undefined) updatedPlan.lessonTitle = patch.lessonTitle;
            if (patch.preschoolMainTheme !== undefined) {
              updatedPlan.mainTheme = patch.preschoolMainTheme;
              updatedPlan.preschoolMainTheme = patch.preschoolMainTheme;
            }
            if (patch.preschoolSubTheme !== undefined) {
              updatedPlan.subTheme = patch.preschoolSubTheme;
              updatedPlan.preschoolSubTheme = patch.preschoolSubTheme;
            }
            if (patch.subject !== undefined) updatedPlan.subject = patch.subject;
            if (patch.grade !== undefined) updatedPlan.grade = patch.grade;
            return { ...item, plan: updatedPlan };
          }
          return item;
        })
      );
    }
  };

  const handleCancelGenerate = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsGenerating(false);
    setProgressSteps({ 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' });
    showToast('Đã dừng và hủy quá trình soạn bài!', 'info');
  };

  const handleResetPlan = () => {
    handleCancelGenerate();
    setCurrentPlan(null);
    setProgressSteps({ 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' });
    setIsGenerating(false);
    setActiveTab('config');
    setConfig((prev) => ({
      ...prev,
      lessonTitle: '',
      oldPlanContent: '',
      oldPlanFileName: '',
    }));
    showToast('Đã khởi tạo bài mới, chuyển về Tab 1 để thiết lập!', 'info');
  };

  // Function to add a plan (current or specified) into Tab 3 combine list
  const handleAddPlanToCombineList = (planToAdd?: LessonPlanOutput) => {
    const targetPlan = planToAdd || currentPlan;
    if (!targetPlan) {
      showToast('Chưa có giáo án để lưu vào Tab 3!', 'error');
      return;
    }

    setCombineList((prev) => {
      const nextIdx = prev.length + 1;
      const newItem: SavedCombineItem = {
        id: 'combine-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        autoIndex: nextIdx,
        mergeOrder: nextIdx,
        selected: true,
        title: targetPlan.lessonTitle || 'Kế hoạch bài dạy',
        schoolLevel: targetPlan.schoolLevel || config.schoolLevel || 'Mầm non',
        grade: targetPlan.grade || config.grade || '',
        subject: targetPlan.subject || config.subject || '',
        createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
        source: 'generated',
        plan: targetPlan,
      };
      return [...prev, newItem];
    });

    showToast(`Đã lưu bài "${targetPlan.lessonTitle || 'Bài soạn'}" vào Tab 3!`, 'success');
  };

  // Function to export multiple selected plans merged into a single Word document
  const handleExportMergedDocx = async (
    selectedItems: SavedCombineItem[],
    customWeekConfig?: CombineWeekConfig
  ): Promise<boolean> => {
    if (!selectedItems || selectedItems.length === 0) {
      showToast('Vui lòng tích chọn ít nhất 1 bài soạn để ghép!', 'info');
      return false;
    }

    setIsExportingDocx(true);
    try {
      const activeWeekCfg = customWeekConfig || weekConfig;
      const sortedPlans = [...selectedItems]
        .sort((a, b) => a.mergeOrder - b.mergeOrder)
        .map((item) => ({
          ...item.plan,
          prepDate: item.prepDate,
          teachDate: item.teachDate,
          dayOfWeek: item.dayOfWeek,
          daysOfWeek: item.daysOfWeek,
          activitySection: item.activitySection,
          activitySectionTitle: item.activitySectionTitle,
        }));

      const cleanWeekName = activeWeekCfg?.enabled && activeWeekCfg.weekTitle
        ? activeWeekCfg.weekTitle.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_')
        : '';
      const mergedTitleName = cleanWeekName
        ? `${cleanWeekName}_GHEP_${selectedItems.length}_BAI_${new Date().toISOString().slice(0, 10)}`
        : `GHEP_HOAN_CHINH_${selectedItems.length}_BAI_${new Date().toISOString().slice(0, 10)}`;

      const success = await exportMultipleMergedLessonPlansToDocx(
        sortedPlans,
        mergedTitleName,
        config.imageSlots || [],
        config.tableLayout || 'two_column',
        activeWeekCfg
      );

      if (success) {
        showToast(`Đã xuất file Word tổng hợp (${selectedItems.length} bài) thành công!`, 'success');
      }
      return success;
    } catch (err) {
      console.error('Error exporting merged docx:', err);
      showToast('Có lỗi khi xuất file Word tổng hợp.', 'error');
      return false;
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Generate Lesson Plan via Gemini Server Endpoint
  const handleGeneratePlan = async () => {
    // If already generating, clicking a second time acts as CANCEL
    if (isGenerating) {
      handleCancelGenerate();
      return;
    }

    if (!config.lessonTitle.trim()) {
      showToast('Vui lòng nhập tên bài học trước khi tạo!', 'error');
      return;
    }

    // --- TRIAL LIMIT & EXPIRATION CHECK ---
    const accessStatus = getUserAccessStatus(currentUser);
    if (!accessStatus.isAllowed) {
      if (accessStatus.requiresCustomApiKey) {
        setIsApiKeyModalOpen(true);
      } else {
        setIsContactAdminOpen(true);
      }
      showToast(accessStatus.reason || 'Tài khoản đã hết quyền soạn giáo án. Vui lòng liên hệ Admin!', 'error');
      return;
    }

    if (accessStatus.isTrial) {
      const nextUsed = accessStatus.usedTrials + 1;
      if (currentUser) {
        const updatedUser = { ...currentUser, trialGenerations: nextUsed };
        setCurrentUser(updatedUser);
        try {
          localStorage.setItem('khbd_current_user', JSON.stringify(updatedUser));
        } catch {}
        saveUserAccountToFirestore(updatedUser);
      } else {
        try {
          localStorage.setItem('khbd_guest_trial_generations', String(nextUsed));
        } catch {}
      }

      if (nextUsed >= accessStatus.maxTrials) {
        showToast(`Bạn đang sử dụng lượt dùng thử cuối cùng (${nextUsed}/${accessStatus.maxTrials} lượt)! Sau lượt này cần liên hệ Admin để cấp quyền.`, 'info');
      }
    }
    // --------------------------------------

    let finalConfig = { ...config };

    // Auto-detect PPCT settings
    try {
      let match = null;
      const savedPPCT = localStorage.getItem('khbd_my_firebase_ppct');
      if (savedPPCT) {
        try {
          const parsed = JSON.parse(savedPPCT);
          if (Array.isArray(parsed) && parsed.length > 0) {
            match = findMatchInPPCTList(parsed, config.subject, config.grade, config.lessonTitle);
          }
        } catch (e) {}
      }

      if (!match || !match.integratedNLS || match.integratedNLS.length === 0) {
        const seedMatch = findMatchInPPCTList(SEED_SAMPLE_PPCT, config.subject, config.grade, config.lessonTitle);
        if (seedMatch && seedMatch.integratedNLS && seedMatch.integratedNLS.length > 0) {
          match = seedMatch;
        } else if (!match) {
          match = seedMatch;
        }
      }

      if (match) {
        const hasStem = Boolean(
          match.hasStemIntegration ||
          match.lessonTitle?.toLowerCase().includes('stem') ||
          match.lessonTitle?.toLowerCase().includes('tích hợp stem')
        );
        if (hasStem) {
          finalConfig.hasStemFromPPCT = true;
          if (match.stemTopic) {
            finalConfig.stemTopic = match.stemTopic;
          }
        }
        finalConfig.periods = match.periods || config.periods;
        finalConfig.targetPeriodDetail = match.periodDetail || (finalConfig.periods === 2 ? '1+2' : String(finalConfig.periods || 1));
        finalConfig.integratedNLSFromPPCT = match.integratedNLS || [];
        finalConfig.integratedAIFromPPCT = match.integratedAI || [];
        setConfig(prev => ({
          ...prev,
          periods: finalConfig.periods,
          targetPeriodDetail: finalConfig.targetPeriodDetail ?? prev.targetPeriodDetail,
          enableSTEM: prev.enableSTEM || false,
          stemTopic: finalConfig.stemTopic ?? prev.stemTopic,
          hasStemFromPPCT: finalConfig.hasStemFromPPCT ?? prev.hasStemFromPPCT
        }));
      }
    } catch (e) {
      console.error("Error reading PPCT", e);
    }

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setProgressSteps({ 1: 'pending', 2: 'pending', 3: 'pending', 4: 'pending' });
    setElapsedSeconds(0);
    setIsGenerating(true);
    setCurrentPlan(null); // Clear previous plan to show empty/generating state
    setActiveTab('result'); // Switch to Tab 2 to watch progress and result

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    // Start live timer
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    try {
      let finalPlan = null;
      const requestPayload = {
        ...finalConfig,
        customApiKey: getStoredApiKey(),
        userRole: currentUser?.role,
        userEmail: currentUser?.email,
        userExpiresAt: currentUser?.expiresAt,
      };

      // Helper to safely parse JSON from fetch responses
      const safeParseResponse = async (res: Response) => {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          try {
            return await res.json();
          } catch (e) {
            return { success: false, error: 'Phản hồi JSON không hợp lệ từ máy chủ.' };
          }
        }
        const text = await res.text();
        return {
          success: false,
          error: res.status >= 500
            ? 'Máy chủ AI đang bận hoặc quá tải, vui lòng thử lại sau giây lát.'
            : (text.length > 200 ? text.slice(0, 200) + '...' : text || 'Phản hồi không đúng định dạng JSON'),
        };
      };

      // 1. Tốc độ siêu tốc (1-Shot Fast Generation, chỉ 3 - 5 giây)
      try {
        const response = await fetch('/api/gemini/generate-khbd', {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(requestPayload),
          signal: controller.signal,
        });

        const data = await safeParseResponse(response);
        if (response.ok && data.success && (data.lessonPlan || data.data)) {
          finalPlan = data.lessonPlan || data.data;
        } else if (data.requiresCustomApiKey) {
          setIsApiKeyModalOpen(true);
          throw new Error(data.error || 'Cần cung cấp API Key');
        } else if (!response.ok) {
          console.warn('1-shot generation returned error, trying fallback...', data.error);
        }
      } catch (fastErr: any) {
        if (fastErr.name === 'AbortError' || controller.signal.aborted) {
          throw fastErr;
        }
        console.warn('Fast 1-shot generation hiccup, attempting fallback...', fastErr);
      }

      // 2. Dự phòng khẩn cấp nếu 1-shot gặp sự cố
      if (!finalPlan && !controller.signal.aborted) {
        setProgressSteps({ 1: 'start', 2: 'start', 3: 'start', 4: 'start' });
        const directResp = await fetch('/api/gemini/generate-lesson-plan-sectional', {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(requestPayload),
          signal: controller.signal,
        });

        const directData = await safeParseResponse(directResp);
        if (directResp.ok && directData.success && (directData.lessonPlan || directData.data)) {
          finalPlan = directData.lessonPlan || directData.data;
        } else {
          if (directData.requiresCustomApiKey) {
            setIsApiKeyModalOpen(true);
          }
          if (directData.error) {
            throw new Error(directData.error);
          }
        }
      }

      if (finalPlan) {
        if (isPreschoolPlan(finalPlan) || (finalPlan as any)?.schoolLevel === 'Mầm non') {
          finalPlan = {
            ...finalPlan,
            mainTheme: config.preschoolMainTheme || (finalPlan as any).mainTheme || (finalPlan as any).preschoolMainTheme || '',
            subTheme: config.preschoolSubTheme || (finalPlan as any).subTheme || (finalPlan as any).preschoolSubTheme || '',
            lessonTitle: config.lessonTitle || finalPlan.lessonTitle || '',
            subject: config.subject || finalPlan.subject || '',
            grade: config.grade || finalPlan.grade || '',
            activities: formatPreschoolActivities(finalPlan.activities || [], config.lessonTitle || finalPlan.lessonTitle || '', config.subject || finalPlan.subject || '', (finalPlan as any).oldPlanContent || '')
          };
        }
        setCurrentPlan(finalPlan);
        setProgressSteps({ 1: 'done', 2: 'done', 3: 'done', 4: 'done' });
        // Automatically save newly generated lesson plan into Tab 3 list
        handleAddPlanToCombineList(finalPlan);
      } else if (!controller.signal.aborted) {
        throw new Error('Hệ thống đang bận hoặc quá tải, vui lòng thử lại sau giây lát.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || controller.signal.aborted) {
        console.log('User cancelled lesson plan generation');
        showToast('Đã dừng và hủy soạn bài dạy!', 'info');
      } else {
        console.error('Error generating lesson plan:', err);
        showToast('Lỗi biên soạn: ' + (err.message || 'Vui lòng kiểm tra lại kết nối mạng hoặc API Key'), 'error');
      }
    } finally {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  // Refine single activity via AI with real-time progression & location tracking
  const handleRefineActivity = async (activity: ActivityDetail, instruction: string) => {
    if (!currentPlan) return;

    // --- TRIAL LIMIT & EXPIRATION CHECK ---
    const accessStatus = getUserAccessStatus(currentUser);
    if (!accessStatus.isAllowed) {
      if (accessStatus.requiresCustomApiKey) {
        setIsApiKeyModalOpen(true);
      } else {
        setIsContactAdminOpen(true);
      }
      showToast(accessStatus.reason || 'Tài khoản đã hết quyền sử dụng AI. Vui lòng liên hệ Admin!', 'error');
      return;
    }
    // --------------------------------------

    lastRefineArgsRef.current = { activity, instruction };
    if (refineIntervalRef.current) {
      clearInterval(refineIntervalRef.current);
      refineIntervalRef.current = null;
    }

    const actName = activity.name || `Hoạt động ${activity.index || 1}`;
    setIsRefiningActivity(true);
    setAiRefineProgress({
      isRefining: true,
      targetId: activity.id,
      targetIndex: activity.index,
      targetName: actName,
      targetType: 'activity',
      instruction,
      progressPercent: 15,
      stageText: `Đang kết nối AI để tinh chỉnh ${actName}...`,
      elapsedSeconds: 0,
      status: 'refining',
    });

    let secCount = 0;
    let percent = 15;
    refineIntervalRef.current = setInterval(() => {
      secCount += 0.25;
      const roundedSec = Math.floor(secCount);

      let stage = `Đang phân tích yêu cầu: "${instruction}"...`;
      if (secCount >= 1.5 && secCount < 3.5) {
        stage = 'Đang tái cấu trúc hoạt động và cập nhật phương pháp dạy học...';
        percent = Math.min(65, percent + 4);
      } else if (secCount >= 3.5 && secCount < 6.5) {
        stage = 'Đang hoàn thiện nội dung chi tiết các bước & sản phẩm học tập...';
        percent = Math.min(88, percent + 3);
      } else if (secCount >= 6.5) {
        stage = 'Đang kiểm tra tính nhất quán sư phạm và chuẩn hóa định dạng...';
        percent = Math.min(96, percent + 1);
      } else {
        percent = Math.min(38, percent + 5);
      }

      setAiRefineProgress((prev) => ({
        ...prev,
        elapsedSeconds: roundedSec,
        progressPercent: Math.round(percent),
        stageText: stage,
      }));
    }, 250);

    try {
      const response = await fetch('/api/gemini/refine-activity', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          activity,
          instruction,
          subject: config.subject,
          grade: config.grade,
          lessonTitle: config.lessonTitle,
          mainTheme: config.preschoolMainTheme,
          subTheme: config.preschoolSubTheme,
          tableLayout: config.tableLayout,
          aiModel: config.aiModel || 'gemini-3.1-flash-lite',
          customApiKey: getStoredApiKey(),
          userRole: currentUser?.role,
          userEmail: currentUser?.email,
          userExpiresAt: currentUser?.expiresAt,
        }),
      });

      let data: any = {};
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = { success: false, error: 'Phản hồi không hợp lệ' };
        }
      } else {
        const text = await response.text();
        data = { success: false, error: text.slice(0, 150) || 'Lỗi kết nối' };
      }

      if (refineIntervalRef.current) {
        clearInterval(refineIntervalRef.current);
        refineIntervalRef.current = null;
      }

      if (data.requiresCustomApiKey) {
        setIsApiKeyModalOpen(true);
      }

      if (data.success && data.activity) {
        const updatedActivities = (currentPlan.activities || []).map((act, idx) =>
          act.id === activity.id || act.index === activity.index || idx === (activity.index ? activity.index - 1 : -1)
            ? data.activity
            : act
        );
        const newPlan = { ...currentPlan, activities: updatedActivities };
        setCurrentPlan(newPlan);
        setCombineList((prev) =>
          prev.map((item) => (item.plan.id === newPlan.id || item.plan.lessonTitle === newPlan.lessonTitle ? { ...item, plan: newPlan } : item))
        );

        setAiRefineProgress((prev) => ({
          ...prev,
          isRefining: false,
          status: 'success',
          progressPercent: 100,
          stageText: `✅ Đã hoàn thành biên soạn và cập nhật xong ${actName}!`,
        }));

        showToast(`Đã nâng cấp xong ${actName}!`, 'success');

        // Automatically hide success badge after 6 seconds
        setTimeout(() => {
          setAiRefineProgress((prev) => (prev.status === 'success' ? { ...prev, status: 'idle' } : prev));
        }, 6000);
      } else {
        throw new Error(data.error || 'Lỗi tinh chỉnh hoạt động');
      }
    } catch (err: any) {
      console.error('Error refining activity:', err);
      if (refineIntervalRef.current) {
        clearInterval(refineIntervalRef.current);
        refineIntervalRef.current = null;
      }
      setAiRefineProgress((prev) => ({
        ...prev,
        isRefining: false,
        status: 'error',
        progressPercent: 100,
        errorMessage: err.message || 'Lỗi tinh chỉnh hoạt động',
        stageText: 'Chưa thể hoàn tất biên soạn.',
      }));
      showToast('Lỗi tinh chỉnh: ' + err.message, 'error');
    } finally {
      setIsRefiningActivity(false);
    }
  };

  const handleRetryRefine = () => {
    if (lastRefineArgsRef.current) {
      handleRefineActivity(lastRefineArgsRef.current.activity, lastRefineArgsRef.current.instruction);
    }
  };

  const handleDismissRefineProgress = () => {
    if (refineIntervalRef.current) {
      clearInterval(refineIntervalRef.current);
      refineIntervalRef.current = null;
    }
    setAiRefineProgress({
      isRefining: false,
      progressPercent: 0,
      stageText: '',
      elapsedSeconds: 0,
      status: 'idle',
    });
  };

  const handleManualEditActivity = (updatedActivity: ActivityDetail) => {
    if (!currentPlan) return;
    const updatedActivities = (currentPlan.activities || []).map((act, idx) =>
      act.id === updatedActivity.id || act.index === updatedActivity.index || idx === (updatedActivity.index ? updatedActivity.index - 1 : -1)
        ? updatedActivity
        : act
    );
    const newPlan = { ...currentPlan, activities: updatedActivities };
    setCurrentPlan(newPlan);
    setCombineList((prev) =>
      prev.map((item) => (item.plan.id === newPlan.id || item.plan.lessonTitle === newPlan.lessonTitle ? { ...item, plan: newPlan } : item))
    );
    showToast(`Đã lưu thay đổi Hoạt động ${updatedActivity.index}!`, 'success');
  };

  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const handleExportDocx = async () => {
    if (!currentPlan) return;
    setIsExportingDocx(true);
    try {
      await exportLessonPlanToDocx(currentPlan, config.imageSlots, config.tableLayout, config.mathFormulaFormat || 'word_equation');
      showToast('Đã tải tệp Giáo án (.docx) thành công!', 'success');
    } catch (err) {
      console.error('Error exporting DOCX:', err);
      showToast('Không thể xuất file Word: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Select textbook from cloud storage modal
  const handleSelectTextbook = (sample: TextbookSample) => {
    setConfig((prev) => ({
      ...prev,
      lessonTitle: sample.title,
      subject: sample.subject,
      grade: sample.grade,
      bookSeries: sample.bookSeries,
      additionalRequirements: `Bám sát nội dung SGK: ${sample.chapter}. Yêu cầu cần đạt: ${sample.sampleSummary}`,
    }));
    showToast(`Đã chọn SGK: ${sample.title} (${sample.bookSeries})`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* App Header */}
      <Header
        onOpenGuide={() => setActiveModal('guide')}
        onOpenAiSuggestions={() => setActiveModal('ai_suggestions')}
        onOpenCloudStorage={() => setActiveModal('cloud_storage')}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenUserProfile={() => setIsUserProfileOpen(true)}
        onLoadSample={() => {}}
        teacherName={config.teacherName}
        schoolName={config.schoolName}
        onOpenSourceCode={() => setActiveModal('source_code')}
        userRole={userRole}
        onToggleUserRole={() => {
          const next = userRole === 'admin' ? 'teacher' : 'admin';
          setUserRole(next);
          showToast(`Đã chuyển vai trò: ${next === 'admin' ? 'Quản trị viên (Admin)' : 'Giáo viên'}`, 'info');
        }}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onOpenLogin={() => {
          setLoginModalMode('login');
          setIsLoginModalOpen(true);
        }}
        onOpenRegister={() => {
          setLoginModalMode('register');
          setIsLoginModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasCustomApiKey={hasCustomApiKey}
        onGenerate={handleGeneratePlan}
        isGenerating={isGenerating}
        elapsedSeconds={elapsedSeconds}
      />

      {/* Toast notification - positioned bottom-right so it never blocks top action buttons */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 transition-all duration-300 animate-in slide-in-from-bottom-4 max-w-xl">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50/95 text-emerald-900 border-emerald-300 shadow-emerald-950/10'
                : toastMessage.type === 'error'
                ? 'bg-rose-50/95 text-rose-900 border-rose-300 shadow-rose-950/10'
                : 'bg-blue-50/95 text-blue-900 border-blue-300 shadow-blue-950/10'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            <span className="leading-snug flex-1">{toastMessage.text}</span>
            {toastMessage.type === 'error' && /api key|quota|hạn ngạch/i.test(toastMessage.text) && (
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(true)}
                className="ml-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-[11px] font-bold shrink-0 transition-all shadow-xs cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Dán API Key ngay</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Unified Sticky Tab Navigation & Action Toolbar (Cùng 1 hàng ngang duy nhất) */}
      {(() => {
        const isPreschool = (config.schoolLevel || (currentPlan as any)?.schoolLevel || '').toLowerCase().includes('mầm non');
        const isMathSubject = !isPreschool && (/toán|math/i.test(config.subject || '') || /toán|math/i.test(currentPlan?.subject || '') || /toán|math/i.test(config.lessonTitle || ''));
        return (
          <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs py-1.5 px-2 sm:px-4 lg:px-6">
            <div className="max-w-[1850px] mx-auto flex items-center justify-between gap-2 flex-nowrap overflow-x-auto">
              {/* Main Tab Switcher Buttons */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100/90 border border-slate-200 rounded-xl shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('config')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'config'
                      ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-amber-900 hover:bg-white/80'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>TAB 1: CẤU HÌNH SOẠN BÀI DẠY</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('result')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'result'
                      ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-amber-900 hover:bg-white/80'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>TAB 2: KẾT QUẢ BÀI SOẠN</span>
                  {isGenerating ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9.5px] bg-rose-500 text-white font-bold animate-pulse">
                      Đang soạn...
                    </span>
                  ) : currentPlan ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9.5px] bg-emerald-600 text-white font-bold">
                      Đã có bài ✓
                    </span>
                  ) : null}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('combine')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'combine'
                      ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white shadow-xs'
                      : 'text-slate-700 hover:text-amber-900 hover:bg-white/80'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>TAB 3: KHO BÀI SOẠN & GHÉP NỐI GIÁO ÁN</span>
                  {combineList.length > 0 && (
                    <span className="inline-flex items-center justify-center min-w-5 h-4 px-1 rounded-full text-[9.5px] bg-amber-400 text-amber-950 font-black">
                      {combineList.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Quick Action Cluster (Soạn bài mới -> Công thức Word nếu Toán -> Tải pptx -> Tải docx) */}
              <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                {/* Context indicator tag */}
                <div className="hidden 2xl:flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0">
                  <span className="text-amber-900 font-bold">{config.schoolLevel || 'Mầm non'}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-800 truncate max-w-[130px]">{config.subject || 'Chưa chọn môn'}</span>
                </div>

                {/* Nút + Soạn bài mới */}
                <button
                  type="button"
                  onClick={handleResetPlan}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all cursor-pointer shadow-2xs shrink-0 whitespace-nowrap"
                  title="Khởi tạo một giáo án mới từ đầu"
                >
                  <Plus className="w-3 h-3" />
                  <span>Soạn bài mới</span>
                </button>

                {/* Ô lựa chọn Công thức Word (Chỉ hiển thị khi là môn Toán ở các cấp Tiểu học, THCS, THPT; TUYỆT ĐỐI KHÔNG hiển thị ở cấp Mầm non) */}
                {!isPreschool && isMathSubject && (
                  <div className="flex items-center gap-1 bg-amber-50/90 border border-amber-300/80 rounded-lg px-2 py-1 shadow-2xs shrink-0 animate-in fade-in duration-200">
                    <span className="text-[10.5px] font-bold text-amber-900 flex items-center gap-1 shrink-0">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span className="hidden sm:inline">Công thức Word:</span>
                    </span>
                    <select
                      value={config.mathFormulaFormat || 'word_equation'}
                      onChange={(e) => setConfig((prev) => ({ ...prev, mathFormulaFormat: e.target.value as any }))}
                      className="text-[10.5px] font-bold text-amber-950 bg-white border border-amber-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs max-w-[180px] sm:max-w-none truncate"
                      title="Phương án 2: Tự động tạo công thức chuẩn Word Equation. Phương án 1: Giữ mã LaTeX cho MathType."
                    >
                      <option value="word_equation">Phương án 2: Word Equation (Tự động)</option>
                      <option value="mathtype_latex">Phương án 1: Mã LaTeX (MathType)</option>
                    </select>
                  </div>
                )}

                {/* Nút Tải giáo án về máy */}
                <button
                  type="button"
                  onClick={handleExportDocx}
                  disabled={isExportingDocx || !currentPlan}
                  className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-lg transition-all shadow-2xs shrink-0 whitespace-nowrap ${
                    !currentPlan
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white border border-blue-400/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                  }`}
                  title="Tải giáo án Word (.docx) về máy"
                >
                  {isExportingDocx ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                      <span>Đang tải...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3 text-blue-100 shrink-0" />
                      <span>Tải giáo án về máy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Main Full-Screen Layout per Tab */}
      <main className="flex-1 w-full max-w-[1850px] mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-5 flex flex-col min-h-[calc(100vh-140px)] pb-14 sm:pb-16">
        {activeTab === 'config' ? (
          /* TAB 1: Cấu hình soạn bài dạy độc lập (Full screen / Mở to hết màn hình) */
          <div className="w-full animate-in fade-in duration-300">
            <LeftConfigPanel
              config={config}
              onChangeConfig={handleUpdateConfig}
              onGenerate={handleGeneratePlan}
              onCancelGenerate={handleCancelGenerate}
              isGenerating={isGenerating}
              elapsedSeconds={elapsedSeconds}
              onOpenCloudStorage={() => setActiveModal('cloud_storage')}
              uploadedBooks={uploadedBooks}
              uploadedPPCTs={uploadedPPCTs}
              userRole={userRole}
              currentUser={currentUser}
              onRequestContactAdmin={() => setIsContactAdminOpen(true)}
              onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
              onBooksUpdated={(books) => {
                setUploadedBooks(books);
              }}
              onViewResult={() => setActiveTab('result')}
              hasPlan={Boolean(currentPlan)}
            />
          </div>
        ) : activeTab === 'result' ? (
          /* TAB 2: Kết quả bài soạn độc lập (Full screen / Mở to hết màn hình) */
          <div className="w-full flex flex-col flex-1 animate-in fade-in duration-300">
            <RightResultEditor
              plan={currentPlan}
              config={config}
              onUpdatePlan={(updated) => {
                setCurrentPlan(updated);
                setCombineList((prev) =>
                  prev.map((item) =>
                    item.plan.id === updated.id || item.plan.lessonTitle === updated.lessonTitle
                      ? { ...item, plan: updated }
                      : item
                  )
                );
              }}
              onChangeConfig={handleUpdateConfig}
              imageSlots={config.imageSlots}
              onOpenAiSuggestions={() => setActiveModal('ai_suggestions')}
              onRefineActivity={handleRefineActivity}
              onManualEditActivity={handleManualEditActivity}
              isRefiningActivity={isRefiningActivity}
              aiRefineProgress={aiRefineProgress}
              onRetryRefine={handleRetryRefine}
              onDismissRefineProgress={handleDismissRefineProgress}
              onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
              isExpanded={true}
              onToggleExpand={() => {}}
              isGenerating={isGenerating}
              elapsedSeconds={elapsedSeconds}
              progress={progressSteps}
              onReset={handleResetPlan}
              onCancelGenerate={handleCancelGenerate}
              tableLayout={config.tableLayout}
              mathFormulaFormat={config.mathFormulaFormat || 'word_equation'}
              onMathFormulaFormatChange={(fmt) => setConfig((prev) => ({ ...prev, mathFormulaFormat: fmt }))}
              onBackToConfig={() => setActiveTab('config')}
            />
          </div>
        ) : (
          /* TAB 3: Kho bài soạn & Ghép nối bài soạn Word tổng hợp */
          <div className="w-full">
            <CombineLessonPlansTab
              combineList={combineList}
              onUpdateCombineList={(newList) => setCombineList(newList)}
              onAddCurrentPlan={() => handleAddPlanToCombineList()}
              currentPlan={currentPlan}
              onExportMergedDocx={handleExportMergedDocx}
              isExporting={isExportingDocx}
              onSelectTab={(tab) => setActiveTab(tab)}
              onViewPlanDetails={(p) => setCurrentPlan(p)}
              weekConfig={weekConfig}
              onUpdateWeekConfig={handleUpdateWeekConfig}
            />
          </div>
        )}
      </main>

      {/* Fixed Sticky Footer: Cố định tab tác giả ở đáy màn hình khi cuộn trang */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-900/60 bg-gradient-to-r from-[#7c2d12] via-[#9a3412] to-[#78350f] py-1.5 shadow-lg backdrop-blur-sm print:hidden">
        <div className="max-w-[1700px] mx-auto px-3 flex items-center justify-center">
          <div className="font-medium text-[10px] sm:text-[11px] text-amber-300 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <span className="flex items-center gap-1 hover:text-white transition-colors cursor-default">
              <User className="w-3 h-3 text-amber-300" /> Tác giả: <strong>Hoàng Văn Đình Khoa</strong>
            </span>

            <span className="hidden sm:inline text-amber-700/60">•</span>

            <a
              href="https://zalo.me/0978468986"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-100 hover:text-white bg-blue-950/40 hover:bg-blue-900/60 border border-blue-400/30 px-2 py-0.5 rounded-full transition-all cursor-pointer font-medium"
              title="Mở Zalo Tác giả (0978.468.986)"
            >
              <span><strong className="font-black text-blue-400">Zalo</strong> Tác giả: 0978.468.986</span>
            </a>

            <span className="hidden sm:inline text-amber-700/60">•</span>

            <a
              href="https://zalo.me/g/64bmhsdrjtoalgugxnzj"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-100 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-400/30 px-2 py-0.5 rounded-full transition-all cursor-pointer font-medium"
              title="Gia nhập Nhóm Zalo Hỗ trợ Giáo án"
            >
              <span>Nhóm <strong className="font-black text-blue-400">Zalo</strong> Hỗ Trợ</span>
            </a>

            <span className="hidden sm:inline text-amber-700/60">•</span>

            <span className="flex items-center gap-1 hover:text-white transition-colors cursor-default">
              <Phone className="w-3 h-3 text-emerald-400" /> Phone: 0989.982.818
            </span>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <GuideModal
        isOpen={activeModal === 'guide'}
        onClose={() => setActiveModal(null)}
      />

      <AiSuggestionModal
        isOpen={activeModal === 'ai_suggestions'}
        onClose={() => setActiveModal(null)}
        lessonTitle={config.lessonTitle}
        subject={config.subject}
        grade={config.grade}
      />

      <FirebaseStorageModal
        isOpen={activeModal === 'cloud_storage'}
        onClose={() => setActiveModal(null)}
        onSelectTextbook={handleSelectTextbook}
        userRole={userRole}
        onPPCTUpdated={(ppcts: any) => {
          setUploadedPPCTs(ppcts);
        }}
        onBooksUpdated={(books) => {
          setUploadedBooks(books);
        }}
        onUpdateTeacherInfo={(fullName, schoolName) => {
          setConfig((prev) => ({
            ...prev,
            teacherName: `GV. ${fullName}`,
            schoolName: schoolName || prev.schoolName,
          }));
          showToast('Đã đồng bộ thông tin Giáo viên & Kho riêng thành công!', 'success');
        }}
      />

      <SourceCodeModal
        isOpen={activeModal === 'source_code'}
        onClose={() => setActiveModal(null)}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        userAccounts={allUserAccounts}
        onAccountsUpdated={(accounts) => {
          setAllUserAccounts(accounts);
          if (currentUser) {
            const freshCurrent = accounts.find(
              (a) =>
                a.id === currentUser.id ||
                a.username.toLowerCase() === currentUser.username.toLowerCase()
            );
            if (freshCurrent) {
              setCurrentUser(freshCurrent);
              try {
                localStorage.setItem('khbd_current_user', JSON.stringify(freshCurrent));
              } catch {}
            } else if (currentUser.role !== 'admin') {
              // Current logged in account was deleted - immediately log out and revoke
              handleLogout();
            }
          }
          showToast('Đã cập nhật danh sách tài khoản người dùng!', 'success');
        }}
        currentUser={currentUser}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updatedAccount) => {
          setCurrentUser(updatedAccount);
          try {
            localStorage.setItem('khbd_current_user', JSON.stringify(updatedAccount));
          } catch {}
          setAllUserAccounts((prev) =>
            prev.map((acc) => (acc.id === updatedAccount.id ? updatedAccount : acc))
          );
          setConfig((prev) => ({
            ...prev,
            teacherName: updatedAccount.fullName,
            schoolName: updatedAccount.schoolName || prev.schoolName,
          }));
          showToast('Thông tin và mật khẩu đã được cập nhật & đồng bộ tức thì lên Firestore!', 'success');
        }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        userAccounts={allUserAccounts}
        initialMode={loginModalMode}
        onAccountsUpdated={(accounts) => setAllUserAccounts(accounts)}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={() => {
          setHasCustomApiKey(Boolean(getStoredApiKey()));
          showToast('Cấu hình Gemini API Key đã được cập nhật thành công!', 'success');
        }}
      />

      <ContactAdminModal
        isOpen={isContactAdminOpen}
        onClose={() => setIsContactAdminOpen(false)}
        accessStatus={getUserAccessStatus(currentUser)}
        userName={currentUser?.fullName || currentUser?.username}
      />
    </div>
  );
}
