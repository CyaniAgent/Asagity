import { useState, useEffect, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import { createPortal } from "react-dom";
import { WindowHeader } from "@/components/layout/WindowHeader";
import type { ViewType } from "@/types/windows";

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

  const addTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    setMounted(true);
    setPosition({
      x: (window.innerWidth - initialWidth) / 2,
      y: (window.innerHeight - initialHeight) / 2,
    });
  }, [initialWidth, initialHeight]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setVisible(false);
      setIsClosing(false);
      // Double rAF: first ensures DOM update (hidden), second fires AFTER browser paint
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

  const handleTransitionEnd = () => {
    if (restoreAnim) {
      setRestoreAnim(false);
    }
  };

  const getTransition = () => {
    if (isClosing) {
      if (isMinimized) return "opacity 180ms cubic-bezier(0.4, 0, 1, 1)";
      return "opacity 220ms cubic-bezier(0.4, 0, 1, 1), transform 220ms cubic-bezier(0.4, 0, 1, 1)";
    }
    if (restoreAnim) {
      return "opacity 280ms cubic-bezier(0, 0, 0.2, 1), transform 280ms cubic-bezier(0, 0, 0.2, 1)";
    }
    if (isMaximized) {
      return "all 200ms cubic-bezier(0, 0, 0.2, 1)";
    }
    return "opacity 260ms cubic-bezier(0, 0, 0.2, 1), transform 260ms cubic-bezier(0.16, 1, 0.3, 1)";
  };

  const getTransformStyle = () => {
    if (isClosing && !isMinimized) {
      return "scale(0.92) translateY(12px)";
    }
    if (restoreAnim) {
      return "translateY(0) scale(1)";
    }
    if (!visible && !isClosing) {
      return "scale(0.88) translateY(24px)";
    }
    return "scale(1) translateY(0)";
  };

  const getOpacity = () => {
    if (isClosing && !isMinimized) return 0;
    if (restoreAnim) return 1;
    if (!visible && !isClosing) return 0;
    return 1;
  };

  return createPortal(
    <Rnd
      onMouseDown={() => onFocus?.()}
      size={
        isMaximized
          ? { width: window.innerWidth - 32, height: window.innerHeight - 32 }
          : { width: size.width, height: size.height }
      }
      position={
        isMaximized
          ? { x: 16, y: 16 }
          : position
      }
      onDrag={(_e, d) => {
        setPosition({ x: d.x, y: d.y });
      }}
      onResizeStop={(_e, _direction, ref, _delta, pos) => {
        setSize({
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
        });
        setPosition(pos);
      }}
      dragHandleClassName="window-drag-handle"
      minWidth={300}
      minHeight={200}
      disableDragging={isMaximized}
      enableResizing={resizable && !isMaximized}
      bounds="window"
      style={{
        display: isMinimized ? "none" : undefined,
        zIndex: 9990,
      }}
      className="z-[9990]"
    >
      <div
        style={{
          opacity: getOpacity(),
          transform: getTransformStyle(),
          transition: getTransition(),
          willChange: "transform, opacity",
          width: "100%",
          height: "100%",
        }}
        onTransitionEnd={handleTransitionEnd}
        className="flex flex-col h-full rounded-[30px] border shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-3xl border-gray-200/50 dark:border-gray-800/80"
      >
        {/* Drag Handle / Header */}
        <div className={`shrink-0 w-full ${isMaximized ? "cursor-default" : ""}`}>
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

        {/* Content */}
        <div className="flex-1 overflow-auto custom-scrollbar relative flex flex-col">
          {children}
        </div>

        {/* Resize Handles (Vue-style cyan hover) */}
        {resizable && !isMaximized && (
          <>
            {/* Corners */}
            <div className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-cyan-500/20 transition-colors z-10" />
            <div className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize hover:bg-cyan-500/20 transition-colors z-10" />
            <div className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-cyan-500/20 transition-colors z-10" />
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-cyan-500/20 transition-colors z-10" />
            {/* Edges */}
            <div className="absolute top-0 left-4 right-4 h-1 cursor-n-resize hover:bg-cyan-500/20 transition-colors z-10" />
            <div className="absolute bottom-0 left-4 right-4 h-1 cursor-s-resize hover:bg-cyan-500/20 transition-colors z-10" />
            <div className="absolute left-0 top-4 bottom-4 w-1 cursor-w-resize hover:bg-cyan-500/20 transition-colors z-10" />
            <div className="absolute right-0 top-4 bottom-4 w-1 cursor-e-resize hover:bg-cyan-500/20 transition-colors z-10" />
          </>
        )}
      </div>
    </Rnd>,
    document.body
  );
}
