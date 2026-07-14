"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useInstanceStore } from "@/stores/instance";
import { useFreeWindowStore } from "@/stores/freeWindow";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

export function Welcome() {
  const instanceStore = useInstanceStore();
  const { openFromContext } = useFreeWindowStore();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
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

  const handleOpenAuth = () => {
    openFromContext("auth", { post: null, user: null, chat: null });
  };

  const handleOpenTimeline = () => {
    openFromContext("welcome_timeline", { post: null, user: null, chat: null });
  };

  const handleOpenFederation = () => {
    openFromContext("welcome_federation", { post: null, user: null, chat: null });
  };

  const handleOpenDashboard = () => {
    openFromContext("welcome_dashboard", { post: null, user: null, chat: null });
  };

  const handleOpenTerminal = () => {
    useFreeWindowStore.getState().openTermity();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f] text-white font-sans flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-[#0a0a0f] to-cyan-950/60 transition-transform duration-75 ease-out"
          style={{ transform: `translate3d(${mousePos.x * -8}px, ${mousePos.y * -8}px, 0) scale(1.05)` }}
        />
        <div
          className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{ transform: `translate3d(${mousePos.x * -15}px, ${mousePos.y * -15}px, 0) scale(1.1)` }}
        >
          <div className="absolute top-[20%] left-[55%] w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px]" />
          <div className="absolute top-[25%] left-[60%] w-[200px] h-[200px] bg-cyan-400/20 rounded-full blur-[60px]" />
          <div className="absolute bottom-[30%] left-[20%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px]" />
        </div>
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
        <div
          className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{ transform: `translate3d(${mousePos.x * -50}px, ${mousePos.y * -50}px, 0) scale(1.2)` }}
        >
          <div className="absolute bottom-0 left-[8%] w-[12%] h-[55vh] bg-[#0d0d14] border-t border-cyan-500/20 rounded-t-sm"
            style={{
              backgroundImage: "radial-gradient(rgba(57,197,187,0.3) 1px, transparent 1px)",
              backgroundSize: "6px 10px",
            }}
          />
          <div className="absolute bottom-0 left-[22%] w-[8%] h-[40vh] bg-[#0a0a12] border-t-2 border-indigo-500/20 rounded-t-sm" />
          <div className="absolute bottom-0 left-[42%] w-[16%] h-[70vh] bg-[#0d0d14] border-t border-cyan-400/30 rounded-tl-lg shadow-[0_0_60px_rgba(57,197,187,0.05)]">
            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-0.5 h-[35vh] bg-cyan-400/15 shadow-[0_0_20px_rgba(57,197,187,0.4)]" />
          </div>
          <div className="absolute bottom-0 right-[12%] w-[14%] h-[50vh] bg-[#0a0a12] border-t border-indigo-400/20" />
          <div className="absolute bottom-0 right-[5%] w-[6%] h-[35vh] bg-[#0d0d14] border-t border-cyan-500/15" />
        </div>
        <div
          className="absolute inset-0 transition-transform duration-75 ease-out"
          style={{ transform: `translate3d(${mousePos.x * -70}px, ${mousePos.y * -70}px, 0) scale(1.25)` }}
        >
          <div className="absolute bottom-[25%] right-[8%] px-3 py-1 border border-cyan-500/30 rounded-sm rotate-6 animate-[flicker_4s_infinite] shadow-[0_0_15px_rgba(57,197,187,0.2)]">
            <span className="text-[10px] font-medium text-cyan-400/50 tracking-widest">ASAGITY-SYS</span>
          </div>
        </div>
      </div>

      {/* Right Side Card Stack */}
      <div className="absolute bottom-8 right-8 z-20 flex flex-col gap-4 items-end">
        {/* Panel 1 - Stats Dashboard (light) */}
        <div className="w-[400px] bg-white/90 backdrop-blur-2xl border border-gray-200 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-400 font-normal mb-1">{t("welcome.online")}</span>
              <span className="text-2xl font-bold text-cyan-600">1</span>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-400 font-normal mb-1">{t("welcome.users")}</span>
              <span className="text-2xl font-bold text-gray-700">1</span>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-400 font-normal mb-1">{t("welcome.posts")}</span>
              <span className="text-2xl font-bold text-gray-700">0</span>
            </div>
          </div>
        </div>

        {/* Panel 2 - Instance Info (light) */}
        <div className="w-[400px] bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative">
          <div className="absolute top-0 right-10 w-20 h-0.5 bg-cyan-500 shadow-[0_0_10px_#39C5BB]" />

          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 drop-shadow-[0_0_15px_rgba(57,197,187,0.5)]">
              <Image src={instanceStore.logoURL} width={64} height={64} className="w-full h-full object-contain" alt="Logo" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-normal text-gray-900 mb-1 truncate">
                {instanceStore.name}
              </h1>
              <span className="text-[10px] font-normal text-cyan-600">
                {instanceStore.alias}
              </span>
            </div>
          </div>

          <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
            {instanceStore.description}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleOpenAuth}
              className="w-full bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 text-white font-bold py-3.5 rounded-full shadow-[0_0_15px_rgba(57,197,187,0.3)] hover:shadow-[0_0_25px_rgba(57,197,187,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm"
            >
              <Icon name="arrow_right_16" fontSize={18} />
              {t("welcome.joinInstance")}
            </button>
            <button
              onClick={handleOpenAuth}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-normal py-3 rounded-full transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Icon name="arrow_enter_16" fontSize={18} />
              {t("auth.login")}
            </button>
          </div>
        </div>

        {/* Panel 3 - Browse This Instance (light) */}
        <div className="w-[400px] bg-white/95 backdrop-blur-2xl border border-gray-200 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center">
                <Icon name="earth_16_filled" className="text-cyan-600" fontSize={12} />
              </div>
              <span className="text-xs font-normal text-gray-700">{t("welcome.browseThisInstance")}</span>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <div className="w-2 h-2 rounded-full bg-gray-300" />
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <button
              onClick={handleOpenTimeline}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-normal py-3 rounded-xl border border-gray-200 transition-all flex items-center gap-3 text-sm group"
            >
              <Icon name="timeline_20_filled" className="text-cyan-600 group-hover:scale-110 transition-transform" fontSize={20} />
              <span>{t("welcome.browseTimeline")}</span>
            </button>
            <button
              onClick={handleOpenFederation}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-normal py-3 rounded-xl border border-gray-200 transition-all flex items-center gap-3 text-sm group"
            >
              <Icon name="server_link_20_filled" className="text-cyan-600 group-hover:scale-110 transition-transform" fontSize={20} />
              <span>{t("welcome.federatedInstances")}</span>
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleOpenDashboard}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-800 font-normal py-3 rounded-xl border border-gray-200 transition-all flex items-center gap-3 text-sm group"
              >
                <Icon name="chart_multiple_16_filled" className="text-cyan-600 group-hover:scale-110 transition-transform" fontSize={20} />
                <span>{t("welcome.dataDashboard")}</span>
              </button>
              <button
                onClick={handleOpenTerminal}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-800 font-normal py-3 rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Icon name="terminal" className="text-cyan-600" fontSize={16} />
                {t("welcome.terminal")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
