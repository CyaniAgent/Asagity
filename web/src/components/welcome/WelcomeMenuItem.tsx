"use client";

import { Icon } from "@/components/ui/Icon";

interface WelcomeMenuItemProps {
  icon: string;
  label: string;
  isDark: boolean;
  itemCls: string;
  onClick: () => void;
  small?: boolean;
  comingSoon?: boolean;
  comingSoonLabel?: string;
}

/** Pure presentational row — all data/behavior comes from config + dispatcher. */
export function WelcomeMenuItem({
  icon,
  label,
  isDark,
  itemCls,
  onClick,
  small,
  comingSoon,
  comingSoonLabel,
}: WelcomeMenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={comingSoon}
      className={`w-full flex items-center gap-3 px-4 ${small ? "py-2" : "py-2.5"} text-[13px] font-medium transition-colors
        ${comingSoon ? "opacity-50 cursor-not-allowed" : ""} ${itemCls}`}
    >
      <Icon
        name={icon}
        fontSize={small ? 15 : 18}
        className={isDark ? "text-white/50" : "text-gray-400"}
      />
      <span className="flex-1 text-left">{label}</span>
      {comingSoon && comingSoonLabel && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
            ${isDark ? "bg-white/10 text-white/40" : "bg-gray-200 text-gray-500"}`}
        >
          {comingSoonLabel}
        </span>
      )}
    </button>
  );
}
