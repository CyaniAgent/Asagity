"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Icon } from "@/components/ui/Icon";

const MainLayout = dynamic(
  () => import("@/components/layout/MainLayout").then((m) => m.MainLayout),
  { ssr: false }
);

const navItems = [
  { label: "个人资料", icon: "person", to: "/settings/profile" },
  { label: "隐私与安全", icon: "shield", to: "/settings/privacy" },
  { label: "通知", icon: "notifications", to: "/settings/notifications" },
  { label: "个性化", icon: "palette", to: "/settings/personalization" },
  { label: "声音", icon: "volume_up", to: "/settings/sound" },
  { label: "云盘", icon: "cloud", to: "/settings/drive" },
  { label: "插件", icon: "extension", to: "/settings/plugins" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 -m-6 lg:-m-10">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <Icon name="arrow_left" fontSize={18} />
          </Link>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white">设置</h1>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Nav */}
          <nav className="w-56 shrink-0 border-r border-gray-200/50 dark:border-gray-800/50 p-4 space-y-1 overflow-y-auto hidden md:block">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    active
                      ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} fontSize={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Nav */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-800/50 px-2 py-1.5 flex overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <button
                  key={item.to}
                  onClick={() => router.push(item.to)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] transition-all shrink-0 ${
                    active
                      ? "text-cyan-600 dark:text-cyan-400 font-semibold"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <Icon name={item.icon} fontSize={18} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {children}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
