"use client";

import { useEffect, useRef, useState } from "react";
import { useWidgetsStore, type WidgetType } from "@/stores/widgets";
import { WidgetShell } from "./WidgetShell";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

/** 可添加的组件目录（下拉菜单内容，后续由 widget registry 驱动） */
const CATALOG: { type: WidgetType; icon: string; titleKey: string }[] = [
  { type: "clock", icon: "clock_alarm", titleKey: "widgets.clock" },
  { type: "memo", icon: "edit", titleKey: "widgets.memo" },
];

/**
 * 右侧小组件区：上组件展示（滚动）+ 下编辑栏。
 * 默认一颗「编辑组件」；编辑态切换为「添加组件（下拉）」+「保存」。
 */
export function WidgetsArea() {
  const { t } = useI18n();
  const items = useWidgetsStore((s) => s.items);
  const isEditing = useWidgetsStore((s) => s.isEditing);
  const setEditing = useWidgetsStore((s) => s.setEditing);
  const addWidget = useWidgetsStore((s) => s.addWidget);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!catalogOpen) return;
    const handler = (e: MouseEvent) => {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) {
        setCatalogOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [catalogOpen ]);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* 上：组件展示区 */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
        {items.map((item, i) => (
          <WidgetShell
            key={item.id}
            item={item}
            isFirst={i === 0}
            isLast={i === items.length - 1}
          />
        ))}
      </div>

      {/* 下：编辑栏 */}
      <div className="shrink-0 p-3 pt-2">
        {!isEditing ? (
          <button
            onClick={() => setEditing(true)}
            className="w-full py-2.5 px-4 rounded-2xl text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-gray-200/50 dark:border-gray-700/50 transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="settings" fontSize={16} />
            {t("widgets.editWidgets")}
          </button>
        ) : (
          <div className="flex gap-2">
            {/* 添加组件（下拉） */}
            <div ref={catalogRef} className="relative flex-1">
              <button
                onClick={() => setCatalogOpen((v) => !v)}
                className="w-full py-2.5 px-4 rounded-2xl text-[13px] font-semibold text-white bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-[0_0_16px_rgba(57,197,187,0.3)] hover:shadow-[0_0_24px_rgba(57,197,187,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Icon name="add" fontSize={16} />
                {t("widgets.addWidget")}
              </button>
              {catalogOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl py-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden">
                  {CATALOG.map((c) => (
                    <button
                      key={c.type}
                      onClick={() => {
                        addWidget(c.type);
                        setCatalogOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <Icon name={c.icon} fontSize={18} className="text-cyan-500" />
                      <span className="flex-1 text-left">{t(c.titleKey)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* 保存 */}
            <button
              onClick={() => {
                setEditing(false);
                setCatalogOpen(false);
              }}
              className="flex-1 py-2.5 px-4 rounded-2xl text-[13px] font-medium text-gray-600 dark:text-gray-300 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-gray-200/50 dark:border-gray-700/50 transition-colors flex items-center justify-center gap-2"
            >
              <Icon name="check_circle" fontSize={16} />
              {t("widgets.save")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
