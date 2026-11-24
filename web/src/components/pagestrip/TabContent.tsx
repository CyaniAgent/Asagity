"use client";

import { Suspense } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { allRoutes } from "@/lib/routes";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import { renderContent } from "@/components/windows/WindowManager";
import { useTermitySessionsStore } from "@/stores/termitySessions";
import type { PageTab } from "@/stores/pageStrip";

function Fallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  );
}

/**
 * Tab 内容区：路由 tab 直接渲染对应页面组件；window/split tab 复用 FreeWindow 的内容渲染器，
 * 因此「作为标签页打开」后看到的仍是原窗口内容，而不是占位提示。
 */
export function TabContent({ tab, refreshKey }: { tab: PageTab; refreshKey: number }) {
  const { t } = useI18n();
  const sessionId = useTermitySessionsStore((s) => s.activeId);
  const ref = tab.history.stack[tab.history.index] ?? "";
  const basePath = ref.split("?")[0];

  if (tab.view.kind === "window" || tab.view.kind === "split") {
    return (
      <div className="h-full overflow-auto">
        {renderContent(
          tab.view.refId,
          refreshKey,
          tab.view.browserUrl,
          tab.id,
          tab.view.refId === "termity" ? sessionId : undefined,
        )}
      </div>
    );
  }

  if (basePath !== "/") {
    const route = allRoutes.find((r) => r.path === basePath);
    if (route) {
      const Page = route.component;
      return (
        <Suspense fallback={<Fallback />}>
          <Page key={`${tab.id}-${refreshKey}-${ref}`} />
        </Suspense>
      );
    }
  }

  const title = tab.titleKey ? t(tab.titleKey) : tab.title ?? ref;

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card variant="transparent" padding={4} className="max-w-sm text-center">
        <Icon name={tab.icon} fontSize={32} className="mx-auto mb-3 text-fgaccent" />
        <Text as="h3" type="label" weight="semibold">{title}</Text>
        <Text as="p" type="supporting" color="secondary" className="mt-2">{t("taskbar.comingSoon")}</Text>
      </Card>
    </div>
  );
}
