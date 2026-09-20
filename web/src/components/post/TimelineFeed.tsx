"use client";

import { List } from "react-window";
import { PostItem } from "./PostItem";
import type { TimelinePost } from "@/types/models";

const mockPosts: TimelinePost[] = [
  {
    id: "mock-1",
    author: {
      avatar: "",
      displayName: "CyaniAgent",
      username: "cyani",
      instance: "asagity.io",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    content: "欢迎来到 **Asagity** — 多维社交平台！✨\n\n$[color=#39C5BB 这是一个为创作者与梦想家打造的平台。]\n\n#Asagity #欢迎",
    metrics: { replies: 12, reposts: 34, reactions: 128 },
  },
  {
    id: "mock-2",
    author: {
      avatar: "",
      displayName: "Miku",
      username: "miku",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    content: "今天天气真好，适合出去走走~ 🌸\n\n$[color=#FF6B9D 心情指数：⭐⭐⭐⭐⭐]",
    metrics: { replies: 5, reposts: 8, reactions: 42 },
  },
  {
    id: "mock-3",
    author: {
      avatar: "",
      displayName: "Suzuka",
      username: "suzuka",
      instance: "uma.musume",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    content: "**目标：全 Perfect！** 🏇\n\n刚刚完成了 Level 14+ 的 AP 全通，感觉像在跑最终直线一样刺激！\n\n> 速度是武器，但节奏才是关键。\n\n#maimai #AP",
    metrics: { replies: 23, reposts: 67, reactions: 256 },
  },
  {
    id: "mock-4",
    author: {
      avatar: "",
      displayName: "Producer",
      username: "producer",
      instance: "gakumasu",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    content: "新单曲录制完成！🎤\n\n感谢所有工作人员的辛苦付出，这次的 PV 效果非常棒。\n\n$[color=#FFA500 期待正式发布！]",
    replyTo: {
      author: {
        avatar: "",
        displayName: "Staff",
        username: "staff",
      },
    },
    metrics: { replies: 8, reposts: 15, reactions: 89 },
  },
  {
    id: "mock-5",
    author: {
      avatar: "",
      displayName: "Asagity Dev",
      username: "dev",
      instance: "asagity.io",
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    content: "**Termity v2.0 发布！** 🖥️\n\n全新的 Termity 现已上线，支持更多命令和更好的交互体验。\n\n使用 `help` 查看可用命令列表。\n\n#更新日志 #Termity",
    metrics: { replies: 18, reposts: 42, reactions: 167 },
  },
];

const ITEM_HEIGHT = 200;

function PostRow({ index, style }: { index: number; style: React.CSSProperties }) {
  const post = mockPosts[index];
  if (!post) return null;
  return (
    <div style={style}>
      <PostItem post={post} />
    </div>
  );
}

export function TimelineFeed() {
  return (
    <div className="w-full h-full animate-[fadeIn_0.4s_ease-out] -m-6 lg:-m-10 flex flex-col">
      <div className="flex flex-col min-w-0 bg-white dark:bg-gray-900 w-full h-full">
        <List<{}>
          rowComponent={PostRow}
          rowCount={mockPosts.length}
          rowHeight={ITEM_HEIGHT}
          rowProps={{}}
          overscanCount={5}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}
