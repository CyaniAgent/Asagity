/**
 * LoginPage — 登录表单
 *
 * 品牌楔形、品牌文案、窗口按钮和拖拽条都由外层 AuthShell 提供，
 * 这样切换注册页时外壳不会被卸载，楔形才能平滑地滑到另一侧。
 * 这里只负责表单本身。
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
      useRouterStore.getState().replace("/");
      const win = freeWindowStore.windows.find((w) => w.viewType === "login_window");
      if (win) freeWindowStore.close(win.id);
    } catch (err) {
      setError((err as Error).message || t("auth.authFailed"));
    } finally {
      setLoading(false);
    }
  };

  /* ── Theme tokens ───────────────────────────────────────────── */
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const borderColor = isDark ? "border-white/10" : "border-gray-200";

  return (
    <div className="relative">
      {/* Header — centred above the form fields */}
      <div className="mb-8 text-center">
        {/* Brand wedge 在窄屏隐藏，Logo 在这里兜底 */}
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
          {t("auth.loginToInstance")}
        </h1>
        <p className={`text-[12px] ${textSecondary}`}>{t("loginPage.subtitle")}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-400">
          <Icon name="error" fontSize={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <AuthField
          label={t("auth.hubIdEmail")}
          icon="person"
          value={identifier}
          onChange={setIdentifier}
          placeholder="syskuku@asagity.net"
          required
          isDark={isDark}
        />

        <AuthField
          label={t("auth.password")}
          icon="key"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          required
          isDark={isDark}
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

        {/* 注册在左，忘记密钥在右 */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            label={t("auth.initNewAccount")}
            onClick={() => {
              const win = freeWindowStore.windows.find((w) => w.viewType === "login_window");
              if (win) freeWindowStore.switchView(win.id, "register_window");
            }}
          />
          <Button variant="ghost" size="sm" label={t("auth.forgotKey")} onClick={() => {}} />
        </div>

        <Button
          variant="ghost"
          size="lg"
          type="submit"
          width="100%"
          label={loading ? t("auth.verifying") : t("auth.loginToInstance")}
          isLoading={loading}
          isDisabled={!identifier || !password}
          className="bg-[#242424] text-gray-200 hover:bg-[#2b2b2b] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
        />
      </form>

      {/* Developer entry */}
      <div className="mt-4 text-left">
        <Button
          variant="ghost"
          size="sm"
          label={t("welcome.directEnter")}
          icon={<Icon name="terminal" fontSize={14} />}
          onClick={() => {
            userStore.developerEnter();
            useRouterStore.getState().replace("/");
            const win = freeWindowStore.windows.find((w) => w.viewType === "login_window");
            if (win) freeWindowStore.close(win.id);
          }}
        />
      </div>
    </div>
  );
}
