"use client";

import { useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useSystemStore } from "@/stores/system";
import { useInstanceStore } from "@/stores/instance";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";
import { pickSplashMessageKey } from "./splashConfig";

/** 季节统一动效曲线（与 --ease-standard 一致）。 */
const EASE = [0.2, 0.8, 0.2, 1] as const;

/**
 * SplashScreen — 开屏（T1 层：React 挂载后 ~ 初始化完成）
 *
 * 数据源：systemStore.initSequence 的分阶段真进度（15→55→70→92→100，
 * 由真实阶段推进，绝不假装满格）；进度条下方随机展示一条风味文案
 * （splashConfig.ts，未来开放设置项覆盖）。
 *
 * 动效：framer-motion 编排 — 入场（logo spring + 进度 spring + 文案 stagger），
 * 退场 AnimatePresence 整体淡出上飘（治旧版硬切）；useReducedMotion 兜底。
 *
 * 视觉：季节语义令牌（bg-sheet/text-fg/text-fgdim/text-bad + glow-accent），
 * 与 index.html 的 boot splash（T0 层）像素对位：logo 128px、进度条 256×3、
 * gap 32px —— 挂载时把 #boot-splash 淡出移除，实现零白帧交接。
 *
 * 范围：挂在 ClientLayout（I18nProvider 内）→ 覆盖 Welcome / Dashboard 全入口。
 */
export function SplashScreen() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const isLoadFinished = useSystemStore((s) => s.isLoadFinished);
  const initProgress = useSystemStore((s) => s.initProgress);
  const initError = useSystemStore((s) => s.initError);
  const initErrorCode = useSystemStore((s) => s.initErrorCode);
  const logoURL = useInstanceStore((s) => s.logoURL);

  // 每次开屏随机抽一条风味文案（单次，不随进度轮换）
  const messageKey = useMemo(() => pickSplashMessageKey(), []);

  // 引导 splash 交接：React 首帧后淡出 T0 层（boot 为纯 DOM，不归 React 管）
  useEffect(() => {
    const boot = document.getElementById("boot-splash");
    if (!boot) return;
    const raf = requestAnimationFrame(() => {
      boot.classList.add("boot-fade");
      window.setTimeout(() => boot.remove(), 600);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {!isLoadFinished && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100000] flex flex-col items-center justify-center gap-8
            bg-sheet/98 backdrop-blur-glassheavy overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={
            reduce
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.03, y: -16 }
          }
          transition={{ duration: reduce ? 0 : 0.45, ease: EASE }}
        >
          {/* 环境光：冰川呼吸球 */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 flex items-center justify-center"
          >
            <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-brand/25 rounded-full blur-[120px] animate-pulse" />
          </div>

          {/* Logo（与 boot splash 同尺寸同位置 → 交接无缝） */}
          <motion.img
            src={logoURL}
            alt={useInstanceStore.getState().name}
            width={128}
            height={128}
            className="relative w-32 h-32 object-contain"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reduce
                ? { duration: 0.2 }
                : { type: "spring", stiffness: 240, damping: 22, delay: 0.05 }
            }
          />

          {!initError ? (
            <>
              {/* 进度条：真进度 spring 推进 */}
              <div className="relative w-64 h-[3px] rounded-full overflow-hidden bg-fg/10">
                <motion.div
                  className="h-full rounded-full bg-brand shadow-[0_0_8px_rgba(46,118,184,0.6)]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${initProgress}%` }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 110, damping: 20 }
                  }
                />
              </div>

              {/* 风味文案（随机单选，未来可配置） */}
              <motion.p
                className="relative text-[11px] tracking-wide text-fgdim"
                initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.3, duration: 0.4, ease: EASE }}
              >
                {t(messageKey)}
              </motion.p>
            </>
          ) : (
            /* ── 错误态：结构沿用旧版，色值全面季节令牌化 ── */
            <div className="relative flex flex-col items-center w-64">
              <div className="w-full h-1 bg-bad/20 rounded-full overflow-hidden mb-8">
                <div className="h-full bg-bad w-full animate-pulse" />
              </div>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-bad/10 border border-bad/30 rounded-full mb-2">
                  <Icon name="error" className="text-bad" fontSize={14} />
                  <span className="text-[10px] font-black text-bad tracking-widest uppercase">
                    {initErrorCode || "ERR 9999"}
                  </span>
                </div>
                <p className="text-[11px] text-fgdim font-medium max-w-[240px] leading-relaxed">
                  {initError}
                </p>
                <button
                  onClick={() => useSystemStore.getState().initSequence()}
                  className="flex items-center gap-2 px-6 py-2 bg-bad/10 text-bad rounded-xl font-black text-xs tracking-widest hover:bg-bad/20 transition-colors"
                >
                  <Icon name="refresh" fontSize={14} />
                  {t("splash.retry")}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
