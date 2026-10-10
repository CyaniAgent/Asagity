"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface ScannedNode {
  id: string;
  selector: string;
  label: string;
  tagName: string;
  depth: number;
  childCount: number;
}

/* ── 受系统保护的核心组件（永不允许隐藏，仅展示） ───────── */
export type ProtectedReason = "html" | "body" | "root" | "portal";

export interface ProtectedNode {
  id: string;
  selector: string;
  label: string;
  tagName: string;
  childCount: number;
  reason: ProtectedReason;
}

let scanIdCounter = 0;

function generateScanId(): string {
  scanIdCounter += 1;
  return `scan-${scanIdCounter}`;
}

/**
 * 为 DOM 元素生成唯一定位选择器
 * 优先使用 id → data-debug-id → 生成唯一路径
 */
function buildSelector(el: Element, index: number): string {
  if (el.id) return `#${el.id}`;
  if (el.getAttribute("data-debug-id")) return `[data-debug-id="${el.getAttribute("data-debug-id")}"]`;

  // 用 class + tag 组合生成选择器
  const tag = el.tagName.toLowerCase();
  const cls = el.className && typeof el.className === "string"
    ? el.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".")
    : "";
  return cls ? `${tag}.${cls}` : `${tag}:nth-of-type(${index + 1})`;
}

function buildLabel(el: Element): string {
  const tag = el.tagName.toLowerCase();
  // 尝试获取有意义的标签
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return `${tag} [${ariaLabel}]`;

  const dataDebugLabel = el.getAttribute("data-debug-label");
  if (dataDebugLabel) return `${tag} [${dataDebugLabel}]`;

  const textContent = el.textContent?.trim().slice(0, 30);
  if (textContent && textContent.length > 0) return `${tag} "${textContent}"`;

  return tag;
}

/**
 * 是否为自由窗口 / 调试器入口等 portal 外壳。
 * FreeWindow 外壳 className="z-[9990]"，调试器浮球 z-[9998]，
 * 隐藏它们 = 窗口自杀，且 buildSelector 产出的 div.z-[9990] 是非法选择器，
 * 因此整体归入受保护名单并剪枝（不再递归其子树，避免列出调试器自己的内部节点）。
 */
function isPortalShell(el: Element): boolean {
  const cls = typeof el.className === "string" ? el.className : "";
  return cls.includes("z-[9990]") || cls.includes("z-[9998]");
}

/**
 * 深度优先扫描指定根元素的子树，收集可调试的组件节点
 * 返回双列表：nodes（可隐藏）+ protectedNodes（受系统保护，仅展示）。
 * 抑制规则：
 * - html / body → 受保护，仍递归子节点（子节点 depth 不增加）
 * - #root（React 挂载点）→ 受保护，仍递归子节点
 * - portal 外壳（z-[9990]/z-[9998]）→ 受保护，剪枝不再递归
 */
function scanDOMTree(root: Element, maxDepth: number = 3): { nodes: ScannedNode[]; protectedNodes: ProtectedNode[] } {
  const results: ScannedNode[] = [];
  const protectedResults: ProtectedNode[] = [];
  const skipTags = new Set(["script", "style", "noscript", "link", "meta", "br", "hr"]);

  function pushProtected(el: Element, reason: ProtectedReason) {
    protectedResults.push({
      id: generateScanId(),
      selector: buildSelector(el, 0),
      label: buildLabel(el),
      tagName: el.tagName.toLowerCase(),
      childCount: el.children.length,
      reason,
    });
  }

  function walk(el: Element, depth: number) {
    if (depth > maxDepth) return;
    const tag = el.tagName.toLowerCase();
    // html / body：受保护，仅透传子节点
    if (tag === "html" || tag === "body") {
      pushProtected(el, tag as ProtectedReason);
      for (let i = 0; i < el.children.length && results.length + protectedResults.length < 120; i++) {
        walk(el.children[i], depth);
      }
      return;
    }
    if (skipTags.has(tag)) return;

    // #root：React 整站挂载点，受保护，仍递归
    if (el.id === "root") {
      pushProtected(el, "root");
      for (let i = 0; i < el.children.length && results.length + protectedResults.length < 120; i++) {
        walk(el.children[i], depth + 1);
      }
      return;
    }

    // portal 外壳：受保护，剪枝不再递归（避免列出调试器自己的内部节点）
    if (isPortalShell(el)) {
      pushProtected(el, "portal");
      return;
    }

    // 只收集有意义的元素：React 根节点、带 data 属性的、header/main/nav/section/article 等语义标签
    // 注意：不再收集 isRoot（body 本身），见上方 body/html 提前返回逻辑
    const isSemantic = ["header", "main", "nav", "section", "article", "aside", "footer", "form"].includes(tag);
    const hasDebugAttr = el.hasAttribute("data-debug-id") || el.hasAttribute("data-debug");
    const isReactRoot = tag === "div" && el.childElementCount > 0 && depth === 0;

    if (isReactRoot || isSemantic || hasDebugAttr) {
      const childCount = el.children.length;
      results.push({
        id: generateScanId(),
        selector: buildSelector(el, 0),
        label: buildLabel(el),
        tagName: tag,
        depth,
        childCount,
      });
    }

    // 递归子节点
    for (let i = 0; i < el.children.length && results.length + protectedResults.length < 120; i++) {
      walk(el.children[i], depth + 1);
    }
  }

  walk(root, 0);
  return { nodes: results, protectedNodes: protectedResults };
}

export function useComponentScanner() {
  const [nodes, setNodes] = useState<ScannedNode[]>([]);
  const [protectedNodes, setProtectedNodes] = useState<ProtectedNode[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const rootRef = useRef<Element | null>(null);

  const scan = useCallback((root?: Element | null) => {
    setIsScanning(true);
    const target = root || document.body;
    rootRef.current = target;

    // 使用 requestAnimationFrame 避免阻塞 UI
    requestAnimationFrame(() => {
      const found = scanDOMTree(target);
      setNodes(found.nodes);
      setProtectedNodes(found.protectedNodes);
      setIsScanning(false);
    });
  }, []);

  const refresh = useCallback(() => {
    scan(rootRef.current);
  }, [scan]);

  // 初始扫描
  useEffect(() => {
    scan(document.body);
  }, [scan]);

  return { nodes, protectedNodes, isScanning, scan, refresh };
}
