import { ShieldAlertIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AccessRestrictedProps = {
  description: string;
  title?: string;
};

export function AccessRestricted({
  description,
  title = "Acesso restrito",
}: AccessRestrictedProps) {
  return (
    <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <ShieldAlertIcon className="size-5" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/admin/dashboard">Voltar ao painel</Link>
        </Button>
        <Button asChild className="rounded-xl">
          <Link href="/">Ir para a loja</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
