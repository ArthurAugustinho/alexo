"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type ProductDescriptionProps = {
  description: string;
};

export function ProductDescription({ description }: ProductDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const lines = description.split("\n");
  const isLong = lines.length > 3 || description.length > 300;

  const preview =
    !expanded && isLong
      ? lines.slice(0, 3).join("\n").slice(0, 300)
      : description;

  return (
    <section className="border-t px-5 py-8 lg:px-0">
      <h2 className="mb-3 text-lg font-semibold">Descrição</h2>
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
          {preview}
          {!expanded && isLong && "..."}
        </p>
        {isLong && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-0 text-sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <ChevronUpIcon className="size-4" />
                Ver menos
              </>
            ) : (
              <>
                <ChevronDownIcon className="size-4" />
                Ver descrição completa
              </>
            )}
          </Button>
        )}
      </div>
    </section>
  );
}
