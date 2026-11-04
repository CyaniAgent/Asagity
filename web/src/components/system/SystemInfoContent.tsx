"use client";

import { useEffect, useMemo, useState } from "react";
import { version as reactVersion } from "react";
import { useInstanceStore } from "@/stores/instance";
import { useSystemStore } from "@/stores/system";
import { useI18n } from "@/components/providers/I18nProvider";
import { toApiNetPath } from "@/lib/backend";
import { fetchGithubList, GITHUB_ORG, GITHUB_ORG_URL, type GithubPerson } from "@/lib/shellGithub";

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
    <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-fgdim">
      {children}
    </h2>
  );
}

/** 信息行：左标签右值，竖列逐行，行间分隔线。 */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-line/60 last:border-b-0">
      <span className="text-[13px] text-fgdim shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-fg tabular-nums text-right min-w-0 truncate">
        {value}
      </span>
    </div>
  );
}

/** 服务端版本值槽：loading→文案、ok→值、error→"—"。 */
function RuntimeValue({ state }: { state: LoadState<string> }) {
  const { t } = useI18n();
  if (state.status === "loading") {
    return <span className="text-[12px] text-fgdim/60 animate-pulse">{t("sysinfo.loading")}</span>;
  }
  if (state.status === "error") {
    return <span className="text-[13px] font-medium text-fgdim">—</span>;
  }
  return <span className="text-[13px] font-medium text-fg tabular-nums">{state.data}</span>;
}

/** 人物卡（组织者 / 贡献者共用）：头像 + 登录名 + 可选贡献数徽章。 */
function PersonCard({ person, badge }: { person: GithubPerson; badge?: string }) {
  const { t } = useI18n();
  return (
    <a
      href={person.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-line bg-sheet/70 px-3 py-2.5
        hover:bg-fg/5 transition-colors min-w-0"
    >
      <img
        src={person.avatar_url}
        alt=""
        loading="lazy"
        className="w-9 h-9 rounded-full bg-fg/5 object-cover shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-fg truncate">{person.login}</div>
        {badge && <div className="text-[10px] text-fgdim truncate">{badge}</div>}
      </div>
      {person.contributions != null && (
        <span className="shrink-0 rounded-full bg-brand/10 text-fgaccent px-2 py-0.5 text-[11px] font-semibold tabular-nums">
          {person.contributions.toLocaleString()} {t("sysinfo.contribUnit")}
        </span>
      )}
    </a>
  );
}

/** 板块加载骨架（三块脉冲卡）。 */
function PeopleSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[54px] rounded-xl border border-line bg-fg/[0.03] animate-pulse" />
      ))}
    </div>
  );
}

/**
 * SystemInfoContent — 系统信息（自由窗口 viewType: system_info）
 *
 * 板块结构（自上而下）：
 * 1. Asagity        版本主题 Banner（setupwizard-bg.jpg 约 700×300，左下角
 *                   版本号 HarmonyOS Sans、赛季代号 Quicksand Medium —— CSS 变量读取，多主题安全）
 * 2. Asagity 信息    竖列：运行模式 / React 版本 / 服务端版本（Go 与 .NET 运行时，
 *                   各自独立探测，缺数据 "—"）
 * 3. 项目组织者      shell 网关 → /github/org-members（组织卡恒在首位兜底）
 * 4. 贡献者          shell 网关 → /github/contributors（贡献数徽章）
 * 5. 特别鸣谢        占位符
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
  const [contributors, setContributors] = useState<LoadState<GithubPerson[]>>({ status: "loading" });

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

    const loadPeople = async (
      kind: "org-members" | "contributors",
      set: (s: LoadState<GithubPerson[]>) => void,
    ) => {
      set({ status: "loading" });
      try {
        const items = await fetchGithubList(kind);
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
    loadPeople("org-members", setMembers);
    loadPeople("contributors", setContributors);

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
  const contributorItems = contributors.status === "ok" ? contributors.data : [];

  return (
    <div className="min-h-full p-4 flex flex-col gap-5">
      {/* ── ① Asagity · 版本主题 Banner ── */}
      <section className="flex flex-col gap-2">
        <SectionTitle>Asagity</SectionTitle>
        <div className="relative h-[300px] rounded-2xl overflow-hidden border border-line">
          <img
            src="/images/background/setupwizard-bg.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* 底部压暗：白字在亮色冰川天空上可读 */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
          />
          {/* 左下角：版本号 HarmonyOS Sans 常规渲染，代号 Quicksand Medium ——
              @font-face 的 ascent-override 已把行盒钉到 cap→基线，两行紧贴不留空隙 */}
          <div className="absolute left-6 bottom-5 text-white drop-shadow-md">
            <div className="text-[26px] leading-tight font-semibold tracking-wide">
              {version || "Ver. Dev"}
            </div>
            {season && (
              <div className="font-quicksand text-[14px] font-medium tracking-[0.18em] opacity-90">
                {season}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── ② Asagity 信息 · 竖列 ── */}
      <section className="flex flex-col gap-2">
        <SectionTitle>{t("sysinfo.info")}</SectionTitle>
        <div className="mt-1 rounded-2xl border border-line bg-sheet/70 px-4 py-0.5">
          <InfoRow label={t("sysinfo.runMode")} value={runMode} />
          <InfoRow label={t("sysinfo.reactVersion")} value={`React ${reactVersion}`} />
          {/* 服务端版本：Go / .NET 两行子槽，各自独立状态 */}
          <div className="py-2.5 border-b border-line/60">
            <div className="text-[13px] text-fgdim">{t("sysinfo.serverVersion")}</div>
            <div className="mt-1.5 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] font-mono text-fgdim/80">Go</span>
                <RuntimeValue state={goRuntime} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] font-mono text-fgdim/80">.NET</span>
                <RuntimeValue state={netRuntime} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ③ 项目组织者 ── */}
      <section className="flex flex-col gap-2">
        <SectionTitle>{t("sysinfo.organizers")}</SectionTitle>
        {members.status === "loading" ? (
          <PeopleSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {/* 组织卡恒在首位：成员列表空/失败时仍是事实兜底 */}
            <PersonCard
              person={{
                login: GITHUB_ORG,
                avatar_url: `https://github.com/${GITHUB_ORG}.png`,
                html_url: GITHUB_ORG_URL,
              }}
              badge={t("sysinfo.organization")}
            />
            {memberItems.map((m) => (
              <PersonCard key={m.login} person={m} />
            ))}
          </div>
        )}
      </section>

      {/* ── ④ 贡献者 ── */}
      <section className="flex flex-col gap-2">
        <SectionTitle>{t("sysinfo.contributors")}</SectionTitle>
        {contributors.status === "loading" ? (
          <PeopleSkeleton />
        ) : contributorItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {contributorItems.map((c) => (
              <PersonCard key={c.login} person={c} />
            ))}
          </div>
        ) : (
          <div className="mt-1 rounded-xl border border-line bg-fg/[0.03] py-6 text-center text-[13px] text-fgdim">
            —
          </div>
        )}
      </section>

      {/* ── ⑤ 特别鸣谢 · 占位 ── */}
      <section className="flex flex-col gap-2">
        <SectionTitle>{t("sysinfo.specialThanks")}</SectionTitle>
        <div className="mt-1 rounded-2xl border border-dashed border-line px-4 py-7 text-center text-[12px] text-fgdim">
          {t("sysinfo.thanksPlaceholder")}
        </div>
      </section>
    </div>
  );
}
