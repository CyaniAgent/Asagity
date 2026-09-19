/**
 * RegisterPage — 三步注册向导（自由窗口版）
 *
 * Material Design 3 风格 + Asagity 初音绿品牌色。
 * 左侧：实例品牌信息（静态）
 * 右侧：步骤内容（随步骤切换）
 * 顶部：步骤指示器
 */
import { useState, useRef, useCallback } from "react";
import { useInstanceStore } from "@/stores/instance";
import { useUserStore } from "@/stores/user";
import { useThemeStore } from "@/stores/theme";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

/* ── Types ──────────────────────────────────────────────────────── */
type Step = 0 | 1 | 2;

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    username: string;
    name?: string;
    avatar_url?: string;
  };
}

/* ── Agreement documents (placeholder) ──────────────────────────── */
interface AgreementDoc {
  id: string;
  titleKey: string;
  required: boolean;
  content: string;
}

const AGREEMENTS: AgreementDoc[] = [
  {
    id: "guidelines",
    titleKey: "register.docGuidelines",
    required: true,
    content:
      "欢迎来到我们的社区！为了维护良好的交流环境，请遵守以下行为准则：\n\n" +
      "1. 尊重每一位成员，禁止人身攻击、骚扰或歧视行为。\n" +
      "2. 禁止发布违法、暴力、色情或其他违反法律法规的内容。\n" +
      "3. 禁止发布垃圾信息、广告或未经授权的商业推广。\n" +
      "4. 保护个人隐私，未经许可不得公开他人个人信息。\n" +
      "5. 合理使用平台资源，禁止恶意攻击或滥用系统。\n" +
      "6. 遵守联邦协议规范，尊重其他实例的用户和规则。\n\n" +
      "违反以上准则可能导致账号被限制或封禁。感谢您的配合！",
  },
  {
    id: "privacy",
    titleKey: "register.docPrivacy",
    required: false,
    content:
      "本隐私政策说明了我们如何收集、使用和保护您的个人信息。\n\n" +
      "信息收集：我们收集您在注册时提供的用户名、邮箱地址，以及使用平台过程中产生的帖子、关注等公开数据。\n\n" +
      "信息使用：您的信息用于提供社交服务、改善用户体验、保障平台安全。\n\n" +
      "信息保护：我们采用加密存储和传输技术保护您的数据安全。\n\n" +
      "信息共享：未经您的同意，我们不会将您的个人信息出售给第三方。联邦协议下的数据同步遵循 ActivityPub 标准。\n\n" +
      "您可以随时在设置中管理您的隐私选项。",
  },
  {
    id: "terms",
    titleKey: "register.docTerms",
    required: false,
    content:
      "使用本平台即表示您同意以下服务条款：\n\n" +
      "1. 您必须年满 16 周岁才能注册和使用本平台。\n" +
      "2. 您对自己账号下的所有行为负责。\n" +
      "3. 我们保留对违反条款的账号采取措施的权利。\n" +
      "4. 平台可能不定期更新服务条款，更新后将通过平台通知。\n" +
      "5. 您可以在设置中随时删除账号，但已联邦同步的数据可能无法完全撤回。\n\n" +
      "如有疑问，请联系实例管理员。",
  },
  {
    id: "notes",
    titleKey: "register.docNotes",
    required: true,
    content:
      "在加入实例前，请注意以下事项：\n\n" +
      "• 您的帖子默认对联邦网络公开，其他实例的用户可以看到并回复。\n" +
      "• 您可以在设置中调整帖子的默认可见范围。\n" +
      "• 请妥善保管您的登录凭证，切勿分享给他人。\n" +
      "• 如需帮助，请通过设置页面联系管理员。\n\n" +
      "祝您在 Asagity 中拥有愉快的体验！",
  },
];

