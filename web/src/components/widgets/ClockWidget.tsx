"use client";

import { useEffect, useState } from "react";

/** 数字时钟：HH:mm:ss + 年月日，每秒跳动 */
export function ClockWidget() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const date = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}`;

  return (
    <div className="flex flex-col items-center gap-1 py-2 select-none">
      <span className="text-3xl font-bold tabular-nums tracking-wider text-gray-900 dark:text-white">
        {time}
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">{date}</span>
    </div>
  );
}
