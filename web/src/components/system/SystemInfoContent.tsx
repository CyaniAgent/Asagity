"use client";

import { useEffect, useMemo, useState } from "react";
import { version as reactVersion } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useInstanceStore, DEFAULT_VERSION } from "@/stores/instance";
import { useSystemStore } from "@/stores/system";
import { useI18n } from "@/components/providers/I18nProvider";
import { toApiNetPath } from "@/lib/backend";
import { fetchGithubList, GITHUB_ORG, GITHUB_ORG_URL, type GithubPerson } from "@/lib/shellGithub";
import { getBuildVersion } from "@/lib/version";
import { Icon } from "@/components/ui/Icon";

/**
 * Glacier Spec-Sheet（冰川规格书）— 系统信息窗口的视觉方向
 * editorial × technical：Banner 是 Hero（巨型 Build 数字 = 数据即装饰），
 * 信息栏是印刷规格表（mono 终端行 + 状态呼吸灯），组织者是 featured 卡 +
 * 重叠头像堆（消灭对称网格），贡献者是比例贡献榜，鸣谢是有意的空状态。
 * 动效只有一条主线：五段 stagger 入场 + 贡献条 0→真实宽度，reduced-motion 全跳过。
 */

/** 统一入场缓动（expo-out 家族）— 五段共用，动效不散乱。 */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** 异步数据三态 — 缺数据一律 "—"（诚实 doctrine）。 */
type LoadState<T> =
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "error" };

interface SystemInfoContentProps {
  /** 窗口刷新钮 → 重新拉取全部数据（WindowManager 每次 refresh 递增） */
  refreshKey?: number;
}

/** 板块标题：与全站小节标签同款（大写 + 宽字距 + fgdim）。 */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-black tracking-[0.14em] text-fgdim">
      {children}
    </h2>
  );
}

/**
 * 分段入场包装：y:12→0 + fade，280ms，延迟按段递增（0 / 60 / 120 / 180 / 240ms）。
 * prefers-reduced-motion 时退化为静态 section（语义不变）。
 */
function Reveal({
  delay = 0,
  children,
}: {
  delay?: number;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <section>{children}</section>;
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE, delay }}
    >
      {children}
    </motion.section>
  );
}

/** 规格表行：mono 小号大写标签 + 右对齐值，行间 hairline 分隔。 */
function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-line/60 last:border-b-0">
      <span className="font-mono text-[11px] tracking-[0.1em] text-fgdim shrink-0">
        {label}
      </span>
      <span className="text-[13px] font-medium text-fg tabular-nums text-right min-w-0 truncate">
        {value}
      </span>
    </div>
  );
}

/**
 * 终端运行时行：状态呼吸灯 + mono 名称/值 — 印刷规格表质感。
 * ok=brand 绿点（带辉光）、loading=脉冲灰点、error=暗点 + "—"。
 * 状态含义由值文本承载（loading 文案 / "—" / 真值），点为纯视觉冗余。
 */
function RuntimeRow({ name, state }: { name: string; state: LoadState<string> }) {
  const { t } = useI18n();
  const dot =
    state.status === "ok"
      ? "bg-brand shadow-[0_0_6px_var(--color-accent)]"
      : state.status === "loading"
        ? "bg-fg/40 animate-pulse"
        : "bg-fg/20";

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-line/50 bg-fg/[0.03] px-3 py-2">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
      <span className="font-mono text-[12px] text-fgdim/90 w-10 shrink-0">{name}</span>
      <span className="ml-auto font-mono text-[12.5px] tabular-nums text-right min-w-0">
        {state.status === "loading" ? (
          <span className="text-fgdim/60 animate-pulse">{t("sysinfo.loading")}</span>
        ) : state.status === "error" ? (
          <span className="text-fgdim">—</span>
        ) : (
          <span className="text-fg">{state.data}</span>
        )}
      </span>
    </div>
  );
}

/** 板块加载骨架（与目标卡形一致的圆角面板 + 脉冲行）。 */
function PeopleSkeleton() {
  return (
    <div className="mt-1 rounded-2xl border border-line bg-sheet/70 p-3 flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-11 rounded-xl bg-fg/[0.04] animate-pulse" />
      ))}
    </div>
  );
}

/**
 * SystemInfoContent — 系统信息（自由窗口 viewType: system_info）
 *
 * 板块结构（自上而下，Glacier Spec-Sheet）：
 * 1. Asagity        Hero Banner：右上 periwinkle 光晕、右下巨型 Build 数字
 *                   （package.json 三键值，数据即装饰）、左下 2px brand 锚点
 *                   短划线 + 版本号（HarmonyOS Sans）/ 赛季代号（Quicksand Medium）
 * 2. Asagity 信息    规格表：mono 标签行 + Go/.NET 终端行（状态呼吸灯，缺数据 "—"）
 * 3. 项目组织者      featured 组织大卡（48px 头像 + brand ring + open_in_new）
 *                   + 重叠头像堆 + 成员计数（成员列表空/失败时组织卡仍兜底）
 * 4. 特别鸣谢        渐变空状态（periwinkle+brand color-mix + 一次性 shimmer）
 *
 * 数据通道全部走 shell 网关 / 双后端 meta（见 lib/shellGithub.ts 缓存策略）；
 * 窗口刷新钮 → refreshKey 变化 → 全量重拉。
 */
