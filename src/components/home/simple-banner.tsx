import Image from "next/image";

import type { SimpleBanner } from "@/lib/queries/simple-banner";

function BannerImages({ banner }: { banner: SimpleBanner }) {
  return (
    <>
      {/* Imagem desktop — oculta no mobile */}
      <Image
        src={banner.imageUrl}
        alt="Banner"
        width={1440}
        height={200}
        priority
        unoptimized
        className="hidden w-full object-cover md:block"
        style={{ maxHeight: "200px" }}
      />
      {/* Imagem mobile — usa mobileImageUrl se disponível, senão fallback desktop */}
      <Image
        src={banner.mobileImageUrl ?? banner.imageUrl}
        alt="Banner"
        width={750}
        height={200}
        priority
        unoptimized
        className="block w-full object-cover md:hidden"
        style={{ maxHeight: "200px" }}
      />
    </>
  );
}

export function SimpleBanner({ banner }: { banner: SimpleBanner | null }) {
  if (!banner) return null;

  return (
    <div className="w-full overflow-hidden">
      {banner.linkUrl ? (
        <a href={banner.linkUrl} className="block w-full">
          <BannerImages banner={banner} />
        </a>
      ) : (
        <BannerImages banner={banner} />
      )}
    </div>
  );
}
