import React, { useState, useEffect, useRef } from 'react';
import {
  LessonPlanConfig,
  LessonPlanOutput,
  ActivityDetail,
  TextbookSample,
  CustomUploadedBook,
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
  Presentation,
  Plus,
  Loader2,
  Key,
} from 'lucide-react';
import { exportLessonPlanToDocx } from './utils/docxExporter';
import { exportLessonPlanToPptx } from './utils/pptxExporter';

export type StepProgress = 'pending' | 'start' | 'done';

export default function App() {
  // Active Tab state ('config' for Tab 1, 'result' for Tab 2)
  const [activeTab, setActiveTab] = useState<'config' | 'result'>('config');

  // Config state
  const [config, setConfig] = useState<LessonPlanConfig>({
    lessonTitle: '',
    subject: 'Tin học',
    schoolLevel: 'THCS',
    grade: 'Lớp 6',
    bookSeries: 'Kết nối tri thức với cuộc sống',
    periods: 2,
    tableLayout: 'two_column',
    mathFormulaFormat: 'word_equation',
    enableNLS: true,
    nlsMode: 'ppct',
    customNLS: '',
    selectedNLSDomains: ['nls_info', 'nls_creation', 'nls_problem_solving'],
    enableAI: true,
    aiMode: 'ppct',
    customAI: '',
    selectedAIDomains: ['ai_prompting', 'ai_critical_thinking', 'ai_creativity'],
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
                setConfig((prev) => ({
                  ...prev,
                  teacherName: fresh.fullName,
                  schoolName: fresh.schoolName || prev.schoolName,
                }));
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
      setAllUserAccounts((prev) =>
        prev.map((a) => (a.id === currentUser.id ? currentUser : a))
      );
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

  const handleUpdateConfig = (newConfig: Partial<LessonPlanConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
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
      } else {
        showToast(`Đang soạn bài dạy (Dùng thử: Lượt ${nextUsed}/${accessStatus.maxTrials}, còn ${accessStatus.maxTrials - nextUsed} lượt)`, 'info');
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
          finalConfig.enableSTEM = true;
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
          enableSTEM: finalConfig.enableSTEM ?? prev.enableSTEM,
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
    showToast('Đang tiến hành soạn giáo án bài dạy, vui lòng chờ trong giây lát...', 'info');

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

      try {
        const response = await fetch('/api/gemini/generate-lesson-plan-stream', {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(requestPayload),
          signal: controller.signal,
        });

        if (response.ok) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let doneReading = false;

          while (!doneReading && reader) {
            if (controller.signal.aborted) {
              throw new DOMException('Aborted by user', 'AbortError');
            }
            const { value, done } = await reader.read();
            if (done) {
              doneReading = true;
              break;
            }
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop() || '';
            
            for (const ev of events) {
              if (ev.startsWith('data: ')) {
                const dataStr = ev.substring(6);
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.type === 'progress') {
                    setProgressSteps((prev) => ({ ...prev, [parsed.data.step]: parsed.data.status }));
                  } else if (parsed.type === 'complete') {
                    finalPlan = parsed.data.lessonPlan;
                  } else if (parsed.type === 'error') {
                    if (parsed.data.requiresCustomApiKey) {
                      setIsApiKeyModalOpen(true);
                    }
                    throw new Error(parsed.data.error);
                  }
                } catch (e: any) {
                  if (e.message && (e.message.includes('quá tải') || e.message.includes('API Key'))) {
                    throw e;
                  }
                }
              }
            }
          }
        }
      } catch (streamErr: any) {
        if (streamErr.name === 'AbortError' || controller.signal.aborted) {
          throw streamErr;
        }
        console.warn('Streaming connection interrupted or failed. Fallback to direct Sectional API...', streamErr);
      }

      // If streaming did not complete, automatically fall back to direct Sectional JSON endpoint
      if (!finalPlan && !controller.signal.aborted) {
        setProgressSteps({ 1: 'start', 2: 'start', 3: 'start', 4: 'start' });
        const directResp = await fetch('/api/gemini/generate-lesson-plan-sectional', {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify(requestPayload),
          signal: controller.signal,
        });

        if (directResp.ok) {
          const directData = await directResp.json();
          if (directData.success && (directData.lessonPlan || directData.data)) {
            finalPlan = directData.lessonPlan || directData.data;
          }
        } else {
          const directErr = await directResp.json().catch(() => ({}));
          if (directErr.requiresCustomApiKey) {
            setIsApiKeyModalOpen(true);
          }
          if (directErr.error) {
            throw new Error(directErr.error);
          }
        }
      }

      if (finalPlan) {
        setCurrentPlan(finalPlan);
        setProgressSteps({ 1: 'done', 2: 'done', 3: 'done', 4: 'done' });
        showToast('Soạn giáo án hoàn tất!', 'success');
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

  // Refine single activity via AI
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

    setIsRefiningActivity(true);
    showToast(`Đang tinh chỉnh Hoạt động ${activity.index} bằng AI...`, 'info');

    try {
      const response = await fetch('/api/gemini/refine-activity', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          activity,
          instruction,
          subject: config.subject,
          grade: config.grade,
          tableLayout: config.tableLayout,
          aiModel: (config.aiModel && config.aiModel !== 'gemini-flash-latest' && config.aiModel !== 'auto') ? config.aiModel : 'gemini-3.1-flash-lite',
          customApiKey: getStoredApiKey(),
          userRole: currentUser?.role,
          userEmail: currentUser?.email,
          userExpiresAt: currentUser?.expiresAt,
        }),
      });

      const data = await response.json();
      if (data.requiresCustomApiKey) {
        setIsApiKeyModalOpen(true);
      }
      if (data.success && data.activity) {
        const updatedActivities = currentPlan.activities.map((act) =>
          act.id === activity.id || act.index === activity.index ? data.activity : act
        );
        setCurrentPlan({ ...currentPlan, activities: updatedActivities });
        showToast(`Đã nâng cấp xong Hoạt động ${activity.index}!`, 'success');
      } else {
        throw new Error(data.error || 'Lỗi tinh chỉnh hoạt động');
      }
    } catch (err: any) {
      console.error('Error refining activity:', err);
      showToast('Lỗi tinh chỉnh: ' + err.message, 'error');
    } finally {
      setIsRefiningActivity(false);
    }
  };

  const handleManualEditActivity = (updatedActivity: ActivityDetail) => {
    if (!currentPlan) return;
    const updatedActivities = currentPlan.activities.map((act) =>
      act.id === updatedActivity.id || act.index === updatedActivity.index ? updatedActivity : act
    );
    setCurrentPlan({ ...currentPlan, activities: updatedActivities });
    showToast(`Đã lưu thay đổi Hoạt động ${updatedActivity.index}!`, 'success');
  };

  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);

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

  const handleExportPptx = async () => {
    if (!currentPlan) return;
    setIsExportingPptx(true);
    try {
      await exportLessonPlanToPptx(currentPlan, config.imageSlots);
      showToast('Đã tải bài giảng PowerPoint (.pptx) thành công!', 'success');
    } catch (err) {
      console.error('Error exporting PPTX:', err);
      showToast('Không thể xuất bài giảng PowerPoint: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      setIsExportingPptx(false);
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

                {/* Nút Tải bài giảng (.pptx) */}
                <button
                  type="button"
                  onClick={handleExportPptx}
                  disabled={isExportingPptx || !currentPlan}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all shadow-2xs shrink-0 whitespace-nowrap ${
                    !currentPlan
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-700 hover:via-orange-700 hover:to-rose-700 text-white border border-orange-400/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                  }`}
                  title="Tải bài giảng trình chiếu PowerPoint (.pptx)"
                >
                  {isExportingPptx ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <Presentation className="w-3 h-3 text-amber-100 shrink-0" />
                      <span>Tải bài giảng (.pptx)</span>
                    </>
                  )}
                </button>

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
      <main className="flex-1 w-full max-w-[1850px] mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-5 flex flex-col min-h-[calc(100vh-140px)] pb-16 sm:pb-24">
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
        ) : (
          /* TAB 2: Kết quả bài soạn độc lập (Full screen / Mở to hết màn hình) */
          <div className="w-full flex flex-col flex-1 animate-in fade-in duration-300">
            <RightResultEditor
              plan={currentPlan}
              config={config}
              onChangeConfig={(patch) => setConfig((prev) => ({ ...prev, ...patch }))}
              imageSlots={config.imageSlots}
              onOpenAiSuggestions={() => setActiveModal('ai_suggestions')}
              onRefineActivity={handleRefineActivity}
              onManualEditActivity={handleManualEditActivity}
              isRefiningActivity={isRefiningActivity}
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
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-900/60 bg-gradient-to-r from-[#7c2d12] via-[#9a3412] to-[#78350f] py-3 mt-auto shadow-sm relative z-10 shrink-0">
        <div className="max-w-[1700px] mx-auto px-4 flex flex-col items-center justify-center gap-2">
          <div className="font-medium text-[11px] sm:text-xs text-amber-400 flex items-center justify-center gap-3 sm:gap-4 flex-wrap tracking-wide">
            <span className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-default"><User className="w-3.5 h-3.5 text-emerald-400" /> Tác giả: Hoàng Văn Đình Khoa</span>
            <span className="hidden sm:inline text-amber-700/60">|</span>
            <span className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-default"><MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> Zalo: 0978.468.986</span>
            <span className="hidden sm:inline text-amber-700/60">|</span>
            <span className="flex items-center gap-1.5 hover:text-amber-300 transition-colors cursor-default"><Phone className="w-3.5 h-3.5 text-emerald-400" /> Số phone: 0989.982.818</span>
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
