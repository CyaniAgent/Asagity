"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { useInstanceStore } from "@/stores/instance";
import { useWelcomeStore } from "@/stores/welcome";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { useThemeStore } from "@/stores/theme";
import { useRouter } from "@/hooks/useRouter";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import { WelcomeMenuItem } from "./WelcomeMenuItem";
import type { WelcomeMenuAction, WelcomeMenuItemConfig } from "./welcomeConfig";

export interface WelcomeActionPanelProps {}

export function WelcomeActionPanel(_props: WelcomeActionPanelProps) {
  const { t } = useI18n();
  const instanceStore = useInstanceStore();
  const menuGroups = useWelcomeStore((s) => s.menuGroups);
  const isDark = useThemeStore(
    (s) => s.preference === "dark" || (s.preference === "system" && s.systemPreference === "dark")
  );
  const { openFromContext } = useFreeWindowStore();
  const { push } = useRouter();
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
  const handleJoin = () => { openFromContext("register_window"); closeMenu(); };
  const handleLogin = () => { openFromContext("login_window"); closeMenu(); };

  /** Q4 dispatcher: window + link (termity keeps its auth-gated entry). */
  const dispatch = (action: WelcomeMenuAction) => {
    if (action.kind === "window") {
      if (action.viewType === "termity") {
        useFreeWindowStore.getState().openTermity();
      } else {
        openFromContext(action.viewType);
      }
      closeMenu();
    } else if (action.kind === "link") {
      closeMenu();
      if (action.external) {
        window.open(action.href, "_blank", "noopener,noreferrer");
      } else {
        push(action.href);
      }
    }
  };

  const menuCls = isDark
    ? "bg-gray-900/95 border border-white/10 text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    : "bg-white/95 border border-gray-200 text-gray-900 shadow-[0_8px_32px_rgba(0,0,0,0.12)]";
  const itemCls = isDark ? "text-white/70 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100";
  const devItemCls = isDark ? "text-white/50 hover:bg-white/5" : "text-gray-500 hover:bg-gray-50";
  const panelBg = isDark
    ? "bg-gray-900 border border-white/10 text-white shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
    : "bg-white border border-gray-200 text-gray-900 shadow-[0_8px_40px_rgba(0,0,0,0.1)]";

  const renderItem = (item: WelcomeMenuItemConfig, smallDefault = false) => {
    const small = item.small ?? smallDefault;
    const cls = small ? devItemCls : itemCls;
    if (item.children?.length) {
      const open = item.id === "developer-group" ? devOpen : false;
      return (
        <div key={item.id}>
          <button
            onClick={() => item.id === "developer-group" && setDevOpen((v) => !v)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors
              ${itemCls}`}
          >
            <Icon name={item.icon} fontSize={18} className={isDark ? "text-white/50" : "text-gray-400"} />
            <span className="flex-1 text-left">{t(item.labelKey)}</span>
            <Icon
              name="chevron_right"
              fontSize={14}
              className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            />
          </button>
          {open && (
            <div className={`pl-4 pb-1 ${isDark ? "bg-white/[0.03]" : "bg-gray-50"}`}>
              {item.children.map((child) => renderItem(child, true))}
            </div>
          )}
        </div>
      );
    }
    return (
      <WelcomeMenuItem
        key={item.id}
        icon={item.icon}
        label={t(item.labelKey)}
        isDark={isDark}
        itemCls={cls}
        small={small}
        comingSoon={item.comingSoon}
        comingSoonLabel={item.badgeKey ? t(item.badgeKey) : undefined}
        onClick={() => dispatch(item.action)}
      />
    );
  };

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
          <IconButton
            variant="ghost"
            size="md"
            icon={<Icon name="more_horiz" fontSize={20} />}
            label={t("welcome.more")}
            tooltip={t("welcome.more")}
            onClick={() => { setMenuOpen((v) => !v); setDevOpen(false); }}
          />

          {/* ── Dropdown (data-driven) ── */}
          {menuOpen && (
            <div
              className={`absolute bottom-full right-0 mb-2 w-56 max-h-[70vh] overflow-y-auto
                overscroll-contain rounded-2xl py-1.5 z-50 backdrop-blur-xl transition-all
                ${menuCls}`}
            >
              {menuGroups.map((group, gi) => (
                <Fragment key={group.id}>
                  {gi > 0 && (
                    <div className={`my-1.5 mx-3 h-px ${isDark ? "bg-white/10" : "bg-gray-200"}`} />
                  )}
                  {group.items.map((item) => renderItem(item))}
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="flex flex-col gap-2.5">
        {/* Primary: Join Instance */}
        <Button
          variant="primary"
          size="lg"
          width="100%"
          label={t("welcome.joinInstance")}
          icon={<Icon name="arrow_right_16" fontSize={16} />}
          onClick={handleJoin}
          className="glow-accent glow-accent-hover"
        />

        {/* Secondary: Existing Account Login */}
        <Button
          variant="secondary"
          size="md"
          width="100%"
          label={t("welcome.loginExisting")}
          icon={<Icon name="arrow_enter_16" fontSize={16} />}
          onClick={handleLogin}
        />
      </div>
    </div>
  );
}
