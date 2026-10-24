"use client";

import { useWidgetsStore, type WidgetItem } from "@/stores/widgets";
import { ClockWidget } from "./ClockWidget";
import { MemoWidget } from "./MemoWidget";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

/** 组件卡片壳：标题行 + 内容 + 编辑态手柄（删除/上移/下移） */
export function WidgetShell({ item, isFirst, isLast }: { item: WidgetItem; isFirst: boolean; isLast: boolean }) {
  const { t } = useI18n();
  const isEditing = useWidgetsStore((s) => s.isEditing);
  const removeWidget = useWidgetsStore((s) => s.removeWidget);
  const moveWidget = useWidgetsStore((s) => s.moveWidget);

  const title = item.type === "clock" ? t("widgets.clock") : t("widgets.memo");
  const icon = item.type === "clock" ? "clock_alarm" : "edit";

  return (
    <section className="rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
      {/* 标题行 */}
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <Icon name={icon} fontSize={16} className="text-fgaccent shrink-0" />
        <span className="flex-1 text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate">
          {title}
        </span>
        {isEditing && (
          <span className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => moveWidget(item.id, -1)}
              disabled={isFirst}
              className="size-7 grid place-items-center rounded-full text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title={t("widgets.moveUp")}
            >
              <Icon name="arrow_left" fontSize={14} className="rotate-90" />
            </button>
            <button
              onClick={() => moveWidget(item.id, 1)}
              disabled={isLast}
              className="size-7 grid place-items-center rounded-full text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title={t("widgets.moveDown")}
            >
              <Icon name="arrow_left" fontSize={14} className="-rotate-90" />
            </button>
            <button
              onClick={() => removeWidget(item.id)}
              className="size-7 grid place-items-center rounded-full text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
              title={t("widgets.delete")}
            >
              <Icon name="close" fontSize={14} />
            </button>
          </span>
        )}
      </div>

      {/* 内容 */}
      <div className="px-3.5 pb-3.5">
        {item.type === "clock" ? <ClockWidget /> : <MemoWidget id={item.id} />}
      </div>
    </section>
  );
}
