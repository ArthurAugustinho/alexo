import Image from "next/image";

import type { SimpleBanner } from "@/lib/queries/simple-banner";

export function SimpleBanner({ banner }: { banner: SimpleBanner | null }) {
  if (!banner) return null;

  return (
    <div className="w-full">
      {banner.linkUrl ? (
        <a href={banner.linkUrl} className="block w-full">
          <div className="relative h-[200px] w-full overflow-hidden">
            <Image
              src={banner.imageUrl}
              alt="Banner"
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </a>
      ) : (
        <div className="relative h-[200px] w-full overflow-hidden">
          <Image
            src={banner.imageUrl}
            alt="Banner"
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}
    </div>
  );
}
