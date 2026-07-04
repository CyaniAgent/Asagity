"use client";

import { useState } from "react";
import { useUserStore } from "@/stores/user";
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

interface AuthFormProps {
  onModeSwitch?: (mode: AuthMode) => void;
  compact?: boolean;
}

export function AuthForm({ onModeSwitch, compact }: AuthFormProps) {
  const userStore = useUserStore();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  // Login fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

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
        email: regEmail || undefined,
        password: regPassword,
      });
      userStore.setAuth(data);
    } catch (err) {
      setError((err as Error).message || t("auth.registrationRejected"));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    onModeSwitch?.(newMode);
  };

  return (
    <div className={`flex flex-col ${compact ? "gap-4" : "gap-6"}`}>
      {/* Mode Tabs */}
      {!compact && (
        <div className="flex bg-white/5 rounded-xl p-1">
          <button
            onClick={() => switchMode("login")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === "login"
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {t("auth.login")}
          </button>
          <button
            onClick={() => switchMode("register")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === "register"
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {t("auth.register")}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <Icon name="error" fontSize={16} />
          {error}
        </div>
      )}

      {/* Login Form */}
      {mode === "login" && (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
              {t("auth.hubIdEmail")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Icon name="person" className="text-gray-500" fontSize={16} />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                placeholder="syskuku@asagity.net"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {t("auth.accessKey")}
              </label>
              <button type="button" className="text-[9px] font-bold text-cyan-500 hover:text-cyan-400">
                {t("auth.forgotKey")}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Icon name="link" className="text-gray-500" fontSize={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 text-gray-900 font-black tracking-wider py-3 rounded-xl shadow-[0_0_15px_rgba(57,197,187,0.3)] hover:shadow-[0_0_25px_rgba(57,197,187,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Register Form */}
      {mode === "register" && (
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
              {t("auth.hubIdentifier")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Icon name="person" className="text-gray-500" fontSize={16} />
              </div>
              <input
                type="text"
                required
                pattern="[A-Za-z0-9_]+"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                placeholder="syskuku"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
              {t("auth.communicationNode")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Icon name="comment" className="text-gray-500" fontSize={16} />
              </div>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                placeholder="syskuku@asagity.net"
              />
            </div>
            <span className="text-[10px] text-gray-500 ml-1">{t("auth.emailHint")}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                {t("auth.accessKey")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Icon name="link" className="text-gray-500" fontSize={16} />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                {t("auth.confirmKey")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Icon name="link" className="text-gray-500" fontSize={16} />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || regPassword !== regConfirmPassword}
            className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 text-gray-900 font-black tracking-wider py-3 rounded-xl shadow-[0_0_15px_rgba(57,197,187,0.3)] hover:shadow-[0_0_25px_rgba(57,197,187,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Icon name="refresh" className="animate-spin" fontSize={16} />
                {t("auth.initializing")}
              </>
            ) : (
              t("auth.pledgeAndJoin")
            )}
          </button>
        </form>
      )}

      {/* Switch Mode */}
      {!compact && (
        <div className="text-center text-[11px] text-gray-400">
          {mode === "login" ? t("auth.noCredentials") : t("auth.hasAccess")}
          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            className="text-cyan-400 font-bold hover:text-cyan-300 ml-1"
          >
            {mode === "login" ? t("auth.initNewAccount") : t("auth.returnToLogin")}
          </button>
        </div>
      )}
    </div>
  );
}
