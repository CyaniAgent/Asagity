"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";
import {
  useTermitySessionsStore,
  MAX_TERMITY_SESSIONS,
} from "@/stores/termitySessions";

/**
 * Termity Session 选择器。
 *
 * 出现在 Termity 自由窗口的标题栏（替代原 "Termity" 字样）：
 * 按钮显示当前会话名，点击展开下拉：切换 / 新建 / 重命名 / 关闭。
 *
 * 下拉用 portal 渲染 —— 标题栏容器是 `overflow-hidden`，直接内嵌会被裁掉。
 */
export function TermitySessionSelector() {
  const { t } = useI18n();
  const order = useTermitySessionsStore((s) => s.order);
  const sessions = useTermitySessionsStore((s) => s.sessions);
  const activeId = useTermitySessionsStore((s) => s.activeId);
  const switchSession = useTermitySessionsStore((s) => s.switchSession);
  const createSession = useTermitySessionsStore((s) => s.createSession);
  const closeSession = useTermitySessionsStore((s) => s.closeSession);
  const renameSession = useTermitySessionsStore((s) => s.renameSession);

  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);

  const active = sessions[activeId];

  // 定位下拉（portal + fixed 坐标）
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setAnchor({ left: rect.left, top: rect.bottom + 6 });
  }, [open]);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
      setRenaming(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", () => setOpen(false));
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const startRename = (id: string) => {
    setRenaming(id);
    setRenameValue(sessions[id]?.name ?? "");
  };

  const commitRename = () => {
    if (renaming && renameValue.trim()) renameSession(renaming, renameValue);
    setRenaming(null);
  };

  const menu = (
    <div
      ref={menuRef}
      className="fixed z-[100050] w-56 rounded-2xl py-1.5
        bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl
        border border-white/20 dark:border-gray-700/50
        shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
      style={{ left: anchor?.left ?? 0, top: anchor?.top ?? 0 }}
      role="menu"
      aria-label={t("termity.sessionSelector")}
    >
      {order.map((id) => {
        const s = sessions[id];
        if (!s) return null;
        const isActive = id === activeId;
        const isRenaming = renaming === id;
        const canClose = order.length > 1;

        return (
          <div key={id} className="flex items-center gap-1 px-1.5">
            {isRenaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setRenaming(null);
                }}
                onBlur={commitRename}
                className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-[12px]
                  bg-gray-100 dark:bg-gray-800 border border-cyan-500/50
                  text-gray-900 dark:text-white outline-none"
              />
            ) : (
              <button
                onClick={() => {
                  switchSession(id);
                  setOpen(false);
                }}
                className={`flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-[12px] transition-colors ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                role="menuitem"
              >
                <Icon name="terminal" fontSize={13} className="shrink-0" />
                <span className="truncate">{s.name}</span>
                {isActive && <Icon name="check_circle" fontSize={13} className="ml-auto shrink-0" />}
              </button>
            )}

            {!isRenaming && (
              <button
                onClick={() => {
                  if (!canClose) return;
                  closeSession(id);
                }}
                disabled={!canClose}
                title={canClose ? t("termity.sessionClose") : t("termity.sessionKeepOne")}
                className="p-1 rounded-md shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
              >
                <Icon name="close" fontSize={13} />
              </button>
            )}
          </div>
        );
      })}

      <div className="my-1 mx-2 h-px bg-gray-200 dark:bg-gray-700" />

      <button
        onClick={() => {
          createSession();
          setOpen(false);
        }}
        disabled={order.length >= MAX_TERMITY_SESSIONS}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-[12px]
          text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5
          transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
        role="menuitem"
      >
        <Icon name="add" fontSize={13} className="shrink-0" />
        {t("termity.sessionNew")}
      </button>

      <button
        onClick={() => startRename(activeId)}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-[12px]
          text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        role="menuitem"
      >
        <Icon name="edit" fontSize={13} className="shrink-0" />
        {t("termity.sessionRename")}
      </button>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        title={t("termity.sessionSelector")}
        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md
          text-[13px] text-gray-800 dark:text-white
          hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <Icon name="terminal" className="text-cyan-600 dark:text-cyan-400 shrink-0" fontSize={16} />
        <span className="truncate tracking-wide">{active?.name ?? t("termity.sessionSelector")}</span>
        <Icon name="arrow_drop_down" fontSize={14} className="shrink-0 opacity-60" />
      </button>

      {open && typeof document !== "undefined" &&
        createPortal(menu, document.body)}
    </>
  );
}
