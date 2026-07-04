"use client";

import { useMemo } from "react";
import * as mfm from "mfm-js";

interface MfmNode {
  type: string;
  props: Record<string, string>;
  children?: MfmNode[];
}

interface MfmRendererProps {
  text?: string;
  nodes?: MfmNode[];
  plain?: boolean;
}

export function MfmRenderer({ text, nodes, plain }: MfmRendererProps) {
  const displayNodes = useMemo<MfmNode[]>(() => {
    if (nodes) return nodes;
    if (text) {
      try {
        return mfm.parse(text) as MfmNode[];
      } catch (e) {
        console.error("MFM parse error:", e);
        return [{ type: "text", props: { text } }];
      }
    }
    return [];
  }, [text, nodes]);

  if (plain) {
    return <span>{text || ""}</span>;
  }

  return (
    <span className="mfm-container">
      {displayNodes.map((node, i) => (
        <MfmNodeRenderer key={i} node={node} />
      ))}
    </span>
  );
}

function MfmNodeRenderer({ node }: { node: MfmNode }) {
  switch (node.type) {
    case "text":
      return <>{node.props.text}</>;

    case "bold":
      return (
        <strong className="font-bold">
          {node.children?.map((child, i) => (
            <MfmNodeRenderer key={i} node={child} />
          ))}
        </strong>
      );

    case "italic":
      return (
        <em className="italic">
          {node.children?.map((child, i) => (
            <MfmNodeRenderer key={i} node={child} />
          ))}
        </em>
      );

    case "strike":
      return (
        <del className="line-through opacity-70">
          {node.children?.map((child, i) => (
            <MfmNodeRenderer key={i} node={child} />
          ))}
        </del>
      );

    case "inlineCode":
      return (
        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded font-mono text-sm">
          {node.props.code}
        </code>
      );

    case "mention":
      return (
        <span className="text-cyan-500 cursor-pointer hover:underline">
          @{node.props.username}
          {node.props.host ? `@${node.props.host}` : ""}
        </span>
      );

    case "hashtag":
      return (
        <span className="text-cyan-500 cursor-pointer hover:underline">
          #{node.props.hashtag}
        </span>
      );

    case "url":
      return (
        <a
          href={node.props.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {node.props.url}
        </a>
      );

    case "fn":
      return (
        <span className={`mfm-fn-${node.props.name}`}>
          {node.children?.map((child, i) => (
            <MfmNodeRenderer key={i} node={child} />
          ))}
        </span>
      );

    case "tada":
      return (
        <span className="mfm-tada inline-block">
          {node.children?.map((child, i) => (
            <MfmNodeRenderer key={i} node={child} />
          ))}
        </span>
      );

    case "unicodeEmoji":
      return <>{node.props.emoji}</>;

    case "emojiCode":
      return <>:{node.props.name}:</>;

    default:
      return <span className="opacity-50 text-xs">[{node.type}]</span>;
  }
}
