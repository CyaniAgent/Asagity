/**
 * RegisterPage — 注册表单
 *
 * 和登录页一样只负责表单；品牌楔形 / 品牌文案 / 窗口按钮由持久的
 * AuthShell 提供，因此切换时楔形是滑过去的，而不是重新挂载。
 *
 * 只保留注册真正需要的四步：用户名 → 邮箱 → 密码 → 确认密码。
 */
import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { useInstanceStore } from "@/stores/instance";
import { useUserStore } from "@/stores/user";
import { useThemeStore } from "@/stores/theme";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { useRouterStore } from "@/stores/router";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";
import { AuthField } from "@/components/auth/AuthField";

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    username: string;
    name?: string;
    avatar_url?: string;
  };
}

export function RegisterPage() {
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
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Validation ─────────────────────────────────────────────── */
  const usernameOk = username.trim().length >= 3 && /^[A-Za-z0-9_]+$/.test(username);
  const passwordOk = password.length >= 8;
  const confirmOk = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = usernameOk && passwordOk && confirmOk;

  /* ── Submit ─────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.post<AuthResponse>("/api/auth/register", {
        username: username.trim(),
        email: email || undefined,
        password,
      });
      userStore.setAuth(data);
      useRouterStore.getState().replace("/");
      const win = freeWindowStore.windows.find((w) => w.viewType === "register_window");
      if (win) freeWindowStore.close(win.id);
    } catch (err) {
      setError((err as Error).message || t("auth.registrationRejected"));
    } finally {
      setLoading(false);
    }
  };

  /* ── Back to login ──────────────────────────────────────────── */
  const handleBackToLogin = () => {
    const win = freeWindowStore.windows.find((w) => w.viewType === "register_window");
    if (win) freeWindowStore.switchView(win.id, "login_window");
  };

  /* ── Theme tokens ───────────────────────────────────────────── */
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const borderColor = isDark ? "border-white/10" : "border-gray-200";

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-5 text-center">
        <div
          className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border md:hidden ${borderColor} ${isDark ? "bg-[#191919]" : "bg-gray-100"}`}
        >
          <img
            src={instanceStore.logoURL}
            alt={instanceStore.name}
            className="h-10 w-10 object-contain"
          />
        </div>
        <h1 className={`mb-1 text-xl font-bold ${textPrimary}`}>
          {t("auth.initNewAccount")}
        </h1>
        <p className={`text-[12px] ${textSecondary}`}>{t("register.joinInstance")}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 flex items-center gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[12px] text-red-400">
          <Icon name="error" fontSize={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <AuthField
          label={t("auth.username")}
          icon="person"
          value={username}
          onChange={setUsername}
          placeholder="syskuku"
          isDark={isDark}
          autoComplete="username"
        />

        <AuthField
          label={t("auth.email")}
          icon="mail"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="syskuku@asagity.net"
          isDark={isDark}
          autoComplete="email"
        />

        <AuthField
          label={t("auth.password")}
          icon="key"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          isDark={isDark}
          autoComplete="new-password"
          suffix={
            password.length > 0 ? (
              <IconButton
                variant="ghost"
                size="sm"
                icon={<Icon name={showPassword ? "eye_off" : "eye"} fontSize={16} />}
                label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                tooltip={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                onClick={() => setShowPassword(!showPassword)}
              />
            ) : undefined
          }
        />

        <AuthField
          label={t("auth.confirmPassword")}
          icon="key"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="••••••••"
          isDark={isDark}
          autoComplete="new-password"
        />

        <div className="pt-3">
          <Button
            variant="ghost"
            size="lg"
            type="submit"
            width="100%"
            label={loading ? t("auth.initializing") : t("auth.register")}
            isLoading={loading}
            isDisabled={!canSubmit}
            className="bg-[#242424] text-gray-200 hover:bg-[#2b2b2b] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
          />
        </div>
      </form>

      <div className="mt-3 text-left">
        <Button
          variant="ghost"
          size="sm"
          label={t("auth.returnToLogin")}
          onClick={handleBackToLogin}
        />
      </div>
    </div>
  );
}
