import Image from "next/image";

import type { PartnerBrand } from "@/lib/queries/partner-brands";

type BrandShowcaseProps = {
  brands: PartnerBrand[];
};

export function BrandShowcase({ brands }: BrandShowcaseProps) {
  if (brands.length === 0) return null;

  return (
    <section className="px-5">
      <h2 className="mb-4 text-sm font-medium">Marcas parceiras</h2>

      <div className="scrollbar-hide flex flex-nowrap gap-3 overflow-x-auto md:grid md:grid-cols-[repeat(auto-fill,minmax(110px,1fr))] md:overflow-visible">
        {brands.map((brand) => {
          const card = (
            <div className="flex h-[90px] w-[110px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/40 md:w-auto">
              <div className="relative h-12 w-full">
                <Image
                  src={brand.logoUrl}
                  alt={brand.name}
                  fill
                  className="object-contain grayscale transition-all duration-300 hover:grayscale-0"
                  sizes="110px"
                />
              </div>
              <span className="text-muted-foreground w-full truncate text-center text-[12px]">
                {brand.name}
              </span>
            </div>
          );

          if (brand.linkUrl) {
            return (
              <a
                key={brand.id}
                href={brand.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 md:shrink"
              >
                {card}
              </a>
            );
          }

          return (
            <div key={brand.id} className="shrink-0 md:shrink">
              {card}
            </div>
          );
        })}
      </div>
    </section>
  );
}
