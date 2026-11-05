import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TerminalLine } from "@/types/termity";

/**
 * Termity 多会话（Session）管理。
 *
 * 模型对标 tmux：
 * - server  → Termity 窗口
 * - session → TermitySession（独立的输出缓冲 / 输入行 / 历史游标）
 * - client  → 视图（独立窗口 or 调试器内嵌）
 *
 * 持久化策略（对标 Orca 的 "只存 id 不存 scrollback"）：
 * - **只持久化会话元数据**（id / 名称 / 顺序 / 激活项）
 * - **输出缓冲不持久化**（刷新后为空，仅保留欢迎横幅）
 * - 命令历史不在此 store —— 它是全局共享的 `termityHistory`（bash HISTFILE 语义）
 */

/** 最多同时存在多少个 Session（超出后拒绝新建） */
export const MAX_TERMITY_SESSIONS = 8;

/** 单个 Session 的最大输出行数（超出裁剪最旧） */
export const MAX_TERMITY_SESSION_LINES = 500;

export interface TermitySession {
  id: string;
  name: string;
  /** 该会话独立的输出缓冲 */
  lines: TerminalLine[];
  /** 该会话独立的输入行 */
  input: string;
  /** 该会话独立的 ↑/↓ 历史游标（-1 = 未在浏览历史） */
  historyIndex: number;
  /** 浏览历史前的草稿（类 bash readline） */
  draft: string;
  createdAt: number;
}

/** 落盘形态：仅元数据 */
interface PersistedSessions {
  order: string[];
  activeId: string;
  names: Record<string, string>;
}

function defaultName(index: number): string {
  return `Session ${index}`;
}

function createSession(id: string, name: string): TermitySession {
  return {
    id,
    name,
    lines: [],
    input: "",
    historyIndex: -1,
    draft: "",
    createdAt: Date.now(),
  };
}

/** 新会话的欢迎横幅（与 Termity 初始输出一致） */
export function createTermityBanner(): TerminalLine[] {
  return [
    { type: "system", text: "Termity [v2.0.0]" },
    { type: "system", text: 'Type "help" to see available commands.' },
    { type: "system", text: "" },
  ];
}

function initialSessions() {
  const s1 = createSession("s1", defaultName(1));
  return {
    sessions: { s1 } as Record<string, TermitySession>,
    order: ["s1"],
    activeId: "s1",
  };
}

interface TermitySessionsState {
  sessions: Record<string, TermitySession>;
  /** 会话显示顺序（对应下拉菜单排列） */
  order: string[];
  /** 当前激活的会话 id */
  activeId: string;

  /* ── 会话生命周期 ── */
  createSession: (name?: string) => string | null;
  closeSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  switchSession: (id: string) => void;
  /** 清空某会话的输出（Ctrl+L） */
  clearLines: (id: string) => void;
  resetSession: (id: string) => void;

  /* ── 会话内容读写 ── */
  setLines: (id: string, updater: (prev: TerminalLine[]) => TerminalLine[]) => void;
  setInput: (id: string, value: string) => void;
  setHistoryIndex: (id: string, value: number) => void;
  setDraft: (id: string, value: string) => void;
}

export const useTermitySessionsStore = create<TermitySessionsState>()(
  persist(
    (set, get) => ({
      ...initialSessions(),

      createSession: (name) => {
        const { sessions, order } = get();
        if (order.length >= MAX_TERMITY_SESSIONS) return null;

        // 取最小未占用的序号
        let index = 1;
        while (sessions[`s${index}`]) index += 1;
        const id = `s${index}`;
        const session = createSession(id, name?.trim() || defaultName(index));
        session.lines = createTermityBanner();

        set((s) => ({
          sessions: { ...s.sessions, [id]: session },
          order: [...s.order, id],
          activeId: id,
        }));
        return id;
      },

      closeSession: (id) =>
        set((s) => {
          // 至少保留一个会话（对齐 tmux：所有 session 被杀则 server 退出）
          if (s.order.length <= 1) return s;
          if (!s.sessions[id]) return s;

          const sessions = { ...s.sessions };
          delete sessions[id];
          const order = s.order.filter((x) => x !== id);
          const activeId =
            s.activeId === id
              ? order[Math.max(0, order.length - 1)] ?? order[0]
              : s.activeId;

          return { sessions, order, activeId };
        }),

      renameSession: (id, name) =>
        set((s) => {
          const cur = s.sessions[id];
          if (!cur) return s;
          const trimmed = name.trim();
          if (!trimmed) return s;
          return {
            sessions: { ...s.sessions, [id]: { ...cur, name: trimmed } },
          };
        }),

      switchSession: (id) =>
        set((s) => (s.sessions[id] && s.activeId !== id ? { activeId: id } : s)),

      clearLines: (id) =>
        set((s) => {
          const cur = s.sessions[id];
          if (!cur) return s;
          return {
            sessions: { ...s.sessions, [id]: { ...cur, lines: [] } },
          };
        }),

      resetSession: (id) =>
        set((s) => {
          const cur = s.sessions[id];
          if (!cur) return s;
          return {
            sessions: {
              ...s.sessions,
              [id]: {
                ...cur,
                lines: createTermityBanner(),
                input: "",
                historyIndex: -1,
                draft: "",
              },
            },
          };
        }),

      setLines: (id, updater) =>
        set((s) => {
          const cur = s.sessions[id];
          if (!cur) return s;
          const next = updater(cur.lines);
          if (next === cur.lines) return s;
          return {
            sessions: { ...s.sessions, [id]: { ...cur, lines: next } },
          };
        }),

      setInput: (id, value) =>
        set((s) => {
          const cur = s.sessions[id];
          if (!cur) return s;
          return {
            sessions: { ...s.sessions, [id]: { ...cur, input: value } },
          };
        }),

      setHistoryIndex: (id, value) =>
        set((s) => {
          const cur = s.sessions[id];
          if (!cur) return s;
          return {
            sessions: { ...s.sessions, [id]: { ...cur, historyIndex: value } },
          };
        }),

      setDraft: (id, value) =>
        set((s) => {
          const cur = s.sessions[id];
          if (!cur) return s;
          return {
            sessions: { ...s.sessions, [id]: { ...cur, draft: value } },
          };
        }),
    }),
    {
      name: "asagity-termity-sessions",
      version: 1,
      // 只落盘元数据：输出缓冲不持久化
      partialize: (s) => ({
        order: s.order,
        activeId: s.activeId,
        names: Object.fromEntries(
          s.order.map((id) => [id, s.sessions[id]?.name ?? defaultName(1)])
        ),
      }),
      // 重新水合：用落盘的元数据重建会话（输出为空）
      merge: (persisted, current) => {
        const p = persisted as Partial<PersistedSessions> | undefined;
        if (!p || !Array.isArray(p.order) || p.order.length === 0) return current;

        const sessions: Record<string, TermitySession> = {};
        const order: string[] = [];
        for (const id of p.order) {
          if (!id) continue;
          const idx = Number(id.replace(/^s/, "")) || order.length + 1;
          const session = createSession(id, p.names?.[id] || defaultName(idx));
          session.lines = createTermityBanner();
          sessions[id] = session;
          order.push(id);
        }
        if (order.length === 0) return current;

        const activeId = p.activeId && order.includes(p.activeId) ? p.activeId : order[0];
        return { ...current, sessions, order, activeId };
      },
    }
  )
);
