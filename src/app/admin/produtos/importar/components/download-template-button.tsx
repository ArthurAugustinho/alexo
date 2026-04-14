"use client";

import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DownloadTemplateButton() {
  return (
    <Button variant="outline" size="sm" asChild>
      <a href="/templates/produtos-template.csv" download>
        <DownloadIcon className="size-4" />
        Baixar template CSV
      </a>
    </Button>
  );
}
