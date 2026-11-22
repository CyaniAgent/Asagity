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
      <div className="w-20 h-20 rounded-full bg-fg/5 flex items-center justify-center mb-6">
        <Icon name={icon} className="w-10 h-10 text-fgdim" fontSize={40} />
      </div>
      <h3 className="text-[14px] font-semibold text-fg mb-2">{resolvedTitle}</h3>
      <p className="text-[12px] text-fgdim max-w-[200px]">{resolvedDescription}</p>
      {children}
    </div>
  );
}
