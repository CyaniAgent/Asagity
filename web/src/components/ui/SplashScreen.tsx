"use client";

import Image from "next/image";
import { useSystemStore } from "@/stores/system";
import { useInstanceStore } from "@/stores/instance";
import { Icon } from "@/components/ui/Icon";

export function SplashScreen() {
  const { isLoadFinished, initProgress, initError, initErrorCode } = useSystemStore();
  const instanceStore = useInstanceStore();

  if (isLoadFinished) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f0f0f] overflow-hidden transition-opacity duration-500">
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 flex items-center justify-center">
        <div className="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-cyan-400/30 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center animate-[fadeInUp_0.8s_cubic-bezier(0.2,0.8,0.2,1)_forwards]">
        <div className="w-32 h-32 flex items-center justify-center mb-16">
          <Image src={instanceStore.logoURL} width={128} height={128} className="w-full h-full object-contain" alt="Logo" />
        </div>

        <div className="relative flex flex-col items-center w-64">
          {!initError ? (
            <div className="flex flex-col items-center w-full">
              <div className="w-full h-[3px] bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all duration-700 ease-out absolute left-0"
                  style={{ width: `${initProgress}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite_linear]" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              <div className="w-full h-1 bg-red-500/20 rounded-full overflow-hidden mb-8">
                <div className="h-full bg-red-500 w-full animate-pulse" />
              </div>
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full mb-2">
                  <Icon name="error" className="text-red-500" fontSize={14} />
                  <span className="text-[10px] font-black text-red-500 tracking-widest uppercase">
                    {initErrorCode || "ERR 9999"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium max-w-[240px] leading-relaxed">
                  {initError}
                </p>
                <button
                  onClick={() => useSystemStore.getState().initSequence()}
                  className="flex items-center gap-2 px-6 py-2 bg-red-500/10 text-red-500 rounded-xl font-black text-xs tracking-widest hover:bg-red-500/20 transition-colors"
                >
                  <Icon name="refresh" fontSize={14} />
                  RETRY
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
