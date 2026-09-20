import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Save,
  HelpCircle,
  Zap,
  Layers,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import {
  getStoredApiKey,
  setStoredApiKey,
  clearStoredApiKey,
  checkApiKeyStatus,
  parseKeysFromInput,
  ApiKeyStatusResult,
} from '../utils/apiKeyManager';
import { saveUserAccountToFirestore } from '../utils/firebase';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ApiKeyStatusResult | null>(null);

  // Check current user role
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKey();
      setApiKeyInput(stored);
      setTestResult(null);

      try {
        const userStr = localStorage.getItem('khbd_current_user');
        if (userStr) {
          const u = JSON.parse(userStr);
          setCurrentUserInfo(u);
          setIsAdminUser(u.role === 'admin' || u.username === 'admin@123');
        } else {
          setIsAdminUser(false);
          setCurrentUserInfo(null);
        }
      } catch {
        setIsAdminUser(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsedKeys = parseKeysFromInput(apiKeyInput);

  const handleInputChange = (val: string) => {
    setApiKeyInput(val);
    setTestResult(null);
  };

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const cleanKeys = parseKeysFromInput(apiKeyInput);
      const target = cleanKeys.join('\n');
      const result = await checkApiKeyStatus(target);
      setTestResult(result);
    } catch (e: any) {
      setTestResult({
        success: false,
        status: 'error',
        message: 'Lỗi khi kiểm tra kết nối: ' + (e.message || String(e)),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const cleanKeys = parseKeysFromInput(apiKeyInput);
    if (cleanKeys.length === 0 && !isAdminUser) {
      alert('Thầy cô vui lòng nhập ít nhất 1 mã API Key Gemini cá nhân để sử dụng.');
      return;
    }
    const combinedKey = cleanKeys.join('\n');
    setStoredApiKey(combinedKey);

    // Save directly into user account so key persists across Render deploys & account logins!
    try {
      const userStr = localStorage.getItem('khbd_current_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u && u.id) {
          const updatedUser = {
            ...u,
            apiKey: combinedKey || undefined,
            customApiKey: combinedKey || undefined,
          };
          localStorage.setItem('khbd_current_user', JSON.stringify(updatedUser));
          await saveUserAccountToFirestore(updatedUser);
        }
      }
    } catch (e) {
      console.error('Failed to sync apiKey to user account:', e);
    }

    if (onKeySaved) onKeySaved();
    onClose();
  };

  const handleClear = async () => {
    clearStoredApiKey();
    setApiKeyInput('');
    setTestResult(null);

    try {
      const userStr = localStorage.getItem('khbd_current_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u && u.id) {
          const updatedUser = {
            ...u,
            apiKey: undefined,
            customApiKey: undefined,
          };
          localStorage.setItem('khbd_current_user', JSON.stringify(updatedUser));
          await saveUserAccountToFirestore(updatedUser);
        }
      }
    } catch (e) {
      console.error('Failed to clear apiKey from user account:', e);
    }

    if (onKeySaved) onKeySaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#7c2d12] via-[#9a3412] to-[#78350f] text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/15 rounded-lg backdrop-blur-xs text-amber-200">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <span>Cài Đặt & Quản Lý API Key</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black">
                  Gemini AI
                </span>
              </h3>
              <p className="text-xs text-amber-200 font-medium">
                Hỗ trợ nạp nhiều API Key để tự động xoay vòng khi hết hạn ngạch (Quota)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Account Role Banner */}
          {isAdminUser ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-start gap-2.5 text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <span>Tài khoản Quản Trị Viên (Admin: {currentUserInfo?.fullName || currentUserInfo?.username || 'Admin'})</span>
                  <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded font-extrabold">
                    Ưu tiên cao nhất
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Bạn có quyền sử dụng khóa hệ thống trên Render.com hoặc có thể nhập thêm danh sách API Key dự phòng cá nhân dưới đây.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-amber-950">
              <UserCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <span>Tài khoản Giáo viên: Sử dụng API Key Gemini Cá Nhân</span>
                  <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded font-extrabold">
                    Khuyên Dùng
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/90 mt-0.5 leading-relaxed">
                  Để đảm bảo tính riêng tư và hưởng trọn vẹn 100% hạn ngạch độc lập từ Google (không bị gián đoạn hay nghẽn lệnh dùng chung), thầy cô vui lòng dán mã API Key của mình vào bên dưới.
                </p>
              </div>
            </div>
          )}

          {/* Multiple API Keys Input Box */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Layers className="w-4 h-4 text-amber-700" />
                <span>Nhập danh sách API Key (1 hoặc nhiều key):</span>
              </label>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline flex items-center gap-1"
              >
                <span>Lấy key miễn phí</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={apiKeyInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Dán 1 hoặc nhiều API Key tại đây (mỗi key 1 dòng hoặc cách nhau bởi dấu phẩy, dấu chấm phẩy)&#10;Ví dụ:&#10;AIzaSyA123456789...&#10;AQ.Ab8RN6J3Y..."
                className={`w-full bg-white border border-slate-300 rounded-lg p-3 font-mono text-xs text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 shadow-2xs resize-y min-h-[85px] leading-relaxed ${
                  !showKey ? 'filter-none' : ''
                }`}
                style={!showKey && apiKeyInput.trim() ? { WebkitTextSecurity: 'disc' } as any : {}}
              />
              <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 bg-white/80 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 border border-slate-200 cursor-pointer shadow-2xs"
                  title={showKey ? 'Ẩn ký tự khóa' : 'Hiện rõ ký tự'}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Key Parsing Badge / Counter */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                {parsedKeys.length > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-700" />
                    <span>Đã nhận diện: <strong>{parsedKeys.length} API Key</strong></span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">
                    Chưa có API Key nào được nhập
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 italic">
                Phân cách: Xuống dòng (Enter), dấu phẩy (,), hoặc dấu chấm phẩy (;)
              </div>
            </div>

            {/* Render Parsed Key Badges */}
            {parsedKeys.length > 0 && (
              <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {parsedKeys.map((k, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-amber-100/70 border border-amber-300 text-amber-950 font-mono text-[10px] px-2 py-0.5 rounded-md"
                  >
                    <Key className="w-2.5 h-2.5 text-amber-700" />
                    <span>
                      Key #{idx + 1}: {k.slice(0, 6)}...{k.slice(-4)}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Test & Check Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={isTesting || (!apiKeyInput.trim() && !isAdminUser)}
              className="flex-1 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Đang kiểm tra kết nối & Quota...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Kiểm tra hoạt động & Quota ngay</span>
                </>
              )}
            </button>
          </div>

          {/* Test Result Display */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 animate-in fade-in duration-150 ${
                testResult.status === 'valid'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : testResult.status === 'quota_exceeded'
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : testResult.status === 'invalid'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {testResult.status === 'valid' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : testResult.status === 'quota_exceeded' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="font-bold flex items-center gap-2 flex-wrap">
                  <span>
                    {testResult.status === 'valid'
                      ? 'Khóa API hoạt động xuất sắc!'
                      : testResult.status === 'quota_exceeded'
                      ? 'Cảnh báo: Đã vượt hạn ngạch (Quota Exceeded)'
                      : testResult.status === 'invalid'
                      ? 'Khóa API không hợp lệ'
                      : testResult.status === 'missing'
                      ? 'Chưa cấu hình API Key'
                      : 'Kết quả kiểm tra'}
                  </span>
                  {testResult.keyPreview && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/10">
                      {testResult.keyPreview}
                    </span>
                  )}
                  {testResult.keyCount !== undefined && testResult.keyCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-950 font-bold">
                      {testResult.keyCount} key đã nạp
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed opacity-95 whitespace-pre-line font-medium">
                  {testResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Step by step guide to get free API Keys */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
              <span>Cách lấy mã Gemini API Key miễn phí (Chỉ mất 30 giây):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
              <li>
                Truy cập trang:{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-800 font-bold underline inline-flex items-center gap-0.5"
                >
                  Google AI Studio (aistudio.google.com/apikey)
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>Đăng nhập bằng tài khoản Google (Gmail) bất kỳ.</li>
              <li>Bấm nút xanh <strong className="text-slate-800">"Create API Key"</strong>.</li>
              <li>Sao chép mã khóa (bắt đầu bằng <code className="bg-slate-200 px-1 rounded font-mono">AIzaSy...</code>) và dán vào ô trên.</li>
              <li>
                <em>Mẹo hay: Thầy cô có thể tạo 2-3 khóa API từ các tài khoản Google khác nhau và dán vào đây để hệ thống tự động chuyển đổi khi hết hạn ngạch!</em>
              </li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            {getStoredApiKey() && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                title="Xóa danh sách khóa cá nhân"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa toàn bộ khóa</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Áp dụng & Lưu ({parsedKeys.length > 0 ? `${parsedKeys.length} Key` : 'Cấu hình'})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
