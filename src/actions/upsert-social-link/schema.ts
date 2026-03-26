import { z } from "zod";

export const SOCIAL_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter / X" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "pinterest", label: "Pinterest" },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["value"];

export const upsertSocialLinkSchema = z.object({
  platform: z.string().trim().min(1, "Selecione uma plataforma."),
  url: z.string().trim().url("Informe uma URL válida."),
  isActive: z.boolean().default(true),
  position: z.number().int().min(0).default(0),
});

export type UpsertSocialLinkInput = z.infer<typeof upsertSocialLinkSchema>;
