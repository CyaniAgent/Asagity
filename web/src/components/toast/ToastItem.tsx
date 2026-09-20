"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { useThemeStore } from "@/stores/theme";
import type { ToastData } from "@/stores/toast";

interface ToastItemProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

export function ToastItem({ toast, onRemove }: ToastItemProps) {
  const isDark = useThemeStore(
    (s) =>
      s.preference === "dark" ||
      (s.preference === "system" && s.systemPreference === "dark")
  );

  // 动画状态：初始 false → 浏览器首帧渲染 → true 触发入场动画
  const [animated, setAnimated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 入场动画：等浏览器完成首帧渲染后再添加动画 class
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimated(true);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = () => {
    if (isExiting) return;
    toast.onClose?.();
    setIsExiting(true);
    // 等退场动画播放完毕后再从 DOM 移除
    timerRef.current = setTimeout(() => onRemove(toast.id), 300);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 入场：首帧后添加 toast-slide-in；退场：添加 toast-slide-out
  const getAnimationClass = () => {
    if (isExiting) return "toast-slide-out";
    if (animated) return "toast-slide-in";
    return "";
  };

  return (
    <div
      className={`flex items-stretch w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border shadow-[0_8px_32px_rgba(0,0,0,0.25)] overflow-hidden backdrop-blur-2xl ${getAnimationClass()}
        ${isDark ? "bg-gray-900/90 border-white/10" : "bg-white/90 border-gray-200"}`}
    >
      {/* ── 左侧：图标 + 内容 ── */}
      <div className="flex items-start gap-3 flex-1 min-w-0 p-3.5">
        {/* 通知源图标 */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
            ${isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-cyan-500/10 text-cyan-600"}`}
        >
          <Icon name={toast.icon ?? "notifications"} fontSize={18} />
        </div>

        {/* 文字内容 */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <p
            className={`text-[13px] font-semibold leading-tight truncate
              ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {toast.title}
          </p>
          <p
            className={`text-[12px] leading-snug line-clamp-2
              ${isDark ? "text-white/50" : "text-gray-500"}`}
          >
            {toast.message}
          </p>
        </div>
      </div>

      {/* ── 右侧：延后 + 关闭 ── */}
      <div className="flex flex-col items-center justify-center gap-1 px-2 shrink-0">
        {toast.onPostpone && (
          <button
            onClick={() => {
              toast.onPostpone?.();
              handleClose();
            }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors
              ${isDark
                ? "text-white/30 hover:text-cyan-400 hover:bg-white/10"
                : "text-gray-400 hover:text-cyan-600 hover:bg-gray-100"
              }`}
            title="延后"
          >
            <Icon name="clock_alarm" fontSize={16} />
          </button>
        )}
        <button
          onClick={handleClose}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors
            ${isDark
              ? "text-white/30 hover:text-white/70 hover:bg-white/10"
              : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            }`}
          title="关闭"
        >
          <Icon name="close" fontSize={14} />
        </button>
      </div>
    </div>
  );
}
