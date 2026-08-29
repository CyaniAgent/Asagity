"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useInstanceStore } from "@/stores/instance";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

const serverRules = [
  { id: 1, text: "尊重其他用户，友善交流" },
  { id: 2, text: "禁止发布违法、有害内容" },
  { id: 3, text: "禁止骚扰、欺凌其他用户" },
  { id: 4, text: "禁止发送垃圾信息和广告" },
  { id: 5, text: "保护个人隐私，不泄露他人信息" },
];

const instanceStats = {
  users: 12482,
  notes: 85420,
  federatedInstances: 3,
};

export default function AboutPage() {
  const instanceStore = useInstanceStore();
  const router = useRouter();
  const { t } = useI18n();
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="h-full flex flex-col items-center p-8 relative overflow-y-auto">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Main Card */}
      <div className="z-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl px-12 py-16 rounded-[40px] border border-white/40 dark:border-white/10 shadow-[0_20px_50px_rgba(34,211,238,0.1)] flex flex-col items-center max-w-2xl w-full text-center mb-8">
        {/* Logo */}
        <div className="relative group mb-8">
          <div className="relative w-32 h-32 flex items-center justify-center transform transition-transform duration-500 group-hover:scale-105">
            {instanceStore.logoURL ? (
              <Image src={instanceStore.logoURL} width={128} height={128} className="w-full h-full object-cover rounded-3xl" alt="Logo" />
            ) : (
              <Icon name="server" className="text-cyan-500" fontSize={64} />
            )}
          </div>
        </div>

        {/* Name & Alias */}
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight drop-shadow-sm">
          {instanceStore.name}
        </h1>
        <div className="inline-flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-1.5 rounded-full mb-8 border border-white/20 dark:border-white/5">
          <Icon name="person" className="text-cyan-500" fontSize={16} />
          <span className="text-sm font-bold text-gray-600 dark:text-gray-400 tracking-wider">
            {instanceStore.alias}
          </span>
        </div>

        {/* Description Quote */}
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-10 leading-relaxed font-medium">
          <span className="font-black text-cyan-600 dark:text-cyan-400">「{instanceStore.name}」</span> 使用 Asagity，是使用 ActivityPub 与自研通信协议的去中心化开源平台。
        </p>

        {/* Description Block */}
        <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-[24px] p-6 mb-10 w-full text-left border border-white/30 dark:border-white/5 shadow-inner">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {instanceStore.description}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-10 flex-wrap justify-center">
          <button
            onClick={() => router.push("/about")}
            className="px-4 py-2 rounded-full text-sm font-bold bg-cyan-500 text-white shadow-md shadow-cyan-500/20"
          >
            {t("about.overview")}
          </button>
          <button
            onClick={() => router.push("/about/emojis")}
            className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t("about.emojis")}
          </button>
          <button
            onClick={() => router.push("/about/federation")}
            className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t("about.federation")}
          </button>
          <button
            onClick={() => router.push("/about/charts")}
            className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t("about.charts")}
          </button>
        </div>

        {/* Version */}
        <div className="flex items-center gap-2 group cursor-default">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-xs font-black text-gray-400 dark:text-gray-600 tracking-[0.2em] group-hover:text-cyan-500 transition-colors">
            {instanceStore.version}
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="z-10 w-full max-w-2xl flex flex-col gap-6 mb-8">
        {/* Software Info */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/10 p-6 shadow-sm">
          <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon name="info" className="text-cyan-500" fontSize={20} />
            {t("about.softwareInfo")}
          </h3>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-sm font-bold text-gray-500">{t("about.version")}</span>
            <button
              onClick={() => handleCopy(instanceStore.version, "version")}
              className="flex items-center gap-2 text-sm font-mono font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              {instanceStore.version}
              <Icon name="copy" fontSize={14} className="text-gray-400" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Powered by <span className="font-bold text-cyan-600 dark:text-cyan-400">Asagity</span> — {t("about.decentralizedPlatform")}
          </p>
        </div>

        {/* Operator Info */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/10 p-6 shadow-sm">
          <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon name="person" className="text-cyan-500" fontSize={20} />
            {t("about.operatorInfo")}
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <span className="text-sm font-bold text-gray-500">{t("about.admin")}</span>
              <button
                onClick={() => handleCopy("CyaniAgent", "admin")}
                className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:underline"
              >
                CyaniAgent
                <Icon name="copy" fontSize={14} className="text-gray-400" />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
              <span className="text-sm font-bold text-gray-500">{t("about.contactEmail")}</span>
              <button
                onClick={() => handleCopy("admin@asagity.net", "email")}
                className="flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                admin@asagity.net
                <Icon name="copy" fontSize={14} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Server Rules */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/10 p-6 shadow-sm">
          <button
            onClick={() => setRulesExpanded(!rulesExpanded)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <Icon name="shield" className="text-cyan-500" fontSize={20} />
              {t("about.serverRules")}
            </h3>
            <Icon
              name="chevron_right"
              fontSize={18}
              className={`text-gray-400 transition-transform duration-300 ${rulesExpanded ? "rotate-90" : ""}`}
            />
          </button>
          {rulesExpanded && (
            <div className="mt-4 flex flex-col gap-3">
              {serverRules.map((rule) => (
                <div key={rule.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20">
                    <span className="text-xs font-black text-white">{rule.id}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
                    {rule.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legal Links */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/10 p-6 shadow-sm">
          <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon name="lock" className="text-cyan-500" fontSize={20} />
            {t("about.legalPolicy")}
          </h3>
          <div className="flex flex-col gap-2">
            <button className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{t("about.terms")}</span>
              <Icon name="chevron_right" fontSize={16} className="text-gray-400" />
            </button>
            <button className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{t("about.privacy")}</span>
              <Icon name="chevron_right" fontSize={16} className="text-gray-400" />
            </button>
            <button className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{t("about.contact")}</span>
              <Icon name="chevron_right" fontSize={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/10 p-6 shadow-sm">
          <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon name="dashboard" className="text-cyan-500" fontSize={20} />
            {t("about.instanceStats")}
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
              <p className="text-2xl font-black text-cyan-500">{instanceStats.users.toLocaleString()}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">{t("about.users")}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
              <p className="text-2xl font-black text-purple-500">{instanceStats.notes.toLocaleString()}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">{t("about.posts")}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
              <p className="text-2xl font-black text-amber-500">{instanceStats.federatedInstances}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">{t("about.federatedInstances")}</p>
            </div>
          </div>
        </div>

        {/* Well-known Resources */}
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl rounded-[32px] border border-white/40 dark:border-white/10 p-6 shadow-sm">
          <h3 className="font-black text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Icon name="link" className="text-cyan-500" fontSize={20} />
            {t("about.wellKnown")}
          </h3>
          <div className="flex flex-col gap-2">
            {[
              "/.well-known/nodeinfo",
              "/robots.txt",
              "/manifest.json",
            ].map((path) => (
              <div key={path} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-gray-800">
                <span className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300">{path}</span>
                <Icon name="open_in_new" fontSize={14} className="text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Copied Toast */}
      {copiedField && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-cyan-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-cyan-500/30 animate-[fadeIn_0.2s_ease-out] z-50">
          {t("common.copied")}
        </div>
      )}
    </div>
  );
}
