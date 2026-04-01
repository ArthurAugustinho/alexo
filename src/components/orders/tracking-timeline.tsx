"use client";

import { ChevronDownIcon, ChevronUpIcon, PackageSearchIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTracking } from "@/hooks/queries/use-tracking";

type TrackingTimelineProps = {
  trackingCode: string;
};

export function TrackingTimeline({ trackingCode }: TrackingTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, isError } = useTracking(trackingCode);

  if (isLoading) {
    return (
      <div className="space-y-2 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="mt-1 size-2 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !data || data.events.length === 0) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-2 text-xs">
        <PackageSearchIcon className="size-4 shrink-0" />
        Nenhuma atualização disponível ainda.
      </div>
    );
  }

  const visibleEvents = expanded ? data.events : data.events.slice(0, 3);

  return (
    <div className="space-y-3 pt-1">
      <div className="space-y-3">
        {visibleEvents.map((event, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`mt-1 size-2 shrink-0 rounded-full ${i === 0 ? "bg-primary" : "bg-muted-foreground/40"}`}
              />
              {i < visibleEvents.length - 1 && (
                <span className="bg-muted-foreground/20 mt-1 w-px flex-1" />
              )}
            </div>
            <div className="pb-2">
              <p className="text-xs font-medium">{event.description}</p>
              {event.status && (
                <p className="text-muted-foreground text-xs">{event.status}</p>
              )}
              <p className="text-muted-foreground text-xs">
                {event.date
                  ? new Date(event.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })
                  : ""}
                {event.time ? ` • ${event.time}` : ""}
                {event.location ? ` • ${event.location}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      {data.events.length > 3 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-0 text-xs"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              <ChevronUpIcon className="size-3" />
              Ver menos
            </>
          ) : (
            <>
              <ChevronDownIcon className="size-3" />
              Ver todos os {data.events.length} eventos
            </>
          )}
        </Button>
      )}
    </div>
  );
}
