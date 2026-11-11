"use client";

import { Icon } from "@/components/ui/Icon";

interface WelcomeMenuItemProps {
  icon: string;
  label: string;
  itemCls: string;
  onClick: () => void;
  small?: boolean;
  comingSoon?: boolean;
}

/**
 * Pure presentational menu row — data/behavior from config + dispatcher.
 * role="menuitem" 烤入（本组件唯一用途即为手搓菜单）；色值走语义令牌，明暗自动。
 * comingSoon 只留禁用态（opacity + aria-disabled），不渲染装饰徽章（铁律 4）。
 */
export function WelcomeMenuItem({
  icon,
  label,
  itemCls,
  onClick,
  small,
  comingSoon,
}: WelcomeMenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      aria-disabled={comingSoon || undefined}
      onClick={onClick}
      disabled={comingSoon}
      className={`w-full flex items-center gap-3 px-4 ${small ? "py-2" : "py-3"} text-[13px] font-medium
        transition-colors focus:outline-none focus-visible:bg-fg/10 hover:bg-fg/5
        ${comingSoon ? "opacity-50 cursor-not-allowed" : ""} ${itemCls}`}
    >
      <Icon name={icon} fontSize={small ? 15 : 18} className="text-fgdim opacity-80" />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}
