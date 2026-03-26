import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllFaqItems } from "@/lib/queries/faq";
import { getAllSocialLinks } from "@/lib/queries/social-links";

import { FaqTable } from "./components/faq-table";
import { SocialLinksPanel } from "./components/social-links-panel";

export default async function AdminConfiguracoesFooterPage() {
  const [faqItems, socialLinks] = await Promise.all([
    getAllFaqItems(),
    getAllSocialLinks(),
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
      </TabsList>

      <TabsContent value="faq" className="mt-6">
        <FaqTable initialItems={faqItems} />
      </TabsContent>

      <TabsContent value="social" className="mt-6">
        <SocialLinksPanel initialLinks={socialLinks} />
      </TabsContent>
    </Tabs>
  );
}
