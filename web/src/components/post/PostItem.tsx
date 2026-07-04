"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { zhCN } from "date-fns/locale"; // TODO: Dynamic locale based on i18n locale
import { useSplitViewStore } from "@/stores/splitView";
import { useI18n } from "@/components/providers/I18nProvider";
import { useContextMenuStore } from "@/stores/contextMenu";
import { MfmRenderer } from "./MfmRenderer";
import { Icon } from "@/components/ui/Icon";

interface PostUser {
  avatar: string;
  displayName: string;
  username: string;
  instance?: string;
}

interface PostMetrics {
  replies: number;
  reposts: number;
  reactions: number;
}

export interface TimelinePost {
  id: string;
  author: PostUser;
  createdAt: Date | string;
  content: string;
  replyTo?: { author: PostUser };
  metrics: PostMetrics;
}

interface PostItemProps {
  post: TimelinePost;
  isDetailView?: boolean;
}

export function PostItem({ post, isDetailView }: PostItemProps) {
  const router = useRouter();
  const splitViewStore = useSplitViewStore();
  const contextMenuStore = useContextMenuStore();
  const { t } = useI18n();

  const relativeTime = useMemo(
    () => formatDistanceToNowStrict(new Date(post.createdAt), { addSuffix: true, locale: zhCN }),
    [post.createdAt]
  );

  const fullUsername = useMemo(() => {
    const base = `@${post.author.username}`;
    return post.author.instance ? `${base}@${post.author.instance}` : base;
  }, [post.author]);

  const handleClick = () => {
    if (!isDetailView) {
      splitViewStore.openPost(post);
    }
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/user/${post.author.username}`);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    contextMenuStore.openAt(e.clientX, e.clientY, "post", post);
  };

  return (
    <article
      className={`flex gap-4 p-4 border-b border-gray-100 dark:border-gray-800/60 transition-colors animate-[fadeIn_0.3s_ease-out] ${
        isDetailView ? "" : "cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
      }`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-1">
        <button
          onClick={handleUserClick}
          className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-cyan-400 transition-all cursor-pointer shadow-sm block"
        >
          {post.author.avatar ? (
            <Image src={post.author.avatar} width={40} height={40} className="w-full h-full object-cover" alt={post.author.displayName} />
          ) : (
            <div className="w-full h-full bg-cyan-500/20 flex items-center justify-center">
              <Icon name="person" className="text-cyan-500" fontSize={20} />
            </div>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-start flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5 truncate w-full">
              <span
                className="font-bold text-[15px] truncate cursor-pointer hover:underline text-gray-900 dark:text-gray-100 decoration-cyan-400"
                onClick={handleUserClick}
              >
                {post.author.displayName}
              </span>
              <span className="text-sm text-gray-500 truncate cursor-pointer hover:text-cyan-600 transition-colors">
                {fullUsername}
              </span>
            </div>

            {/* Instance Badge */}
            {post.author.instance && (
              <div className="flex items-center">
                <span className="text-[11px] font-medium bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-100 dark:border-cyan-800/50 flex items-center gap-1">
                  <Icon name="public" fontSize={12} />
                  {post.author.instance}
                </span>
              </div>
            )}
          </div>

          {/* Relative Time */}
          <Link
            href={`/post/${post.id}`}
            className="text-sm text-gray-400 hover:underline shrink-0 tabular-nums self-start pt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {relativeTime}
          </Link>
        </div>

        {/* Reply Context */}
        {post.replyTo && (
          <div className="flex items-center gap-1 text-[13px] text-gray-500 mb-0.5 mt-0.5">
            <Icon name="subdirectory_arrow_right" className="text-cyan-500 bg-cyan-50 dark:bg-cyan-900/40 rounded p-0.5" fontSize={16} />
            <span className="flex items-center gap-1">
              {t("post.repliedTo")}
              <span className="font-medium text-cyan-600 dark:text-cyan-400 cursor-pointer hover:underline flex items-center gap-1">
                {post.replyTo.author.avatar && (
                  <Image src={post.replyTo.author.avatar} width={16} height={16} className="w-4 h-4 rounded-full object-cover" alt="" />
                )}
                {post.replyTo.author.displayName}
              </span>
              {t("post.post")}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="text-[15px] leading-relaxed break-words text-gray-800 dark:text-gray-200">
          <MfmRenderer text={post.content} />
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-4 mt-2 -ml-2 text-gray-500">
          <button className="flex items-center gap-1.5 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 transition-all rounded-full px-2.5 py-1 text-sm">
            <Icon name="chat_bubble" fontSize={18} />
            {post.metrics.replies ? <span>{post.metrics.replies}</span> : null}
          </button>
          <button className="flex items-center gap-1.5 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/50 transition-all rounded-full px-2.5 py-1 text-sm">
            <Icon name="repeat" fontSize={18} />
            {post.metrics.reposts ? <span>{post.metrics.reposts}</span> : null}
          </button>
          <button className="flex items-center gap-1.5 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-all rounded-full px-2.5 py-1 text-sm">
            <Icon name="add" fontSize={18} />
            {post.metrics.reactions ? <span>{post.metrics.reactions}</span> : null}
          </button>
          <button className="flex items-center gap-1.5 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 transition-all rounded-full px-2.5 py-1 text-sm ml-auto">
            <Icon name="more_horiz" fontSize={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
