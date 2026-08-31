"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { Icon } from "@/components/ui/Icon";

const TERMITY_PASSWORD = "TermitybyAsagity2026";

export function TermityAuthModal() {
  const { t } = useI18n();
  const freeWindowStore = useFreeWindowStore();
  const isOpen = useFreeWindowStore((s) => s.isTermityAuthOpen);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setShowPassword(false);
      setError("");
      setShake(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    freeWindowStore.closeTermityAuth();
  }, [freeWindowStore]);

  const handleVerify = useCallback(() => {
    if (password === TERMITY_PASSWORD) {
      freeWindowStore.confirmTermityAuth();
    } else {
      setError(t("termity.verificationFailed"));
      setShake(true);
      setPassword("");
      setTimeout(() => setShake(false), 500);
    }
  }, [password, freeWindowStore, t]);

  const handleLogin = useCallback(() => {
    handleClose();
    freeWindowStore.openFromContext("auth");
  }, [handleClose, freeWindowStore]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleVerify();
      } else if (e.key === "Escape") {
        handleClose();
      }
    },
    [handleVerify, handleClose]
  );

  if (!isOpen) return null;

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

        {/* Password Input */}
        <div className="relative mt-4">
          <input
            ref={inputRef}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder={t("termity.passwordPlaceholder")}
            className="w-full px-4 py-3 pr-10 rounded-xl text-sm
              bg-gray-100 dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30
              transition-all"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Icon name={showPassword ? "visibility_off" : "visibility"} fontSize={18} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5">
            <Icon name="error" fontSize={16} />
            {error}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleLogin}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium
              bg-gray-100 dark:bg-gray-800
              text-gray-700 dark:text-gray-300
              hover:bg-gray-200 dark:hover:bg-gray-700
              border border-gray-200 dark:border-gray-700
              transition-all"
          >
            {t("auth.login")}
          </button>
          <button
            onClick={handleVerify}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium
              bg-cyan-500 hover:bg-cyan-600
              text-white
              shadow-lg shadow-cyan-500/25
              transition-all"
          >
            {t("termity.verify")}
          </button>
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
      `}</style>
    </div>
  );
}
