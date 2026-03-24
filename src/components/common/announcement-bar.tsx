"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { AnnouncementBar } from "@/lib/queries/announcement-bars";

type AnnouncementBarProps = {
  bars: AnnouncementBar[];
};

export function AnnouncementBar({ bars }: AnnouncementBarProps) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (bars.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bars.length);
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bars.length]);

  function handleMouseEnter() {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function handleMouseLeave() {
    if (bars.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bars.length);
    }, 4000);
  }

  if (bars.length === 0) return null;

  const bar = bars[current];
  if (!bar) return null;

  const barContent = (
    <div
      style={{
        height: "36px",
        backgroundColor: bar.bgColor,
        color: bar.textColor,
        fontSize: "13px",
      }}
      className="flex w-full items-center justify-center px-4"
    >
      <span aria-live="polite" key={current} className="text-center">
        {bar.text}
      </span>
    </div>
  );

  return (
    <div
      role="region"
      aria-label="Avisos da loja"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {bar.linkUrl ? (
        <Link href={bar.linkUrl} className="block">
          {barContent}
        </Link>
      ) : (
        barContent
      )}
    </div>
  );
}
