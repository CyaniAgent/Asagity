/**
 * AuthField — 登录 / 注册共用的下划线式浮动标签输入框
 *
 * 静止时只有一条细下划线；聚焦时品牌色高亮线从中间向两侧展开，两端渐隐。
 * 标签在空态时垂直居中，聚焦或有值时上浮到输入框上方。
 *
 * 抽成公共组件是为了让登录页和注册页的输入框永远保持一致 —— 之前两边各写一份，
 * 改了一边忘了另一边，视觉上就对不齐了。
 */
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export interface AuthFieldProps {
  label: string;
  icon: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  isDark: boolean;
  suffix?: React.ReactNode;
  autoComplete?: string;
}

export function AuthField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  isDark,
  suffix,
  autoComplete,
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const isFloating = focused || hasValue;

  return (
    <div
      className="m3-login-field relative pt-4 pb-2"
      style={
        {
          "--m3-field-bg": isDark ? "#191919" : "#f9fafb",
          "--m3-field-fg": isDark ? "#ffffff" : "#111827",
        } as React.CSSProperties
      }
    >
      <div className="relative flex h-9 items-center">
        {/* Label floats into the reserved space above the input row */}
        <label
          className={`
            absolute transition-all duration-200 pointer-events-none z-10
            ${
              isFloating
                ? "-top-4 left-0 text-[10px] font-bold tracking-wide"
                : "left-11 top-1/2 -translate-y-1/2 text-[13px]"
            }
            ${focused ? "text-fgaccent" : isDark ? "text-gray-500" : "text-gray-400"}
          `}
        >
          {label}
        </label>

        <div className="pl-3.5 flex items-center pointer-events-none">
          <Icon
            name={icon}
            fontSize={18}
            className={focused ? "text-fgaccent" : isDark ? "text-gray-500" : "text-gray-400"}
          />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? placeholder : ""}
          required={required}
          autoComplete={autoComplete}
          className={`
            h-full w-full bg-transparent px-3 text-[14px] outline-none
            ${isDark ? "text-white" : "text-gray-900"}
            ${isDark ? "placeholder-gray-600" : "placeholder-gray-300"}
          `}
        />
        {suffix && <div className="pr-3">{suffix}</div>}
      </div>

      {/* Resting underline */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-px ${isDark ? "bg-white/15" : "bg-gray-300"}`}
      />
      {/* Accent underline: grows from the centre; the two ends fade out */}
      <div
        className={`absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 text-fgaccent transition-[width,opacity] duration-300 ease-out ${
          focused ? "w-full opacity-100" : "w-0 opacity-0"
        }`}
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent 0%, currentColor 35%, currentColor 65%, transparent 100%)",
        }}
      />
    </div>
  );
}
