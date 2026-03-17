import Image from "next/image";
import Link from "next/link";

import { Header } from "@/components/common/header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

type CheckoutCancelPageProps = {
  searchParams: Promise<{
    orderId?: string;
  }>;
};

const CheckoutCancelPage = async ({
  searchParams,
}: CheckoutCancelPageProps) => {
  const { orderId } = await searchParams;

  return (
    <>
      <Header />
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="text-center">
          <Image
            src="/illustration.svg"
            alt="Pagamento não confirmado"
            width={300}
            height={300}
            className="mx-auto"
          />
          <DialogTitle className="mt-4 text-2xl">
            Pagamento não confirmado
          </DialogTitle>
          <DialogDescription className="font-medium">
            {orderId
              ? `Não conseguimos confirmar o pagamento do pedido ${orderId}.`
              : "Não conseguimos confirmar o pagamento."}{" "}
            Você pode tentar novamente ou voltar para a loja.
          </DialogDescription>

          <DialogFooter>
            <Button className="rounded-full" size="lg" asChild>
              <Link href="/">Tentar novamente</Link>
            </Button>
            <Button
              className="rounded-full"
              variant="outline"
              size="lg"
              asChild
            >
              <Link href="/">Voltar para a loja</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CheckoutCancelPage;
