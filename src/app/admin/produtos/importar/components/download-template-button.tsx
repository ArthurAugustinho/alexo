"use client";

import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DownloadTemplateButton() {
  return (
    <Button variant="outline" asChild>
      <a href="/templates/alexo_importacao_v5_final.xlsx" download>
        <DownloadIcon className="size-4" />
        Baixar planilha template
      </a>
    </Button>
  );
}
