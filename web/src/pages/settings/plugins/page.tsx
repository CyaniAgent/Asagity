"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-cyan-500" : "bg-gray-300 dark:bg-gray-600"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  author: string;
}

export default function PluginsSettingsPage() {
  const { t } = useI18n();

  const mockPlugins: Plugin[] = [
    {
      id: "mfm-preview",
      name: t("settings.mfmPreview"),
      description: t("settings.mfmPreviewDesc"),
      version: "1.0.0",
      enabled: true,
      author: "Asagity",
    },
    {
      id: "emoji-picker",
      name: t("settings.enhancedEmojiPicker"),
      description: t("settings.enhancedEmojiPickerDesc"),
      version: "1.2.0",
      enabled: true,
      author: "Community",
    },
    {
      id: "code-highlight",
      name: t("settings.codeHighlight"),
      description: t("settings.codeHighlightDesc"),
      version: "0.9.0",
      enabled: false,
      author: "Community",
    },
  ];

  const [plugins, setPlugins] = useState(mockPlugins);

  const togglePlugin = (id: string) => {
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <div className="max-w-[700px] mx-auto p-6 space-y-8 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Icon name="extension" className="text-white" fontSize={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("settings.plugins")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("settings.extendFeatures")}</p>
        </div>
      </div>

      {/* Plugin List */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="extension" className="text-cyan-500" fontSize={18} />
            {t("settings.installed")}
          </h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {plugins.map((plugin) => (
            <div key={plugin.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                <Icon name="extension" className="text-cyan-500" fontSize={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{plugin.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500 dark:text-gray-400">
                    v{plugin.version}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{plugin.description}</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">by {plugin.author}</div>
              </div>
              <Toggle enabled={plugin.enabled} onChange={() => togglePlugin(plugin.id)} />
            </div>
          ))}
        </div>
      </section>

      {/* Install Plugin */}
      <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="add_circle" className="text-cyan-500" fontSize={18} />
            {t("settings.installNewPlugin")}
          </h2>
        </div>
        <div className="p-4">
          <div className="text-center text-gray-400 py-6">
            <Icon name="store" className="mx-auto mb-3 opacity-30" fontSize={40} />
            <p className="text-sm">{t("settings.pluginStoreDev")}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t("settings.pluginStoreDevDesc")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
