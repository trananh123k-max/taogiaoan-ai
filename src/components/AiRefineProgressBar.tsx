import React from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  X,
  ExternalLink,
  KeyRound,
  ArrowDown,
} from 'lucide-react';
import { AiRefineProgress } from '../types';

interface AiRefineProgressBarProps {
  progress: AiRefineProgress;
  onRetry?: () => void;
  onDismiss?: () => void;
  onOpenApiKeyModal?: () => void;
  onScrollToTarget?: () => void;
  variant?: 'inline' | 'floating-hud' | 'banner';
  className?: string;
}

const formatMinSec = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}s`;
};

export const AiRefineProgressBar: React.FC<AiRefineProgressBarProps> = ({
  progress,
  onRetry,
  onDismiss,
  onOpenApiKeyModal,
  onScrollToTarget,
  variant = 'inline',
  className = '',
}) => {
  if (!progress.isRefining && progress.status === 'idle') return null;

  const isSuccess = progress.status === 'success';
  const isError = progress.status === 'error';
  const isRunning = progress.status === 'refining';

  const isQuotaIssue =
    isError &&
    (/quota|resource_exhausted|rate_limit|429/i.test(progress.errorMessage || '') ||
      /hạn ngạch/i.test(progress.errorMessage || ''));

  // 1. FLOATING HUD VARIANT (Sticky bar for long-scroll pages)
  if (variant === 'floating-hud') {
    return (
      <div
        className={`sticky top-2 z-40 w-full max-w-4xl mx-auto px-4 py-2.5 rounded-xl border transition-all shadow-md backdrop-blur-md ${
          isSuccess
            ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-500/10'
            : isError
            ? 'bg-rose-50/95 border-rose-300 text-rose-950 shadow-rose-500/10'
            : 'bg-white/95 border-amber-300 text-slate-900 shadow-amber-500/10'
        } ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Left status & info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0">
              {isSuccess ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : isError ? (
                <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-xs">
                  <AlertCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm tracking-tight truncate">
                  {isSuccess
                    ? 'ĐÃ SOẠN XONG NỘI DUNG!'
                    : isError
                    ? 'CHƯA THỂ HOÀN TẤT BIÊN SOẠN'
                    : progress.targetName
                    ? `AI ĐANG SOẠN: ${progress.targetName}`
                    : 'AI ĐANG BIÊN SOẠN & TINH CHỈNH NỘI DUNG'}
                </span>
                {progress.targetIndex && (
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-800">
                    HĐ {progress.targetIndex}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                {isError ? progress.errorMessage || progress.stageText : progress.stageText}
              </p>
            </div>
          </div>

          {/* Right progress indicator & action buttons */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            {/* Live Timer */}
            <span className="text-[11px] font-mono text-slate-500 bg-white/80 border border-slate-200 px-2 py-0.5 rounded tabular-nums">
              ⏱️ {formatMinSec(progress.elapsedSeconds)}
            </span>

            {/* Percentage badge */}
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded tabular-nums ${
                isSuccess
                  ? 'bg-emerald-600 text-white'
                  : isError
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              {progress.progressPercent}%
            </span>

            {/* Scroll to target button */}
            {onScrollToTarget && (
              <button
                type="button"
                onClick={onScrollToTarget}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded transition-colors cursor-pointer"
                title="Cuộn tới vị trí hoạt động đang soạn"
              >
                <ArrowDown className="w-3 h-3 text-slate-500" />
                <span className="hidden sm:inline">Vị trí</span>
              </button>
            )}

            {/* Dismiss or Retry */}
            {isError && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Thử lại</span>
              </button>
            )}

            {isError && isQuotaIssue && onOpenApiKeyModal && (
              <button
                type="button"
                onClick={onOpenApiKeyModal}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                <KeyRound className="w-3 h-3 text-amber-700" />
                <span>Nhập Key</span>
              </button>
            )}

            {(isSuccess || isError) && onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
                title="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/50 mt-2">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isSuccess
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : isError
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-500'
            }`}
            style={{ width: `${Math.max(5, progress.progressPercent)}%` }}
          />
        </div>
      </div>
    );
  }

  // 2. INLINE OR BANNER VARIANT (Placed directly inside the activity card)
  return (
    <div
      className={`p-4 sm:p-5 border-b transition-all ${
        isSuccess
          ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/90 border-emerald-300 text-emerald-950'
          : isError
          ? 'bg-gradient-to-r from-rose-50/90 to-amber-50/90 border-rose-300 text-rose-950'
          : 'bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-emerald-50/90 border-amber-300 text-slate-900'
      } ${className}`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0">
            {isSuccess ? (
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-5 h-5 animate-bounce" />
              </div>
            ) : isError ? (
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                <AlertCircle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold tracking-tight">
                {isSuccess
                  ? 'ĐÃ SOẠN XONG NỘI DUNG!'
                  : isError
                  ? 'CHƯA THỂ HOÀN TẤT BIÊN SOẠN'
                  : 'AI ĐANG BIÊN SOẠN & TINH CHỈNH NỘI DUNG'}
              </h4>
              {progress.targetIndex && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/90 border border-slate-300 text-slate-800">
                  Hoạt động {progress.targetIndex}
                </span>
              )}
            </div>

            {progress.instruction && (
              <p className="text-[11px] text-slate-600 italic line-clamp-1 mt-0.5">
                Yêu cầu: "{progress.instruction}"
              </p>
            )}
          </div>
        </div>

        {/* Right metrics */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-slate-600 bg-white/80 border border-slate-200 px-2.5 py-1 rounded-lg tabular-nums">
            ⏱️ {formatMinSec(progress.elapsedSeconds)}
          </span>

          <span
            className={`text-xs sm:text-sm font-mono font-black px-2.5 py-1 rounded-lg tabular-nums ${
              isSuccess
                ? 'bg-emerald-600 text-white shadow-2xs'
                : isError
                ? 'bg-rose-600 text-white'
                : 'bg-amber-600 text-white shadow-2xs'
            }`}
          >
            {progress.progressPercent}%
          </span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-3 bg-white/90 rounded-full p-0.5 border border-slate-300/80 overflow-hidden shadow-inner mb-2.5">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isSuccess
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : isError
              ? 'bg-rose-500'
              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-500'
          }`}
          style={{ width: `${Math.max(5, progress.progressPercent)}%` }}
        />
      </div>

      {/* Status Text & Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
          {isRunning && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700 shrink-0" />}
          {isSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
          {isError && <AlertCircle className="w-3.5 h-3.5 text-rose-700 shrink-0" />}

          <span
            className={`font-medium ${
              isSuccess
                ? 'text-emerald-900 font-bold'
                : isError
                ? 'text-rose-900 font-bold'
                : 'text-slate-800'
            }`}
          >
            {isSuccess
              ? '✅ Hoàn tất 100%! Bảng hoạt động bên dưới đã được cập nhật nội dung mới nhất.'
              : isError
              ? progress.errorMessage || progress.stageText
              : progress.stageText}
          </span>
        </div>

        {/* Action buttons on Error or Done */}
        <div className="flex items-center gap-2">
          {isError && isQuotaIssue && onOpenApiKeyModal && (
            <button
              type="button"
              onClick={onOpenApiKeyModal}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Nhập Gemini API Key riêng</span>
            </button>
          )}

          {isError && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          )}

          {isError && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs transition-all cursor-pointer"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
