export interface UserProfile {
  username: string;
  name?: string;
  avatar_url?: string;
  pubid?: string;
  role?: "admin" | "moderator" | "user";
}

export interface AuthData {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}

export interface HostInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpu: string;
  node_version: string;
  startup_time: number;
  uptime_seconds: number;
  docker: boolean;
}

export interface InstanceMeta {
  name: string;
  description: string;
  version: string;
  theme: string;
}

export interface TimelinePost {
  id: string;
  author: PostUser;
  createdAt: Date | string;
  content: string;
  replyTo?: {
    author: PostUser;
  };
  metrics: PostMetrics;
}

export interface PostUser {
  avatar: string;
  displayName: string;
  username: string;
  instance?: string;
}

export interface PostMetrics {
  replies: number;
  reposts: number;
  reactions: number;
}

export interface PostDetail {
  id: string;
  author: PostUser;
  createdAt: Date | string;
  content: string;
  metrics: PostMetrics;
  replies?: TimelinePost[];
}

export interface UserDetail {
  avatar: string;
  displayName: string;
  username: string;
  instance?: string;
  banner?: string;
  isVerified?: boolean;
  bio?: string;
  location?: string;
  birthday?: string;
  joinedAt?: string;
  stats?: {
    posts: number;
    following: number;
    followers: number;
  };
}

export interface ChatMessage {
  id: string | number;
  name: string;
  avatar: string;
  lastMessage?: string;
  unreadCount?: number;
  online?: boolean;
  isGroup?: boolean;
  members?: number;
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  postCount: number;
  createdAt: Date | string;
}

export interface Notification {
  id: string;
  type: "follow" | "mention" | "reaction" | "repost" | "reply";
  from: PostUser;
  content?: string;
  createdAt: Date | string;
  read: boolean;
}

export interface DriveFile {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  type: "file" | "folder";
  mime_type?: string;
  size?: number;
  hash?: string;
  storage_backend: "local" | "s3" | "webdav";
  storage_key: string;
  thumbnail_key?: string;
  visibility: "private" | "public" | "instance";
  created_at: string;
  updated_at: string;
}

export interface DriveUsage {
  total_files: number;
  total_folders: number;
  used_bytes: number;
  max_bytes: number;
}

export interface FollowCount {
  followers: number;
  following: number;
}
