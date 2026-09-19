"use client";

import { useState, useEffect } from "react";
import { useInstanceStore } from "@/stores/instance";
import { useUserStore } from "@/stores/user";
import { useThemeStore } from "@/stores/theme";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    username: string;
    name?: string;
    avatar_url?: string;
  };
}

type AuthMode = "login" | "register";

export function AuthModal() {
  const instanceStore = useInstanceStore();
  const userStore = useUserStore();
  const { closeAuth } = useFreeWindowStore();
  const { t } = useI18n();
  const isDark = useThemeStore(
    (s) =>
      s.preference === "dark" ||
      (s.preference === "system" && s.systemPreference === "dark")
  );

  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Register
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const passwordsMismatch =
    mode === "register" &&
    regConfirmPassword.length > 0 &&
    regPassword !== regConfirmPassword;

  /* ── Escape key closes ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuth();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeAuth]);

  /* ── Submit ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.post<AuthResponse>("/api/auth/login", {
        identifier,
        password,
      });
      userStore.setAuth(data);
      closeAuth();
    } catch (err) {
      setError((err as Error).message || t("auth.authFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setError(t("auth.passwordsMismatch"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.post<AuthResponse>("/api/auth/register", {
        username: regUsername,
        password: regPassword,
      });
      userStore.setAuth(data);
      closeAuth();
    } catch (err) {
      setError((err as Error).message || t("auth.registrationRejected"));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
  };

  /* ── Theme tokens ── */
  const labelText = isDark ? "text-gray-400" : "text-gray-500";
  const inputBg = isDark ? "bg-white/5" : "bg-gray-100";
  const inputBorder = isDark ? "border-white/10" : "border-gray-200";
  const inputText = isDark ? "text-white" : "text-gray-900";
  const inputPH = isDark ? "placeholder-gray-500" : "placeholder-gray-400";
  const iconColor = isDark ? "text-gray-500" : "text-gray-400";
  const tabActive = isDark
    ? "bg-cyan-500/20 text-cyan-400"
    : "bg-cyan-500/15 text-cyan-600";
  const tabInactive = isDark
    ? "text-gray-400 hover:text-gray-300"
    : "text-gray-500 hover:text-gray-700";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuth();
      }}
    >
      {/* ── Backdrop ── */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

      {/* ── Modal ── */}
      <div
        className={`relative w-[420px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)] rounded-[28px] border shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col
          ${isDark ? "bg-gray-900/95 border-white/10" : "bg-white/95 border-gray-200"}`}
      >
        {/* ── Header ── */}
        <div className="relative shrink-0 px-8 pt-8 pb-4">
          {/* Gradient accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-[2px] bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full shadow-[0_0_12px_rgba(57,197,187,0.4)]" />

          {/* Logo + Instance name */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border
                ${isDark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"}`}
            >
              <img
                src={instanceStore.logoURL}
                alt={instanceStore.name}
                className="w-10 h-10 object-contain"
              />
            </div>
            <h1
              className={`text-xl font-bold tracking-tight text-center
                ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {mode === "login"
                ? t("auth.loginToInstance")
                : t("register.joinInstance")}
            </h1>
          </div>

          {/* Mode tabs */}
          <div
            className={`flex rounded-xl p-1
              ${isDark ? "bg-white/5" : "bg-gray-100"}`}
          >
            <button
              onClick={() => switchMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "login" ? tabActive : tabInactive}`}
            >
              {t("auth.login")}
            </button>
            <button
              onClick={() => switchMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "register" ? tabActive : tabInactive}`}
            >
              {t("auth.register")}
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-4">
              <Icon name="error" fontSize={16} />
              <span>{error}</span>
            </div>
          )}

          {/* ── Login Form ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className={`text-[11px] font-bold uppercase tracking-wider ml-1 ${labelText}`}
                >
                  {t("auth.hubIdEmail")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Icon name="person" className={iconColor} fontSize={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={`w-full ${inputBg} border ${inputBorder} rounded-xl py-3 pl-10 pr-4 text-sm ${inputText} ${inputPH} focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all`}
                    placeholder="syskuku@asagity.net"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label
                    className={`text-[11px] font-bold uppercase tracking-wider ${labelText}`}
                  >
                    {t("auth.password")}
                  </label>
                  <button
                    type="button"
                    className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400"
                  >
                    {t("auth.forgotKey")}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Icon name="lock" className={iconColor} fontSize={16} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full ${inputBg} border ${inputBorder} rounded-xl py-3 pl-10 pr-4 text-sm ${inputText} ${inputPH} focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all`}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 text-gray-900 font-black tracking-wider py-3.5 rounded-xl shadow-[0_0_15px_rgba(57,197,187,0.3)] hover:shadow-[0_0_25px_rgba(57,197,187,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Icon name="refresh" className="animate-spin" fontSize={16} />
                    {t("auth.verifying")}
                  </>
                ) : (
                  t("auth.loginToInstance")
                )}
              </button>
            </form>
          )}

          {/* ── Register Form ── */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  className={`text-[11px] font-bold uppercase tracking-wider ml-1 ${labelText}`}
                >
                  {t("auth.username")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Icon name="person" className={iconColor} fontSize={16} />
                  </div>
                  <input
                    type="text"
                    required
                    pattern="[A-Za-z0-9_]+"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className={`w-full ${inputBg} border ${inputBorder} rounded-xl py-3 pl-10 pr-4 text-sm ${inputText} ${inputPH} focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all`}
                    placeholder="syskuku"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className={`text-[11px] font-bold uppercase tracking-wider ml-1 ${labelText}`}
                >
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Icon name="lock" className={iconColor} fontSize={16} />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className={`w-full ${inputBg} border ${inputBorder} rounded-xl py-3 pl-10 pr-4 text-sm ${inputText} ${inputPH} focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all`}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className={`text-[11px] font-bold uppercase tracking-wider ml-1 ${labelText}`}
                >
                  {t("auth.confirmPassword")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Icon
                      name="check_circle"
                      className={iconColor}
                      fontSize={16}
                    />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className={`w-full ${inputBg} border ${inputBorder} rounded-xl py-3 pl-10 pr-4 text-sm ${inputText} ${inputPH} focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all ${
                      passwordsMismatch
                        ? "border-red-500/60 focus:ring-red-500/50"
                        : ""
                    }`}
                    placeholder="••••••••"
                  />
                </div>
                {passwordsMismatch && (
                  <span className="text-[11px] text-red-400 ml-1">
                    {t("auth.passwordsMismatch")}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || passwordsMismatch || !regUsername || !regPassword || !regConfirmPassword}
                className="w-full mt-1 bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 text-gray-900 font-black tracking-wider py-3.5 rounded-xl shadow-[0_0_15px_rgba(57,197,187,0.3)] hover:shadow-[0_0_25px_rgba(57,197,187,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Icon name="refresh" className="animate-spin" fontSize={16} />
                    {t("auth.initializing")}
                  </>
                ) : (
                  t("register.joinInstance")
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
