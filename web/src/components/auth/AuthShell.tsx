/**
 * AuthShell — 登录 / 注册窗口的持久外壳
 *
 * 这一层存在的唯一理由是**不被卸载**。login_window 与 register_window
 * 共用它，切换时只有 children（表单）换掉，楔形和品牌块留在原地，
 * 于是它们可以真的"滑"过去，而不是先销毁再在对面重新出现。
 *
 * 布局分成三块，全部绝对定位、互不干扰：
 *   .auth-brand        楔形 + 品牌块，z-30，不接收指针事件
 *   .window-drag-handle 顶部隐形拖拽条，z-20
 *   表单槽               z-10，水平位置靠两个 flex-grow 占位块推出来
 *
 * 表单的水平位移用 flex-grow 而不是 transform：占位块的 grow 是可插值
 * 的纯数字，既能过渡，又不用写死 780px 这种只在默认尺寸下成立的值，
 * 窗口缩放后依然正确。
 */
import { IconButton } from "@astryxdesign/core/IconButton";
import { useInstanceStore } from "@/stores/instance";
import { useThemeStore } from "@/stores/theme";
import { useFreeWindowStore, AUTH_FORM_OUT_MS } from "@/stores/freeWindow";
import { Icon } from "@/components/ui/Icon";
import { useFreeWindowActions } from "@/components/windows/FreeWindow";
import { useI18n } from "@/components/providers/I18nProvider";

export type AuthSide = "left" | "right";

interface AuthShellProps {
  /** 品牌楔形停在哪一侧。登录在右，注册在左。 */
  side: AuthSide;
  /** 用于判断当前窗口是不是正在做切换动画 */
  windowId: string;
  children: React.ReactNode;
}

