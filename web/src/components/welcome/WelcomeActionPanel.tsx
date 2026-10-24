"use client";

import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import type { DropdownMenuItemData } from "@astryxdesign/core/DropdownMenu";
import { useInstanceStore } from "@/stores/instance";
import { useWelcomeStore } from "@/stores/welcome";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { useRouter } from "@/hooks/useRouter";
import { useI18n } from "@/components/providers/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import { useWelcomeStatusItems, type StatusItem } from "./WelcomeStatusBar";
import { useInstanceMeta } from "./useInstanceMeta";
import { DEFAULT_DEV_BADGE_KEY, type WelcomeMenuAction, type WelcomeMenuItemConfig } from "./welcomeConfig";

export interface WelcomeActionPanelProps {}

/**
 * WelcomeActionPanel — 实例名片（四段式）
 *
 * Z1 身份区    logo + 实例名 + alias · 版本 + 右上更多菜单
 * Z2 状态区    实时状态芯片并入面板（后端缺字段显示「—」+ 灰点，绝不假装在线）
 * Z3 入口区    时间线（当前唯一真实可跳的窗口）提为显性入口行
 * Z4 CTA 区    加入实例(primary) / 已有账户登录(secondary)
 *
 * 全部颜色走季节语义令牌（bg-sheet/text-fg/text-ok…），明暗由 light-dark() 自动跟随。
 */
export function WelcomeActionPanel(_props: WelcomeActionPanelProps) {
  const { t } = useI18n();
  const instanceStore = useInstanceStore();
  const menuGroups = useWelcomeStore((s) => s.menuGroups);
  const { openFromContext } = useFreeWindowStore();
  const { push } = useRouter();
  const statusItems = useWelcomeStatusItems();
  useInstanceMeta(); // 身份 hydrate（一次性）+ 在线轮询（缺字段返回 null）

  /* ── Handlers ── */
  const dispatch = (action: WelcomeMenuAction) => {
    if (action.kind === "window") {
      if (action.viewType === "termity") {
        useFreeWindowStore.getState().openTermity();
      } else {
        openFromContext(action.viewType);
      }
    } else if (action.kind === "link") {
      if (action.external) {
        window.open(action.href, "_blank", "noopener,noreferrer");
      } else {
        push(action.href);
      }
    }
  };
  const handleJoin = () => dispatch({ kind: "window", viewType: "register_window" });
  const handleLogin = () => dispatch({ kind: "window", viewType: "login_window" });

  /* ── 更多菜单：数据驱动 + Astryx DropdownMenu ── */
  const toOption = (item: WelcomeMenuItemConfig): DropdownMenuItemData => ({
    id: item.id,
    label: t(item.labelKey),
    icon: <Icon name={item.icon} fontSize={16} />,
    isDisabled: item.comingSoon,
    onClick: item.comingSoon ? undefined : () => dispatch(item.action),
    // 占位项：拖尾「开发中」提示，状态诚实
    ...(item.comingSoon
      ? {
          endContent: (
            <span className="text-[10px] font-medium text-fgdim shrink-0">
              {t(item.badgeKey ?? DEFAULT_DEV_BADGE_KEY)}
            </span>
          ),
        }
      : {}),
  });

  const menuItems = menuGroups.map((group) => ({
    type: "section" as const,
    id: group.id,
    items: group.items.flatMap((item) => {
      if (item.children?.length) return item.children.map(toOption); // 拍平开发者子组
      return [toOption(item)];
    }),
  }));

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
    <div
      className="relative w-[360px] max-w-[calc(100vw-3rem)] flex flex-col gap-3.5 rounded-3xl p-5
        bg-sheet/95 border border-line backdrop-blur-glassheavy shadow-2xl"
    >
      {/* ── Z1 身份区 + 更多菜单 ── */}
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

        <DropdownMenu
          items={menuItems}
          placement="above"
          alignment="end"
          presentation="adaptive"
          menuWidth={232}
          menuMaxHeight={340}
          hasChevron={false}
          renderTrigger={(tp) => (
            <IconButton
              {...tp}
              variant="ghost"
              size="sm"
              icon={<Icon name="more_horiz" fontSize={18} />}
              label={t("welcome.more")}
              tooltip={t("welcome.more")}
            />
          )}
        />
      </div>

      {/* ── 描述（后端 hydrate，随 meta 变更）── */}
      <p className="text-[13px] leading-relaxed text-fgdim line-clamp-2">
        {instanceStore.description}
      </p>

      {/* ── Z2 状态区（并入面板；在线缺字段=「—」灰点）── */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusItems.map((item) => (
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
  );
}
