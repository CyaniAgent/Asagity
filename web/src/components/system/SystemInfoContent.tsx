"use client";

import { useEffect, useMemo, useState } from "react";
import { version as reactVersion } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { useInstanceStore, DEFAULT_VERSION } from "@/stores/instance";
import { useSystemStore } from "@/stores/system";
import { useI18n } from "@/components/providers/I18nProvider";
import { toApiNetPath } from "@/lib/backend";
import { GITHUB_ORG } from "@/lib/shellGithub";

/**
 * Glacier Spec-Sheet（冰川规格书）— 系统信息窗口的视觉方向
 * editorial × technical：Banner 是冰河照片，版本文案直接落在照片上（无容器包裹，
 * 暗色投影保可读、禁右键/拖拽），下方是印刷规格表与分组列表。
 * 铁律：无巨型装饰数字、无辉光、无渐变、无嵌套卡；颜色/字阶/圆角走赛季令牌；
 * 布局与文本走 Astryx Card/Grid/HStack/VStack/Text/MetadataList（§9 F009），
 * 仅装饰点与 Banner 图片保留原生元素。动效为三段 stagger，reduced-motion 全跳过。
 */

/** 统一入场缓动：赛季 fast motion 常量 cubic-bezier(.2,.8,.2,1)（design-tokens §4）。 */
const EASE: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

/** 项目组织者：固定 4 条（组织 + 3 位用户），头像与显示名均取 GitHub。 */
const ORGANIZERS = [GITHUB_ORG, "AyaxYuna", "SakuraCake", "shenwenbo2009"] as const;

/** 异步数据三态 — 缺数据一律 "—"（诚实 doctrine）。 */
type LoadState<T> =
  | { status: "loading" }
  | { status: "ok"; data: T }
  | { status: "error" };

interface SystemInfoContentProps {
  /** 窗口刷新钮 → 重新拉取全部数据（WindowManager 每次 refresh 递增） */
  refreshKey?: number;
}

/** 板块标题：Astryx Text label role（14px/600）+ secondary 色，语义仍是 h2。 */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text as="h2" type="label" weight="semibold" color="secondary">
      {children}
    </Text>
  );
}

/**
 * 分段入场包装：y:12→0 + fade，280ms，延迟按段递增（0 / 60 / 120ms）。
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

/** 规格表行：Astryx MetadataListItem（dt/dd 语义 + 统一分隔），值统一右对齐。 */
function SpecRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <MetadataListItem label={label}>
      <VStack gap={0} className="w-full items-end">
        <Text as="span" type="label" weight="medium" className={valueClass}>
          {value}
        </Text>
      </VStack>
    </MetadataListItem>
  );
}

/**
 * 服务端运行时行：Astryx MetadataListItem，自身 label 命名自己的值（官方 best practice）。
 * 状态点走 MetadataListItem.icon（颜色 + 值文本双通道），数据值 Quicksand。
 */
function RuntimeRow({ name, state }: { name: string; state: LoadState<string> }) {
  const { t } = useI18n();
  const dotClass =
    state.status === "ok"
      ? "bg-brand"
      : state.status === "loading"
        ? "bg-fg/40 animate-pulse"
        : "bg-fg/20";

  return (
    <MetadataListItem
      label={name}
      icon={<span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />}
    >
      <VStack gap={0} className="w-full items-end">
        {state.status === "loading" ? (
          <Text as="span" type="label" color="secondary" className="animate-pulse opacity-60">
            {t("sysinfo.loading")}
          </Text>
        ) : state.status === "error" ? (
          <Text as="span" type="label" color="secondary" hasTabularNumbers className="font-quicksand">—</Text>
        ) : (
          <Text as="span" type="label" hasTabularNumbers className="font-quicksand">{state.data}</Text>
        )}
      </VStack>
    </MetadataListItem>
  );
}

