"use client";

import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";

export default function PanelSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  const categories = [
    {
      label: t("panel.instanceManagement"),
      items: [
        { label: t("panel.instanceInfo"), icon: "info", to: "/panel/settings/instance" },
        { label: t("panel.moderationSettings"), icon: "shield", to: "/panel/settings/moderation" },
      ],
    },
    {
      label: t("panel.resourceManagement"),
      items: [
        { label: t("panel.emailServer"), icon: "mail", to: "/panel/settings/email" },
        { label: t("panel.objectStorage"), icon: "cloud", to: "/panel/settings/storage" },
      ],
    },
    {
      label: t("panel.systemMaintenanceTab"),
      items: [
        { label: t("panel.securityAndCaptcha"), icon: "lock", to: "/panel/settings/security" },
      ],
    },
  ];

  return (
    <div className="flex gap-6 animate-[fadeIn_0.4s_ease-out] h-full overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col gap-6 overflow-y-auto pr-2">
        {categories.map((cat) => (
          <div key={cat.label} className="flex flex-col gap-1.5">
            <div className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 opacity-60">
              {cat.label}
            </div>
            {cat.items.map((item) => (
              <button
                key={item.to}
                onClick={() => router.push(item.to)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 group w-full text-left ${
                  pathname === item.to
                    ? "bg-cyan-500 text-white shadow-[0_8px_20px_-4px_rgba(6,182,212,0.4)]"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-bold"
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`transition-transform duration-300 group-hover:scale-110 ${
                    pathname === item.to ? "text-white" : "text-gray-400 group-hover:text-cyan-500"
                  }`}
                  fontSize={18}
                />
                <span className="text-[14px] tracking-wide">{item.label}</span>
                {pathname === item.to && (
                  <Icon name="chevron_right" className="ml-auto w-4 h-4 animate-bounce" fontSize={16} />
                )}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Content */}
      <main className="flex-1 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 dark:border-gray-800/50 rounded-[32px] overflow-hidden shadow-xl flex flex-col">
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
