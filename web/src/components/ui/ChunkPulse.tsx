"use client";

import { useInstanceStore } from "@/stores/instance";

/**
 * ChunkPulse — 懒加载 chunk 的统一视觉回退（Layer C）
 *
 * 与 boot splash / SplashScreen 同一视觉语言：小号 logo 呼吸 +
 * indeterminate 冰蓝扫描线（boot-scan keyframes，定义于 index.html
 * 内联样式并镜像在 globals.css，React 侧可独立使用）。
 *
 * 用于：TopRouter 根路由 fallback、RouteView 兜底等 Suspense 边界。
 */
export function ChunkPulse() {
  const logoURL = useInstanceStore((s) => s.logoURL);

  return (
    <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center gap-5">
      <img
        src={logoURL}
        alt=""
        className="w-10 h-10 object-contain opacity-70 animate-pulse"
      />
      <div className="w-40 h-0.5 rounded-full overflow-hidden bg-fg/10">
        <div className="h-full w-1/3 rounded-full bg-brand animate-[boot-scan_1.15s_cubic-bezier(0.2,0.8,0.2,1)_infinite]" />
      </div>
    </div>
  );
}
