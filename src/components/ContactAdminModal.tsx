import React, { useState } from 'react';
import {
  ShieldAlert,
  Phone,
  MessageCircle,
  Copy,
  Check,
  X,
  ExternalLink,
  Lock,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { UserAccessStatus } from '../utils/userAccess';

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessStatus?: UserAccessStatus;
  userName?: string;
  isNewAccount?: boolean;
}

export const ContactAdminModal: React.FC<ContactAdminModalProps> = ({
  isOpen,
  onClose,
  accessStatus,
  userName,
  isNewAccount,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const adminPhone = '0989.982.818';
  const adminZalo = '0978.468.986';
  const adminName = 'Hoàng Văn Đình Khoa';

  const handleCopy = (text: string, type: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch {}
  };

  const handleOpenZalo = () => {
    window.open(`https://zalo.me/${adminZalo.replace(/\./g, '')}`, '_blank');
  };

  const isNew = isNewAccount || accessStatus?.isNewAccount;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-amber-200/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800 animate-in zoom-in-95 duration-200">
        {/* Modal Top Header Banner */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#7c2d12] via-[#9a3412] to-[#78350f] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-300/40 text-amber-300 flex items-center justify-center shrink-0">
              {isNew ? <Sparkles className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-base text-white">
                {isNew ? 'Kích Hoạt Tài Khoản' : 'Hết Quyền Soạn Giáo Án'}
              </h3>
              <p className="text-xs text-amber-200/90 font-medium">
                {isNew
                  ? 'Liên hệ Admin để nhận lượt dùng thử hoặc gia hạn'
                  : 'Vui lòng liên hệ Admin để được cấp quyền'}
              </p>
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Status Alert Box */}
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              isNew
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {isNew ? (
              <UserCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className={`font-bold ${isNew ? 'text-amber-900' : 'text-rose-800'}`}>
                {isNew
                  ? 'Tài khoản mới đăng ký thành công - Chờ Admin kích hoạt!'
                  : accessStatus?.isOutOfTrials
                  ? `Đã sử dụng hết ${accessStatus.maxTrials || 5} lượt dùng thử!`
                  : accessStatus?.isExpired
                  ? `Tài khoản đã hết hạn (${accessStatus.expiresAt})!`
                  : 'Tài khoản chưa được cấp quyền soạn giáo án!'}
              </p>
              <p className={`text-[11.5px] leading-relaxed ${isNew ? 'text-amber-800' : 'text-rose-700'}`}>
                {isNew
                  ? 'Chào mừng Thầy/Cô! Tài khoản đã được tự động đồng bộ lên hệ thống quản trị. Quý Thầy/Cô vui lòng nhắn tin Zalo hoặc gọi Hotline cho Admin để được cấp lượt dùng thử hoặc kích hoạt thời hạn sử dụng.'
                  : accessStatus?.reason ||
                    'Để tiếp tục sử dụng tính năng tạo bài dạy đầy đủ chuẩn Công văn 5512 tích hợp Năng lực số & AI, quý Thầy/Cô vui lòng liên hệ Ban quản trị để gia hạn.'}
              </p>
            </div>
          </div>

          {/* User Info Reminder */}
          {userName && (
            <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-700">
              <span>Tài khoản hiện tại:</span>
              <span className="font-bold text-slate-900">{userName}</span>
            </div>
          )}

          {/* Admin Contact Cards */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Thông Tin Liên Hệ Ban Quản Trị:
            </h4>

            {/* Author / Admin Name */}
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-xs">
                  AD
                </div>
                <div>
                  <div className="text-[11px] text-amber-800/80 font-medium">Tác giả & Quản trị viên</div>
                  <div className="font-extrabold text-xs text-amber-950">{adminName}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                Hỗ trợ 24/7
              </span>
            </div>

            {/* Zalo Direct Contact */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-blue-700 font-medium">Zalo tư vấn & Cấp quyền</div>
                  <div className="font-extrabold text-sm text-blue-950">{adminZalo}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(adminZalo.replace(/\./g, ''), 'zalo')}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-blue-300 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title="Sao chép số Zalo"
                >
                  {copiedType === 'zalo' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'zalo' ? 'Đã chép' : 'Sao chép'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenZalo}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  title="Mở Zalo ngay"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở Zalo</span>
                </button>
              </div>
            </div>

            {/* Hotline Phone Contact */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-emerald-700 font-medium">Hotline điện thoại</div>
                  <div className="font-extrabold text-sm text-emerald-950">{adminPhone}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(adminPhone.replace(/\./g, ''), 'phone')}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                title="Sao chép số điện thoại"
              >
                {copiedType === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'phone' ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>

          {/* Action Close */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Đã Hiểu & Đóng Lại</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
