"use client";

import { useEffect, useRef } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import { usePageStripStore } from "@/stores/pageStrip";
import { PageTabView } from "./PageTabView";

const RATIOS = { "1/3": 0.3333, "1/2": 0.5, "2/3": 0.6667 } as const;

/** niri 式横向条带：列内 tab 纵向排列，新 tab 追加不重排已有列。 */
export function PageStrip() {
  const { t } = useI18n();
  const columns = usePageStripStore((s) => s.columns);
  const activeTabId = usePageStripStore((s) => s.activeTabId);
  const openTab = usePageStripStore((s) => s.openTab);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeTabId) return;
    const el = scrollerRef.current?.querySelector(`[data-tab-id="${activeTabId}"]`);
    el?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [activeTabId]);

  return (
    <div ref={scrollerRef} data-testid="page-strip" className="h-full w-full overflow-x-auto overflow-y-hidden p-4 custom-scrollbar">
      <div className="flex h-full min-w-min gap-4">
        {columns.map((column) => {
          const sizing = column.tabs.find((tab) => tab.id === column.activeTabId) ?? column.tabs[0];
          const ratio = sizing ? RATIOS[sizing.width === "fixed" ? "1/3" : sizing.width] : RATIOS["1/3"];
          const style = sizing?.autoWidth
            ? { minWidth: `calc((100vw - 64px) * ${ratio})`, flex: "1 1 0" as const }
            : { width: `${sizing?.fixedWidth ?? 480}px`, flex: "0 0 auto" as const };
          return (
            <div key={column.id} style={style} className="flex h-full min-w-0 flex-col gap-4">
              {column.tabs.map((tab) => (
                <PageTabView key={tab.id} tab={tab} isActive={tab.id === activeTabId} />
              ))}
            </div>
          );
        })}

        {columns.length === 0 && (
          <Card padding={4} className="flex h-full flex-1 items-center justify-center">
            <div className="text-center">
              <Icon name="dashboard" fontSize={32} className="mx-auto mb-3 text-fgaccent" />
              <Text as="p" type="label" weight="semibold">{t("tabs.home")}</Text>
              <button
                type="button"
                onClick={() => openTab({ appId: "home", icon: "home", titleKey: "tabs.home", view: { kind: "route", refId: "/" } })}
                className="mt-4 rounded-lg border border-line px-4 py-2 text-[13px] text-fg hover:bg-fg/5 transition-colors"
              >
                {t("tabs.home")}
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