/* ── Main Component ─────────────────────────────────────────────── */
export function RegisterPage() {
  const { t } = useI18n();
  const instanceStore = useInstanceStore();
  const userStore = useUserStore();
  const isDark = useThemeStore(
    (s) =>
      s.preference === "dark" ||
      (s.preference === "system" && s.systemPreference === "dark"),
  );

  /* ── Step state ─────────────────────────────────────────────── */
  const [step, setStep] = useState<Step>(0);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionDir, setTransitionDir] = useState<"forward" | "backward">("forward");

  /* ── Agreement state ────────────────────────────────────────── */
  const [agreedIds, setAgreedIds] = useState<Set<string>>(new Set());
  const scrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [scrolledToEnd, setScrolledToEnd] = useState<Set<string>>(new Set());

  /* ── Form state ─────────────────────────────────────────────── */
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ── Verify state ───────────────────────────────────────────── */
  const [verifyCode, setVerifyCode] = useState("");
  const [verifySent, setVerifySent] = useState(false);

  /* ── Common state ───────────────────────────────────────────── */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Step transition ────────────────────────────────────────── */
  const goToStep = useCallback(
    (next: Step) => {
      if (next === step || transitioning) return;
      setTransitionDir(next > step ? "forward" : "backward");
      setTransitioning(true);
      setTimeout(() => {
        setStep(next);
        setTimeout(() => setTransitioning(false), 50);
      }, 180);
    },
    [step, transitioning],
  );

  /* ── Scroll detection for agreement docs ────────────────────── */
  const handleScroll = useCallback(
    (docId: string, e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
      if (atBottom && !scrolledToEnd.has(docId)) {
        setScrolledToEnd((prev) => new Set(prev).add(docId));
      }
    },
    [scrolledToEnd],
  );

  const toggleAgreement = useCallback(
    (docId: string) => {
      setAgreedIds((prev) => {
        const next = new Set(prev);
        if (next.has(docId)) next.delete(docId);
        else next.add(docId);
        return next;
      });
    },
    [],
  );

  /* ── Can proceed from step 0 ────────────────────────────────── */
  const requiredAgreements = AGREEMENTS.filter((a) => a.required);
  const allRequiredAgreed = requiredAgreements.every(
    (a) => agreedIds.has(a.id) && scrolledToEnd.has(a.id),
  );

  /* ── Form validation ────────────────────────────────────────── */
  const isFormValid =
    username.trim().length >= 3 &&
    /^[A-Za-z0-9_]+$/.test(username) &&
    password.length >= 8 &&
    password === confirmPassword;

  /* ── Submit registration ────────────────────────────────────── */
  const handleSubmitInfo = async () => {
    if (!isFormValid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.post<AuthResponse>("/api/auth/register", {
        username: username.trim(),
        email: email || undefined,
        password,
      });
      userStore.setAuth(data);
      // TODO: If email verification is needed, go to step 2
      // For now, registration completes directly
    } catch (err) {
      setError((err as Error).message || t("auth.registrationRejected"));
    } finally {
      setLoading(false);
    }
  };

  /* ── Submit verification code ───────────────────────────────── */
  const handleVerify = async () => {
    if (verifyCode.length !== 8) return;
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/auth/register/verify-email", { code: verifyCode });
      // After verification, the user should be logged in
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

  const steps = [
    { label: t("register.stepAgreement"), icon: "description" },
    { label: t("register.stepInfo"), icon: "person" },
    { label: t("register.stepVerify"), icon: "verified" },
  ];

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
        <p
          className={`text-[12px] leading-relaxed text-center ${textSecondary}`}
        >
          {instanceStore.description}
        </p>

        {/* Version */}
        <span
          className={`mt-6 text-[10px] font-mono ${textTertiary}`}
        >
          {instanceStore.version}
        </span>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* RIGHT PANEL — Step Content                            */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Step Indicator ────────────────────────────────── */}
        <div
          className={`shrink-0 px-6 pt-6 pb-4 border-b ${borderColor} ${surfaceBg}`}
        >
          <div className="flex items-center justify-center gap-0">
            {steps.map((s, i) => {
              const isActive = i === step;
              const isCompleted = i < step;
              return (
                <div key={i} className="flex items-center">
                  {/* Circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold
                        transition-all duration-300
                        ${
                          isActive
                            ? "bg-cyan-500 text-white shadow-[0_0_16px_rgba(57,197,187,0.4)]"
                            : isCompleted
                              ? "bg-cyan-500/20 text-cyan-400"
                              : `${isDark ? "bg-white/5 text-gray-500" : "bg-gray-100 text-gray-400"}`
                        }
                      `}
                    >
                      {isCompleted ? (
                        <Icon name="check_circle" fontSize={18} />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`
                        mt-2 text-[11px] font-medium whitespace-nowrap
                        ${isActive ? "text-cyan-400" : isCompleted ? "text-cyan-500/60" : textTertiary}
                      `}
                    >
                      {s.label}
                    </span>
                  </div>

                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div
                      className={`
                        w-16 h-[2px] mx-3 mb-6 rounded-full transition-colors duration-300
                        ${i < step ? "bg-cyan-500/40" : isDark ? "bg-white/10" : "bg-gray-200"}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step Content ──────────────────────────────────── */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className={`
              absolute inset-0 transition-all duration-200
              ${transitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}
              ${transitionDir === "backward" && transitioning ? "-translate-x-4" : ""}
            `}
          >
            {/* ── Step 0: Agreements ──────────────────────── */}
            {step === 0 && (
              <div className="h-full flex flex-col">
                <div className="px-6 pt-6 pb-4 text-center">
                  <h3 className={`text-[15px] font-bold ${textPrimary} mb-1.5`}>
                    {t("register.agreementTitle")}
                  </h3>
                  <p className={`text-[12px] leading-relaxed ${textSecondary}`}>
                    {t("register.agreementDesc")}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">
                  {AGREEMENTS.map((doc) => {
                    const isRead = scrolledToEnd.has(doc.id);
                    const isAgreed = agreedIds.has(doc.id);
                    return (
                      <div
                        key={doc.id}
                        className={`
                          rounded-2xl border overflow-hidden
                          ${isAgreed ? "border-cyan-500/30 bg-cyan-500/5" : borderColor}
                        `}
                      >
                        {/* Doc header */}
                        <div
                          className={`flex items-center justify-between px-4 py-3 ${surfaceBg}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              name="description"
                              fontSize={16}
                              className="text-cyan-500"
                            />
                            <span className={`text-[13px] font-semibold ${textPrimary}`}>
                              {t(doc.titleKey)}
                            </span>
                            {doc.required && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-500 font-medium">
                                {t("register.required")}
                              </span>
                            )}
                          </div>
                          {isRead && doc.required && (
                            <button
                              onClick={() => toggleAgreement(doc.id)}
                              className={`
                                w-[42px] h-[24px] rounded-full relative transition-colors duration-200
                                ${isAgreed ? "bg-cyan-500" : isDark ? "bg-white/15" : "bg-gray-300"}
                              `}
                            >
                              <div
                                className={`
                                  absolute top-[2px] w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
                                  ${isAgreed ? "translate-x-[20px]" : "translate-x-[2px]"}
                                `}
                              />
                            </button>
                          )}
                          {isRead && !doc.required && (
                            <span className={`text-[10px] ${textTertiary}`}>
                              {t("register.optional")}
                            </span>
                          )}
                        </div>

                        {/* Doc body (scrollable) */}
                        <div
                          ref={(el) => {
                            if (el) scrollRefs.current.set(doc.id, el);
                          }}
                          onScroll={(e) => handleScroll(doc.id, e)}
                          className="max-h-[140px] overflow-y-auto px-4 py-3"
                        >
                          <p
                            className={`text-[12px] leading-[1.8] whitespace-pre-line ${textSecondary}`}
                          >
                            {doc.content}
                          </p>
                          {!isRead && (
                            <div
                              className={`
                                sticky bottom-0 h-8 flex items-center justify-center text-[10px] font-medium
                                bg-gradient-to-t ${isDark ? "from-gray-950" : "from-gray-50"} to-transparent
                                ${textTertiary}
                              `}
                            >
                              {t("register.scrollToRead")}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom action */}
                <div className={`shrink-0 px-6 py-4 border-t ${borderColor}`}>
                  <button
                    disabled={!allRequiredAgreed}
                    onClick={() => goToStep(1)}
                    className={`
                      w-full py-3 rounded-full text-[14px] font-bold tracking-wide
                      transition-all duration-200
                      ${
                        allRequiredAgreed
                          ? "bg-cyan-500 text-white shadow-[0_0_20px_rgba(57,197,187,0.3)] hover:shadow-[0_0_30px_rgba(57,197,187,0.5)] hover:bg-cyan-400 active:scale-[0.98]"
                          : `${isDark ? "bg-white/5 text-gray-600" : "bg-gray-100 text-gray-400"} cursor-not-allowed`
                      }
                    `}
                  >
                    {allRequiredAgreed
                      ? t("register.startButton")
                      : t("register.readAllRequired")}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 1: Fill Info ───────────────────────── */}
            {step === 1 && (
              <div className="h-full flex flex-col">
                <div className="px-6 pt-6 pb-4 text-center">
                  <h3 className={`text-[15px] font-bold ${textPrimary} mb-1.5`}>
                    {t("register.infoTitle")}
                  </h3>
                  <p className={`text-[12px] leading-relaxed ${textSecondary}`}>
                    {t("register.infoDesc")}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-[12px]">
                      <Icon name="error" fontSize={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Username */}
                  <M3TextField
                    label={t("auth.username")}
                    icon="person"
                    value={username}
                    onChange={setUsername}
                    placeholder="syskuku"
                    pattern="[A-Za-z0-9_]+"
                    required
                    isDark={isDark}
                    error={
                      username.length > 0 && username.length < 3
                        ? t("register.usernameTooShort")
                        : username.length > 0 && !/^[A-Za-z0-9_]+$/.test(username)
                          ? t("register.usernameInvalid")
                          : undefined
                    }
                  />

                  {/* Email */}
                  <M3TextField
                    label={t("auth.email")}
                    icon="mail"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="syskuku@asagity.net"
                    isDark={isDark}
                    hint={t("auth.emailHint")}
                  />

                  {/* Password */}
                  <M3TextField
                    label={t("auth.password")}
                    icon="key"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    isDark={isDark}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`p-1 rounded-full ${textTertiary} hover:${textSecondary}`}
                      >
                        <Icon name={showPassword ? "eye_off" : "eye"} fontSize={16} />
                      </button>
                    }
                    error={
                      password.length > 0 && password.length < 8
                        ? t("register.passwordTooShort")
                        : undefined
                    }
                  />

                  {/* Confirm Password */}
                  <M3TextField
                    label={t("auth.confirmPassword")}
                    icon="key"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="••••••••"
                    required
                    isDark={isDark}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`p-1 rounded-full ${textTertiary} hover:${textSecondary}`}
                      >
                        <Icon
                          name={showConfirmPassword ? "eye_off" : "eye"}
                          fontSize={16}
                        />
                      </button>
                    }
                    error={
                      confirmPassword.length > 0 && password !== confirmPassword
                        ? t("auth.passwordsMismatch")
                        : undefined
                    }
                  />
                </div>

                {/* Bottom actions */}
                <div className={`shrink-0 px-6 py-4 border-t ${borderColor} flex gap-3`}>
                  <button
                    onClick={() => goToStep(0)}
                    className={`
                      px-5 py-3 rounded-full text-[13px] font-medium border transition-all
                      ${borderColor} ${textSecondary} hover:${isDark ? "bg-white/5" : "bg-gray-100"}
                    `}
                  >
                    {t("common.back")}
                  </button>
                  <button
                    disabled={!isFormValid || loading}
                    onClick={handleSubmitInfo}
                    className={`
                      flex-1 py-3 rounded-full text-[14px] font-bold tracking-wide
                      transition-all duration-200 flex items-center justify-center gap-2
                      ${
                        isFormValid && !loading
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
                      t("register.joinButton")
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Email Verification ──────────────── */}
            {step === 2 && (
              <div className="h-full flex flex-col">
                <div className="px-6 pt-6 pb-4 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/15 flex items-center justify-center">
                    <Icon name="mail" fontSize={28} className="text-cyan-500" />
                  </div>
                  <h3 className={`text-[15px] font-bold ${textPrimary} mb-1.5`}>
                    {t("register.verifyTitle")}
                  </h3>
                  <p className={`text-[12px] leading-relaxed ${textSecondary}`}>
                    {t("register.verifyDesc")}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-[12px]">
                      <Icon name="error" fontSize={16} />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Verify code input */}
                  <M3TextField
                    label={t("register.verifyCode")}
                    icon="pin"
                    value={verifyCode}
                    onChange={(v) => setVerifyCode(v.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8))}
                    placeholder="Abc12345"
                    isDark={isDark}
                    maxLength={8}
                  />

                  {/* Resend */}
                  <button
                    onClick={() => setVerifySent(true)}
                    className={`text-[12px] font-medium ${verifySent ? textTertiary : "text-cyan-500 hover:text-cyan-400"}`}
                    disabled={verifySent}
                  >
                    {verifySent
                      ? t("register.codeSent")
                      : t("register.resendCode")}
                  </button>
                </div>

                {/* Bottom actions */}
                <div className={`shrink-0 px-6 py-4 border-t ${borderColor} flex gap-3`}>
                  <button
                    onClick={() => goToStep(1)}
                    className={`
                      px-5 py-3 rounded-full text-[13px] font-medium border transition-all
                      ${borderColor} ${textSecondary} hover:${isDark ? "bg-white/5" : "bg-gray-100"}
                    `}
                  >
                    {t("common.back")}
                  </button>
                  <button
                    disabled={verifyCode.length !== 8 || loading}
                    onClick={handleVerify}
                    className={`
                      flex-1 py-3 rounded-full text-[14px] font-bold tracking-wide
                      transition-all duration-200 flex items-center justify-center gap-2
                      ${
                        verifyCode.length === 8 && !loading
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
                      t("register.finishButton")
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── M3 Text Field ──────────────────────────────────────────────── */
function M3TextField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  minLength,
  pattern,
  isDark,
  error,
  hint,
  suffix,
  maxLength,
}: {
  label: string;
  icon: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  pattern?: string;
  isDark: boolean;
  error?: string;
  hint?: string;
  suffix?: React.ReactNode;
  maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const isFloating = focused || hasValue;

  return (
    <div className="relative">
      <div
        className={`
          relative rounded-2xl border transition-all duration-200
          ${
            error
              ? "border-red-500/50"
              : focused
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
            ${error ? "text-red-400" : focused ? "text-cyan-400" : isDark ? "text-gray-500" : "text-gray-400"}
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
              className={error ? "text-red-400" : focused ? "text-cyan-500" : isDark ? "text-gray-500" : "text-gray-400"}
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
            minLength={minLength}
            pattern={pattern}
            maxLength={maxLength}
            className={`
              w-full bg-transparent pt-5 pb-2 px-3 text-[14px] outline-none
              ${isDark ? "text-white" : "text-gray-900"}
              ${isDark ? "placeholder-gray-600" : "placeholder-gray-300"}
            `}
          />
          {suffix && <div className="pr-3">{suffix}</div>}
        </div>
      </div>

      {/* Error / Hint */}
      {(error || hint) && (
        <p
          className={`
            mt-1.5 ml-4 text-[11px]
            ${error ? "text-red-400" : isDark ? "text-gray-500" : "text-gray-400"}
          `}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
