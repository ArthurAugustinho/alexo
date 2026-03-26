import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllFaqItems } from "@/lib/queries/faq";
import { getAllSocialLinks } from "@/lib/queries/social-links";
import { getAllTrustBadges } from "@/lib/queries/trust-badges";

import { FaqTable } from "./components/faq-table";
import { SocialLinksPanel } from "./components/social-links-panel";
import { TrustBadgeTable } from "./components/trust-badge-table";

export default async function AdminConfiguracoesFooterPage() {
  const [faqItems, socialLinks, trustBadges] = await Promise.all([
    getAllFaqItems(),
    getAllSocialLinks(),
    getAllTrustBadges(),
  ]);

  return (
    <Tabs defaultValue="faq">
      <TabsList className="rounded-2xl">
        <TabsTrigger value="faq" className="rounded-xl">
          FAQ
        </TabsTrigger>
        <TabsTrigger value="social" className="rounded-xl">
          Redes sociais
        </TabsTrigger>
        <TabsTrigger value="badges" className="rounded-xl">
          Selos de segurança
        </TabsTrigger>
      </TabsList>

      <TabsContent value="faq" className="mt-6">
        <FaqTable initialItems={faqItems} />
      </TabsContent>

      <TabsContent value="social" className="mt-6">
        <SocialLinksPanel initialLinks={socialLinks} />
      </TabsContent>

      <TabsContent value="badges" className="mt-6">
        <TrustBadgeTable initialBadges={trustBadges} />
      </TabsContent>
    </Tabs>
  );
}
