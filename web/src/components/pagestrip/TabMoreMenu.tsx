"use client";

import { useState } from "react";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Popover } from "@astryxdesign/core/Popover";
import { Text } from "@astryxdesign/core/Text";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import { usePageStripStore, type PageTab, type WidthPreset } from "@/stores/pageStrip";

const PRESETS: WidthPreset[] = ["1/3", "1/2", "2/3", "fixed"];

interface TabMoreMenuProps {
  tab: PageTab;
  onPopOut: () => void;
}

export function TabMoreMenu({ tab, onPopOut }: TabMoreMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const setWidth = usePageStripStore((s) => s.setWidth);
  const setAutoWidth = usePageStripStore((s) => s.setAutoWidth);
  const back = usePageStripStore((s) => s.back);
  const forward = usePageStripStore((s) => s.forward);

  const canBack = tab.history.index > 0;
  const canForward = tab.history.index < tab.history.stack.length - 1;

  const item =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-fg hover:bg-fg/5 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

  return (
    <Popover
      label={t("tabbar.more")}
      placement="below"
      width={240}
      isOpen={open}
      onOpenChange={setOpen}
      content={
        <div className="p-2">
          <div className="px-3 pb-1 pt-1 text-[12px] font-semibold text-fgdim">{t("tabbar.widthSettings")}</div>
          <div className="flex gap-1 px-2 pb-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={tab.width === preset}
                onClick={() => setWidth(tab.id, preset, preset === "fixed" ? 480 : undefined)}
                className={`flex-1 rounded-lg border border-line px-2 py-1 text-[12px] transition-colors ${
                  tab.width === preset ? "bg-brand/10 text-fgaccent" : "text-fgdim hover:bg-fg/5"
                }`}
              >
                {preset === "fixed" ? t("tabbar.widthSettings") : t(`tabbar.${preset === "1/3" ? "narrow" : preset === "1/2" ? "medium" : "wide"}`)}
              </button>
            ))}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={tab.autoWidth}
            onClick={() => setAutoWidth(tab.id, !tab.autoWidth)}
            className={item}
          >
            <Icon name="move_horizontal" fontSize={16} className="text-fgdim" />
            <Text as="span" type="label">{t("tabbar.autoWidth")}</Text>
            <span
              aria-hidden
              className={`ml-auto h-4 w-7 rounded-full p-0.5 transition-colors ${tab.autoWidth ? "bg-brand" : "bg-fg/20"}`}
            >
              <span className={`block h-3 w-3 rounded-full bg-sheet transition-transform ${tab.autoWidth ? "translate-x-3" : ""}`} />
            </span>
          </button>
          <div className="my-1 h-px bg-line" />
          <button type="button" disabled={!canBack} onClick={() => { back(tab.id); setOpen(false); }} className={item}>
            <Icon name="arrow_left" fontSize={16} className="text-fgdim" />
            <Text as="span" type="label">{t("tabbar.back")}</Text>
          </button>
          <button type="button" disabled={!canForward} onClick={() => { forward(tab.id); setOpen(false); }} className={item}>
            <Icon name="arrow_right_16" fontSize={16} className="text-fgdim" />
            <Text as="span" type="label">{t("tabbar.forward")}</Text>
          </button>
          <button type="button" onClick={() => { onPopOut(); setOpen(false); }} className={item}>
            <Icon name="open_in_new" fontSize={16} className="text-fgdim" />
            <Text as="span" type="label">{t("tabbar.popOut")}</Text>
          </button>
          <button type="button" disabled className={item} title={t("taskbar.comingSoon")}>
            <Icon name="settings" fontSize={16} className="text-fgdim" />
            <Text as="span" type="label">{t("tabbar.endTask")}</Text>
          </button>
        </div>
      }
    >
      <IconButton
        variant="ghost"
        size="sm"
        icon={<Icon name="menu" fontSize={16} />}
        label={t("tabbar.more")}
      />
    </Popover>
  );
}
