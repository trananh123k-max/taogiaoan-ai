import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  KeyRound,
  Shield,
  Building,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  Laptop,
  Save,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Calendar,
  Activity,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import {
  ManagedUserAccount,
  saveUserAccountToFirestore,
  formatActiveTime,
} from '../utils/firebase';
import {
  PRESET_AVATARS,
  compressAndResizeImage,
  getUserInitials,
} from '../utils/avatarUtils';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: ManagedUserAccount | null;
  onUserUpdated: (updatedUser: ManagedUserAccount) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'devices'>('profile');

  // Form states
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [schoolName, setSchoolName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Password states
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status message
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevOpenRef = useRef(false);
  const prevUserIdRef = useRef<string | null>(null);

  // Only initialize form fields when modal opens or user identity changes
  useEffect(() => {
    const isOpening = isOpen && !prevOpenRef.current;
    const isUserChanged = currentUser?.id && prevUserIdRef.current !== currentUser.id;

    if (isOpen && currentUser && (isOpening || isUserChanged)) {
      setFullName(currentUser.fullName || '');
      setAvatar(currentUser.avatar || '');
      setSchoolName(currentUser.schoolName || '');
      setPhone(currentUser.phone || '');
      setEmail(currentUser.email || currentUser.username || '');
      setNotes(currentUser.notes || '');
      setCurrentPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice(null);
    }
    prevOpenRef.current = isOpen;
    prevUserIdRef.current = currentUser?.id || null;
  }, [isOpen, currentUser?.id]);

  if (!isOpen || !currentUser) return null;

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotice({ text, type });
    setTimeout(() => {
      setNotice(null);
    }, 4000);
  };

  // Helper to persist avatar immediately to Firestore
  const handleSaveAvatarImmediately = async (newAvatarUrl: string | undefined) => {
    if (!currentUser) return;
    try {
      const updatedUser: ManagedUserAccount = {
        ...currentUser,
        fullName: fullName.trim() || currentUser.fullName,
        avatar: newAvatarUrl || undefined,
        schoolName: schoolName.trim() || currentUser.schoolName,
        phone: phone.trim() || currentUser.phone,
        email: email.trim() || currentUser.email,
        notes: notes.trim() || currentUser.notes,
      };
      await saveUserAccountToFirestore(updatedUser);
      onUserUpdated(updatedUser);
    } catch (err) {
      console.error('Error auto-saving avatar:', err);
    }
  };

  // Handle uploading custom photo from computer
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const compressed = await compressAndResizeImage(file, 220, 0.85);
      setAvatar(compressed);
      await handleSaveAvatarImmediately(compressed);
      showNotification('Đã tải và lưu ảnh đại diện thành công lên Firestore!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải ảnh đại diện!';
      showNotification(msg, 'error');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle choosing preset avatar
  const handleSelectPresetAvatar = async (presetDataUrl: string, presetName: string) => {
    setAvatar(presetDataUrl);
    await handleSaveAvatarImmediately(presetDataUrl);
    showNotification(`Đã chọn và lưu ảnh "${presetName}" thành công!`, 'success');
  };

  // Handle removing avatar back to default
  const handleResetToDefaultAvatar = async () => {
    setAvatar('');
    await handleSaveAvatarImmediately(undefined);
    showNotification('Đã chuyển về Avatar mặc định theo tên.', 'info');
  };

  // Handle saving Profile Information (Name, Avatar, School, Phone, Email, Notes)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showNotification('Vui lòng nhập Họ và Tên giáo viên / người dùng!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser: ManagedUserAccount = {
        ...currentUser,
        fullName: fullName.trim(),
        avatar: avatar.trim() || undefined,
        schoolName: schoolName.trim() || currentUser.schoolName || 'Chưa cập nhật trường',
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      // Save to Firestore and sync across local and server
      await saveUserAccountToFirestore(updatedUser);
      onUserUpdated(updatedUser);

      showNotification('Đã cập nhật Ảnh đại diện, Tên và Hồ sơ thành công lên Firestore!', 'success');
    } catch {
      showNotification('Đã xảy ra lỗi khi lưu thông tin. Vui lòng thử lại!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Changing Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verify current password if user already has an accessCode
    if (currentUser.accessCode && currentUser.accessCode.trim()) {
      if (!currentPasswordInput) {
        showNotification('Vui lòng nhập mật khẩu hiện tại để xác thực!', 'error');
        return;
      }
      if (currentPasswordInput.trim() !== currentUser.accessCode.trim()) {
        showNotification('Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại!', 'error');
        return;
      }
    }

    if (!newPassword.trim()) {
      showNotification('Vui lòng nhập mật khẩu mới!', 'error');
      return;
    }

    if (newPassword.trim().length < 4) {
      showNotification('Mật khẩu mới phải có ít nhất 4 ký tự!', 'error');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      showNotification('Xác nhận mật khẩu mới không khớp!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser: ManagedUserAccount = {
        ...currentUser,
        accessCode: newPassword.trim(),
      };

      // Save to Firestore and sync immediately
      await saveUserAccountToFirestore(updatedUser);
      onUserUpdated(updatedUser);

      setCurrentPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');
      showNotification('Đã đổi mật khẩu thành công và đồng bộ tức thì lên Firestore!', 'success');
    } catch {
      showNotification('Đã xảy ra lỗi khi đổi mật khẩu. Vui lòng thử lại!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = currentUser.role === 'admin';
  const devices = Array.isArray(currentUser.authorizedDevices) ? currentUser.authorizedDevices : [];
  const maxAllowed = currentUser.maxDevices !== undefined ? currentUser.maxDevices : (isAdmin ? 10 : 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-white px-5 py-4 flex items-center justify-between border-b border-amber-700/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-900 border-2 border-amber-400 overflow-hidden flex items-center justify-center shadow-md relative shrink-0">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center font-black text-sm text-white ${
                    isAdmin
                      ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-amber-100'
                      : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-emerald-100'
                  }`}
                >
                  {isAdmin ? (
                    <Shield className="w-5 h-5 text-amber-200" />
                  ) : (
                    <span>{getUserInitials(currentUser.fullName, currentUser.username)}</span>
                  )}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Tài Khoản & Hồ Sơ Cá Nhân
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isAdmin
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  }`}
                >
                  {isAdmin ? 'Quản trị viên' : 'Giáo viên'}
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-medium">
                {currentUser.username} • {currentUser.schoolName || 'Chưa cập nhật trường'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-amber-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-amber-50/50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-amber-700 text-amber-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-amber-100/50'
            }`}
          >
            <User className="w-4 h-4 text-amber-700" />
            <span>Hồ sơ & Đổi Avatar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg border-b-2 transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'border-amber-700 text-amber-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-amber-100/50'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-700" />
            <span>Đổi Mật Khẩu</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg border-b-2 transition-all cursor-pointer ${
              activeTab === 'devices'
                ? 'border-amber-700 text-amber-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-amber-100/50'
            }`}
          >
            <Laptop className="w-4 h-4 text-amber-700" />
            <span>Thiết bị & Bảo mật ({devices.length}/{maxAllowed})</span>
          </button>
        </div>

        {/* Notice Alert */}
        {notice && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
              notice.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : notice.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : notice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-slate-700">
          {/* TAB 1: PROFILE, AVATAR & RENAME */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* SECTION: AVATAR MANAGEMENT */}
              <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/50 p-4 rounded-2xl border border-amber-200 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-700" />
                    <span>Ảnh Đại Diện (Lưu Vĩnh Viễn Trên Firestore)</span>
                  </label>
                  <span className="text-[11px] text-amber-800/80 font-medium">
                    Tự động đồng bộ sang tất cả máy tính
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Current Avatar Circle */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-full bg-slate-900 border-3 border-amber-400 overflow-hidden shadow-md flex items-center justify-center">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center font-black text-xl text-white select-none ${
                            isAdmin
                              ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-amber-100'
                              : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-emerald-100'
                          }`}
                        >
                          {isAdmin ? (
                            <Shield className="w-9 h-9 text-amber-200" />
                          ) : (
                            <span>{getUserInitials(fullName || currentUser.fullName, currentUser.username)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Avatar Upload & Actions */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarFileSelect}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingAvatar ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Tải ảnh từ máy tính</span>
                      </button>

                      {avatar && (
                        <button
                          type="button"
                          onClick={handleResetToDefaultAvatar}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                          title="Dùng avatar chữ cái mặc định"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Dùng mặc định</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Hỗ trợ ảnh PNG, JPG, WebP. Ảnh được nén tự động để lưu trực tiếp trên Firestore, không bao giờ bị mất khi đăng nhập máy khác.
                    </p>
                  </div>
                </div>

                {/* Preset Avatars Library */}
                <div className="mt-3.5 pt-3 border-t border-amber-200/70">
                  <p className="text-[11px] font-bold text-amber-900 mb-2 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-700" />
                    <span>Hoặc chọn nhanh ảnh đại diện giáo dục có sẵn (lưu tự động):</span>
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected = avatar === preset.dataUrl;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPresetAvatar(preset.dataUrl, preset.name)}
                          className={`group relative p-1 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            isSelected
                              ? 'bg-amber-200/70 border-amber-600 ring-2 ring-amber-500 scale-105 shadow-xs'
                              : 'bg-white/80 border-slate-200 hover:border-amber-400 hover:bg-white'
                          }`}
                          title={preset.name}
                        >
                          <img
                            src={preset.dataUrl}
                            alt={preset.name}
                            className="w-10 h-10 rounded-full object-cover shadow-2xs group-hover:scale-105 transition-transform"
                          />
                          {isSelected && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] shadow-xs">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                          <span className="text-[9px] font-semibold text-slate-700 truncate max-w-[50px] text-center">
                            {preset.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tên đăng nhập (Read-only) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Tên đăng nhập / Tài khoản hệ thống
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-600">
                  <User className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-mono">{currentUser.username}</span>
                  <span className="ml-auto text-[10px] text-slate-500 font-normal">
                    (ID: {currentUser.id})
                  </span>
                </div>
              </div>

              {/* Họ và tên (Editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Họ và tên Giáo viên / Người dùng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Thầy Nguyễn Văn An / Cô Lê Thị Mai"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 text-sm font-semibold text-slate-900 bg-amber-50/20"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Tên này sẽ xuất hiện trên Giáo án khi xuất file Word và hiển thị trên giao diện chính.
                </p>
              </div>

              {/* Đơn vị công tác & Số điện thoại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Đơn vị công tác / Trường học
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="VD: THPT Chuyên Châu Văn Liêm"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="VD: 0912 345 678"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Ghi chú */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Email nhận thông báo
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="VD: giaovien@edu.vn"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Ghi chú cá nhân
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="VD: Tổ Toán - Tin học"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingAvatar}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Đang lưu vào Firestore...' : 'Lưu Thay Đổi & Đồng Bộ'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CHANGE PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                <KeyRound className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Đổi Mật Khẩu Đăng Nhập:</p>
                  <p className="text-slate-600 mt-0.5">
                    Mật khẩu mới sẽ được lưu trực tiếp vào cơ sở dữ liệu Firestore. Lần đăng nhập kế tiếp trên bất kỳ thiết bị nào sẽ sử dụng mật khẩu mới này.
                  </p>
                </div>
              </div>

              {/* Mật khẩu hiện tại (chỉ yêu cầu nếu tài khoản đã có accessCode) */}
              {currentUser.accessCode && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Mật khẩu hiện tại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Nhập mật khẩu đang sử dụng..."
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 text-xs font-mono text-slate-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Mật khẩu mới */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới (ít nhất 4 ký tự)..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 text-xs font-mono text-slate-900 bg-amber-50/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Xác nhận lại mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới vừa đặt..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 text-xs font-mono text-slate-900 bg-amber-50/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Đang lưu vào Firestore...' : 'Lưu Mật Khẩu Lên Firestore'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DEVICES & SECURITY */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 text-xs text-slate-700 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950">Chính sách sử dụng thiết bị:</p>
                  <p className="text-slate-600 mt-0.5">
                    Hệ thống giới hạn mỗi tài khoản chỉ được phép đăng nhập trên tối đa{' '}
                    <strong className="text-amber-800 font-bold">{maxAllowed} máy tính vật lý</strong>.
                    Bạn được phép mở <strong>tất cả các ứng dụng</strong> và dùng <strong>mọi trình duyệt (Chrome, Edge, Cốc Cốc...)</strong> trên cùng một máy mà không bị trừ thêm lượt máy.
                  </p>
                </div>
              </div>

              {/* Danh sách máy */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Danh sách thiết bị đã cấp quyền ({devices.length}/{maxAllowed})</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Còn trống: {Math.max(0, maxAllowed - devices.length)} máy
                  </span>
                </h4>

                {devices.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                    <Laptop className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                    <p className="font-semibold">Chưa ghi nhận thiết bị nào</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Thiết bị sẽ được tự động liên kết khi bạn đăng nhập lần đầu trên máy tính.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {devices.map((d, i) => (
                      <div
                        key={d.deviceId || i}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs hover:border-amber-300 transition-colors shadow-2xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold shrink-0 mt-0.5">
                            <Laptop className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900">{d.deviceName || `Máy tính #${i + 1}`}</p>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                                {d.os || 'HĐH'}
                              </span>
                              {d.browser && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">
                                  {d.browser}
                                </span>
                              )}
                              {(d.usedApps && d.usedApps.length > 0) ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-medium border border-emerald-200">
                                  {d.usedApps.join(', ')}
                                </span>
                              ) : d.appName ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-medium border border-emerald-200">
                                  {d.appName}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">
                              ID: {d.deviceId.slice(0, 16)}...
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đã ủy quyền
                          </span>
                          <p className="text-[9px] text-slate-400 mt-0.5">Hoạt động: {d.lastActive}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Thông tin tài khoản thêm */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> Ngày cấp tài khoản
                  </span>
                  <p className="font-bold text-slate-800 mt-0.5">{currentUser.createdAt || '01/01/2025'}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Thời hạn tài khoản
                  </span>
                  <p className="font-bold text-emerald-700 mt-0.5">
                    {currentUser.expiresAt === 'Chưa cấp' 
                      ? `Dùng thử (${currentUser.trialGenerations || 0}/${currentUser.maxTrialGenerations !== undefined ? currentUser.maxTrialGenerations : 5} lần)` 
                      : (currentUser.expiresAt || 'Vĩnh viễn')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