/**
 * SystemInfoContent — 系统信息（自由窗口 viewType: system_info）
 *
 * 板块结构（自上而下，Glacier Spec-Sheet）：
 * 1. Asagity        Hero Banner：冰河照片 + 直接落图的版本文案 / 赛季代号
 *                   （无容器、无磨砂带、无 brand 竖条；暗色投影保可读、禁右键）
 * 2. Asagity 信息    规格表：Astryx Text 行 + Divider + Go/.NET 终端行（缺数据 "—"）
 * 3. 项目组织者      固定 4 条（组织 + 3 位用户）透明 Grid，头像 + GitHub 显示名；
 *                   默认 2×2，随窗口宽度按 minWidth 自动重排
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

    // 运行时：Go 引擎与 .NET API 各自独立探测 — 不做镜像回退，
    // 一方缺席即 "—"（避免拿 .NET 的值冒充 Go）。
    // .NET 镜像路径经 toApiNetPath 派生（/api/meta/version → /api-net/meta/version），
    // 别硬编码 "/api-net/api/..." —— vite 重写后会变成双 api 前缀而 404。
    setGoRuntime({ status: "loading" });
    setNetRuntime({ status: "loading" });
    loadRuntime("/api/meta/version", setGoRuntime);
    loadRuntime(toApiNetPath("/api/meta/version") ?? "/api-net/meta/version", setNetRuntime);

    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const runMode = isFrontendOnlyMode
    ? t("sysinfo.modeFrontendOnly")
    : import.meta.env.DEV
      ? t("sysinfo.modeDev")
      : t("sysinfo.modeProd");

  return (
    <VStack gap={5} className="min-h-full p-4">
      {/* ── ① Asagity · 冰河照片英雄区（版本文案直接融入背景，无容器/无 BUILD 数字） ── */}
      <Reveal delay={0}>
        <div
          className="relative h-[300px] overflow-hidden rounded-2xl border border-line select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          <img
            src="/images/background/setupwizard-bg.jpg"
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          {/* 无卡片/磨砂带：白字 + 暗色投影直接落在冰河照片上；右键与拖拽禁用 */}
          <HStack gap={0} align="start" className="absolute left-6 bottom-5 text-white on-photo-ink">
            <VStack gap={0}>
              <Text as="span" size="xl" weight="semibold" hasTabularNumbers className="text-white">
                {version || DEFAULT_VERSION}
              </Text>
              {season && (
                <Text as="span" type="supporting" className="text-white/90">{season}</Text>
              )}
            </VStack>
          </HStack>
        </div>
      </Reveal>

      {/* ── ② Asagity 信息 · 规格表 ── */}
      <Reveal delay={0.06}>
        <VStack gap={2}>
          <SectionTitle>{t("sysinfo.info")}</SectionTitle>
          <Card padding={2} className="mt-1 rounded-2xl px-4">
            <VStack gap={2}>
              <MetadataList columns={1} label={{ position: "start", width: 112 }}>
                <SpecRow label={t("sysinfo.runMode")} value={runMode} />
                <SpecRow label={t("sysinfo.reactVersion")} value={`React ${reactVersion}`} valueClass="font-quicksand" />
              </MetadataList>
              <MetadataList
                columns={1}
                label={{ position: "start", width: 112 }}
                title={
                  <Text as="h3" type="label" weight="semibold" color="secondary">
                    {t("sysinfo.serverVersion")}
                  </Text>
                }
              >
                <RuntimeRow name="Go" state={goRuntime} />
                <RuntimeRow name=".NET" state={netRuntime} />
              </MetadataList>
            </VStack>
          </Card>
        </VStack>
      </Reveal>

      {/* ── ③ 项目组织者 · 平铺组织行 + 头像堆（无嵌套卡） ── */}
      <Reveal delay={0.12}>
        <VStack gap={2}>
          <SectionTitle>{t("sysinfo.organizers")}</SectionTitle>
          {/* 固定 4 条：透明背景、逐条显示；Grid 按容器宽度自动重排（默认 2×2） */}
          <Grid columns={{ minWidth: 280, max: 4, repeat: "fit" }} gap={3} className="mt-1">
            {ORGANIZERS.map((login) => (
              <a
                key={login}
                href={`https://github.com/${login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-fg/5 transition-colors"
              >
                <Avatar
                  name={login}
                  src={`https://github.com/${login}.png?size=80`}
                  size={40}
                  shape="circle"
                  tooltip={false}
                />
                <Text
                  as="span"
                  type="label"
                  weight="medium"
                  className="min-w-0 truncate group-hover:text-fgaccent transition-colors"
                >
                  {login}
                </Text>
              </a>
            ))}
          </Grid>
        </VStack>
      </Reveal>

      {/* ── 页脚：固定文案 + 底部留白（自由窗口滚到底仍有呼吸空间） ── */}
      <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-1 pb-8 text-center">
        <Text as="span" type="supporting" color="secondary">2026 Asagity Developer by </Text>
        <Text as="span" type="supporting" color="secondary">
          <a
            href="https://github.com/CyaniAgent"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fgaccent hover:underline"
          >
            CyaniAgent
          </a>
        </Text>
        <Text as="span" type="supporting" color="secondary"> and contributors. Licensed by </Text>
        <Text as="span" type="supporting" color="secondary">
          <a
            href="https://github.com/CyaniAgent/Asagity/blob/Dev/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fgaccent hover:underline"
          >
            MIT
          </a>
        </Text>
      </footer>
    </VStack>
  );
}
