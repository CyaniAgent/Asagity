import { create } from "zustand";

/**
 * 版本展示缺省值（versioning.md §4.4-2 收敛锚点）：
 * 挂载前 / 版本不可用时的诚实缺省；正常启动后由
 * lib/version.ts `initAppVersion()` 用 package.json 语义化值覆盖。
 * 定义在 store 侧而非 lib/version.ts —— version.ts 依赖本 store，
 * 反向引用会形成循环导入（version.ts 的 store 引用仅在函数体内，
 * 方向安全；本文件顶层直接取值则不安全）。
 */
export const DEFAULT_VERSION = "Ver. Dev";

interface InstanceState {
  name: string;
  alias: string;
  description: string;
  version: string;
  logoURL: string;
  setName: (name: string) => void;
  setAlias: (alias: string) => void;
  setDescription: (desc: string) => void;
  setVersion: (version: string) => void;
  setLogoURL: (url: string) => void;
}

export const useInstanceStore = create<InstanceState>()((set) => ({
  name: "Asagity",
  alias: "asagity.io",
  description: "Asagity - 一个为创作者与梦想家打造的多维社交平台。连接、分享，并构建属于你的世界。",
  version: DEFAULT_VERSION,
  logoURL: "/favicon.ico",

  setName: (name) => set({ name }),
  setAlias: (alias) => set({ alias }),
  setDescription: (description) => set({ description }),
  setVersion: (version) => set({ version }),
  setLogoURL: (logoURL) => set({ logoURL }),
}));
