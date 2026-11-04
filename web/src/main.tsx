import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import "./theme/yukinoshita-glacier/dist/yukinoshita-glacier.css";
import "@astryxdesign/core/astryx.css";
import { App } from "./App";

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
