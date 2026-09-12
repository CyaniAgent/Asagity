"use client";

import { lazy } from "react";
// Image: replaced next/image with standard img
import { ClientLink as Link } from "@/components/ui/ClientLink";
import { useRouter } from "@/hooks/useRouter";
import { useI18n } from "@/components/providers/I18nProvider";

const MainLayout = lazy(() => import("@/components/layout/MainLayout").then((m) => ({ default: m.MainLayout })));

export default function NotFound() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <MainLayout notFound>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex items-center gap-10 max-w-xl">
          <img
            src="/images/system/404.png"
            alt="404"
            width={200}
            height={200}
            className="w-[200px] h-[200px] object-contain shrink-0"
          />
          <div className="flex flex-col gap-3">
            <h1 className="text-7xl font-bold text-gray-900 dark:text-white tracking-tight">
              404
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">
              {t("notFound.message")}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-xl transition-colors"
              >
                {t("notFound.back")}
              </button>
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                {t("notFound.goHome")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
