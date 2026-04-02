"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";

type GalleryItem =
  | { type: "image"; url: string }
  | { type: "video"; url: string };

type ProductGalleryProps = {
  images: string[];
  videoUrl?: string | null;
  productName: string;
  activeImageUrl: string;
};

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  return match?.[1] ?? null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match?.[1] ?? null;
}

function getVideoEmbedUrl(url: string): string | null {
  const ytId = getYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}`;
  const vimeoId = getVimeoId(url);
  if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;
  if (/\.(mp4|webm)$/i.test(url)) return url;
  return null;
}

function getVideoThumbnail(url: string): string | null {
  const ytId = getYouTubeId(url);
  return ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
}

function isLocalVideo(url: string): boolean {
  return /\.(mp4|webm)$/i.test(url);
}

function VideoPlayer({ url }: { url: string }) {
  const embedUrl = getVideoEmbedUrl(url);
  if (!embedUrl) return null;

  if (isLocalVideo(url)) {
    return (
      <video
        controls
        className="h-full w-full object-contain"
        src={embedUrl}
      />
    );
  }

  return (
    <iframe
      src={embedUrl}
      className="h-full w-full"
      allowFullScreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    />
  );
}

export function ProductGallery({
  images,
  videoUrl,
  productName,
  activeImageUrl,
}: ProductGalleryProps) {
  const items = useMemo<GalleryItem[]>(() => {
    const imageItems: GalleryItem[] = images.map((url) => ({
      type: "image",
      url,
    }));
    if (videoUrl) {
      return [...imageItems, { type: "video", url: videoUrl }];
    }
    return imageItems;
  }, [images, videoUrl]);

  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = images.indexOf(activeImageUrl);
    return idx >= 0 ? idx : 0;
  });

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Hover zoom state
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [isZooming, setIsZooming] = useState(false);
  const mainImageRef = useRef<HTMLDivElement>(null);

  // Pinch-to-zoom state (for lightbox)
  const pinchRef = useRef({ startDist: 0, scale: 1 });
  const [lightboxScale, setLightboxScale] = useState(1);
  const [lightboxOrigin, setLightboxOrigin] = useState("50% 50%");
  const lastTapRef = useRef(0);

  // Sync active index when variant changes externally
  useEffect(() => {
    const idx = images.indexOf(activeImageUrl);
    if (idx >= 0) {
      setActiveIndex(idx);
    }
  }, [activeImageUrl, images]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  }

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxScale(1);
    setLightboxOpen(true);
  }

  function lightboxPrev() {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    setLightboxScale(1);
  }

  function lightboxNext() {
    setLightboxIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    setLightboxScale(1);
  }

  function handleLightboxTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current.startDist = Math.hypot(dx, dy);
      pinchRef.current.scale = lightboxScale;
    }
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // double-tap: reset zoom
        setLightboxScale(1);
        setLightboxOrigin("50% 50%");
      }
      lastTapRef.current = now;
    }
  }

  function handleLightboxTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newScale = Math.min(
        4,
        Math.max(1, pinchRef.current.scale * (dist / pinchRef.current.startDist)),
      );
      const midX =
        ((e.touches[0].clientX + e.touches[1].clientX) / 2 /
          window.innerWidth) *
        100;
      const midY =
        ((e.touches[0].clientY + e.touches[1].clientY) / 2 /
          window.innerHeight) *
        100;
      setLightboxOrigin(`${midX}% ${midY}%`);
      setLightboxScale(newScale);
    }
  }

  const activeItem = items[activeIndex];

  return (
    <>
      {/* Desktop layout: thumbnails column + main image */}
      <div className="hidden lg:flex lg:gap-3">
        {/* Thumbnails */}
        <div className="flex w-[80px] shrink-0 flex-col gap-2 overflow-y-auto">
          {items.map((item, index) => {
            const thumbnailUrl =
              item.type === "image"
                ? item.url
                : (getVideoThumbnail(item.url) ?? item.url);
            const isActive = index === activeIndex;

            return (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative aspect-square w-full shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  isActive
                    ? "border-foreground"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={thumbnailUrl}
                  alt={`${productName} — miniatura ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg
                      viewBox="0 0 24 24"
                      fill="white"
                      className="size-5"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Main image */}
        <div
          ref={mainImageRef}
          className="group relative flex-1 aspect-[4/5] max-h-[600px] cursor-zoom-in overflow-hidden rounded-2xl bg-gray-50"
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={handleMouseMove}
          onClick={() => openLightbox(activeIndex)}
        >
          {activeItem?.type === "video" ? (
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(activeIndex);
              }}
            >
              <div className="flex h-full items-center justify-center bg-black/5">
                <div className="flex size-16 items-center justify-center rounded-full bg-black/60">
                  <svg viewBox="0 0 24 24" fill="white" className="size-8 pl-1">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {activeItem.url && getVideoThumbnail(activeItem.url) ? (
                <Image
                  src={getVideoThumbnail(activeItem.url)!}
                  alt={`${productName} — vídeo`}
                  fill
                  sizes="(max-width: 1280px) 60vw, 500px"
                  className="object-cover opacity-60"
                />
              ) : null}
            </div>
          ) : activeItem ? (
            <Image
              key={activeItem.url}
              src={activeItem.url}
              alt={productName}
              fill
              priority
              sizes="(max-width: 1280px) 60vw, 500px"
              className={`object-contain transition-transform duration-200 ${
                isZooming ? "scale-[2]" : "scale-100"
              }`}
              style={isZooming ? zoomStyle : undefined}
            />
          ) : null}
        </div>
      </div>

      {/* Mobile layout: horizontal scroll-snap carousel */}
      <div className="lg:hidden">
        <div
          className="flex snap-x snap-mandatory overflow-x-auto [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const container = e.currentTarget;
            const index = Math.round(
              container.scrollLeft / container.offsetWidth,
            );
            setActiveIndex(index);
          }}
          ref={(el) => {
            if (el && items.length > 0) {
              const target = el.children[activeIndex] as HTMLElement | null;
              if (target) {
                el.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
              }
            }
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="relative aspect-square w-full flex-none snap-center"
              onClick={() => openLightbox(index)}
            >
              {item.type === "video" ? (
                <div className="flex h-full items-center justify-center bg-muted">
                  <div className="flex size-16 items-center justify-center rounded-full bg-black/60">
                    <svg viewBox="0 0 24 24" fill="white" className="size-8 pl-1">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  {getVideoThumbnail(item.url) ? (
                    <Image
                      src={getVideoThumbnail(item.url)!}
                      alt={`${productName} — vídeo`}
                      fill
                      sizes="100vw"
                      className="object-cover opacity-60"
                    />
                  ) : null}
                </div>
              ) : (
                <Image
                  src={item.url}
                  alt={`${productName} — foto ${index + 1}`}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        {items.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {items.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Ir para imagem ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-4 bg-foreground"
                    : "w-1.5 bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-h-screen max-w-screen border-0 bg-black/95 p-0"
          onTouchStart={handleLightboxTouchStart}
          onTouchMove={handleLightboxTouchMove}
        >
          <div className="relative flex h-screen items-center justify-center">
            {/* Prev button */}
            {items.length > 1 && (
              <button
                type="button"
                onClick={lightboxPrev}
                className="absolute left-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Imagem anterior"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="size-5"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}

            {/* Media */}
            <div
              className="relative flex h-full w-full items-center justify-center overflow-hidden"
              style={{
                transform: `scale(${lightboxScale})`,
                transformOrigin: lightboxOrigin,
                transition: lightboxScale === 1 ? "transform 0.2s" : "none",
              }}
            >
              {items[lightboxIndex]?.type === "video" ? (
                <div className="aspect-video w-full max-w-4xl">
                  <VideoPlayer url={items[lightboxIndex]!.url} />
                </div>
              ) : items[lightboxIndex] ? (
                <Image
                  src={items[lightboxIndex]!.url}
                  alt={productName}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              ) : null}
            </div>

            {/* Next button */}
            {items.length > 1 && (
              <button
                type="button"
                onClick={lightboxNext}
                className="absolute right-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Próxima imagem"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="size-5"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}

            {/* Counter */}
            {items.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                {lightboxIndex + 1} / {items.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
