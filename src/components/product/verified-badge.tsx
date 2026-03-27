import { ShieldCheckIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type VerifiedBadgeProps = {
  isVerified: boolean;
};

export function VerifiedBadge({ isVerified }: VerifiedBadgeProps) {
  if (!isVerified) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-default items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <ShieldCheckIcon className="size-3" />
            Fornecedor verificado
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Produto de fornecedor verificado pela Alexo
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
