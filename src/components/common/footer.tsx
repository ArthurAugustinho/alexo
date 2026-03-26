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
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getAllCategories } from "@/lib/queries/categories";
import { getActiveFaqItems } from "@/lib/queries/faq";
import { getActiveSocialLinks } from "@/lib/queries/social-links";
import { getActiveTrustBadges } from "@/lib/queries/trust-badges";

import { TrustBadges } from "./trust-badges";

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

const INSTITUTIONAL_LINKS = [
  { href: "/sobre-nos", label: "Sobre nós" },
  { href: "/contato", label: "Contato" },
  { href: "/politica-de-privacidade", label: "Política de privacidade" },
  { href: "/politica-de-troca-e-devolucao", label: "Troca e devolução" },
  { href: "/termos-de-uso", label: "Termos de uso" },
];

export async function Footer() {
  const [faqItems, socialLinks, categories, badges] = await Promise.all([
    getActiveFaqItems(),
    getActiveSocialLinks(),
    getAllCategories(),
    getActiveTrustBadges(),
  ]);

  return (
    <footer className="bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Coluna 1 — Marca + redes sociais */}
          <div className="space-y-5">
            <div>
              <p className="text-2xl font-bold tracking-tight text-white">
                Alexo
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Moda e vestuário com estilo. Descubra as últimas tendências.
              </p>
            </div>

            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((link) => {
                  const Icon = PLATFORM_ICONS[link.platform] ?? GlobeIcon;
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.platform}
                      className="flex size-9 items-center justify-center rounded-full border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-white"
                    >
                      <Icon className="size-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coluna 2 — Categorias */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white">
              Categorias
            </h3>
            {categories.length > 0 ? (
              <ul className="space-y-2">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">—</p>
            )}
          </div>

          {/* Coluna 3 — Links institucionais */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white">
              Informações
            </h3>
            <ul className="space-y-2">
              {INSTITUTIONAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 4 — FAQ */}
          {faqItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white">
                Dúvidas frequentes
              </h3>
              <Accordion type="single" collapsible>
                {faqItems.map((item) => (
                  <AccordionItem
                    key={item.id}
                    value={item.id}
                    className="border-zinc-800"
                  >
                    <AccordionTrigger className="py-3 text-left text-sm text-zinc-300 hover:text-white hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-zinc-500">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-8">
          <p className="text-xs text-zinc-600" suppressHydrationWarning>
            © {new Date().getFullYear()} Alexo. Todos os direitos reservados.
          </p>
          <TrustBadges badges={badges} />
        </div>
      </div>
    </footer>
  );
}
