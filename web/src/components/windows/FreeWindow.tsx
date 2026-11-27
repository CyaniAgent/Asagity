/**
 * FreeWindow — 自由窗口组件
 *
 * 重构：移除 react-rnd（React 19 不兼容），使用：
 * - re-resizable（缩放，纯函数组件，React 19 兼容）
 * - Pointer Events 自研拖拽（~50 行，完全可控）
 */
import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { Resizable } from "re-resizable";
import { createPortal } from "react-dom";
import { WindowHeader } from "@/components/layout/WindowHeader";
import { useFreeWindowStore } from "@/stores/freeWindow";
import type { ViewType } from "@/types/windows";

/** Window actions exposed to content that renders its own controls. */
export interface FreeWindowActions {
  close: () => void;
  toggleMaximize: () => void;
}

const FreeWindowActionsContext = createContext<FreeWindowActions | null>(null);

export function useFreeWindowActions(): FreeWindowActions | null {
  return useContext(FreeWindowActionsContext);
}

/* ── re-resizable handle 样式（位置 + hover 效果） ─────────── */
const HANDLE_STYLE_BASE: React.CSSProperties = {
  position: "absolute",
  zIndex: 10,
  transition: "background-color 150ms",
};
const RESIZE_HANDLE_STYLES: Record<string, React.CSSProperties & { className: string }> = {
  top:          { ...HANDLE_STYLE_BASE, top: 0, left: 4, right: 4, height: 4, cursor: "n-resize",  className: "hover:bg-brand/15" },
  bottom:       { ...HANDLE_STYLE_BASE, bottom: 0, left: 4, right: 4, height: 4, cursor: "s-resize",  className: "hover:bg-brand/15" },
  left:         { ...HANDLE_STYLE_BASE, left: 0, top: 4, bottom: 4, width: 4, cursor: "w-resize",   className: "hover:bg-brand/15" },
  right:        { ...HANDLE_STYLE_BASE, right: 0, top: 4, bottom: 4, width: 4, cursor: "e-resize",   className: "hover:bg-brand/15" },
  topRight:     { ...HANDLE_STYLE_BASE, top: 0, right: 0, width: 14, height: 14, cursor: "ne-resize", className: "hover:bg-brand/15 rounded-bl" },
  bottomRight:  { ...HANDLE_STYLE_BASE, bottom: 0, right: 0, width: 14, height: 14, cursor: "se-resize", className: "hover:bg-brand/15 rounded-tl" },
  bottomLeft:   { ...HANDLE_STYLE_BASE, bottom: 0, left: 0, width: 14, height: 14, cursor: "sw-resize", className: "hover:bg-brand/15 rounded-tr" },
  topLeft:      { ...HANDLE_STYLE_BASE, top: 0, left: 0, width: 14, height: 14, cursor: "nw-resize", className: "hover:bg-brand/15 rounded-br" },
};

interface FreeWindowProps {
  isOpen: boolean;
  title?: string;
  icon?: string;
  type?: ViewType;
  /** 所属窗口 id：auth 分离退场时用于匹配 closingWindow，让外壳同步渐隐 */
  windowId?: string;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  disableTransfer?: boolean;
  disableMaximize?: boolean;
  disableMinimize?: boolean;
  /** Hide the built-in title bar; content renders its own window controls. */
  hideHeader?: boolean;
  onClose?: () => void;
  onFocus?: () => void;
  /** 本地最小化按钮回写 store，保证任务栏状态一致 */
  onMinimize?: (v: boolean) => void;
  /** 是否为当前活跃窗口（由 store.focusedId 决定） */
  isActive?: boolean;
  /** 最近使用顺序序号，用于非活跃窗口的稳定层叠 */
  stackOrder?: number;
  onRefresh?: () => void;
  onSwitchMode?: () => void;
  /** 自定义标题渲染（用于 Termity 的 Session 选择器等） */
  renderTitle?: () => React.ReactNode;
  children: React.ReactNode;
}

