import { create } from "zustand";

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
  version: "Ver 2026.Indevelopment",
  logoURL: "/favicon.ico",

  setName: (name) => set({ name }),
  setAlias: (alias) => set({ alias }),
  setDescription: (description) => set({ description }),
  setVersion: (version) => set({ version }),
  setLogoURL: (logoURL) => set({ logoURL }),
}));
