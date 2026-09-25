/**
 * FreeWindow — 自由窗口组件
 *
 * 重构：移除 react-rnd（React 19 不兼容），使用：
 * - re-resizable（缩放，纯函数组件，React 19 兼容）
 * - Pointer Events 自研拖拽（~50 行，完全可控）
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Resizable } from "re-resizable";
import { createPortal } from "react-dom";
import { WindowHeader } from "@/components/layout/WindowHeader";
import type { ViewType } from "@/types/windows";

/* ── re-resizable handle 样式（位置 + hover 效果） ─────────── */
const HANDLE_STYLE_BASE: React.CSSProperties = {
  position: "absolute",
  zIndex: 10,
  transition: "background-color 150ms",
};
const RESIZE_HANDLE_STYLES: Record<string, React.CSSProperties & { className: string }> = {
  top:          { ...HANDLE_STYLE_BASE, top: 0, left: 4, right: 4, height: 4, cursor: "n-resize",  className: "hover:bg-cyan-500/15" },
  bottom:       { ...HANDLE_STYLE_BASE, bottom: 0, left: 4, right: 4, height: 4, cursor: "s-resize",  className: "hover:bg-cyan-500/15" },
  left:         { ...HANDLE_STYLE_BASE, left: 0, top: 4, bottom: 4, width: 4, cursor: "w-resize",   className: "hover:bg-cyan-500/15" },
  right:        { ...HANDLE_STYLE_BASE, right: 0, top: 4, bottom: 4, width: 4, cursor: "e-resize",   className: "hover:bg-cyan-500/15" },
  topRight:     { ...HANDLE_STYLE_BASE, top: 0, right: 0, width: 14, height: 14, cursor: "ne-resize", className: "hover:bg-cyan-500/15 rounded-bl" },
  bottomRight:  { ...HANDLE_STYLE_BASE, bottom: 0, right: 0, width: 14, height: 14, cursor: "se-resize", className: "hover:bg-cyan-500/15 rounded-tl" },
  bottomLeft:   { ...HANDLE_STYLE_BASE, bottom: 0, left: 0, width: 14, height: 14, cursor: "sw-resize", className: "hover:bg-cyan-500/15 rounded-tr" },
  topLeft:      { ...HANDLE_STYLE_BASE, top: 0, left: 0, width: 14, height: 14, cursor: "nw-resize", className: "hover:bg-cyan-500/15 rounded-br" },
};

interface FreeWindowProps {
  isOpen: boolean;
  title?: string;
  icon?: string;
  type?: ViewType;
  initialWidth?: number;
  initialHeight?: number;
  resizable?: boolean;
  disableTransfer?: boolean;
  disableMaximize?: boolean;
  disableMinimize?: boolean;
  onClose?: () => void;
  onFocus?: () => void;
  onRefresh?: () => void;
  onSwitchMode?: () => void;
  children: React.ReactNode;
}

