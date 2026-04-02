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

      <div className="scrollbar-hide flex flex-nowrap gap-4 overflow-x-auto md:flex-wrap md:justify-center md:overflow-visible">
        {brands.map((brand) => {
          const card = (
            <div className="shrink-0 flex flex-col items-center rounded-lg border bg-white p-3 transition-colors hover:bg-muted/40">
              <div className="relative h-[60px] w-[150px]">
                <Image
                  src={brand.logoUrl}
                  alt={brand.name}
                  fill
                  className="object-contain grayscale transition-all duration-300 hover:grayscale-0"
                  sizes="150px"
                />
              </div>
              <span className="text-muted-foreground mt-2 text-center text-xs">
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
              >
                {card}
              </a>
            );
          }

          return <div key={brand.id}>{card}</div>;
        })}
      </div>
    </section>
  );
}
