"use client";

import { useWidgetsStore } from "@/stores/widgets";
import { useI18n } from "@/components/providers/I18nProvider";

/** 便签：多行文本，正文按组件 id 持久化 */
export function MemoWidget({ id }: { id: string }) {
  const { t } = useI18n();
  const text = useWidgetsStore((s) => s.items.find((w) => w.id === id)?.data?.text ?? "");
  const updateWidgetData = useWidgetsStore((s) => s.updateWidgetData);

  return (
    <textarea
      value={text}
      onChange={(e) => updateWidgetData(id, { text: e.target.value })}
      placeholder={t("widgets.memoPlaceholder")}
      rows={4}
      className="w-full resize-none bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none leading-relaxed"
    />
  );
}