export function SystemInfoContent({ refreshKey = 0 }: SystemInfoContentProps) {
  const { t } = useI18n();
  const version = useInstanceStore((s) => s.version);
  const isFrontendOnlyMode = useSystemStore((s) => s.isFrontendOnlyMode);
  const reduce = useReducedMotion();

  // package.json 三键值拆解（不可解析如季度制 stable tag → null → 隐藏装饰数字）
  const build = useMemo(() => getBuildVersion(), []);

  // 赛季代号：直读主题 CSS 变量（--season-codename / --season-period），
  // 主题热切换后重开窗口即为新值；变量缺失则隐藏第二行。
  const season = useMemo(() => {
    try {
      const cs = getComputedStyle(document.documentElement);
      const codename = cs.getPropertyValue("--season-codename").trim();
      const period = cs.getPropertyValue("--season-period").trim();
      return [codename, period].filter(Boolean).join(" · ");
    } catch {
      return "";
    }
  }, []);

  const [goRuntime, setGoRuntime] = useState<LoadState<string>>({ status: "loading" });
  const [netRuntime, setNetRuntime] = useState<LoadState<string>>({ status: "loading" });
  const [members, setMembers] = useState<LoadState<GithubPerson[]>>({ status: "loading" });

  useEffect(() => {
    let alive = true;

    const loadRuntime = async (url: string, set: (s: LoadState<string>) => void) => {
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(5000),
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { data?: { runtime?: string } };
        const runtime = json?.data?.runtime;
        if (alive) set(runtime ? { status: "ok", data: runtime } : { status: "error" });
      } catch {
        if (alive) set({ status: "error" });
      }
    };

    const loadMembers = async (set: (s: LoadState<GithubPerson[]>) => void) => {
      set({ status: "loading" });
      try {
        const items = await fetchGithubList("org-members");
        if (alive) set({ status: "ok", data: items });
      } catch {
        if (alive) set({ status: "error" });
      }
    };

    // 运行时：Go 引擎与 .NET API 各自独立探测 — 不做镜像回退，
    // 一方缺席即 "—"（避免拿 .NET 的值冒充 Go）。
    // .NET 镜像路径经 toApiNetPath 派生（/api/meta/version → /api-net/meta/version），
    // 别硬编码 "/api-net/api/..." —— vite 重写后会变成双 api 前缀而 404。
    setGoRuntime({ status: "loading" });
    setNetRuntime({ status: "loading" });
    loadRuntime("/api/meta/version", setGoRuntime);
    loadRuntime(toApiNetPath("/api/meta/version") ?? "/api-net/meta/version", setNetRuntime);
    loadMembers(setMembers);

    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const runMode = isFrontendOnlyMode
    ? t("sysinfo.modeFrontendOnly")
    : import.meta.env.DEV
      ? t("sysinfo.modeDev")
      : t("sysinfo.modeProd");

  const memberItems = members.status === "ok" ? members.data : [];

  return (
    <div className="min-h-full p-4 flex flex-col gap-5">
      {/* ── ① Asagity · Hero Banner ── */}
      <Reveal delay={0}>
        <section className="flex flex-col gap-2">
          <SectionTitle>Asagity</SectionTitle>
          <div className="relative h-[300px] rounded-2xl overflow-hidden border border-line">
            <motion.img
              src="/images/background/setupwizard-bg.jpg"
              alt=""
              initial={reduce ? false : { scale: 1.04 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.9, ease: EASE }}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* 右上角：season-periwinkle 柔光晕（双色变量按模式解析，color-mix 安全） */}
            <div
              aria-hidden
              className="absolute -top-24 -right-20 h-72 w-72 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, color-mix(in srgb, var(--season-periwinkle) 75%, transparent), transparent)",
              }}
            />
            {/* 底部压暗：白字在亮色冰川天空上可读 */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
            />
            {/* 右下角：巨型 Build 数字（package.json 三键值）— 出血裁切，数据即装饰 */}
            {build && (
              <div
                aria-hidden
                className="absolute -bottom-7 right-3 font-quicksand font-light text-[150px] leading-none tabular-nums text-white/25 select-none drop-shadow-[0_2px_18px_rgba(0,0,0,0.4)]"
              >
                {build.commitsTotal}
              </div>
            )}
            {/* 左下角：2px brand 锚点短划线 + 版本号（HarmonyOS Sans）/ 代号（Quicksand Medium）—
                @font-face 的 ascent-override 已把行盒钉到 cap→基线，两行紧贴不留空隙 */}
            <div className="absolute left-6 bottom-5 flex items-start gap-3 text-white drop-shadow-md">
              <span
                aria-hidden
                className="mt-[7px] h-[24px] w-[2px] shrink-0 rounded-full bg-brand shadow-[0_0_8px_var(--color-accent)]"
              />
              <div>
                <div className="text-[26px] leading-tight font-semibold tracking-wide">
                  {version || DEFAULT_VERSION}
                </div>
                {season && (
                  <div className="font-quicksand text-[14px] font-medium tracking-[0.18em] opacity-90">
                    {season}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── ② Asagity 信息 · 规格表 ── */}
      <Reveal delay={0.06}>
        <section className="flex flex-col gap-2">
          <SectionTitle>{t("sysinfo.info")}</SectionTitle>
          <div className="mt-1 rounded-2xl border border-line bg-sheet/70 px-4 py-0.5">
            <SpecRow label={t("sysinfo.runMode")} value={runMode} />
            <SpecRow label={t("sysinfo.reactVersion")} value={`React ${reactVersion}`} />
            {/* 服务端版本：Go / .NET 终端行（状态呼吸灯），各自独立状态 */}
            <div className="py-3 border-t border-line/60">
              <span className="font-mono text-[11px] tracking-[0.1em] text-fgdim">
                {t("sysinfo.serverVersion")}
              </span>
              <div className="mt-2 flex flex-col gap-1.5">
                <RuntimeRow name="Go" state={goRuntime} />
                <RuntimeRow name=".NET" state={netRuntime} />
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── ③ 项目组织者 · featured 卡 + 头像堆 ── */}
      <Reveal delay={0.12}>
        <section className="flex flex-col gap-2">
          <SectionTitle>{t("sysinfo.organizers")}</SectionTitle>
          {members.status === "loading" ? (
            <PeopleSkeleton />
          ) : (
            <div className="mt-1 rounded-2xl border border-line bg-sheet/70 p-3 flex flex-col gap-3">
              {/* 组织 featured 卡恒在：成员列表空/失败时仍是事实兜底 */}
              <a
                href={GITHUB_ORG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3.5 rounded-xl border border-line/60 bg-fg/[0.04] px-3.5 py-3
                  hover:border-brand/40 hover:bg-fg/[0.07] transition-colors"
              >
                <img
                  src={`https://github.com/${GITHUB_ORG}.png`}
                  alt=""
                  loading="lazy"
                  className="w-12 h-12 rounded-full object-cover bg-fg/5 ring-2 ring-brand/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold text-fg truncate">{GITHUB_ORG}</div>
                  <div className="text-[11px] text-fgdim truncate">{t("sysinfo.organization")}</div>
                </div>
                <Icon
                  name="open_in_new"
                  fontSize={16}
                  className="text-fgdim group-hover:text-fgaccent transition-colors shrink-0"
                />
              </a>
              {/* 成员重叠头像堆 + 计数（最多展示 8 位） */}
              {memberItems.length > 0 && (
                <div className="flex items-center gap-3 px-1 pb-0.5">
                  <div className="flex -space-x-2.5">
                    {memberItems.slice(0, 8).map((m) => (
                      <a
                        key={m.login}
                        href={m.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={m.login}
                      >
                        <img
                          src={m.avatar_url}
                          alt={m.login}
                          loading="lazy"
                          className="w-8 h-8 rounded-full object-cover bg-fg/5 ring-2 ring-[var(--background)] hover:z-10 hover:relative transition-transform hover:scale-110"
                        />
                      </a>
                    ))}
                  </div>
                  <span className="text-[12px] text-fgdim tabular-nums">
                    {t("sysinfo.memberCount", { count: memberItems.length })}
                  </span>
                </div>
              )}
            </div>
          )}
        </section>
      </Reveal>

      {/* ── ④ 特别鸣谢 · 有意的空状态 ── */}
      <Reveal delay={0.18}>
        <section className="flex flex-col gap-2">
          <SectionTitle>{t("sysinfo.specialThanks")}</SectionTitle>
          <div
            className="relative mt-1 overflow-hidden rounded-2xl border border-line px-4 py-7 text-center"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--season-periwinkle) 9%, transparent), color-mix(in srgb, var(--color-accent) 6%, transparent))",
            }}
          >
            {/* 一次性微光扫过（shimmer sweep，reduced-motion 跳过） */}
            {!reduce && (
              <motion.span
                aria-hidden
                className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                style={{ transform: "skewX(-16deg)" }}
                initial={{ x: 0 }}
                animate={{ x: "450%" }}
                transition={{ duration: 1.2, ease: EASE, delay: 0.55 }}
              />
            )}
            <Icon
              name="military_tech"
              fontSize={22}
              className="relative mx-auto mb-2 text-fgdim"
            />
            <div className="relative text-[12.5px] text-fgdim">
              {t("sysinfo.thanksPlaceholder")}
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