export function FreeWindow({
  isOpen,
  title,
  icon,
  type,
  windowId,
  initialWidth = 450,
  initialHeight = 600,
  minWidth = 300,
  minHeight = 200,
  resizable = true,
  disableTransfer = false,
  disableMaximize = false,
  disableMinimize = false,
  hideHeader = false,
  onClose,
  onFocus,
  onMinimize,
  isActive = false,
  stackOrder = 0,
  onRefresh,
  onSwitchMode,
  renderTitle,
  children,
}: FreeWindowProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [mounted, setMounted] = useState(false);
  // 缩放增量基准：onResize 逐帧用 ref 算 delta，避免 state 闭包过期
  const sizeRef = useRef({ width: initialWidth, height: initialHeight });

  const [visible, setVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [restoreAnim, setRestoreAnim] = useState(false);
  const [contentScrolled, setContentScrolled] = useState(false);
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

  /* ── 初始化：按视口适配缩放 + 居中 + 挂载标记 ────────── */
  useEffect(() => {
    setMounted(true);
    const MARGIN = 32;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // 可用空间（兜底 200，避免极端小屏算出负数）
    const availW = Math.max(200, vw - MARGIN);
    const availH = Math.max(200, vh - MARGIN);
    // 理想尺寸先满足 min，再钳进视口：大屏=初始值，小屏=按屏收缩
    const w = Math.min(Math.max(initialWidth, minWidth), availW);
    const h = Math.min(Math.max(initialHeight, minHeight), availH);
    setSize({ width: Math.floor(w), height: Math.floor(h) });
    sizeRef.current = { width: Math.floor(w), height: Math.floor(h) };
    setPosition({
      x: Math.max(0, (vw - w) / 2),
      y: Math.max(0, (vh - h) / 2),
    });
  }, [initialWidth, initialHeight, minWidth, minHeight]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    };
  }, []);

  /* ── store 最小化状态同步（任务栏调用 setMinimized 时生效） ── */
  useEffect(() => {
    setIsMinimized(!isOpen);
  }, [isOpen]);

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
      setIsMaximized(false);
      setRestoreAnim(false);
    }
  }, [isOpen]);

  /* auth 分离退场进行中：内容（表单/楔形）在 AuthShell 内飞出，但窗口
   * 外壳（圆角框/边框/阴影）不属于它——不渐隐的话内容飞完后窗口框会
   * 突然消失，观感就是"硬关闭"。外壳用同一条曲线同步渐隐兜底。
   * 必须放在 if (!mounted) return null 之前：条件 return 之后不能调用
   * hook，否则首次渲染跳过、二次渲染执行，hook 数量不一致会崩掉整树。 */
  const authClosing = useFreeWindowStore((s) => s.closingWindow);
  const shellExiting =
    authClosing !== null &&
    authClosing === windowId &&
    (type === "login_window" || type === "register_window");
  const shellExitingStyle: React.CSSProperties | undefined = shellExiting
    ? {
        opacity: 0,
        transition: "opacity var(--auth-exit-dur) var(--auth-exit-ease)",
      }
    : undefined;

  if (!mounted) return null;

  /* ── 拖拽：Pointer Events ────────────────────────────────── */
  const handlePointerDown = (e: React.PointerEvent) => {
    // 任何区域按下都激活窗口（含正文与已最大化窗口），不只是拖拽柄
    onFocus?.();
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
      onMinimize?.(false);
      setIsMinimized(false);
      setRestoreAnim(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setRestoreAnim(true);
          addTimer(() => setRestoreAnim(false), 300);
        });
      });
    } else {
      onMinimize?.(true);
      setIsClosing(true);
      addTimer(() => {
        setIsMinimized(true);
        setIsClosing(false);
      }, 350);
    }
    setIsMaximized(false);
  };


  const handleClose = () => {
    // 登录 / 注册窗口的关闭走内容分离退场（store.close 内驱动表单与
    // 楔形向外飞出），不叠加窗口级收拢动画，两种运动会互相打架。
    if (type === "login_window" || type === "register_window") {
      onClose?.();
      return;
    }
    setIsClosing(true);
    addTimer(() => {
      setIsClosing(false);
      onClose?.();
    }, 200);
  };

  /* ── 动画样式 ─────────────────────────────────────────────── */
  const getTransition = () => {
    const ease = "var(--ease-standard, cubic-bezier(0.2, 0.8, 0.2, 1))";
    if (isClosing) {
      if (isMinimized) return `opacity 180ms ${ease}`;
      return `opacity 220ms ${ease}, transform 220ms ${ease}`;
    }
    if (restoreAnim) return `opacity 280ms ${ease}, transform 280ms ${ease}`;
    if (isMaximized) return `opacity 120ms ${ease}`;
    return `opacity 260ms ${ease}, transform 260ms ${ease}`;
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
  const w = isMaximized ? window.innerWidth : size.width;
  const h = isMaximized ? window.innerHeight : size.height;
  const x = isMaximized ? 0 : position.x;
  const y = isMaximized ? 0 : position.y;
  const zIndex = 9990 + (isActive ? 100 : Math.max(0, Math.min(stackOrder, 50)));

  return createPortal(
    <div
      onPointerDown={handlePointerDown}
      onFocus={() => onFocus?.()}
      style={{
        position: "fixed",
        left: x,
        top: y,
        width: isMaximized ? w : undefined,
        height: isMaximized ? h : undefined,
        display: isMinimized ? "none" : undefined,
        zIndex,
        opacity: getOpacity(),
        transform: getTransformStyle(),
        transition: getTransition(),
        willChange: "transform, opacity",
      }}
    >
      <Resizable
        size={isMaximized ? { width: w, height: h } : { width: size.width, height: size.height }}
        onResize={(_event, direction, elementRef) => {
          const newW = parseInt(elementRef.style.width, 10);
          const newH = parseInt(elementRef.style.height, 10);
          if (isNaN(newW) || isNaN(newH)) return;
          // 左/上柄缩放必须同步挪窗口位置，否则视觉上只有右/下在动
          const dW = sizeRef.current.width - newW;
          const dH = sizeRef.current.height - newH;
          sizeRef.current = { width: newW, height: newH };
          setSize({ width: newW, height: newH });
          if (dW !== 0 || dH !== 0) {
            setPosition((p) => ({
              x: /left/i.test(direction)
                ? Math.max(-newW + 80, Math.min(window.innerWidth - 80, p.x + dW))
                : p.x,
              y: /top/i.test(direction)
                ? Math.max(0, Math.min(window.innerHeight - 40, p.y + dH))
                : p.y,
            }));
          }
        }}
        onResizeStop={(_event, _direction, elementRef) => {
          const newW = parseInt(elementRef.style.width, 10);
          const newH = parseInt(elementRef.style.height, 10);
          if (!isNaN(newW) && !isNaN(newH)) {
            setSize({ width: newW, height: newH });
            sizeRef.current = { width: newW, height: newH };
            // 注意：此处不再 setPosition——onResize 已逐帧补偿到位，
            // 用渲染闭包的旧 x/y 会把窗口 snap 回错误位置。
          }
        }}
        minWidth={minWidth}
        minHeight={minHeight}
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
          className={`free-window-shell flex flex-col h-full overflow-hidden ${
            isMaximized
              ? "rounded-none border-0 shadow-none bg-sheet"
              : "rounded-2xl border border-line shadow-2xl bg-sheet/90 backdrop-blur-glassheavy"
          }`}
          style={shellExitingStyle}
        >
          {/* 拖拽手柄 / 标题栏 */}
          {!hideHeader && (
            <div className={`shrink-0 w-full ${isMaximized ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}>
              <div className="window-drag-handle">
                <WindowHeader
                  mode="free"
                  type={type}
                  customTitle={title}
                  customIcon={icon}
                  isMaximized={isMaximized}
                  isMinimized={isMinimized}
                  scrolled={contentScrolled}
                  disableTransfer={disableTransfer}
                  disableMaximize={disableMaximize}
                  disableMinimize={disableMinimize}
                  onClose={handleClose}
                  onToggleMaximize={handleToggleMaximize}
                  onToggleMinimize={handleToggleMinimize}
                  onRefresh={onRefresh}
                  onSwitchMode={onSwitchMode}
                  renderTitle={renderTitle}
                />
              </div>
            </div>
          )}
          {/* 内容区域 */}
          <div
            className="flex-1 overflow-auto custom-scrollbar relative flex flex-col"
            onScroll={(e) => {
              const t = e.currentTarget.scrollTop > 4;
              setContentScrolled((prev) => (prev === t ? prev : t));
            }}
          >
            <FreeWindowActionsContext.Provider
              value={{ close: handleClose, toggleMaximize: handleToggleMaximize }}
            >
              {children}
            </FreeWindowActionsContext.Provider>
          </div>
        </div>
      </Resizable>
    </div>,
    document.body
  );
}
