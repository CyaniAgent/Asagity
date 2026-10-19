import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Termity 命令历史（类 bash HISTFILE / HISTSIZE）。
 *
 * 设计对标 bash：
 * - `HISTFILE`  → localStorage key `asagity-termity-history`
 * - `HISTSIZE`  → MAX_TERMITY_HISTORY（超出裁剪最旧）
 * - `ignoredups`→ 连续相同命令不重复入库
 *
 * 与 bash 的差异（有意为之）：
 * - bash 登出时才写盘；浏览器没有可靠的 unload 时机，且 bash 用户要
 *   `history -w` 手动刷盘的痛点不必继承 —— 这里每条命令立即落盘。
 *
 * 仅持久化 `history` 数组；`historyIndex` 之类的瞬态游标留在组件内。
 */
export const MAX_TERMITY_HISTORY = 100;

interface TermityHistoryState {
  /** 按时间正序排列的历史命令（index 0 = 最早） */
  history: string[];
  /** 追加一条命令；连续重复则忽略（HISTCONTROL=ignoredups） */
  push: (command: string) => void;
  /** 清空历史 */
  clear: () => void;
}

export const useTermityHistoryStore = create<TermityHistoryState>()(
  persist(
    (set) => ({
      history: [],

      push: (command) =>
        set((state) => {
          const cmd = command.trim();
          if (!cmd) return state;
          // ignoredups：与上一条完全相同则不重复记录
          if (state.history[state.history.length - 1] === cmd) return state;

          const next = [...state.history, cmd];
          return {
            history:
              next.length > MAX_TERMITY_HISTORY
                ? next.slice(-MAX_TERMITY_HISTORY)
                : next,
          };
        }),

      clear: () => set({ history: [] }),
    }),
    {
      name: "asagity-termity-history",
      version: 1,
      partialize: (state) => ({ history: state.history }),
    }
  )
);
