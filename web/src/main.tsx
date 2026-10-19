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