export function FreeWindow({
  isOpen,
  title,
  icon,
  type,
  initialWidth = 450,
  initialHeight = 600,
  resizable = true,
  disableTransfer = false,
  disableMaximize = false,
  disableMinimize = false,
  onClose,
  onFocus,
  onRefresh,
  onSwitchMode,
  children,
}: FreeWindowProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [mounted, setMounted] = useState(false);

  const [visible, setVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [restoreAnim, setRestoreAnim] = useState(false);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const rafRef = useRef<number>(0);

  /* ── 拖拽状态 ─────────────────────────────────────────────── */
  const dragState = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
    return id;
  }, []);

  /* ── 初始化：居中 + 挂载标记 ──────────────────────────────── */
  useEffect(() => {
    setMounted(true);
    setPosition({
      x: Math.max(0, (window.innerWidth - initialWidth) / 2),
      y: Math.max(0, (window.innerHeight - initialHeight) / 2),
    });
  }, [initialWidth, initialHeight]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    };
  }, []);

  /* ── 打开/关闭动画控制 ─────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      setVisible(false);
      setIsClosing(false);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      cancelAnimationFrame(rafRef.current);
      setVisible(false);
      setIsClosing(false);
      setIsMinimized(false);
      setIsMaximized(false);
      setRestoreAnim(false);
    }
  }, [isOpen]);

  if (!mounted) return null;

  /* ── 拖拽：Pointer Events ────────────────────────────────── */
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isMaximized) return;
    const handle = (e.target as HTMLElement).closest(".window-drag-handle");
    if (!handle) return;

    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, startPosX: position.x, startPosY: position.y };

    const onMove = (ev: PointerEvent) => {
      if (!dragState.current) return;
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;
      const newX = dragState.current.startPosX + dx;
      const newY = dragState.current.startPosY + dy;
      // 边界约束：窗口至少露出 80px 标题栏
      setPosition({
        x: Math.max(-size.width + 80, Math.min(window.innerWidth - 80, newX)),
        y: Math.max(0, Math.min(window.innerHeight - 40, newY)),
      });
    };

    const onUp = () => {
      dragState.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    onFocus?.();
  };

  /* ── 最大化 / 最小化 / 关闭 ──────────────────────────────── */
  const handleToggleMaximize = () => {
    setIsMaximized((prev) => {
      if (!prev) setIsMinimized(false);
      return !prev;
    });
    setIsClosing(false);
  };

  const handleToggleMinimize = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setRestoreAnim(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setRestoreAnim(true);
          addTimer(() => setRestoreAnim(false), 300);
        });
      });
    } else {
      setIsClosing(true);
      addTimer(() => {
        setIsMinimized(true);
        setIsClosing(false);
      }, 350);
    }
    setIsMaximized(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    addTimer(() => {
      setIsClosing(false);
      onClose?.();
    }, 200);
  };

  /* ── 动画样式 ─────────────────────────────────────────────── */
  const getTransition = () => {
    if (isClosing) {
      if (isMinimized) return "opacity 180ms cubic-bezier(0.4,0,1,1)";
      return "opacity 220ms cubic-bezier(0.4,0,1,1), transform 220ms cubic-bezier(0.4,0,1,1)";
    }
    if (restoreAnim) return "opacity 280ms cubic-bezier(0,0,0.2,1), transform 280ms cubic-bezier(0,0,0.2,1)";
    if (isMaximized) return "opacity 120ms ease-out";
    return "opacity 260ms cubic-bezier(0,0,0.2,1), transform 260ms cubic-bezier(0.16,1,0.3,1)";
  };

  const getTransformStyle = () => {
    if (isClosing && !isMinimized) return "scale(0.92) translateY(12px)";
    if (restoreAnim) return "translateY(0) scale(1)";
    if (!visible && !isClosing) return "scale(0.88) translateY(24px)";
    return "scale(1) translateY(0)";
  };

  const getOpacity = () => {
    if (isClosing && !isMinimized) return 0;
    if (restoreAnim) return 1;
    if (!visible && !isClosing) return 0;
    return 1;
  };

  /* ── 计算实际窗口尺寸/位置 ────────────────────────────────── */
  const w = isMaximized ? window.innerWidth - 32 : size.width;
  const h = isMaximized ? window.innerHeight - 32 : size.height;
  const x = isMaximized ? 16 : position.x;
  const y = isMaximized ? 16 : position.y;

  return createPortal(
    <div
      onPointerDown={handlePointerDown}
      style={{
        position: "fixed",
        left: x,
        top: y,
        width: isMaximized ? w : undefined,
        height: isMaximized ? h : undefined,
        display: isMinimized ? "none" : undefined,
        zIndex: 9990,
        opacity: getOpacity(),
        transform: getTransformStyle(),
        transition: getTransition(),
        willChange: "transform, opacity",
      }}
      className="z-[9990]"
    >
      <Resizable
        size={isMaximized ? { width: w, height: h } : { width: size.width, height: size.height }}
        onResize={(_event, _direction, elementRef) => {
          const newW = parseInt(elementRef.style.width, 10);
          const newH = parseInt(elementRef.style.height, 10);
          if (!isNaN(newW) && !isNaN(newH)) {
            setSize({ width: newW, height: newH });
          }
        }}
        onResizeStop={(_event, _direction, elementRef) => {
          const newW = parseInt(elementRef.style.width, 10);
          const newH = parseInt(elementRef.style.height, 10);
          if (!isNaN(newW) && !isNaN(newH)) {
            setSize({ width: newW, height: newH });
            setPosition({ x, y });
          }
        }}
        minWidth={300}
        minHeight={200}
        enable={!resizable || isMaximized ? false : undefined}
        handleClasses={{
          top: "resize-top", bottom: "resize-bottom",
          left: "resize-left", right: "resize-right",
          topRight: "resize-topRight", bottomRight: "resize-bottomRight",
          bottomLeft: "resize-bottomLeft", topLeft: "resize-topLeft",
        }}
        handleComponent={{
          top: <div className={RESIZE_HANDLE_STYLES.top.className} style={RESIZE_HANDLE_STYLES.top} />,
          bottom: <div className={RESIZE_HANDLE_STYLES.bottom.className} style={RESIZE_HANDLE_STYLES.bottom} />,
          left: <div className={RESIZE_HANDLE_STYLES.left.className} style={RESIZE_HANDLE_STYLES.left} />,
          right: <div className={RESIZE_HANDLE_STYLES.right.className} style={RESIZE_HANDLE_STYLES.right} />,
          topRight: <div className={RESIZE_HANDLE_STYLES.topRight.className} style={RESIZE_HANDLE_STYLES.topRight} />,
          bottomRight: <div className={RESIZE_HANDLE_STYLES.bottomRight.className} style={RESIZE_HANDLE_STYLES.bottomRight} />,
          bottomLeft: <div className={RESIZE_HANDLE_STYLES.bottomLeft.className} style={RESIZE_HANDLE_STYLES.bottomLeft} />,
          topLeft: <div className={RESIZE_HANDLE_STYLES.topLeft.className} style={RESIZE_HANDLE_STYLES.topLeft} />,
        }}
      >
        <div
          className="flex flex-col h-full rounded-[30px] border shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-3xl border-gray-200/50 dark:border-gray-800/80"
        >
          {/* 拖拽手柄 / 标题栏 */}
          <div className={`shrink-0 w-full ${isMaximized ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}>
            <div className="window-drag-handle">
              <WindowHeader
                mode="free"
                type={type}
                customTitle={title}
                customIcon={icon}
                isMaximized={isMaximized}
                isMinimized={isMinimized}
                disableTransfer={disableTransfer}
                disableMaximize={disableMaximize}
                disableMinimize={disableMinimize}
                onClose={handleClose}
                onToggleMaximize={handleToggleMaximize}
                onToggleMinimize={handleToggleMinimize}
                onRefresh={onRefresh}
                onSwitchMode={onSwitchMode}
              />
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-auto custom-scrollbar relative flex flex-col">
            {children}
          </div>
        </div>
      </Resizable>
    </div>,
    document.body
  );
}
