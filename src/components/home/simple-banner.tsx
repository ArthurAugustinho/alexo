import Image from "next/image";

import type { SimpleBanner } from "@/lib/queries/simple-banner";

type SimpleBannerProps = {
  banner: SimpleBanner | null;
};

export function SimpleBanner({ banner }: SimpleBannerProps) {
  if (!banner) return null;

  const content = (
    <div className="relative h-[100px] w-full overflow-hidden">
      <Image
        src={banner.imageUrl}
        alt="Banner promocional"
        fill
        className="object-cover"
        priority
      />
    </div>
  );

  if (banner.linkUrl) {
    return (
      <a href={banner.linkUrl} className="block w-full">
        {content}
      </a>
    );
  }

  return content;
}
