"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

interface MoreMenuPopoverProps {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

function useMoreMenuGroups() {
  const { t } = useI18n();
  return [
    {
      label: t("moreMenu.tools"),
      items: [
        { label: t("moreMenu.favorites"), icon: "star", to: "/bookmarks" },
        { label: t("moreMenu.miniApp"), icon: "widgets", to: "/miniapp" },
        { label: t("moreMenu.qrCode"), icon: "qr_code", to: "/qrcode" },
        { label: t("moreMenu.miniGames"), icon: "sports_esports", to: "/games" },
      ],
    },
    {
      label: t("moreMenu.media"),
      items: [
        { label: t("moreMenu.albums"), icon: "photo_library", to: "/albums" },
        { label: t("moreMenu.achievements"), icon: "military_tech", to: "/achievements" },
      ],
    },
    {
      label: t("moreMenu.system"),
      items: [
        { label: t("moreMenu.developer"), icon: "terminal", to: "/developer" },
        { label: t("moreMenu.about"), icon: "help_outline", to: "/about" },
      ],
    },
  ];
}

export function MoreMenuPopover({ open, onClose, triggerRef }: MoreMenuPopoverProps) {
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const moreMenuGroups = useMoreMenuGroups();

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.top,
      left: rect.right + 8,
    });
  }, [triggerRef]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose, triggerRef]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95, x: -8 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: -8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed z-50 w-64 bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-800 shadow-2xl shadow-black/10 p-3"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {moreMenuGroups.map((group, groupIndex) => (
            <div key={group.label}>
              {groupIndex > 0 && (
                <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />
              )}
              <div className="px-2 py-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                  {group.label}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {group.items.map((item) => (
                  <button
                    key={item.to}
                    onClick={() => {
                      router.push(item.to);
                      onClose();
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-cyan-500/10 group-hover:scale-110 transition-all">
                      <Icon name={item.icon} className="text-gray-500 group-hover:text-cyan-500 transition-colors" fontSize={20} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
