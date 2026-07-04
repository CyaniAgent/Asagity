"use client";

import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon = "inbox",
  children,
}: EmptyStateProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t("emptyState.noContent");
  const resolvedDescription = description ?? t("emptyState.description");
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <Icon name={icon} className="w-10 h-10 text-gray-300 dark:text-gray-600" fontSize={40} />
      </div>
      <h3 className="text-lg font-black text-gray-500 dark:text-gray-400 mb-2">{resolvedTitle}</h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-[200px]">{resolvedDescription}</p>
      {children}
    </div>
  );
}
