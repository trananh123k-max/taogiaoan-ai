import React, { useState, useEffect } from 'react';
import {
  X,
  LogIn,
  KeyRound,
  User,
  AlertCircle,
  Laptop,
  ShieldAlert,
  Info,
  Eye,
  EyeOff,
  UserPlus,
  Building,
  Phone,
  CheckCircle2,
  Sparkles,
  Clock,
} from 'lucide-react';
import {
  ManagedUserAccount,
  DEFAULT_USER_ACCOUNTS,
  checkAndAuthorizeDevice,
  sanitizeUserAccounts,
  saveUserAccountToFirestore,
} from '../utils/firebase';
import { getMachineHardwareFingerprint } from '../utils/deviceManager';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: ManagedUserAccount) => void;
  userAccounts: ManagedUserAccount[];
  initialMode?: 'login' | 'register';
  onAccountsUpdated?: (accounts: ManagedUserAccount[]) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  userAccounts,
  initialMode = 'login',
  onAccountsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);

  // Login form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [deviceExceededError, setDeviceExceededError] = useState<{
    show: boolean;
    reason: string;
    account?: ManagedUserAccount;
  }>({ show: false, reason: '' });
  const [loading, setLoading] = useState(false);

  // Registration form states
  const [regFullName, setRegFullName] = useState('');
  const [regSchoolName, setRegSchoolName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Sync initial mode
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setErrorMessage('');
      setRegError('');
      setSuccessNotice('');
      setDeviceExceededError({ show: false, reason: '' });
    }
  }, [isOpen, initialMode]);

  // Load remembered account on open
  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem('khbd_remember_account');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.password) setPassword(parsed.password);
        if (typeof parsed.rememberMe === 'boolean') setRememberMe(parsed.rememberMe);
      }
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const currentMachine = getMachineHardwareFingerprint();

  // Find matched account dynamically based on entered username/email
  const sanitizedList = sanitizeUserAccounts(userAccounts);
  const trimmedUser = username.trim().toLowerCase();
  const matchedAccount = trimmedUser
    ? sanitizedList.find(
        (a) =>
          a.username.toLowerCase() === trimmedUser ||
          (a.email && a.email.toLowerCase() === trimmedUser)
      )
    : undefined;
  const accountsList = sanitizeUserAccounts(userAccounts.length > 0 ? userAccounts : DEFAULT_USER_ACCOUNTS);

  const handleSaveRememberMe = () => {
    try {
      if (rememberMe) {
        localStorage.setItem(
          'khbd_remember_account',
          JSON.stringify({
            username: username.trim(),
            password: password,
            rememberMe: true,
          })
        );
      } else {
        localStorage.removeItem('khbd_remember_account');
      }
    } catch {}
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');
    setDeviceExceededError({ show: false, reason: '' });

    const rawUsername = username.trim();
    if (!rawUsername) {
      setErrorMessage('Vui lòng nhập Tên đăng nhập hoặc Email!');
      return;
    }

    if (/\s/.test(rawUsername)) {
      setErrorMessage('Tên đăng nhập không được chứa khoảng trắng (dấu cách)! Vui lòng kiểm tra lại.');
      return;
    }

    setLoading(true);

    try {
      const inputLower = rawUsername.toLowerCase();

      // Check for admin@123
      if (inputLower === 'admin@123') {
        const existingAdmin = accountsList.find(a => a.username.toLowerCase() === 'admin@123') || DEFAULT_USER_ACCOUNTS[0];
        const requiredAdminPassword = existingAdmin.accessCode || '111111';
        
        if (!password) {
          setErrorMessage('Vui lòng nhập mật khẩu quản trị viên!');
          setLoading(false);
          return;
        }

        if (password !== requiredAdminPassword) {
          setErrorMessage('Mật khẩu quản trị không chính xác!');
          setLoading(false);
          return;
        }

        const authResult = await checkAndAuthorizeDevice(existingAdmin, currentMachine);
        
        if (!authResult.allowed) {
          setDeviceExceededError({
            show: true,
            reason: authResult.reason || 'Thiết bị vượt quá giới hạn cho phép!',
            account: existingAdmin,
          });
          setLoading(false);
          return;
        }

        handleSaveRememberMe();
        setLoading(false);
        onLoginSuccess(authResult.updatedAccount || existingAdmin);
        onClose();
        return;
      }

      // Find matching account in registered list
      const matched = accountsList.find(
        (acc) =>
          acc.username.toLowerCase() === inputLower ||
          (acc.email && acc.email.toLowerCase() === inputLower)
      );

      if (!matched) {
        setErrorMessage('Tài khoản không tồn tại trên hệ thống! Vui lòng kiểm tra lại tên đăng nhập hoặc nhấn "Đăng ký ngay" nếu chưa có tài khoản.');
        setLoading(false);
        return;
      }

      if (matched.status === 'locked') {
        setErrorMessage('Tài khoản này đang bị tạm khóa. Vui lòng liên hệ Quản trị viên!');
        setLoading(false);
        return;
      }

      // Check password if account has accessCode or require password
      if (!password) {
        setErrorMessage('Vui lòng nhập mật khẩu đăng nhập!');
        setLoading(false);
        return;
      }

      if (matched.accessCode && matched.accessCode !== password) {
        setErrorMessage('Mật khẩu không chính xác! Vui lòng thử lại.');
        setLoading(false);
        return;
      }

      // Verify Device Limit Authorization (Max 2 machines by default)
      const authResult = await checkAndAuthorizeDevice(matched, currentMachine);

      if (!authResult.allowed) {
        setDeviceExceededError({
          show: true,
          reason: authResult.reason || `Tài khoản đã đạt giới hạn đăng nhập tối đa ${matched.maxDevices || 2} máy tính!`,
          account: matched,
        });
        setLoading(false);
        return;
      }

      handleSaveRememberMe();
      setLoading(false);
      onLoginSuccess(authResult.updatedAccount || matched);
      onClose();
    } catch {
      setErrorMessage('Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại!');
      setLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setErrorMessage('');
    setSuccessNotice('');

    if (!regFullName.trim()) {
      setRegError('Vui lòng nhập Họ và tên!');
      return;
    }

    if (!regSchoolName.trim()) {
      setRegError('Vui lòng nhập Đơn vị / Trường học công tác!');
      return;
    }

    const cleanUsername = regUsername.trim();
    if (!cleanUsername) {
      setRegError('Vui lòng nhập Tên đăng nhập hoặc Email!');
      return;
    }

    if (/\s/.test(cleanUsername)) {
      setRegError('Tên đăng nhập không được chứa khoảng trắng (dấu cách)!');
      return;
    }

    if (cleanUsername.length < 3) {
      setRegError('Tên đăng nhập phải có ít nhất 3 ký tự!');
      return;
    }

    // Check duplicate username
    const existing = accountsList.find(
      (a) =>
        a.username.toLowerCase() === cleanUsername.toLowerCase() ||
        (a.email && a.email.toLowerCase() === cleanUsername.toLowerCase())
    );

    if (existing) {
      setRegError('Tên đăng nhập hoặc Email này đã tồn tại trên hệ thống! Vui lòng chọn tên khác hoặc chuyển sang Đăng nhập.');
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setRegError('Mật khẩu phải có độ dài tối thiểu 4 ký tự!');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!');
      return;
    }

    setRegLoading(true);

    try {
      const newAccountId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const nowFormatted = new Date().toLocaleDateString('vi-VN');
      const nowStr = new Date().toLocaleString('vi-VN');

      // 1. Get current device footprint
      const machine = getMachineHardwareFingerprint('KHBD AI PRO');
      const newDevice = {
        deviceId: machine.machineId,
        deviceName: machine.deviceName || `Máy tính #1`,
        firstLogin: nowStr,
        lastActive: nowStr,
        os: machine.os,
        browser: machine.browser,
        appName: 'KHBD AI PRO',
        usedApps: ['KHBD AI PRO'],
        hardwareSig: machine.hardwareSig,
      };

      const newAccount: ManagedUserAccount = {
        id: newAccountId,
        username: cleanUsername,
        fullName: regFullName.trim(),
        schoolName: regSchoolName.trim(),
        email: cleanUsername.includes('@') ? cleanUsername : undefined,
        phone: regPhone.trim() || undefined,
        role: 'teacher',
        status: 'active',
        accessCode: regPassword.trim(),
        createdAt: nowFormatted,
        expiresAt: 'Dùng thử',
        trialGenerations: 0,
        maxTrialGenerations: 5,
        maxDevices: 2,
        authorizedDevices: [newDevice], // Automatically bind registration device
        notes: 'Người dùng tự đăng ký qua hệ thống',
        totalLoginCount: 0,
        loginCountToday: 0,
      };

      // 1. Immediately save to Firestore, Server Storage, and LocalStorage in real-time
      await saveUserAccountToFirestore(newAccount);

      // 2. Update parent state
      const updatedAccounts = sanitizeUserAccounts([newAccount, ...accountsList]);
      if (onAccountsUpdated) {
        onAccountsUpdated(updatedAccounts);
      }

      // 3. Pre-fill login credentials and switch to Login tab
      setUsername(cleanUsername);
      setPassword('');
      setRegLoading(false);
      setSuccessNotice(`🎉 Đăng ký tài khoản thành công! Thầy/Cô hãy nhập mật khẩu vừa tạo để đăng nhập.`);
      setActiveTab('login');

      // Clear register form
      setRegFullName('');
      setRegSchoolName('');
      setRegUsername('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch {
      setRegError('Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại!');
      setRegLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-amber-200/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150 max-h-[95vh] flex flex-col">
        {/* Header Banner */}
        <div className="p-4 sm:p-5 border-b border-amber-900/30 flex items-center justify-between bg-gradient-to-r from-[#7c2d12] via-[#9a3412] to-[#78350f] text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white p-1 shadow-md border border-amber-300/40 shrink-0">
              <img
                src="/logo.svg"
                alt="Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {activeTab === 'login' ? 'Đăng Nhập Hệ Thống' : 'Đăng Ký Tài Khoản'}
              </h3>
              <p className="text-xs text-amber-200 font-medium">Hệ thống KHBD AI PRO</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Đăng Nhập / Đăng Ký */}
        <div className="flex items-center border-b border-slate-200 bg-slate-100/80 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
              setRegError('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-amber-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng Nhập</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage('');
              setRegError('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700 hover:bg-white/50'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Đăng Ký Tài Khoản</span>
            <span className="text-[9px] bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full font-black ml-0.5">
              Mới
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Machine Info Notice */}
          <div className="px-3 py-2 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-medium truncate">
              <Laptop className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Máy tính này: <strong className="font-bold">{currentMachine.deviceName}</strong></span>
            </div>
            {matchedAccount ? (
              <span className="text-[10px] bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded font-bold shrink-0 border border-amber-300 shadow-xs">
                Tối đa {matchedAccount.maxDevices ?? (matchedAccount.role === 'admin' ? 10 : 2)} máy
              </span>
            ) : (
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold shrink-0">
                Tự động đồng bộ
              </span>
            )}
          </div>

          {/* Success Notice Banner */}
          {successNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Device Limit Exceeded Modal / Alert */}
          {deviceExceededError.show && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs space-y-2 animate-shake">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-rose-900 text-xs">
                    VƯỢT QUÁ GIỚI HẠN SỐ MÁY ĐĂNG NHẬP
                  </h4>
                  <p className="text-[11px] leading-relaxed text-rose-700">
                    {deviceExceededError.reason}
                  </p>
                </div>
              </div>

              <div className="p-2 bg-white/80 rounded-lg border border-rose-200 text-[11px] text-slate-700 space-y-1">
                <div className="flex items-center gap-1 text-slate-900 font-semibold">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Cách xử lý khi đổi máy hoặc cài lại Win/Mac:</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Thầy/cô vui lòng liên hệ <strong>Quản trị viên</strong> để được bấm nút <em>"Khôi phục máy"</em> trên bảng quản trị.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên đăng nhập hoặc Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập hoặc email..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-amber-600 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center justify-between text-xs py-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 hover:text-slate-900 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-700 focus:ring-amber-500 border-slate-300 cursor-pointer accent-amber-700"
                    />
                    <span>Ghi nhớ tài khoản trên máy này</span>
                  </label>
                  {username && (
                    <button
                      type="button"
                      onClick={() => {
                        setUsername('');
                        setPassword('');
                        try {
                          localStorage.removeItem('khbd_remember_account');
                        } catch {}
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Xóa ghi nhớ
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Đăng Nhập Vào Hệ Thống</span>
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switcher Link */}
              <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100">
                <span>Chưa có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage('');
                  }}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer ml-1 inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Đăng ký tài khoản mới ngay</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER FORM */}
          {activeTab === 'register' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Đăng ký tài khoản giáo viên tự động:</span>
                </p>
                <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                  Sau khi đăng ký, tài khoản sẽ tự động đồng bộ lên hệ thống quản trị. Thầy/Cô đăng nhập và liên hệ Admin để được cấp lượt dùng thử hoặc ngày sử dụng.
                </p>
              </div>

              {regError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3">
                {/* Full name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên giáo viên <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Thị Hoa"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 shadow-2xs"
                    />
                  </div>
                </div>

                {/* School / Unit */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đơn vị / Trường học <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={regSchoolName}
                      onChange={(e) => setRegSchoolName(e.target.value)}
                      placeholder="Ví dụ: Trường THCS Chu Văn An"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Username / Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên đăng nhập / Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Ví dụ: giaovien_hoa hoặc hoanguyen@gmail.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại <span className="text-slate-400 font-normal">(tùy chọn)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="Ví dụ: 0987.654.321"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mật khẩu <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Tối thiểu 4 ký tự..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Xác nhận mật khẩu <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {regLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Đăng Ký Tài Khoản Ngay</span>
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Login Link */}
              <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100">
                <span>Đã có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setRegError('');
                  }}
                  className="text-amber-800 font-bold hover:underline cursor-pointer ml-1 inline-flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3 text-amber-700" />
                  <span>Đăng nhập ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
