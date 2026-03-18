"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { type SeasonalBanner } from "@/lib/storefront-showcase-schema";

type BannerCarouselProps = {
  ariaLabel?: string;
  autoRotateIntervalMs?: number;
  banners: SeasonalBanner[];
};

export function BannerCarousel({
  ariaLabel = "Banners sazonais em destaque",
  autoRotateIntervalMs = 6000,
  banners,
}: BannerCarouselProps) {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    setCurrentBannerIndex(0);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentBannerIndex((previousIndex) =>
        previousIndex === banners.length - 1 ? 0 : previousIndex + 1,
      );
    }, autoRotateIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRotateIntervalMs, banners.length]);

  function goToBanner(index: number) {
    setCurrentBannerIndex(index);
  }

  function goToPreviousBanner() {
    setCurrentBannerIndex((previousIndex) =>
      previousIndex === 0 ? banners.length - 1 : previousIndex - 1,
    );
  }

  function goToNextBanner() {
    setCurrentBannerIndex((previousIndex) =>
      previousIndex === banners.length - 1 ? 0 : previousIndex + 1,
    );
  }

  if (banners.length === 0) {
    return (
      <section role="region" aria-label={ariaLabel}>
        <div className="border-border/70 bg-background rounded-[32px] border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
          Nenhum banner sazonal vigente no momento.
        </div>
      </section>
    );
  }

  return (
    <section role="region" aria-label={ariaLabel} className="space-y-4">
      <div className="border-border/70 bg-background relative overflow-hidden rounded-[32px] border shadow-sm">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
        >
          {banners.map((banner, index) => {
            const isExternalLink = banner.linkUrl.startsWith("http");

            return (
              <Link
                key={banner.id}
                href={banner.linkUrl}
                target={isExternalLink ? "_blank" : undefined}
                rel={isExternalLink ? "noreferrer" : undefined}
                className="relative block min-w-full"
              >
                <div className="relative aspect-[4/3] md:aspect-[16/9]">
                  <Image
                    src={banner.imageUrl}
                    alt={`${banner.title} — ${banner.subtitle}`}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.82),rgba(9,9,11,0.18))]" />

                  <div className="absolute inset-x-0 bottom-0 flex h-full items-end p-6 md:p-10">
                    <div className="max-w-xl space-y-3 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">
                        Campanha sazonal
                      </p>
                      <h2 className="text-2xl font-semibold md:text-4xl">
                        {banner.title}
                      </h2>
                      <p className="max-w-lg text-sm text-white/80 md:text-base">
                        {banner.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {banners.length > 1 ? (
          <>
            <div className="absolute inset-y-0 left-0 flex items-center p-3 md:p-5">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="rounded-full bg-white/88 text-foreground hover:bg-white"
                aria-label="Banner anterior"
                onClick={goToPreviousBanner}
              >
                <ChevronLeftIcon />
              </Button>
            </div>

            <div className="absolute inset-y-0 right-0 flex items-center p-3 md:p-5">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="rounded-full bg-white/88 text-foreground hover:bg-white"
                aria-label="Próximo banner"
                onClick={goToNextBanner}
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </>
        ) : null}
      </div>

      {banners.length > 1 ? (
        <div className="flex items-center justify-center gap-2">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Ir para o banner ${index + 1}`}
              aria-current={index === currentBannerIndex}
              className={`h-2.5 rounded-full transition-all ${
                index === currentBannerIndex
                  ? "bg-foreground w-8"
                  : "bg-muted-foreground/30 w-2.5"
              }`}
              onClick={() => goToBanner(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
