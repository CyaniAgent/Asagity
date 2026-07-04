"use client";

import { useState, useCallback } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Icon } from "@/components/ui/Icon";

interface ApiErrorFallbackProps {
  error: Error;
  onRetry: () => void;
}

function ApiErrorFallback({ error, onRetry }: ApiErrorFallbackProps) {
  const isNetworkError =
    error.message.includes("Failed to fetch") ||
    error.message.includes("NetworkError") ||
    error.message.includes("network");

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Icon
        name={isNetworkError ? "wifi_off" : "error"}
        className="text-red-400 mb-4"
        fontSize={48}
      />
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {isNetworkError ? "Connection Lost" : "Request Failed"}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">
        {isNetworkError
          ? "Unable to connect to the server. Please check your network connection."
          : error.message || "The request could not be completed."}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl text-sm font-medium hover:bg-cyan-500/20 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
}

export function ApiErrorBoundary({ children }: ApiErrorBoundaryProps) {
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  return (
    <ErrorBoundary
      key={retryKey}
      fallback={<ApiErrorFallback error={new Error("Loading")} onRetry={handleRetry} />}
      onRetry={handleRetry}
    >
      {children}
    </ErrorBoundary>
  );
}
