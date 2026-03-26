"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  FacebookIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedinIcon,
  type LucideIcon,
  MessageCircleIcon,
  Music2Icon,
  PinIcon,
  TwitterIcon,
  YoutubeIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { toggleSocialLink } from "@/actions/toggle-social-link";
import { upsertSocialLink } from "@/actions/upsert-social-link";
import { SOCIAL_PLATFORMS } from "@/actions/upsert-social-link/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { SocialLink } from "@/lib/queries/social-links";

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  youtube: YoutubeIcon,
  tiktok: Music2Icon,
  linkedin: LinkedinIcon,
  whatsapp: MessageCircleIcon,
  pinterest: PinIcon,
};

const urlSchema = z.object({
  url: z.string().trim().url("Informe uma URL válida."),
});

type UrlFormValues = z.infer<typeof urlSchema>;

type PlatformRowProps = {
  platform: (typeof SOCIAL_PLATFORMS)[number];
  link: SocialLink | undefined;
  position: number;
  onSaved: () => void;
};

function PlatformRow({ platform, link, position, onSaved }: PlatformRowProps) {
  const [isPending, startTransition] = useTransition();
  const Icon = PLATFORM_ICONS[platform.value] ?? GlobeIcon;

  const form = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: { url: link?.url ?? "" },
  });

  function handleSave(values: UrlFormValues) {
    startTransition(async () => {
      const result = await upsertSocialLink({
        platform: platform.value,
        url: values.url,
        isActive: link?.isActive ?? true,
        position,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onSaved();
    });
  }

  function handleToggle(isActive: boolean) {
    if (!link) return;

    startTransition(async () => {
      const result = await toggleSocialLink({ id: link.id, isActive });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      onSaved();
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      <span className="w-28 shrink-0 text-sm font-medium">
        {platform.label}
      </span>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSave)}
          className="flex flex-1 items-start gap-2"
        >
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    placeholder={`https://${platform.value}.com/alexo`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl"
            disabled={isPending}
          >
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </Form>

      {link && (
        <Switch
          checked={link.isActive}
          onCheckedChange={handleToggle}
          disabled={isPending}
          aria-label={`${link.isActive ? "Desativar" : "Ativar"} ${platform.label}`}
        />
      )}
    </div>
  );
}

type SocialLinksPanelProps = {
  initialLinks: SocialLink[];
};

export function SocialLinksPanel({ initialLinks }: SocialLinksPanelProps) {
  const router = useRouter();

  function getLinkForPlatform(platformValue: string) {
    return initialLinks.find((l) => l.platform === platformValue);
  }

  return (
    <Card className="border-border/70 bg-background/95 rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Redes sociais</CardTitle>
        <CardDescription>
          Configure os links das redes sociais exibidos no footer. Links
          ativados aparecem na loja.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
        {SOCIAL_PLATFORMS.map((platform, index) => (
          <PlatformRow
            key={platform.value}
            platform={platform}
            link={getLinkForPlatform(platform.value)}
            position={index}
            onSaved={() => router.refresh()}
          />
        ))}
      </CardContent>
    </Card>
  );
}
