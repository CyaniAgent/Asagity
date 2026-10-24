"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@astryxdesign/core/Button";
import { useI18n } from "@/components/providers/I18nProvider";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { Icon } from "@/components/ui/Icon";
import {
  GUEST_CODE_LENGTH,
  normalizeGuestCode,
  issueGuestCode,
  verifyGuestCode,
  logGuestCodeToConsole,
} from "@/lib/termityGuestAuth";

/**
 * Termity 免登录进入验证弹窗（guest gate）。
 *
 * 验证机制：8 位验证码（0-9 + A-Z），由后端随机铸造并打印到运行日志，
 * 前端取回后打进浏览器开发者工具控制台 —— 用户从控制台抄码输入。
 * 旧的硬编码密码机制已废除。
 *
 * 输入 UI 采用 OTP 卡片：8 个独立格 + 一个透明单输入兜底
 * （自动前进 / 退格回退 / 粘贴分发全部由原生输入承担）。
 * 按钮为 Astryx 设计体系组件（见 docs/design-tokens.md）。
 */
export function TermityAuthModal() {
  const { t } = useI18n();
  const freeWindowStore = useFreeWindowStore();
  const isOpen = useFreeWindowStore((s) => s.isTermityAuthOpen);

  const [digits, setDigits] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 语言切换不应触发重新发码：effect 只依赖 isOpen，取码经 ref 转发
  const requestCodeRef = useRef<() => Promise<void>>(async () => {});

  const requestCode = useCallback(async () => {
    setIssuing(true);
    const res = await issueGuestCode();
    setIssuing(false);
    if (res.ok) {
      logGuestCodeToConsole(res.code, t("termity.codeConsoleLabel"), t("termity.codeConsoleHint"));
    } else {
      setError(t("termity.codeIssueError"));
    }
  }, [t]);
  requestCodeRef.current = requestCode;

  const fireShake = useCallback(() => {
    setShake(true);
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShake(false), 500);
  }, []);

  // 打开 → 重置状态 + 向后端申请新码 + 聚焦输入
  useEffect(() => {
    if (!isOpen) return;
    setDigits("");
    setError("");
    setVerifying(false);
    setShake(false);
    void requestCodeRef.current();
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => {
      clearTimeout(focusTimer);
      if (shakeTimer.current) {
        clearTimeout(shakeTimer.current);
        shakeTimer.current = null;
      }
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    freeWindowStore.closeTermityAuth();
  }, [freeWindowStore]);

  const handleVerify = useCallback(async () => {
    if (verifying || digits.length !== GUEST_CODE_LENGTH) return;
    setVerifying(true);
    const status = await verifyGuestCode(digits);
    setVerifying(false);
    if (status === "valid") {
      freeWindowStore.confirmTermityAuth();
      return;
    }
    // 失败：清空格子 + 抖动反馈
    setDigits("");
    fireShake();
    if (status === "mismatch") {
      setError(t("termity.verificationFailed"));
    } else if (status === "expired") {
      // 码已过期/被打满失效 → 自动重新发一枚并再打一次控制台
      setError(t("termity.codeExpired"));
      void requestCodeRef.current();
    } else {
      setError(t("termity.codeVerifyError"));
    }
  }, [verifying, digits, freeWindowStore, fireShake, t]);

  const handleLogin = useCallback(() => {
    handleClose();
    freeWindowStore.openFromContext("auth");
  }, [handleClose, freeWindowStore]);

  if (!isOpen) return null;

  const activeIndex = Math.min(digits.length, GUEST_CODE_LENGTH - 1);

  return (
    <div className="fixed inset-0 z-[100003] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-[400px] max-w-[90vw] rounded-3xl p-6
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl
          border border-white/20 dark:border-gray-700/50
          shadow-[0_20px_60px_rgba(0,0,0,0.3)]
          animate-[fadeIn_0.2s_ease-out]
          ${shake ? "animate-[shakeX_0.5s_ease-in-out]" : ""}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Icon name="terminal" className="text-cyan-500" fontSize={22} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {t("termity.authRequired")}
          </h3>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 leading-relaxed">
          {t("termity.authDescription")}
        </p>

        {/* ── OTP card: 8 slots over one transparent input ─────────────── */}
        <div
          className="relative mt-4 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <input
            ref={inputRef}
            value={digits}
            onChange={(e) => {
              setDigits(normalizeGuestCode(e.target.value));
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleVerify();
              } else if (e.key === "Escape") {
                e.preventDefault();
                handleClose();
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="absolute inset-0 z-10 w-full h-full opacity-0"
            inputMode="text"
            autoComplete="one-time-code"
            spellCheck={false}
            aria-label={t("termity.authRequired")}
          />
          <div
            className="flex justify-center gap-1.5 pointer-events-none"
            aria-hidden="true"
          >
            {Array.from({ length: GUEST_CODE_LENGTH }, (_, i) => {
              const ch = digits[i];
              const filled = Boolean(ch);
              const isActive = focused && !filled && i === activeIndex;
              return (
                <div
                  key={i}
                  className={[
                    "relative w-9 h-11 rounded-xl flex items-center justify-center",
                    "text-lg font-mono font-semibold select-none",
                    "border transition-all duration-150 ease-[cubic-bezier(.2,.8,.2,1)]",
                    shake
                      ? "border-bad bg-badmuted"
                      : filled
                        ? "border-cyan-500/60 bg-cyan-500/10 text-gray-900 dark:text-white"
                        : isActive
                          ? "border-cyan-500 bg-white dark:bg-gray-800 scale-105 shadow-sm"
                          : "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800",
                  ].join(" ")}
                >
                  {ch ??
                    (isActive ? (
                      <span className="w-0.5 h-5 bg-cyan-500 rounded-full animate-[caretBlink_1s_linear_infinite]" />
                    ) : null)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Console hint + reissue */}
        <div className="flex items-center justify-between gap-2 mt-2.5 min-h-[20px]">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 min-w-0">
            <Icon name="info" fontSize={13} className="shrink-0" />
            <span className="truncate">
              {issuing ? t("termity.codeIssuing") : t("termity.codeHint")}
            </span>
          </p>
          <button
            type="button"
            onClick={() => {
              setError("");
              void requestCodeRef.current();
            }}
            disabled={issuing}
            className="shrink-0 text-[11px] text-cyan-600 dark:text-cyan-400
              hover:underline disabled:opacity-50 flex items-center gap-1"
          >
            <Icon name="refresh" fontSize={13} />
            {t("termity.codeResend")}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-2 text-sm text-bad flex items-center gap-1.5">
            <Icon name="error" fontSize={16} />
            {error}
          </p>
        )}

        {/* Action Buttons — Astryx design system */}
        <div className="flex gap-3 mt-5">
          <div className="flex-1">
            <Button
              variant="secondary"
              size="lg"
              width="100%"
              label={t("auth.login")}
              onClick={handleLogin}
            />
          </div>
          <div className="flex-1">
            <Button
              variant="primary"
              size="lg"
              width="100%"
              label={t("termity.verify")}
              onClick={() => void handleVerify()}
              isLoading={verifying}
              isDisabled={digits.length !== GUEST_CODE_LENGTH}
              className="glow-accent glow-accent-hover"
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes caretBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
