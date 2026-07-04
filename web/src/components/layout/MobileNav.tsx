"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

const mobileNavItems = [
  { icon: "home", to: "/" },
  { icon: "tag", to: "/topic" },
  { icon: "bookmark", to: "/bookmarks" },
  { icon: "cloud", to: "/drive" },
  { icon: "chat", to: "/chat" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/5 px-4 py-2 safe-area-bottom">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const isActive = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.icon}
              href={item.to}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${
                isActive ? "text-cyan-600 dark:text-cyan-400" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <Icon name={item.icon} fontSize={24} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
