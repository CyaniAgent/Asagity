/**
 * LoginPage — 登录窗口（Material Design 3 风格）
 *
 * 左侧：实例品牌信息
 * 右侧：登录表单（identifier + password）
 */
import { useState } from "react";
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

export function LoginPage() {
  const { t } = useI18n();
  const instanceStore = useInstanceStore();
  const userStore = useUserStore();
  const freeWindowStore = useFreeWindowStore();
  const isDark = useThemeStore(
    (s) =>
      s.preference === "dark" ||
      (s.preference === "system" && s.systemPreference === "dark"),
  );

  /* ── Form state ─────────────────────────────────────────────── */
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Submit ─────────────────────────────────────────────────── */
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
      // Close the login window by finding it in the store
      const win = freeWindowStore.windows.find((w) => w.viewType === "login_window");
      if (win) freeWindowStore.close(win.id);
    } catch (err) {
      setError((err as Error).message || t("auth.authFailed"));
    } finally {
      setLoading(false);
    }
  };

  /* ── Theme tokens ───────────────────────────────────────────── */
  const bg = isDark ? "bg-gray-950" : "bg-gray-50";
  const surfaceBg = isDark ? "bg-gray-900/80" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const textTertiary = isDark ? "text-gray-500" : "text-gray-400";
  const borderColor = isDark ? "border-white/10" : "border-gray-200";

  return (
    <div className={`flex h-full ${bg}`}>
      {/* ════════════════════════════════════════════════════════ */}
      {/* LEFT PANEL — Instance Brand                           */}
      {/* ════════════════════════════════════════════════════════ */}
      <div
        className={`hidden md:flex w-[260px] shrink-0 flex-col items-center justify-center p-8 border-r ${borderColor} ${surfaceBg}`}
      >
        {/* Logo */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-5 border ${borderColor} ${isDark ? "bg-white/5" : "bg-gray-100"}`}
        >
          <img
            src={instanceStore.logoURL}
            alt={instanceStore.name}
            className="w-12 h-12 object-contain"
          />
        </div>

        {/* Name */}
        <h2 className={`text-lg font-bold ${textPrimary} mb-1.5`}>
          {instanceStore.name}
        </h2>
        <p className={`text-[11px] font-mono ${textTertiary} mb-4`}>
          {instanceStore.alias}
        </p>

        {/* Description */}
        <p className={`text-[12px] leading-relaxed text-center ${textSecondary}`}>
          {instanceStore.description}
        </p>

        {/* Version */}
        <span className={`mt-6 text-[10px] font-mono ${textTertiary}`}>
          {instanceStore.version}
        </span>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* RIGHT PANEL — Login Form                              */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-[340px]">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Mobile-only logo */}
            <div
              className={`md:hidden w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border ${borderColor} ${isDark ? "bg-white/5" : "bg-gray-100"}`}
            >
              <img
                src={instanceStore.logoURL}
                alt={instanceStore.name}
                className="w-10 h-10 object-contain"
              />
            </div>

            {/* Accent line */}
            <div className="w-10 h-[2px] mx-auto mb-5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full shadow-[0_0_10px_rgba(57,197,187,0.3)]" />

            <h1 className={`text-xl font-bold ${textPrimary} mb-1`}>
              {t("auth.loginToInstance")}
            </h1>
            <p className={`text-[12px] ${textSecondary}`}>
              {t("loginPage.subtitle")}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 mb-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-[12px]">
              <Icon name="error" fontSize={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Identifier */}
            <M3LoginField
              label={t("auth.hubIdEmail")}
              icon="person"
              value={identifier}
              onChange={setIdentifier}
              placeholder="syskuku@asagity.net"
              required
              isDark={isDark}
            />

            {/* Password */}
            <M3LoginField
              label={t("auth.password")}
              icon="key"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
              isDark={isDark}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`p-1 rounded-full ${textTertiary} hover:${textSecondary} transition-colors`}
                >
                  <Icon name={showPassword ? "eye_off" : "eye"} fontSize={16} />
                </button>
              }
            />

            {/* Forgot password */}
            <div className="flex justify-end">
              <button
                type="button"
                className={`text-[11px] font-medium text-cyan-500 hover:text-cyan-400 transition-colors`}
              >
                {t("auth.forgotKey")}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !identifier || !password}
              className={`
                w-full py-3.5 rounded-full text-[14px] font-bold tracking-wide
                transition-all duration-200 flex items-center justify-center gap-2
                ${
                  !loading && identifier && password
                    ? "bg-cyan-500 text-white shadow-[0_0_20px_rgba(57,197,187,0.3)] hover:shadow-[0_0_30px_rgba(57,197,187,0.5)] hover:bg-cyan-400 active:scale-[0.98]"
                    : `${isDark ? "bg-white/5 text-gray-600" : "bg-gray-100 text-gray-400"} cursor-not-allowed`
                }
              `}
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

          {/* Switch to register */}
          <div className={`mt-6 text-center text-[12px] ${textSecondary}`}>
            {t("auth.noCredentials")}
            <button
              type="button"
              onClick={() => {
                // Close login window, then open register window
                const win = freeWindowStore.windows.find((w) => w.viewType === "login_window");
                if (win) freeWindowStore.close(win.id);
                setTimeout(() => {
                  freeWindowStore.openFromContext("register_window");
                }, 100);
              }}
              className="text-cyan-500 font-bold hover:text-cyan-400 ml-1 transition-colors"
            >
              {t("auth.initNewAccount")}
            </button>
          </div>

          {/* Developer entry */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                userStore.developerEnter();
                const win = freeWindowStore.windows.find((w) => w.viewType === "login_window");
                if (win) freeWindowStore.close(win.id);
              }}
              className={`
                text-[11px] font-medium px-3 py-1.5 rounded-full transition-all
                ${isDark ? "text-gray-500 hover:text-gray-400 hover:bg-white/5" : "text-gray-400 hover:text-gray-500 hover:bg-gray-100"}
              `}
            >
              <Icon name="terminal" fontSize={14} className="inline mr-1.5 align-[-3px]" />
              {t("welcome.directEnter")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── M3 Login Field ─────────────────────────────────────────────── */
function M3LoginField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  isDark,
  suffix,
}: {
  label: string;
  icon: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  isDark: boolean;
  suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const isFloating = focused || hasValue;

  return (
    <div
      className={`
        relative rounded-2xl border transition-all duration-200
        ${
          focused
            ? "border-cyan-500/50 shadow-[0_0_12px_rgba(57,197,187,0.15)]"
            : isDark
              ? "border-white/10 hover:border-white/20"
              : "border-gray-200 hover:border-gray-300"
        }
      `}
    >
      {/* Floating label */}
      <label
        className={`
          absolute left-11 transition-all duration-200 pointer-events-none z-10
          ${isFloating ? "top-2 text-[10px] font-bold" : "top-1/2 -translate-y-1/2 text-[13px]"}
          ${focused ? "text-cyan-400" : isDark ? "text-gray-500" : "text-gray-400"}
        `}
      >
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {/* Input area */}
      <div className="flex items-center">
        <div className="pl-3.5 flex items-center pointer-events-none">
          <Icon
            name={icon}
            fontSize={18}
            className={focused ? "text-cyan-500" : isDark ? "text-gray-500" : "text-gray-400"}
          />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? placeholder : ""}
          required={required}
          className={`
            w-full bg-transparent pt-5 pb-2 px-3 text-[14px] outline-none
            ${isDark ? "text-white" : "text-gray-900"}
            ${isDark ? "placeholder-gray-600" : "placeholder-gray-300"}
          `}
        />
        {suffix && <div className="pr-3">{suffix}</div>}
      </div>
    </div>
  );
}
