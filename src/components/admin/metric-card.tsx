import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type MetricCardSource = "real" | "estimated";

type MetricSourceBadgeProps = {
  source: MetricCardSource;
  estimatedReason?: string;
};

type MetricCardProps = {
  label: string;
  value: string;
  source: MetricCardSource;
  estimatedReason?: string;
  description?: string;
};

export function MetricSourceBadge({
  source,
  estimatedReason,
}: MetricSourceBadgeProps) {
  if (source === "real") {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            aria-label="Métrica estimada"
            className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold leading-none text-[#633806]"
            style={{ backgroundColor: "#FAEEDA" }}
          >
            Est.
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-center">
          {estimatedReason ?? "Esta métrica é uma estimativa."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function MetricCard({
  label,
  value,
  source,
  estimatedReason,
  description,
}: MetricCardProps) {
  return (
    <Card className="border-border/70 bg-background/90 relative rounded-3xl">
      <div className="absolute top-4 right-4">
        <MetricSourceBadge
          source={source}
          estimatedReason={estimatedReason}
        />
      </div>
      <CardContent className="space-y-2 p-6">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
          {label}
        </p>
        <p className="text-3xl font-semibold">{value}</p>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
