export type ViewType =
  | "post"
  | "user"
  | "music"
  | "notifications"
  | "chat"
  | "admin_database"
  | "browser"
  | "error"
  | "termity"
  | "lyrics_window"
  | "playlist_window";

export type RightViewType =
  | "post"
  | "user"
  | "music"
  | "notifications"
  | "chat"
  | "browser";

export type ContextMenuType =
  | "global"
  | "post"
  | "user"
  | "link_internal"
  | "link_external";

export interface ContextMenuItem {
  label: string;
  icon?: string;
  action: () => void;
  color?: string;
  danger?: boolean;
  divider?: boolean;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}
