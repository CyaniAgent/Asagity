"use client";

import { useEffect, useRef, useState } from "react";
import { ClientLink as Link } from "@/components/ui/ClientLink";
import { useRouter } from "@/hooks/useRouter";
import { useUserStore } from "@/stores/user";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

/** 用户头像 + 下拉（主页 / 设置 / 退出，搬运自旧 MainLayout） */
export function UserAvatar() {
  const { t } = useI18n();
  const router = useRouter();
  const userAvatar = useUserStore((s) => s.avatar);
  const username = useUserStore((s) => s.username);
  const userName = useUserStore((s) => s.user?.name);
  const logout = useUserStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open ]);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => (username ? router.push(`/user/${username}`) : setOpen(!open))}
        className="size-8 rounded-full overflow-hidden ring-2 ring-brand/50 hover:ring-brand transition-all cursor-pointer shrink-0 grid place-items-center"
      >
        {userAvatar ? (
          <img src={userAvatar} width={32} height={32} className="w-full h-full object-cover" alt="Avatar" />
        ) : (
          <div className="w-full h-full bg-brand/20 flex items-center justify-center">
            <Icon name="person" className="text-fgaccent" fontSize={16} />
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-[100] w-72 bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl shadow-black/20 p-4 animate-[fadeInUp_0.15s_ease-out]">
          <div
            className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200/50 dark:border-gray-800/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl transition-colors"
            onClick={() => {
              router.push(`/user/${username}`);
              setOpen(false);
            }}
          >
            <img src={userAvatar} width={40} height={40} className="w-10 h-10 rounded-full object-cover" alt="Avatar" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{userName}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">@{username}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Link
              href="/settings/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-brand/10 transition-colors"
            >
              <Icon name="settings" fontSize={16} />
              {t("header.settings")}
            </Link>
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Icon name="close" fontSize={16} />
              {t("header.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
