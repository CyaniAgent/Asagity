"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    setMounted(true);
    setPosition({
      x: (window.innerWidth - initialWidth) / 2,
      y: (window.innerHeight - initialHeight) / 2,
    });
  }, [initialWidth, initialHeight]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const handleToggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) setIsMinimized(false);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) setIsMaximized(false);
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
        opacity: visible && !isMinimized ? 1 : 0,
        transform: visible && !isMinimized ? "scale(1) translateY(0)" : "scale(0.9) translateY(20px)",
        transition: isMaximized
          ? "all 0.5s cubic-bezier(0.4,0,0.2,1)"
          : "opacity 0.4s cubic-bezier(0.34,1.56,0.64,1), transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
      }}
      className="z-[9990]"
    >
      <div
        className={`flex flex-col h-full rounded-[30px] border shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-3xl border-gray-200/50 dark:border-gray-800/80 ${
          isMaximized ? "duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" : ""
        }`}
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
              onClose={onClose}
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
