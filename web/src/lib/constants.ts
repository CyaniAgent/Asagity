export const MIKU_GREEN = "#39C5BB";

export const ERROR_CODES = {
  INIT_FAILED: "ERR 12201",
  NETWORK_TIMEOUT: "ERR 12202",
  CONNECTION_FAILED: "ERR 11500",
  UNKNOWN: "ERR 9999",
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "asagity_access_token",
  REFRESH_TOKEN: "asagity_refresh_token",
  USER_PROFILE: "asagity_user_profile",
  COLOR_MODE: "asagity-color-mode",
  DEV_MODE: "asgt_dev_mode_forever",
  TIMELINE_CACHE: "asgt_timeline_cache",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  ABOUT: "/about",
  DRIVE: "/drive",
  DRIVE_DROP: "/drive/drop",
  SETTINGS: "/settings",
  SETTINGS_PROFILE: "/settings/profile",
  SETTINGS_PERSONALIZATION: "/settings/personalization",
  TOPIC: "/topic",
  TOPIC_CREATE: "/topic/create",
  CHAT: "/chat",
  CHAT_CONTACTS: "/chat/contacts",
  PANEL: "/panel",
  PANEL_SETTINGS: "/panel/settings",
  PANEL_ABOUT: "/panel/about",
  POST_DETAIL: "/post",
  BOOKMARKS: "/bookmarks",
  ANNOUNCEMENT: "/announcement",
  ORGS: "/orgs",
  MORE: "/more",
  DEVELOPER: "/developer",
} as const;

export const PUBLIC_PAGES = ["/", "/login", "/register", "/about"];

export const OFFLINE_ALLOWED_PATHS = ["/", "/settings", "/about"];
