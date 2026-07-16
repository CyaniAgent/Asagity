"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import { createPortal } from "react-dom";
import { WindowHeader } from "@/components/layout/WindowHeader";

interface FreeWindowProps {
  isOpen: boolean;
  title?: string;
  icon?: string;
  type?: string;
  initialWidth?: number;
  initialHeight?: number;
  resizable?: boolean;
  disableTransfer?: boolean;
  disableMaximize?: boolean;
  disableMinimize?: boolean;
  onClose?: () => void;
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
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
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
      if (isMinimized) return "opacity 200ms ease";
      return "opacity 350ms ease, transform 350ms ease";
    }
    if (restoreAnim) {
      return "opacity 300ms ease, transform 300ms ease";
    }
    if (isMaximized) {
      return "all 200ms ease";
    }
    return "all 200ms ease";
  };

  const getTransformStyle = () => {
    if (isClosing && !isMinimized) {
      return "translateY(100vh) scale(0.8)";
    }
    if (restoreAnim) {
      return "translateY(0) scale(1)";
    }
    if (!visible && !isClosing) {
      return "scale(0.95) translateY(10px)";
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
      onDragStop={(_e, d) => {
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
        opacity: getOpacity(),
        transform: getTransformStyle(),
        transition: getTransition(),
        zIndex: 9990,
      }}
      className="z-[9990]"
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        className={`flex flex-col h-full rounded-[30px] border shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-3xl border-gray-200/50 dark:border-gray-800/80`}
      >
        {/* Drag Handle / Header */}
        <div className={`shrink-0 w-full ${isMaximized ? "cursor-default" : ""}`}>
          <div className="window-drag-handle">
            <WindowHeader
              mode="free"
              type={type as Parameters<typeof WindowHeader>[0]["type"]}
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
