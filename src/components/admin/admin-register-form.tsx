"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRoundIcon, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import { registerAdminUser } from "@/lib/actions/admin-users";
import {
  type RegisterAdminUserInput,
  registerAdminUserSchema,
} from "@/lib/register-admin-user-schema";

type AdminRegisterFormProps = {
  registrationEnabled: boolean;
};

export function AdminRegisterForm({
  registrationEnabled,
}: AdminRegisterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<RegisterAdminUserInput>({
    resolver: zodResolver(registerAdminUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      accessKey: "",
    },
  });

  function onSubmit(values: RegisterAdminUserInput) {
    startTransition(async () => {
      const result = await registerAdminUser(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Card className="border-border/70 bg-background/95 rounded-3xl shadow-lg shadow-primary/5">
      <CardHeader className="space-y-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <UserPlusIcon className="size-5" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl">Cadastrar vendedor</CardTitle>
          <CardDescription>
            Venha trabalhar com a gente.
          </CardDescription>
        </div>
        <div className="rounded-2xl border bg-muted/40 px-4 py-3 text-center text-sm">
          Entre em contato com nossa equipe para cadastro.
        </div>
      </CardHeader>

      <CardContent>
        {!registrationEnabled ? (
          <div className="rounded-2xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
            alexo@gmail.com
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome do vendedor"
                        className="h-11 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="vendedor@empresa.com"
                        className="h-11 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave de acesso</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRoundIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input
                          placeholder="Opcional se o e-mail já estiver liberado"
                          className="h-11 rounded-xl pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Mínimo de 8 caracteres"
                          className="h-11 rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passwordConfirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Repita a senha"
                          className="h-11 rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl"
                disabled={isPending}
              >
                Criar conta administrativa
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
