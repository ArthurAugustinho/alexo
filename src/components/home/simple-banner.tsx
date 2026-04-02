import Image from "next/image";

import type { SimpleBanner } from "@/lib/queries/simple-banner";

type SimpleBannerProps = {
  banner: SimpleBanner | null;
};

export function SimpleBanner({ banner }: SimpleBannerProps) {
  if (!banner) return null;

  const inner = (
    <div className="relative h-[80px] w-full md:h-[100px]">
      <Image
        src={banner.imageUrl}
        alt="Banner"
        fill
        className="object-cover"
        sizes="100vw"
      />
    </div>
  );

  if (banner.linkUrl) {
    return (
      <a href={banner.linkUrl} className="block w-full overflow-hidden">
        {inner}
      </a>
    );
  }

  return <div className="w-full overflow-hidden">{inner}</div>;
}
