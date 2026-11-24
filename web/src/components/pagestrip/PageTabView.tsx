"use client";

import { useRef, useState } from "react";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Text } from "@astryxdesign/core/Text";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { usePageStripStore, type PageTab } from "@/stores/pageStrip";
import type { ViewType } from "@/types/windows";
import { TabContent } from "./TabContent";
import { TabMoreMenu } from "./TabMoreMenu";

export function PageTabView({ tab, isActive }: { tab: PageTab; isActive: boolean }) {
  const { t } = useI18n();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const activateTab = usePageStripStore((s) => s.activateTab);
  const toggleMinimize = usePageStripStore((s) => s.toggleMinimize);
  const closeTab = usePageStripStore((s) => s.closeTab);
  const flashTabId = usePageStripStore((s) => s.flashTabId);
  const openFromContext = useFreeWindowStore((s) => s.openFromContext);

  const title = tab.titleKey ? t(tab.titleKey) : tab.title ?? "";
  const flashed = flashTabId === tab.id;

  const popOut = () => {
    if (tab.view.kind === "route") {
      const url = new URL(tab.view.refId, window.location.origin).href;
      openFromContext("browser", { browserUrl: url });
    } else {
      openFromContext(tab.view.refId as ViewType);
    }
    closeTab(tab.id);
  };

  const scrollTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bodyRef.current?.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section
      data-tab-id={tab.id}
      onPointerDown={() => activateTab(tab.id)}
      aria-label={title}
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-sheet/90 ${
        isActive ? "ring-1 ring-brand" : ""
      } ${flashed ? "ring-2 ring-brand" : ""}`}
    >
      {/* ── 顶栏：左 color bar + app 图标 + 名称；右 更多/刷新/最小化/关闭 ── */}
      <header
        onClick={scrollTop}
        className="flex h-10 shrink-0 items-center gap-2 border-b border-line bg-sheet/80 px-3"
      >
        <span aria-hidden className="h-4 w-1 shrink-0 rounded-full bg-brand" />
        <Icon name={tab.icon} fontSize={18} className="text-fgaccent shrink-0" />
        <Text as="span" type="label" weight="semibold" className="min-w-0 truncate">{title}</Text>
        <div className="ml-auto flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <TabMoreMenu tab={tab} onPopOut={popOut} />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Icon name="refresh" fontSize={14} />}
            label={t("common.refresh")}
            onClick={() => setRefreshKey((k) => k + 1)}
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Icon name="minimize" fontSize={14} />}
            label={t("common.minimize")}
            onClick={() => toggleMinimize(tab.id)}
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Icon name="close" fontSize={14} />}
            label={t("common.close")}
            className="text-bad hover:bg-bad/10"
            onClick={() => closeTab(tab.id)}
          />
        </div>
      </header>

      {/* ── 内容区：最小化后只保留顶栏（Misskey 非活跃列语义） ── */}
      {!tab.minimized && (
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <TabContent tab={tab} refreshKey={refreshKey} />
        </div>
      )}
    </section>
  );
}