export function AuthShell({ side, windowId, children }: AuthShellProps) {
  const { t } = useI18n();
  const instanceStore = useInstanceStore();
  const windowActions = useFreeWindowActions();
  const switching = useFreeWindowStore((s) => s.switchingWindow);
  const closing = useFreeWindowStore((s) => s.closingWindow);

  const isDark = useThemeStore(
    (s) =>
      s.preference === "dark" ||
      (s.preference === "system" && s.systemPreference === "dark"),
  );

  const isSwitching = switching?.id === windowId;
  const fadingOut = isSwitching && switching.phase === "out";
  /* 楔形的侧别在切换一开始就切到目标侧：表单滑出与楔形滑动并行，
   * 而不是等表单完全划出后楔形才起步。 */
  const effectiveSide: AuthSide =
    isSwitching
      ? switching.to === "register_window"
        ? "left"
        : "right"
      : side;
  /* 关闭退场：表单与楔形沿各自一侧向外分离飞出（登录楔形在右，注册在左）。 */
  const exiting = closing === windowId;

  /* 无障碍：系统开启"减少动态效果"时跳过所有过渡，直接换态。 */
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Theme tokens ───────────────────────────────────────────── */
  const bg = isDark ? "bg-[#191919]" : "bg-gray-50";
  const surfaceBg = isDark ? "bg-[#191919]" : "bg-white";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const textTertiary = isDark ? "text-gray-500" : "text-gray-400";
  const borderColor = isDark ? "border-white/10" : "border-gray-200";

  /* 切换时旧表单沿自己一侧整槽滑出窗口（登录向左 / 注册向右），
   * 完全划出后才换内容，接缝藏在窗口边界外；关闭退场则飞向楔形
   * 对侧，边飞边模糊边淡出，像被"推散"消失。reduceMotion 下跳过
   * 位移与模糊，直接换态。 */
  const exitSign = side === "right" ? -1 : 1;
  const formStyle: React.CSSProperties = {
    opacity: exiting ? 0 : 1,
    transform:
      exiting && !reduceMotion
        ? `translateX(${exitSign * 56}px)`
        : fadingOut && !reduceMotion
          ? `translateX(${exitSign * 110}%)`
          : undefined,
    filter: exiting && !reduceMotion ? "blur(8px)" : undefined,
    transition: reduceMotion
      ? "none"
      : exiting
        ? "transform var(--auth-exit-dur) var(--auth-exit-ease), opacity var(--auth-exit-dur) var(--auth-exit-ease), filter var(--auth-exit-dur) var(--auth-exit-ease)"
        : fadingOut
          ? `transform ${AUTH_FORM_OUT_MS}ms cubic-bezier(0.4, 0, 1, 1)`
          : "opacity 260ms cubic-bezier(0.22, 1, 0.36, 1)",
    pointerEvents: exiting ? "none" : undefined,
  };

  /* 楔形 + 品牌块整体沿品牌一侧向外飞出，与表单反方向分离。
   * 楔形是大面积色块，模糊阈值比文字表单更高才有消散感知。 */
  const brandExitStyle: React.CSSProperties | undefined = exiting
    ? {
        transform: reduceMotion
          ? undefined
          : `translateX(${exitSign * -72}px)`,
        opacity: 0,
        filter: reduceMotion ? undefined : "blur(14px)",
        transition: reduceMotion
          ? "none"
          : "transform var(--auth-exit-dur) var(--auth-exit-ease), opacity var(--auth-exit-dur) var(--auth-exit-ease), filter var(--auth-exit-dur) var(--auth-exit-ease)",
      }
    : undefined;

  /* 外壳同步渐隐，避免内容飞完之后空壳突兀地消失。 */
  const shellExitStyle: React.CSSProperties | undefined = exiting
    ? {
        opacity: 0,
        transition: reduceMotion
          ? "none"
          : "opacity var(--auth-exit-dur) var(--auth-exit-ease)",
      }
    : undefined;

  const spacerTransition = "flex-grow var(--auth-sweep-dur) var(--auth-sweep-ease)";

  return (
    <div
      className={`relative h-full overflow-hidden ${bg}`}
      style={
        {
          "--wedge-from": isDark ? "#191919" : "#eef0f2",
          "--wedge-to": isDark ? "#242424" : "#f7f8f9",

          ...shellExitStyle,
        } as React.CSSProperties
      }
    >
      {/* ════════════════════════════════════════════════════════ */}
      {/* 品牌层 — 楔形与品牌块一起左右移动                     */}
      {/* ════════════════════════════════════════════════════════ */}
      <div
        className="auth-brand pointer-events-none absolute inset-0 z-30"
        data-side={effectiveSide}
        style={brandExitStyle}
      >
        <div aria-hidden="true" className="brand-wedge" />

        <div className="auth-brand-block">
          <div className="flex flex-col items-center">
            <div
              className={`mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border ${borderColor} ${surfaceBg}`}
            >
              <img src={instanceStore.logoURL} alt="" className="h-12 w-12 object-contain" />
            </div>
            <h2 className={`mb-1.5 text-lg font-bold ${textPrimary}`}>{instanceStore.name}</h2>
            <p className={`mb-4 font-mono text-[11px] ${textTertiary}`}>{instanceStore.alias}</p>
            <p className={`max-w-[190px] text-[12px] leading-relaxed ${textSecondary}`}>
              {instanceStore.description}
            </p>
            <span className={`mt-6 block font-mono text-[10px] ${textTertiary}`}>
              {instanceStore.version}
            </span>
          </div>
        </div>
      </div>

      {/* 顶部隐形拖拽条 */}
      <div
        aria-hidden="true"
        className="window-drag-handle absolute inset-x-0 top-0 z-20 h-14 cursor-grab active:cursor-grabbing"
      />

      {/* 窗口控制按钮 */}
      {windowActions && (
        <div className="absolute right-3 top-3 z-40 flex items-center gap-1">
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Icon name="maximize" fontSize={14} />}
            label={t("common.maximize")}
            tooltip={t("common.maximize")}
            onClick={windowActions.toggleMaximize}
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Icon name="close" fontSize={14} />}
            label={t("common.close")}
            tooltip={t("common.close")}
            onClick={windowActions.close}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* 表单槽 — 两个 grow 占位块把表单推到左或右              */}
      {/* ════════════════════════════════════════════════════════ */}
      <div
        className="absolute inset-0 z-10 flex items-center overflow-y-auto px-8 py-6"
        style={formStyle}
      >
        <div
          aria-hidden="true"
          className="shrink-0"
          style={{
            flexGrow: effectiveSide === "left" ? 1 : 0,
            flexBasis: 0,
            transition: spacerTransition,
          }}
        />
        <div className="w-full max-w-[340px] shrink" style={{ flex: "0 1 340px" }}>
          {children}
        </div>
        <div
          aria-hidden="true"
          className="shrink-0"
          style={{
            flexGrow: effectiveSide === "left" ? 0 : 1,
            flexBasis: 0,
            transition: spacerTransition,
          }}
        />
      </div>
    </div>
  );
}
