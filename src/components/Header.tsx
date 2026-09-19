import React from 'react';
import {
  Sparkles,
  LogOut,
  LogIn,
  BookOpen,
  Users,
  Shield,
  GraduationCap,
  User,
  Calendar,
  Clock,
  Key,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { ManagedUserAccount } from '../utils/firebase';
import { getUserInitials } from '../utils/avatarUtils';
import { getUserAccessStatus } from '../utils/userAccess';

interface HeaderProps {
  onOpenGuide: () => void;
  onOpenAiSuggestions: () => void;
  onOpenCloudStorage: () => void;
  onOpenUserManagement?: () => void;
  onOpenUserProfile?: () => void;
  onLoadSample: (sampleId: string) => void;
  teacherName?: string;
  schoolName?: string;
  onOpenSourceCode?: () => void;
  userRole?: 'admin' | 'teacher';
  onToggleUserRole?: () => void;
  isLoggedIn?: boolean;
  currentUser?: ManagedUserAccount | null;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onLogout?: () => void;
  onOpenApiKeyModal?: () => void;
  hasCustomApiKey?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCloudStorage,
  onOpenUserManagement,
  onOpenUserProfile,
  userRole = 'admin',
  onToggleUserRole,
  isLoggedIn = true,
  currentUser,
  onOpenLogin,
  onOpenRegister,
  onLogout,
  onOpenApiKeyModal,
  hasCustomApiKey = false,
}) => {
  const currentRole = currentUser ? currentUser.role : userRole;
  const isTeacher = currentRole === 'teacher';
  const isAdmin = currentRole === 'admin';
  const accessStatus = getUserAccessStatus(currentUser);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#7c2d12] via-[#9a3412] to-[#78350f] text-white shadow-md border-b border-amber-900/60">
      <div className="max-w-[1700px] mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white p-1 shadow-md shadow-amber-950/40 border border-amber-300/40 shrink-0">
              <img
                src="/logo.svg"
                alt="KHBD AI PRO Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                  <span>KHBD</span>
                  <span className="text-amber-300 bg-amber-950/50 px-1.5 py-0.5 rounded text-sm font-black border border-amber-500/30">
                    AI PRO
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* Right: Dynamic Role & User info according to logged in account */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* API Key Management Button */}
            {onOpenApiKeyModal && (
              <button
                type="button"
                onClick={onOpenApiKeyModal}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-xs ${
                  hasCustomApiKey
                    ? 'bg-amber-950/90 hover:bg-amber-900 text-amber-300 border-amber-400/70'
                    : 'bg-black/20 hover:bg-black/40 text-amber-200 hover:text-white border-amber-500/40'
                }`}
                title="Quản lý API Key Gemini & Kiểm tra Quota"
              >
                <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden md:inline">API Key</span>
                {hasCustomApiKey && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Đang dùng khóa cá nhân" />
                )}
              </button>
            )}

            {isLoggedIn && currentUser ? (
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* STRICTLY SEPARATE: 1. Kho Sách & PPCT button */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={onOpenCloudStorage}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-950/70 hover:bg-amber-900 text-amber-200 hover:text-white border border-amber-500/50 hover:border-amber-400 shadow-xs transition-all cursor-pointer"
                    title="Mở Kho Sách SGK & Phân phối chương trình (PPCT)"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="hidden sm:inline">Kho Sách & PPCT</span>
                    <span className="sm:hidden">Kho Sách</span>
                  </button>
                )}

                {/* Quản trị viên (Admin) button */}
                {isAdmin && onOpenUserManagement && (
                  <button
                    type="button"
                    onClick={onOpenUserManagement}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border border-amber-400/70 shadow-sm transition-all cursor-pointer group"
                    title="Quản lý toàn bộ tài khoản giáo viên, phân quyền, đổi mật khẩu và đặt lại số máy"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-200 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="hidden sm:inline">Quản trị viên (Admin)</span>
                    <span className="sm:hidden">Admin</span>
                  </button>
                )}

                {/* User Avatar Button for Profile, Name, Password & Avatar Management */}
                {onOpenUserProfile && (
                  <button
                    type="button"
                    onClick={onOpenUserProfile}
                    className="relative group p-0.5 rounded-full border-2 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 focus:outline-none ring-offset-2 ring-offset-amber-950 focus:ring-2 focus:ring-amber-400 shrink-0"
                    style={{
                      borderColor: isAdmin ? '#f59e0b' : '#10b981',
                      backgroundColor: isAdmin ? '#451a03' : '#064e3b',
                    }}
                    title={`Tài khoản: ${currentUser.fullName || currentUser.username} (${isAdmin ? 'Quản trị viên' : 'Giáo viên'})\n• Bấm để xem hồ sơ, đổi avatar, đổi tên và mật khẩu`}
                  >
                    {/* Avatar Image / Fallback Initials */}
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center relative bg-slate-900">
                      {currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.fullName || 'User Avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center font-black text-xs text-white select-none ${
                            isAdmin
                              ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-amber-100'
                              : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-emerald-100'
                          }`}
                        >
                          {isAdmin ? (
                            <Shield className="w-4 h-4 text-amber-200" />
                          ) : (
                            <span>{getUserInitials(currentUser.fullName, currentUser.username)}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Online Status / Role indicator dot */}
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-amber-950 shadow-xs ${
                        isAdmin ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    />
                  </button>
                )}

                {/* Expiry date / Trial count FOR TEACHER ACCOUNTS ONLY */}
                {isTeacher && (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs border transition-all ${
                      accessStatus.badgeVariant === 'error'
                        ? 'bg-rose-950/80 border-rose-500/80 text-rose-200 animate-pulse'
                        : accessStatus.badgeVariant === 'warning'
                        ? 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                        : 'bg-emerald-900/50 border-emerald-700/60 text-emerald-200'
                    }`}
                    title={
                      accessStatus.isTrial
                        ? `Tài khoản dùng thử: Đã tạo ${accessStatus.usedTrials}/${accessStatus.maxTrials} bài dạy. Còn lại ${accessStatus.remainingTrials} lượt.`
                        : accessStatus.isExpired
                        ? `Tài khoản đã hết hạn vào ngày ${accessStatus.expiresAt}. Vui lòng liên hệ Admin!`
                        : `Thời hạn sử dụng: ${accessStatus.expiresAt}`
                    }
                  >
                    {accessStatus.badgeVariant === 'error' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : accessStatus.isTrial ? (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    )}
                    <span className="font-bold">{accessStatus.badgeText}</span>
                  </div>
                )}

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-950/80 hover:bg-red-900/80 text-amber-200 hover:text-white border border-amber-700/60 transition-all cursor-pointer shadow-xs"
                  title="Đăng xuất khỏi hệ thống"
                >
                  <LogOut className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              /* When not logged in */
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenRegister || onOpenLogin}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 hover:text-white border border-amber-400/40 shadow-xs transition-all cursor-pointer"
                  title="Tạo tài khoản mới dành cho giáo viên"
                >
                  <User className="w-3.5 h-3.5 text-amber-300" />
                  <span>Đăng ký</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white border border-emerald-400/50 shadow-sm transition-all cursor-pointer"
                  title="Đăng nhập tài khoản giáo viên hoặc quản trị viên"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Đăng nhập</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


