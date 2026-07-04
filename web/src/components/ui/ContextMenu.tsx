"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useContextMenuStore } from "@/stores/contextMenu";
import { useSplitViewStore } from "@/stores/splitView";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

export function ContextMenu() {
  const { isOpen, x, y, type, data, menuKey, close } = useContextMenuStore();
  const splitViewStore = useSplitViewStore();
  const freeWindowStore = useFreeWindowStore();
  const router = useRouter();
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const handleClose = () => close();
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen) {
      setSelectedText(window.getSelection()?.toString().trim() || "");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const menuWidth = 220;
  const menuHeight = type === "post" ? 450 : 150;
  const left = Math.min(x, window.innerWidth - menuWidth - 10);
  const top = Math.min(y, window.innerHeight - menuHeight - 10);

  const handleAction = (action: () => void) => {
    action();
    close();
  };

  const copyContent = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const sharePage = () => {
    if (navigator.share) {
      navigator.share({ title: "Asagity", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const openFederated = (postData: { author?: { instance?: string; username?: string }; id?: string }) => {
    if (postData.author?.instance) {
      const url = `https://${postData.author.instance}/@${postData.author.username}/${postData.id}`;
      window.open(url, "_blank");
    }
  };

  const openExternal = (url: string) => {
    window.open(url, "_blank");
  };

  const openInternal = (path: string) => {
    router.push(path);
  };

  return createPortal(
    <div
      key={menuKey}
      ref={menuRef}
      className="fixed z-[9999] w-[220px] bg-white/70 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/20 dark:border-gray-800/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden p-1.5"
      style={{ left: `${left}px`, top: `${top}px` }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Text Selection Menu */}
      {selectedText && (
        <>
          <div className="flex flex-col gap-0.5">
            <MenuItem icon="content_copy" label={t("contextMenu.copy")} bold onClick={() => handleAction(() => copyContent(selectedText))} />
            <MenuItem icon="share" label={t("contextMenu.shareSelectedText")} onClick={() => handleAction(() => {
              if (navigator.share && selectedText) {
                navigator.share({ text: selectedText });
              } else {
                copyContent(selectedText);
              }
            })} />
          </div>
          <Divider />
        </>
      )}

      {/* Post Menu */}
      {type === "post" && (
        <>
          <div className="flex flex-col gap-0.5">
            <MenuItem icon="visibility" label={t("contextMenu.details")} bold onClick={() => handleAction(() => {
              const postData = data as { id: string; author: unknown; content: string; metrics: unknown; createdAt: string };
              splitViewStore.openPost(postData as Parameters<typeof splitViewStore.openPost>[0]);
            })} />
            <MenuItem icon="content_copy" label={t("contextMenu.copyContent")} onClick={() => handleAction(() => {
              const postData = data as { content: string };
              copyContent(postData.content);
            })} />
            {(data as { author?: { instance?: string } })?.author?.instance && (
              <MenuItem icon="language" label={t("contextMenu.openFederated")} onClick={() => handleAction(() => openFederated(data as { author?: { instance?: string; username?: string }; id?: string }))} />
            )}
          </div>
          <Divider />
          <div className="flex flex-col gap-0.5">
            <MenuItem icon="share" label={t("contextMenu.share")} onClick={() => handleAction(() => {})} />
            <MenuItem icon="favorite" label={t("contextMenu.bookmark")} onClick={() => handleAction(() => {})} />
          </div>
          <Divider />
          <div className="flex flex-col gap-0.5">
            <MenuItem icon="tag" label={t("contextMenu.addToTopic")} onClick={() => handleAction(() => {})} />
            <MenuItem icon="block" label={t("contextMenu.muteThread")} danger={false} onClick={() => handleAction(() => {})} />
          </div>
          <Divider />
          <div className="flex flex-col gap-0.5">
            <MenuItem icon="delete" label={t("common.delete")} danger onClick={() => handleAction(() => {})} />
            <MenuItem icon="flag" label={t("contextMenu.report")} danger onClick={() => handleAction(() => {})} />
            <MenuItem icon="fingerprint" label={t("contextMenu.copyPubID")} onClick={() => handleAction(() => {
              const postData = data as { author?: { pubid?: string } };
              copyContent(postData.author?.pubid || "asgt_unknown");
            })} />
          </div>
        </>
      )}

      {/* User Menu */}
      {type === "user" && (
        <div className="flex flex-col gap-0.5">
          <MenuItem icon="person" label={t("contextMenu.viewProfile")} onClick={close} />
          <MenuItem icon="content_copy" label={t("contextMenu.copyPubID")} onClick={close} />
        </div>
      )}

      {/* Internal Link Menu */}
      {type === "link_internal" && (
        <>
          <div className="px-3 py-2 mb-1 flex flex-col gap-0.5 overflow-hidden">
            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest opacity-60">{t("contextMenu.internalPath")}</span>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate">
              {(data as { path?: string })?.path}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <MenuItem icon="open_in_new" label={t("contextMenu.open")} bold onClick={() => handleAction(() => openInternal((data as { path?: string })?.path || "/"))} />
            <MenuItem icon="link" label={t("contextMenu.copyLink")} onClick={() => handleAction(() => copyContent((data as { href?: string })?.href || ""))} />
            <MenuItem icon="refresh" label={t("common.refresh")} onClick={() => handleAction(() => window.location.reload())} />
            <MenuItem icon="ios_share" label={t("contextMenu.shareThisPage")} onClick={() => handleAction(sharePage)} />
          </div>
          <Divider />
          <div className="flex flex-col gap-0.5">
            <MenuItem icon="vertical_split" label={t("contextMenu.openInSplitView")} onClick={() => handleAction(() => splitViewStore.openBrowser((data as { href?: string })?.href || ""))} />
            <MenuItem icon="open_in_new" label={t("contextMenu.openInFreeWindow")} onClick={() => handleAction(() => freeWindowStore.openBrowser((data as { href?: string })?.href || ""))} />
          </div>
        </>
      )}

      {/* External Link Menu */}
      {type === "link_external" && (
        <>
          <div className="px-3 py-2 mb-1 flex flex-col gap-0.5 overflow-hidden">
            <span className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest opacity-60">
              {(data as { title?: string })?.title}
            </span>
            <span className="text-[9px] font-bold text-gray-400 truncate">
              {(data as { url?: string })?.url}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <MenuItem icon="open_in_new" label={t("contextMenu.openInNewTab")} bold onClick={() => handleAction(() => openExternal((data as { url?: string })?.url || ""))} />
            <MenuItem icon="laptop_mac" label={t("contextMenu.openInInternalBrowser")} onClick={() => handleAction(() => splitViewStore.openBrowser((data as { url?: string })?.url || ""))} />
            <MenuItem icon="vertical_split" label={t("contextMenu.openInSplitView")} onClick={() => handleAction(() => splitViewStore.openBrowser((data as { url?: string })?.url || ""))} />
            <MenuItem icon="open_in_new" label={t("contextMenu.openInFreeWindow")} onClick={() => handleAction(() => freeWindowStore.openBrowser((data as { url?: string })?.url || ""))} />
          </div>
          <Divider />
          <div className="flex flex-col gap-0.5">
            <MenuItem icon="link" label={t("contextMenu.copyLink")} onClick={() => handleAction(() => copyContent((data as { url?: string })?.url || ""))} />
            <MenuItem icon="ios_share" label={t("contextMenu.shareLink")} onClick={() => handleAction(() => {})} />
          </div>
        </>
      )}

      {/* Global Menu */}
      {type === "global" && (
        <div className="flex flex-col gap-0.5">
          <MenuItem icon="refresh" label={t("common.refresh")} onClick={() => handleAction(() => window.location.reload())} />
          <MenuItem icon="open_in_new" label={t("contextMenu.openInFreeWindow")} onClick={() => handleAction(() => freeWindowStore.openFromContext("post", { post: data as null }, {}))} />
          <MenuItem icon="ios_share" label={t("contextMenu.sharePage")} onClick={() => handleAction(sharePage)} />
        </div>
      )}
    </div>,
    document.body
  );
}

function MenuItem({
  icon,
  label,
  bold,
  danger,
  onClick,
}: {
  icon: string;
  label: string;
  bold?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
        danger
          ? "text-red-600 dark:text-red-400 hover:bg-red-500/10"
          : bold
            ? "text-cyan-600 dark:text-cyan-400 font-bold hover:bg-cyan-500/10"
            : "text-gray-700 dark:text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
      }`}
    >
      <Icon name={icon} className="opacity-70" fontSize={16} />
      <span>{label}</span>
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-gray-200/50 dark:bg-gray-800/50 my-1.5 mx-2" />;
}
