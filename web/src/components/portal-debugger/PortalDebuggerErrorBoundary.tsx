"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import type { RuntimeError } from "@/hooks/useRuntimeErrors";

interface PortalDebuggerErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: RuntimeError) => void;
}

interface PortalDebuggerErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PortalDebuggerErrorBoundary extends Component<
  PortalDebuggerErrorBoundaryProps,
  PortalDebuggerErrorBoundaryState
> {
  constructor(props: PortalDebuggerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<PortalDebuggerErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    if (onError) {
      onError({
        id: `re-boundary-${Date.now()}`,
        type: "render-error",
        severity: "error",
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack || undefined,
        timestamp: Date.now(),
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <p className="text-[13px] text-red-500 font-medium">Component crashed</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 truncate max-w-[300px]">
            {this.state.error?.message}
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-3 px-3 py-1.5 text-[12px] rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
