"use client";

import { useState, useRef, useEffect } from "react";
import { useInstanceStore } from "@/stores/instance";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { useThemeStore } from "@/stores/theme";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";

export interface WelcomeActionPanelProps {}

export function WelcomeActionPanel(_props: WelcomeActionPanelProps) {
  const { t } = useI18n();
  const instanceStore = useInstanceStore();
  const isDark = useThemeStore(
    (s) => s.preference === "dark" || (s.preference === "system" && s.systemPreference === "dark")
  );
  const { openFromContext } = useFreeWindowStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* ── Menu outside-click ── */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false); setDevOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  /* ── Handlers ── */
  const closeMenu = () => { setMenuOpen(false); setDevOpen(false); };
  const handleJoin = () => { openFromContext("auth"); };
  const handleLogin = () => { openFromContext("auth"); };
  const handleOpenTimeline = () => { openFromContext("welcome_timeline"); closeMenu(); };
  const handleOpenTermity = () => { useFreeWindowStore.getState().openTermity(); closeMenu(); };

  const menuCls = isDark
    ? "bg-gray-900/95 border border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    : "bg-white/95 border border-gray-200 text-gray-900 shadow-[0_8px_32px_rgba(0,0,0,0.12)]";
  const itemCls = isDark ? "text-white/70 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100";
  const devItemCls = isDark ? "text-white/50 hover:bg-white/5" : "text-gray-500 hover:bg-gray-50";
  const panelBg = isDark
    ? "bg-gray-900 border border-white/10 text-white shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
    : "bg-white border border-gray-200 text-gray-900 shadow-[0_8px_40px_rgba(0,0,0,0.1)]";

  return (
    <div
      ref={menuRef}
      className={`relative w-[360px] flex flex-col gap-4 rounded-[28px] p-5 backdrop-blur-2xl
        ${panelBg}`}
    >
        {/* ── Header: Instance Info + More Menu ── */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="w-12 h-[2px] bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mb-4 shadow-[0_0_12px_rgba(57,197,187,0.4)]" />
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border
                ${isDark ? "bg-white/10 border-white/10" : "bg-gray-100 border-gray-200"}`}
            >
              <img src={instanceStore.logoURL} alt={instanceStore.name} className="w-8 h-8 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate leading-tight text-inherit">
                {instanceStore.name}
              </h1>
              <span className={`text-[11px] font-medium ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
                {instanceStore.alias}
              </span>
            </div>
          </div>
          <p className={`text-[13px] leading-relaxed line-clamp-2 mb-1 ${isDark ? "text-white/60" : "text-gray-600"}`}>
            {instanceStore.description}
          </p>
          <span className={`inline-block text-[10px] font-mono mt-1 ${isDark ? "text-white/30" : "text-gray-400"}`}>
            {instanceStore.version}
          </span>
        </div>

        {/* ── Three-dot more menu ── */}
          <div className="relative shrink-0 mt-1">
          <button
            onClick={() => { setMenuOpen((v) => !v); setDevOpen(false); }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200
              ${isDark
                ? "hover:bg-white/10 text-white/60 hover:text-white/90"
                : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              } ${menuOpen ? (isDark ? "bg-white/10" : "bg-gray-100") : ""}`}
          >
            <Icon name="more_horiz" fontSize={20} />
          </button>

          {/* ── Dropdown ── */}
          {menuOpen && (
            <div
              className={`absolute bottom-full right-0 mb-2 w-56 max-h-[70vh] overflow-y-auto
                overscroll-contain rounded-2xl py-1.5 z-50 backdrop-blur-xl transition-all
                ${menuCls}`}
            >
              {/* ── Group: Quick Access ── */}
              <MenuItem
                icon="timeline_20_filled"
                label={t("welcome.browseTimeline")}
                isDark={isDark}
                itemCls={itemCls}
                onClick={handleOpenTimeline}
              />
              <MenuItem
                icon="campaign"
                label={t("announcement.announcements")}
                isDark={isDark}
                itemCls={itemCls}
                comingSoon
                comingSoonLabel={t("header.inDevelopment")}
                onClick={() => {}}
              />

              {/* ── Divider ── */}
              <div className={`my-1.5 mx-3 h-px ${isDark ? "bg-white/10" : "bg-gray-200"}`} />

              {/* ── Group: Instance ── */}
              <MenuItem
                icon="info"
                label={t("welcome.aboutInstance")}
                isDark={isDark}
                itemCls={itemCls}
                onClick={() => { handleOpenTimeline(); }}
              />
              <MenuItem
                icon="globe"
                label={t("welcome.federation")}
                isDark={isDark}
                itemCls={itemCls}
                comingSoon
                comingSoonLabel={t("header.inDevelopment")}
                onClick={() => {}}
              />
              <MenuItem
                icon="dashboard"
                label={t("welcome.dataDashboard")}
                isDark={isDark}
                itemCls={itemCls}
                comingSoon
                comingSoonLabel={t("header.inDevelopment")}
                onClick={() => {}}
              />
              <MenuItem
                icon="campaign"
                label={t("welcome.adPool")}
                isDark={isDark}
                itemCls={itemCls}
                comingSoon
                comingSoonLabel={t("header.inDevelopment")}
                onClick={() => {}}
              />
              <MenuItem
                icon="mail_inbox"
                label={t("welcome.contactUs")}
                isDark={isDark}
                itemCls={itemCls}
                comingSoon
                comingSoonLabel={t("header.inDevelopment")}
                onClick={() => {}}
              />

              {/* ── Divider ── */}
              <div className={`my-1.5 mx-3 h-px ${isDark ? "bg-white/10" : "bg-gray-200"}`} />

              {/* ── Group: Developer (submenu) ── */}
              <div>
                <button
                  onClick={() => setDevOpen((v) => !v)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors
                    ${itemCls}`}
                >
                  <Icon name="terminal" fontSize={18} className={isDark ? "text-white/50" : "text-gray-400"} />
                  <span className="flex-1 text-left">{t("welcome.developer")}</span>
                  <Icon
                    name="chevron_right"
                    fontSize={14}
                    className={`transition-transform duration-200 ${devOpen ? "rotate-90" : ""}`}
                  />
                </button>
                {devOpen && (
                  <div className={`pl-4 pb-1 ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
                    <MenuItem
                      icon="terminal"
                      label={t("welcome.termity")}
                      isDark={isDark}
                      itemCls={devItemCls}
                      onClick={handleOpenTermity}
                      small
                    />
                    <MenuItem
                      icon="public"
                      label={t("welcome.verseNET")}
                      isDark={isDark}
                      itemCls={devItemCls}
                      comingSoon
                      comingSoonLabel={t("header.inDevelopment")}
                      onClick={() => {}}
                      small
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex flex-col gap-2.5">
        {/* Primary: Join Instance */}
        <button
          onClick={handleJoin}
          className="w-full py-3 px-4 rounded-2xl text-sm font-bold text-white
                     bg-gradient-to-r from-cyan-500 to-cyan-400
                     shadow-[0_0_20px_rgba(57,197,187,0.3)]
                     hover:shadow-[0_0_30px_rgba(57,197,187,0.5)]
                     hover:from-cyan-400 hover:to-cyan-300
                     active:scale-[0.98] transition-all duration-200
                     flex items-center justify-center gap-2"
        >
          <Icon name="arrow_right_16" fontSize={16} />
          {t("welcome.joinInstance")}
        </button>

        {/* Secondary: Existing Account Login */}
        <button
          onClick={handleLogin}
          className={`w-full py-2.5 px-4 rounded-2xl text-[13px] font-medium
                     active:scale-[0.98] transition-all duration-200
                     flex items-center justify-center gap-2.5
                     ${isDark
                       ? "text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15"
                       : "text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-gray-300"
                     }`}
        >
          <Icon name="arrow_enter_16" fontSize={16} className="text-cyan-500" />
          {t("welcome.loginExisting")}
        </button>
      </div>
    </div>
  );
}

/* ── Helper: Menu Item ── */
function MenuItem({
  icon,
  label,
  isDark,
  itemCls,
  onClick,
  small,
  comingSoon,
  comingSoonLabel,
}: {
  icon: string;
  label: string;
  isDark: boolean;
  itemCls: string;
  onClick: () => void;
  small?: boolean;
  comingSoon?: boolean;
  comingSoonLabel?: string;
}) {
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
