"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useUserStore } from "@/stores/user";
import { useInstanceStore } from "@/stores/instance";
import { AuthForm } from "@/components/auth/AuthForm";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

export function Welcome() {
  const userStore = useUserStore();
  const instanceStore = useInstanceStore();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showAuth, setShowAuth] = useState(false);
  const { t } = useI18n();

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMousePos({ x, y });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f] text-white font-sans flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Base gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-[#0a0a0f] to-cyan-950/60 transition-transform duration-75 ease-out"
          style={{ transform: `translate3d(${mousePos.x * -8}px, ${mousePos.y * -8}px, 0) scale(1.05)` }}
        />

        {/* Glow orbs */}
        <div
          className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{ transform: `translate3d(${mousePos.x * -15}px, ${mousePos.y * -15}px, 0) scale(1.1)` }}
        >
          <div className="absolute top-[20%] left-[55%] w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px]" />
          <div className="absolute top-[25%] left-[60%] w-[200px] h-[200px] bg-cyan-400/20 rounded-full blur-[60px]" />
          <div className="absolute bottom-[30%] left-[20%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px]" />
        </div>

        {/* Grid floor */}
        <div
          className="absolute inset-0 opacity-30 transition-transform duration-75 ease-out"
          style={{ transform: `translate3d(${mousePos.x * -30}px, ${mousePos.y * -30}px, 0) scale(1.15)` }}
        >
          <div className="absolute bottom-0 w-full h-[45vh] border-t border-cyan-900/40"
            style={{
              backgroundImage: "linear-gradient(rgba(57,197,187,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(57,197,187,0.08) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              transform: "perspective(600px) rotateX(60deg) translateY(80px) scale(3)",
            }}
          />
        </div>

        {/* Skyline buildings */}
        <div
          className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{ transform: `translate3d(${mousePos.x * -50}px, ${mousePos.y * -50}px, 0) scale(1.2)` }}
        >
          {/* Building 1 */}
          <div className="absolute bottom-0 left-[8%] w-[12%] h-[55vh] bg-[#0d0d14] border-t border-cyan-500/20 rounded-t-sm"
            style={{
              backgroundImage: "radial-gradient(rgba(57,197,187,0.3) 1px, transparent 1px)",
              backgroundSize: "6px 10px",
            }}
          />
          {/* Building 2 */}
          <div className="absolute bottom-0 left-[22%] w-[8%] h-[40vh] bg-[#0a0a12] border-t-2 border-indigo-500/20 rounded-t-sm" />
          {/* Building 3 - Tower */}
          <div className="absolute bottom-0 left-[42%] w-[16%] h-[70vh] bg-[#0d0d14] border-t border-cyan-400/30 rounded-tl-lg shadow-[0_0_60px_rgba(57,197,187,0.05)]">
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-0.5 h-[35vh] bg-cyan-400/15 shadow-[0_0_20px_rgba(57,197,187,0.4)]" />
          </div>
          {/* Building 4 */}
          <div className="absolute bottom-0 right-[12%] w-[14%] h-[50vh] bg-[#0a0a12] border-t border-indigo-400/20" />
          {/* Building 5 */}
          <div className="absolute bottom-0 right-[5%] w-[6%] h-[35vh] bg-[#0d0d14] border-t border-cyan-500/15" />
        </div>

        {/* Floating label */}
        <div
          className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{ transform: `translate3d(${mousePos.x * -70}px, ${mousePos.y * -70}px, 0) scale(1.25)` }}
        >
          <div className="absolute bottom-[25%] right-[8%] px-3 py-1 border border-cyan-500/30 rounded-sm rotate-6 animate-[flicker_4s_infinite] shadow-[0_0_15px_rgba(57,197,187,0.2)]">
            <span className="text-[10px] font-medium text-cyan-400/50 tracking-widest">ASAGITY-SYS</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="absolute bottom-8 right-8 z-20 flex flex-col gap-4 items-end">
        {/* Instance Stats */}
        <div className="flex items-center gap-5 px-5 py-2.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/5">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-500 font-normal">{t("welcome.online")}</span>
            <span className="text-sm font-medium text-cyan-400">1</span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-500 font-normal">{t("welcome.users")}</span>
            <span className="text-sm font-medium text-gray-300">1</span>
          </div>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-gray-500 font-normal">{t("welcome.posts")}</span>
            <span className="text-sm font-medium text-gray-300">0</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="w-[400px] bg-white/90 dark:bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          {/* Accent line */}
          <div className="absolute top-0 right-10 w-20 h-0.5 bg-cyan-500 shadow-[0_0_10px_#39C5BB]" />

          {!showAuth ? (
            /* Landing Content */
            <div className="flex flex-col items-center text-center">
              {/* Logo */}
              <div className="w-16 h-16 flex items-center justify-center mb-4 drop-shadow-[0_0_15px_rgba(57,197,187,0.5)]">
                <Image src={instanceStore.logoURL} width={64} height={64} className="w-full h-full object-contain" alt="Logo" />
              </div>

              <h1 className="text-3xl font-normal text-gray-900 dark:text-white mb-1">
                {instanceStore.name}
              </h1>
              <span className="text-[10px] font-normal text-cyan-600 dark:text-cyan-400 mb-4">
                {instanceStore.alias}
              </span>

              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8 font-medium px-2">
                {instanceStore.description}
              </p>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => setShowAuth(true)}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-900 dark:text-white font-normal py-3.5 rounded-full transition-colors flex items-center justify-center gap-2"
                >
                  <Icon name="person" fontSize={18} />
                  {t("auth.login")}
                </button>

                <button
                  onClick={() => {
                    userStore.developerEnter();
                  }}
                  className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-normal py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 transition-colors text-xs flex items-center justify-center gap-2 group"
                >
                  <Icon name="terminal" className="opacity-60 group-hover:opacity-100" fontSize={14} />
                  {t("welcome.directEnter")}
                </button>
              </div>
            </div>
          ) : (
            /* Auth Form */
            <div className="flex flex-col">
              <div className="flex flex-col items-center mb-6">
                <div className="w-12 h-12 flex items-center justify-center mb-3 drop-shadow-[0_0_15px_rgba(57,197,187,0.5)]">
                  <Image src={instanceStore.logoURL} width={48} height={48} className="w-full h-full object-contain" alt="Logo" />
                </div>
                <h2 className="text-2xl font-black tracking-wider text-white">
                  {t("welcome.authLayer")}
                </h2>
                <span className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] uppercase mt-1">
                  {t("welcome.authenticateMatrix")}
                </span>
              </div>

              <AuthForm compact />

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowAuth(false)}
                  className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {t("welcome.back")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
