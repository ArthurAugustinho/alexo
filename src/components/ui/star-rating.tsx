import { StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
};

const sizeMap = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

export function StarRating({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  if (interactive) {
    return (
      <div className={cn("flex items-center gap-0.5", className)}>
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className="transition-transform hover:scale-110 focus:outline-none"
            aria-label={`${star} estrela${star !== 1 ? "s" : ""}`}
          >
            <StarIcon
              className={cn(
                sizeMap[size],
                "transition-colors",
                star <= value
                  ? "fill-amber-400 text-amber-400"
                  : "fill-none text-gray-300",
              )}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {stars.map((star) => (
        <StarIcon
          key={star}
          className={cn(
            sizeMap[size],
            star <= value
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-gray-300",
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}
