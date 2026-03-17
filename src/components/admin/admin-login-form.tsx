"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyholeIcon, MailIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
  email: z.email("Informe um e-mail v\u00e1lido."),
  password: z
    .string("Senha inv\u00e1lida.")
    .min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

type FormValues = z.infer<typeof formSchema>;

type AdminLoginFormProps = {
  alertMessage?: string;
};

export function AdminLoginForm({ alertMessage }: AdminLoginFormProps) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: FormValues) {
    await authClient.signIn.email({
      email: values.email,
      password: values.password,
      fetchOptions: {
        onSuccess: () => {
          router.push("/admin/dashboard");
          router.refresh();
        },
        onError: (ctx) => {
          if (ctx.error.code === "USER_NOT_FOUND") {
            form.setError("email", {
              message: "E-mail n\u00e3o encontrado.",
            });
            toast.error("E-mail n\u00e3o encontrado.");
            return;
          }

          if (ctx.error.code === "INVALID_EMAIL_OR_PASSWORD") {
            const message = "E-mail ou senha inv\u00e1lidos.";
            form.setError("email", { message });
            form.setError("password", { message });
            toast.error(message);
            return;
          }

          toast.error(ctx.error.message);
        },
      },
    });
  }

  return (
    <Card className="border-border/70 bg-background/95 rounded-3xl shadow-lg shadow-primary/5">
      <CardHeader className="space-y-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <LockKeyholeIcon className="size-5" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl">Painel Administrativo</CardTitle>
          <CardDescription>
            Use o seu e-mail corporativo e senha para acessar o painel.
          </CardDescription>
        </div>
        {alertMessage ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {alertMessage}
          </div>
        ) : null}
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MailIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input
                        placeholder="voce@empresa.com"
                        className="h-11 rounded-xl pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <LockKeyholeIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input
                        type="password"
                        placeholder="Digite sua senha"
                        className="h-11 rounded-xl pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="h-11 w-full rounded-xl">
              Entrar
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
