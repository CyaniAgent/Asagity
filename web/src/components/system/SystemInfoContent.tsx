"use client";

import { useEffect, useMemo, useState } from "react";
import { version as reactVersion } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useInstanceStore, DEFAULT_VERSION } from "@/stores/instance";
import { useSystemStore } from "@/stores/system";
import { useI18n } from "@/components/providers/I18nProvider";
import { toApiNetPath } from "@/lib/backend";
import { fetchGithubList, GITHUB_ORG, GITHUB_ORG_URL, type GithubPerson } from "@/lib/shellGithub";
import { Icon } from "@/components/ui/Icon";

/**
 * Glacier Spec-Sheet（冰川规格书）— 系统信息窗口的视觉方向
 * editorial × technical：Banner 是冰河照片 + 季度指纹 + build 文案（单一焦点），
 * 信息栏是印刷规格表（mono 标签行 + 终端行），组织者是平铺 featured 行 + 头像堆。
 * 铁律：无巨型装饰数字、无辉光、无渐变、无嵌套卡；颜色/字阶/圆角走赛季令牌；
 * 动效只有一条主线：三段 stagger 入场（--ease-standard），reduced-motion 全跳过。
 */

/** 统一入场缓动：赛季 fast motion 常量 cubic-bezier(.2,.8,.2,1)（design-tokens §4）。 */
const EASE: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

/** 异步数据三态 — 缺数据一律 "—"（诚实 doctrine）。 */
type LoadState<T> =
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "error" };

interface SystemInfoContentProps {
  /** 窗口刷新钮 → 重新拉取全部数据（WindowManager 每次 refresh 递增） */
  refreshKey?: number;
}

/** 板块标题：13px/600 字重、常规字距，与全站小节标签同款（§9.3 F004）。 */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-semibold text-fgdim">
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
    <div className="flex items-baseline justify-between gap-4 py-3 border-b border-line/60 last:border-b-0">
      <span className="font-mono text-[12px] text-fgdim shrink-0">
        {label}
      </span>
      <span className="text-[14px] font-medium text-fg tabular-nums text-right min-w-0 truncate">
        {value}
      </span>
    </div>
  );
}

/**
 * 终端运行时行：状态点 + mono 名称/值 — 印刷规格表质感。
 * ok=brand 点、loading=脉冲点、error=暗点 + "—"；状态含义由值文本承载。
 * 点无辉光（F002），行用 hairline 分隔而非嵌套卡（F006）。
 */
function RuntimeRow({ name, state }: { name: string; state: LoadState<string> }) {
  const { t } = useI18n();
  const dot =
    state.status === "ok"
      ? "bg-brand"
      : state.status === "loading"
        ? "bg-fg/40 animate-pulse"
        : "bg-fg/20";

  return (
    <div className="flex items-center gap-2 py-2 border-b border-line/60 last:border-b-0">
      <span aria-hidden className={`h-2 w-2 rounded-full shrink-0 ${dot}`} />
      <span className="font-mono text-[12px] text-fgdim/90 w-10 shrink-0">{name}</span>
      <span className="ml-auto font-mono text-[12px] tabular-nums text-right min-w-0">
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
        <div key={i} className="h-11 rounded-lg bg-fg/[0.04] animate-pulse" />
      ))}
    </div>
  );
}

/**
 * SystemInfoContent — 系统信息（自由窗口 viewType: system_info）
 *
 * 板块结构（自上而下，Glacier Spec-Sheet）：
 * 1. Asagity        Hero Banner：冰河照片 + token 化磨砂文案带（build 文案 +
 *                   赛季代号），单一焦点；左下 brand 锚点短划线无辉光
 * 2. Asagity 信息    规格表：mono 标签行 + Go/.NET 终端行（hairline 分隔，缺数据 "—"）
 * 3. 项目组织者      平铺组织行（48px 头像 + brand ring + open_in_new）
 *                   + 重叠头像堆 + 成员计数（成员列表空/失败时组织行仍兜底）
 *                   无内容的「特别鸣谢」不渲染
 *
 * 数据通道全部走 shell 网关 / 双后端 meta（见 lib/shellGithub.ts 缓存策略）；
 * 窗口刷新钮 → refreshKey 变化 → 全量重拉。
 */
export function SystemInfoContent({ refreshKey = 0 }: SystemInfoContentProps) {
  const { t } = useI18n();
  const version = useInstanceStore((s) => s.version);
  const isFrontendOnlyMode = useSystemStore((s) => s.isFrontendOnlyMode);

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
            <img
              src="/images/background/setupwizard-bg.jpg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* 左下角：token 化磨砂文案带（bg-sheet/80 随明暗解析），build 文案是唯一焦点；
                brand 短划线无辉光（F002），字号/字距归档位（F004） */}
            <div className="absolute left-6 bottom-5 flex items-start gap-3 rounded-lg bg-sheet/80 px-4 py-3 text-fg backdrop-blur-glasslight">
              <span
                aria-hidden
                className="mt-2 h-6 w-1 shrink-0 rounded-full bg-brand"
              />
              <div>
                <div className="text-[20px] font-semibold">
                  {version || DEFAULT_VERSION}
                </div>
                {season && (
                  <div className="font-mono text-[12px] text-fgdim">
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
          <div className="mt-1 rounded-2xl border border-line bg-sheet/70 px-4 py-2">
            <SpecRow label={t("sysinfo.runMode")} value={runMode} />
            <SpecRow label={t("sysinfo.reactVersion")} value={`React ${reactVersion}`} />
            {/* 服务端版本：Go / .NET 终端行（状态呼吸灯），各自独立状态 */}
            <div className="py-3 border-t border-line/60">
              <span className="font-mono text-[12px] text-fgdim">
                {t("sysinfo.serverVersion")}
              </span>
              <div className="mt-2 flex flex-col gap-2">
                <RuntimeRow name="Go" state={goRuntime} />
                <RuntimeRow name=".NET" state={netRuntime} />
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── ③ 项目组织者 · 平铺组织行 + 头像堆（无嵌套卡） ── */}
      <Reveal delay={0.12}>
        <section className="flex flex-col gap-2">
          <SectionTitle>{t("sysinfo.organizers")}</SectionTitle>
          {members.status === "loading" ? (
            <PeopleSkeleton />
          ) : (
            <div className="mt-1 rounded-2xl border border-line bg-sheet/70 p-3">
              {/* 组织行恒在：成员列表空/失败时仍是事实兜底；平铺无第二层卡片 */}
              <a
                href={GITHUB_ORG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-fg/5 transition-colors"
              >
                <img
                  src={`https://github.com/${GITHUB_ORG}.png`}
                  alt=""
                  loading="lazy"
                  className="w-12 h-12 rounded-full object-cover bg-fg/5 ring-2 ring-brand/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-fg truncate">{GITHUB_ORG}</div>
                  <div className="text-[12px] text-fgdim truncate">{t("sysinfo.organization")}</div>
                </div>
                <Icon
                  name="open_in_new"
                  fontSize={16}
                  className="text-fgdim group-hover:text-fgaccent transition-colors shrink-0"
                />
              </a>
              {/* 成员重叠头像堆 + 计数（最多展示 8 位） */}
              {memberItems.length > 0 && (
                <div className="flex items-center gap-3 px-1 pb-2">
                  <div className="flex -space-x-2">
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
                          className="w-8 h-8 rounded-full object-cover bg-fg/5 ring-2 ring-plate hover:z-10 hover:relative"
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
    </div>
  );
}
