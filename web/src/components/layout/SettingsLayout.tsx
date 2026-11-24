"use client";

import { Text } from "@astryxdesign/core/Text";
import { usePathname } from "@/hooks/usePathname";
import { useRouter } from "@/hooks/useRouter";
import { ClientLink as Link } from "@/components/ui/ClientLink";
import { Icon } from "@/components/ui/Icon";

/** 设置页子导航：不再包裹旧 MainLayout，直接作为新外壳 Tab 内容渲染。 */
const navItems = [
  { label: "个人资料", icon: "person", to: "/settings/profile" },
  { label: "隐私与安全", icon: "shield", to: "/settings/privacy" },
  { label: "通知", icon: "notifications", to: "/settings/notifications" },
  { label: "个性化", icon: "palette", to: "/settings/personalization" },
  { label: "声音", icon: "volume_up", to: "/settings/sound" },
  { label: "云盘", icon: "cloud", to: "/settings/drive" },
  { label: "插件", icon: "extension", to: "/settings/plugins" },
];

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex h-full flex-col bg-sheet">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-sheet/90 px-4 py-3 backdrop-blur-glasslight">
        <Link
          href="/"
          aria-label="返回主页"
          className="flex h-8 w-8 items-center justify-center rounded-full text-fgdim hover:bg-fg/5 hover:text-fg transition-colors"
        >
          <Icon name="arrow_left" fontSize={18} />
        </Link>
        <Text as="h1" type="label" weight="semibold" className="text-fg">设置</Text>
      </div>

      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-56 shrink-0 space-y-1 overflow-y-auto border-r border-line p-4 md:block">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                href={item.to}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                  active
                    ? "bg-brand/10 font-semibold text-fgaccent"
                    : "text-fgdim hover:bg-fg/5 hover:text-fg"
                }`}
              >
                <Icon name={item.icon} fontSize={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>

      <nav className="flex shrink-0 gap-1 overflow-x-auto border-t border-line px-2 py-2 md:hidden">
        {navItems.map((item) => (
          <button
            key={item.to}
            type="button"
            onClick={() => router.push(item.to)}
            className={`shrink-0 rounded-lg px-3 py-2 text-[12px] transition-colors ${
              pathname.startsWith(item.to) ? "bg-brand/10 text-fgaccent" : "text-fgdim hover:bg-fg/5"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
