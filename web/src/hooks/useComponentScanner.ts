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
 * 深度优先扫描指定根元素的子树，收集可调试的组件节点
 */
function scanDOMTree(root: Element, maxDepth: number = 3): ScannedNode[] {
  const results: ScannedNode[] = [];
  const skipTags = new Set(["script", "style", "noscript", "link", "meta", "br", "hr"]);

  function walk(el: Element, depth: number) {
    if (depth > maxDepth) return;
    if (skipTags.has(el.tagName.toLowerCase())) return;

    const tag = el.tagName.toLowerCase();

    // 只收集有意义的元素：React 根节点、带 data 属性的、header/main/nav/section/article 等语义标签
    const isSemantic = ["header", "main", "nav", "section", "article", "aside", "footer", "form"].includes(tag);
    const hasDebugAttr = el.hasAttribute("data-debug-id") || el.hasAttribute("data-debug");
    const isRoot = el === root;
    const isReactRoot = tag === "div" && el.childElementCount > 0 && depth === 0;

    if (isRoot || isReactRoot || isSemantic || hasDebugAttr) {
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
    for (let i = 0; i < el.children.length && results.length < 100; i++) {
      walk(el.children[i], depth + 1);
    }
  }

  walk(root, 0);
  return results;
}

export function useComponentScanner() {
  const [nodes, setNodes] = useState<ScannedNode[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const rootRef = useRef<Element | null>(null);

  const scan = useCallback((root?: Element | null) => {
    setIsScanning(true);
    const target = root || document.body;
    rootRef.current = target;

    // 使用 requestAnimationFrame 避免阻塞 UI
    requestAnimationFrame(() => {
      const found = scanDOMTree(target);
      setNodes(found);
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

  return { nodes, isScanning, scan, refresh };
}
