import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import "./theme/yukinoshita-glacier/dist/yukinoshita-glacier.css";
import "@astryxdesign/core/astryx.css";
import { App } from "./App";

// S3 图标接管（docs/design-standard.md §7）在主题层完成：
// yukinoshita-glacier 主题 defineTheme({ icons }) 覆盖 Astryx 内置 30 个
// 语义名兜底 → Lucide，随主题载入，无需入口注册。

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 引导开屏兜底：正常路径由 SplashScreen 挂载时淡出移除；
// 这里 6s 后仅在 React 已有产出时强制清除（崩溃时保留 spinner，不露白屏）。
window.setTimeout(() => {
  const boot = document.getElementById("boot-splash");
  const root = document.getElementById("root");
  if (boot && root && root.childNodes.length > 0) boot.remove();
}, 6000);
