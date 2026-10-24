import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WidgetType = "clock" | "memo";

export interface WidgetItem {
  id: string;
  type: WidgetType;
  /** 组件私有数据（如便签正文），按 id 隔离 */
  data?: Record<string, string>;
}

interface WidgetsState {
  items: WidgetItem[];
  /** 编辑模式（瞬态，不持久化）：显示删除/排序手柄与底部添加栏 */
  isEditing: boolean;
  setEditing: (v: boolean) => void;
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  moveWidget: (id: string, dir: -1 | 1) => void;
  updateWidgetData: (id: string, data: Record<string, string>) => void;
  resetWidgets: () => void;
}

let nextId = 1;
const uid = () => `w${Date.now().toString(36)}${nextId++}`;

const DEFAULT_ITEMS: WidgetItem[] = [
  { id: "clock-default", type: "clock" },
  { id: "memo-default", type: "memo", data: { text: "" } },
];

export const useWidgetsStore = create<WidgetsState>()(
  persist(
    (set) => ({
      items: DEFAULT_ITEMS,
      isEditing: false,

      setEditing: (isEditing) => set({ isEditing }),

      addWidget: (type) =>
        set((s) => ({
          items: [
            ...s.items,
            type === "memo"
              ? { id: uid(), type, data: { text: "" } }
              : { id: uid(), type },
          ],
        })),

      removeWidget: (id) =>
        set((s) => ({ items: s.items.filter((w) => w.id !== id) })),

      moveWidget: (id, dir) =>
        set((s) => {
          const i = s.items.findIndex((w) => w.id === id);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= s.items.length) return s;
          const items = [...s.items];
          [items[i], items[j]] = [items[j], items[i]];
          return { items };
        }),

      updateWidgetData: (id, data) =>
        set((s) => ({
          items: s.items.map((w) =>
            w.id === id ? { ...w, data: { ...w.data, ...data } } : w
          ),
        })),

      resetWidgets: () => set({ items: DEFAULT_ITEMS }),
    }),
    {
      name: "asagity-widgets",
      // 只持久化布局与组件数据，编辑态为瞬态
      partialize: (s) => ({ items: s.items }),
    }
  )
);
