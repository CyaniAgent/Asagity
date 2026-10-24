"use client";

import { ClientLink as Link } from "@/components/ui/ClientLink";
import { useInstanceStore } from "@/stores/instance";

/** 左侧品牌区：站点 logo + 站点名称（数据来自 instance store） */
export function BrandBlock() {
  const logoURL = useInstanceStore((s) => s.logoURL);
  const name = useInstanceStore((s) => s.name);
  const alias = useInstanceStore((s) => s.alias);

  return (
    <Link href="/about" className="flex items-center gap-2.5 shrink-0 group cursor-pointer">
      <img
        src={logoURL}
        width={32}
        height={32}
        className="w-8 h-8 rounded-xl object-cover group-hover:scale-105 transition-transform"
        alt={name}
      />
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-bold text-gray-900 dark:text-white truncate max-w-40">
          {name}
        </span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-40">
          {alias}
        </span>
      </div>
    </Link>
  );
}
