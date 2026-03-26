import Image from "next/image";

import type { TrustBadge } from "@/lib/queries/trust-badges";

type TrustBadgesProps = {
  badges: TrustBadge[];
};

export function TrustBadges({ badges }: TrustBadgesProps) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-4">
      {badges.map((badge) => {
        const isLocal = badge.imageUrl.startsWith("/");

        const content = (
          <div className="flex items-center gap-2 opacity-80 transition-opacity hover:opacity-100">
            {isLocal ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={badge.imageUrl}
                alt={badge.label}
                className="h-7 w-auto object-contain"
              />
            ) : (
              <Image
                src={badge.imageUrl}
                alt={badge.label}
                width={28}
                height={28}
                className="h-7 w-auto object-contain"
                unoptimized
              />
            )}
            <span className="whitespace-nowrap text-[11px] text-zinc-500">
              {badge.label}
            </span>
          </div>
        );

        if (badge.linkUrl) {
          return (
            <a
              key={badge.id}
              href={badge.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {content}
            </a>
          );
        }

        return <div key={badge.id}>{content}</div>;
      })}
    </div>
  );
}
