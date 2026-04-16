"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

interface LottieAnimationProps {
  src: string;
  width?: number;
  height?: number;
  loop?: boolean;
}

export function LottieAnimation({
  src,
  width = 280,
  height = 280,
  loop = false,
}: LottieAnimationProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    fetch(src)
      .then((res) => res.json())
      .then((data) => setAnimationData(data as object));
  }, [src]);

  if (!animationData) {
    return (
      <div
        style={{ width, height }}
        className="animate-pulse rounded-full bg-muted"
      />
    );
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      style={{ width, height }}
      autoplay
    />
  );
}
