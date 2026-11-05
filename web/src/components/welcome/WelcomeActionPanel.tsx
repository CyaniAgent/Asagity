"use client";

import { Fragment, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { useInstanceStore } from "@/stores/instance";
import { useWelcomeStore } from "@/stores/welcome";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { useRouter } from "@/hooks/useRouter";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import { WelcomeMenuItem } from "./WelcomeMenuItem";
import { useWelcomeStatusItems, type StatusItem } from "./WelcomeStatusBar";
import { useInstanceMeta } from "./useInstanceMeta";
import type { WelcomeMenuAction, WelcomeMenuItemConfig } from "./welcomeConfig";

export interface WelcomeActionPanelProps {}

/** Big-stat value formatting: numeric → thousands separators; missing → "—". */
function formatStat(value: string | null): string {
  if (value == null) return "—";
  const n = Number(value);
  return value.trim() !== "" && Number.isFinite(n) ? n.toLocaleString() : value;
}

/** One stat block in the big strip. tone "ok" = green (online), "fg" = theme color. */
function StatCell({ value, label, tone }: { value: string; label: string; tone: "ok" | "fg" | "dim" }) {
  const color = tone === "ok" ? "text-ok" : tone === "fg" ? "text-fg" : "text-fgdim";
  return (
    <div className="flex-1 min-w-0 px-4 py-3">
      <div className={`text-xl font-bold tabular-nums leading-none truncate transition-colors ${color}`}>
        {value}
      </div>
      <div className="mt-1.5 text-[10px] font-medium tracking-wide text-fgdim">{label}</div>
    </div>
  );
}

/**
 * WelcomeActionPanel — 实例名片（顶置大数据条 + 四段式面板）
 *
 * Z0 数据区    用户总数 / 帖子总数 / 在线人数 三大数据条（后端缺字段=「—」）：
 *              在线人数已知时绿色(--color-ok)，其余两枚走主题语义色(--color-fg)
 * Z1 身份区    logo + 实例名 + alias · 版本 + 右上更多菜单（原生手搓，菜单已令牌化）
 * Z2 状态区    实时状态芯片并入面板（count 类已上浮 Z0，此处只留 heartbeat 类）
 * Z3 入口区    时间线（当前唯一真实可跳的窗口）提为显性入口行
 * Z4 CTA 区    加入实例(primary) / 已有账户登录(secondary)
 *
 * 「更多」菜单（原样保形 + 令牌化 + 无障碍基线）：
 *   - 锚点在外层 stack 容器：菜单从数据条上沿之外弹出，不再自噬数据条；
 *   - role/aria：menu / menuitem / aria-expanded / aria-controls；
 *   - 键盘：↑↓ 循环 / Home / End / Esc 关闭并归还焦点 / Tab 收起；
 *   - 动效：menu-pop（150ms 季节 fast + --ease-standard，respects reduced-motion）。
 */
export function WelcomeActionPanel(_props: WelcomeActionPanelProps) {
  const { t } = useI18n();
  const instanceStore = useInstanceStore();
  const menuGroups = useWelcomeStore((s) => s.menuGroups);
  const { openFromContext } = useFreeWindowStore();
  const { push } = useRouter();
  const stats = useInstanceMeta(); // 身份 hydrate + 三大数据轮询（缺字段返回 null）
  const statusItems = useWelcomeStatusItems(stats);
  const chipItems = statusItems.filter((s) => s.kind === "status");

  /* ── Menu state ── */
  const [menuOpen, setMenuOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  /** 外点关闭排除域 = 外层 stack（面板内任何点击都不收菜单，原版行为） */
  const stackRef = useRef<HTMLDivElement>(null);
  /** 更多触发钮：键盘关闭后归还焦点 */
  const triggerRef = useRef<HTMLButtonElement>(null);
  /** 键盘开菜单时首/尾行预置焦点 */
  const queueFocusRef = useRef<"first" | "last" | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (stackRef.current && !stackRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  /* 键盘开菜单 → 弹出后把焦点送进首/尾行 */
  useEffect(() => {
    if (!menuOpen || !queueFocusRef.current) return;
    const rows = rowEls(stackRef.current);
    if (rows.length) rows[queueFocusRef.current === "last" ? rows.length - 1 : 0]?.focus();
    queueFocusRef.current = null;
  }, [menuOpen]);

  /* ── Handlers ── */
  const closeMenu = (returnFocus = false) => {
    setMenuOpen(false);
    setDevOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

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
  const handleJoin = () => dispatch({ kind: "window", viewType: "register_window" });
  const handleLogin = () => dispatch({ kind: "window", viewType: "login_window" });

  /* ── 菜单键盘导航（C）── */
  const rowEls = (root: HTMLElement | null) =>
    root ? Array.from(root.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')) : [];

  const focusRelative = (current: HTMLElement | null, dir: 1 | -1) => {
    const rows = rowEls(stackRef.current);
    if (!rows.length) return;
    const idx = current ? rows.indexOf(current) : -1;
    const next = idx < 0 ? (dir > 0 ? 0 : rows.length - 1) : (idx + dir + rows.length) % rows.length;
    rows[next]?.focus();
  };

  const handleTriggerKeys = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      queueFocusRef.current = "first";
      setMenuOpen(true);
      setDevOpen(false);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      queueFocusRef.current = "last";
      setMenuOpen(true);
      setDevOpen(false);
    }
  };

  const handleMenuKeys = (e: ReactKeyboardEvent) => {
    const item = e.target as HTMLElement;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusRelative(item.tagName === "BUTTON" ? item : null, 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusRelative(item.tagName === "BUTTON" ? item : null, -1);
        break;
      case "Home": {
        e.preventDefault();
        const rows = rowEls(stackRef.current);
        rows[0]?.focus();
        break;
      }
      case "End": {
        e.preventDefault();
        const rows = rowEls(stackRef.current);
        rows[rows.length - 1]?.focus();
        break;
      }
      case "Escape": /* light-dismiss 键盘对应 */
      case "Tab": /* Tab 移出即收起（焦点归还触发钮） */
        e.preventDefault();
        closeMenu(true);
        break;
    }
  };

  /* ── 菜单渲染（保形 + 令牌化：hover 背景统一由 WelcomeMenuItem 自持）── */
  const itemCls = "text-fgdim";
  const devItemCls = "text-fgdim/75";

  const renderItem = (item: WelcomeMenuItemConfig, smallDefault = false) => {
    const small = item.small ?? smallDefault;
    const cls = small ? devItemCls : itemCls;
    if (item.children?.length) {
      const open = item.id === "developer-group" ? devOpen : false;
      return (
        <div key={item.id}>
          <button
            type="button"
            role="menuitem"
            aria-expanded={open}
            onClick={() => item.id === "developer-group" && setDevOpen((v) => !v)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium
              transition-colors focus:outline-none focus-visible:bg-fg/10 hover:bg-fg/5
              ${itemCls}`}
          >
            <Icon name={item.icon} fontSize={18} className="text-fgdim opacity-80" />
            <span className="flex-1 text-left">{t(item.labelKey)}</span>
            <Icon
              name="chevron_right"
              fontSize={14}
              className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            />
          </button>
          {open && (
            <div className="pl-4 pb-1 bg-fg/[0.03]">
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
        itemCls={cls}
        small={small}
        comingSoon={item.comingSoon}
        comingSoonLabel={item.badgeKey ? t(item.badgeKey) : undefined}
        onClick={() => dispatch(item.action)}
      />
    );
  };

  /* ── 状态芯片：令牌驱动，明暗自动 ── */
  const chipTone = (status: StatusItem["status"]) => {
    switch (status) {
      case "green":
        return "border-ok/40 bg-ok/10";
      case "red":
        return "border-bad/40 bg-bad/10";
      default:
        return "border-line bg-fg/5";
    }
  };
  const dotTone = (status: StatusItem["status"]) =>
    status === "green" ? "bg-ok" : status === "red" ? "bg-bad" : "bg-fgdim";

  return (
    <div ref={stackRef} className="relative w-[360px] max-w-[calc(100vw-3rem)] flex flex-col gap-2.5">
      {/* ── Z0 三大数据条：用户总数 / 帖子总数 / 在线人数 ── */}
      <div
        className="flex items-stretch rounded-3xl bg-sheet/95 border border-line
          backdrop-blur-glassheavy shadow-2xl overflow-hidden"
        role="list"
      >
        <StatCell value={formatStat(stats.users)} label={t("welcome.totalUsers")} tone="fg" />
        <span aria-hidden className="w-px shrink-0 bg-line my-3" />
        <StatCell value={formatStat(stats.posts)} label={t("welcome.totalPosts")} tone="fg" />
        <span aria-hidden className="w-px shrink-0 bg-line my-3" />
        <StatCell
          value={formatStat(stats.online)}
          label={t("welcome.onlineCount")}
          tone={stats.online != null ? "ok" : "dim"}
        />
      </div>

      {/* ── 面板本体 ── */}
      <div className="relative w-full flex flex-col gap-3.5 rounded-3xl p-5 bg-sheet/95 border border-line backdrop-blur-glassheavy shadow-2xl">
        {/* ── Z1 身份区 + 更多触发钮 ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-fg/5 border border-line p-1.5 shrink-0">
              <img src={instanceStore.logoURL} alt={instanceStore.name} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate leading-tight text-fg">
                {instanceStore.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <span className="text-[11px] font-medium text-fgaccent truncate">
                  {instanceStore.alias}
                </span>
                <span aria-hidden className="text-fgdim shrink-0">·</span>
                <span className="text-[10px] font-mono text-fgdim truncate">
                  {instanceStore.version}
                </span>
              </div>
            </div>
          </div>

          {/* 触发钮：键盘监听挂容器（Button 内部会覆 onKeyDown，靠冒泡兜住） */}
          <div className="shrink-0" onKeyDown={handleTriggerKeys}>
            <IconButton
              ref={triggerRef}
              id="welcome-more-trigger"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuOpen ? "welcome-more-menu" : undefined}
              variant="ghost"
              size="sm"
              icon={<Icon name="more_horiz" fontSize={18} />}
              label={t("welcome.more")}
              tooltip={t("welcome.more")}
              onClick={() => { if (menuOpen) closeMenu(true); else { setMenuOpen(true); setDevOpen(false); } }}
            />
          </div>
        </div>

        {/* ── 描述（后端 hydrate，随 meta 变更）── */}
        <p className="text-[13px] leading-relaxed text-fgdim line-clamp-2">
          {instanceStore.description}
        </p>

        {/* ── Z2 状态区（heartbeat 类；count 类已上浮 Z0 大数据条）── */}
        <div className="flex items-center gap-2 flex-wrap">
          {chipItems.map((item) => (
            <div
              key={item.label}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${chipTone(item.status)}`}
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                {item.status === "green" && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-75" />
                )}
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotTone(item.status)}`} />
              </span>
              <span className="text-[10px] font-medium tracking-wide text-fgdim">{item.label}</span>
              <span
                className={`text-[11px] font-semibold tabular-nums ${item.status === "gray" ? "text-fgdim" : "text-fg"}`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Z3 入口区：时间线（唯一真实可跳入口）── */}
        <button
          onClick={() => dispatch({ kind: "window", viewType: "welcome_timeline" })}
          className="group flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13px] font-medium
            text-fg hover:bg-fg/5 active:scale-[0.99] transition-all"
        >
          <span className="h-7 w-7 rounded-lg bg-brand/10 text-fgaccent flex items-center justify-center shrink-0">
            <Icon name="timeline_20_filled" fontSize={16} />
          </span>
          <span className="flex-1 text-left">{t("welcome.browseTimeline")}</span>
          <Icon
            name="chevron_right"
            fontSize={14}
            className="text-fgdim transition-transform group-hover:translate-x-0.5"
          />
        </button>

        {/* ── Z4 CTA ── */}
        <div className="flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="lg"
            width="100%"
            label={t("welcome.joinInstance")}
            icon={<Icon name="arrow_right_16" fontSize={16} />}
            onClick={handleJoin}
            className="glow-accent glow-accent-hover"
          />
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

      {/* ── Dropdown（原生样式 · 令牌化）：锚在 stack 容器，从数据条上沿之外弹出 ── */}
      {menuOpen && (
        <div
          id="welcome-more-menu"
          role="menu"
          className={`menu-pop absolute bottom-full right-0 mb-2.5 w-56 max-h-[70vh] overflow-y-auto
            overscroll-contain rounded-2xl py-1.5 z-50 backdrop-blur-xl
            bg-popover/95 border border-line text-fg shadow-2xl`}
          onKeyDown={handleMenuKeys}
        >
          {menuGroups.map((group, gi) => (
            <Fragment key={group.id}>
              {gi > 0 && <div aria-hidden className="my-1.5 mx-3 h-px bg-line" />}
              {group.items.map((item) => renderItem(item))}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
