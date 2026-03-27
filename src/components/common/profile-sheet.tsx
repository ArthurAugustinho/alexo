"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CameraIcon, KeyRoundIcon, ShieldIcon, UserIcon } from "lucide-react";
import { useRef, useState } from "react";
import { type Resolver,useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";

import { type ChangePasswordInput, changePasswordSchema } from "@/actions/change-password/schema";
import { type UpdateProfileInput, updateProfileSchema } from "@/actions/update-profile/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useChangePassword } from "@/hooks/mutations/use-change-password";
import { useUpdateAvatar } from "@/hooks/mutations/use-update-avatar";
import { useUpdateProfile } from "@/hooks/mutations/use-update-profile";
import { useProfile } from "@/hooks/queries/use-profile";

const GENDER_OPTIONS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
  { value: "other", label: "Outro" },
  { value: "prefer_not_to_say", label: "Prefiro não dizer" },
];

type ProfileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
};

function PersonalDataTab({ userId }: { userId: string }) {
  const { data: profile, isLoading } = useProfile(userId);
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileResolver = zodResolver(updateProfileSchema) as Resolver<
    UpdateProfileInput,
    unknown,
    UpdateProfileInput
  >;

  const form = useForm<UpdateProfileInput, unknown, UpdateProfileInput>({
    resolver: profileResolver,
    values: {
      name: profile?.name ?? "",
      phone: profile?.phone ?? "",
      birthDate: profile?.birthDate ?? "",
      gender: (profile?.gender as UpdateProfileInput["gender"]) ?? "",
      cpf: profile?.cpf ?? "",
    },
  });

  if (isLoading) {
    return <div className="text-muted-foreground py-8 text-center text-sm">Carregando...</div>;
  }

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    updateAvatar.mutate(file);
    e.target.value = "";
  }

  function onSubmit(data: UpdateProfileInput) {
    updateProfile.mutate(data);
  }

  return (
    <div className="space-y-6">
      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar className="size-20">
            <AvatarImage src={profile?.image ?? undefined} />
            <AvatarFallback className="text-xl">
              {profile?.name?.split(" ")?.[0]?.[0]}
              {profile?.name?.split(" ")?.[1]?.[0]}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={updateAvatar.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full shadow transition-colors disabled:opacity-50"
          >
            <CameraIcon className="size-3.5" />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-muted-foreground text-xs">JPG, PNG ou WebP — máx. 2MB</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Celular</FormLabel>
                <FormControl>
                  <PatternFormat
                    format="(##) #####-####"
                    placeholder="(11) 99999-9999"
                    customInput={Input}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <PatternFormat
                    format="###.###.###-##"
                    placeholder="000.000.000-00"
                    customInput={Input}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gênero</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                    className="grid grid-cols-2 gap-2"
                  >
                    {GENDER_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                      >
                        <RadioGroupItem value={opt.value} />
                        {opt.label}
                      </label>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function SecurityTab({ userId }: { userId: string }) {
  const { data: profile, isLoading } = useProfile(userId);
  const changePassword = useChangePassword();

  const passwordResolver = zodResolver(changePasswordSchema) as Resolver<
    ChangePasswordInput,
    unknown,
    ChangePasswordInput
  >;

  const form = useForm<ChangePasswordInput, unknown, ChangePasswordInput>({
    resolver: passwordResolver,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  if (isLoading) {
    return <div className="text-muted-foreground py-8 text-center text-sm">Carregando...</div>;
  }

  if (!profile?.hasPassword) {
    return (
      <div className="rounded-xl border p-5 text-center">
        <div className="bg-muted mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
          <ShieldIcon className="size-5" />
        </div>
        <h3 className="font-semibold">Login com Google</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Sua conta usa o Google para autenticação. A senha é gerenciada diretamente pelo Google.
        </p>
      </div>
    );
  }

  function onSubmit(data: ChangePasswordInput) {
    changePassword.mutate(data, {
      onSuccess: (result) => {
        if (result.success) {
          form.reset();
        }
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha atual</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar nova senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={changePassword.isPending}
        >
          {changePassword.isPending ? "Alterando..." : "Alterar senha"}
        </Button>
      </form>
    </Form>
  );
}

function PreferencesTab({ userId }: { userId: string }) {
  const { data: profile, isLoading } = useProfile(userId);
  const updateProfile = useUpdateProfile();
  const [emailMarketing, setEmailMarketing] = useState<boolean | null>(null);
  const [whatsappMarketing, setWhatsappMarketing] = useState<boolean | null>(null);

  if (isLoading) {
    return <div className="text-muted-foreground py-8 text-center text-sm">Carregando...</div>;
  }

  const effectiveEmail = emailMarketing ?? profile?.emailMarketing ?? true;
  const effectiveWhatsapp = whatsappMarketing ?? profile?.whatsappMarketing ?? false;

  function handleSave() {
    if (!profile) return;
    updateProfile.mutate({
      name: profile.name,
      phone: profile.phone ?? "",
      birthDate: profile.birthDate ?? "",
      gender: (profile.gender as UpdateProfileInput["gender"]) ?? "",
      cpf: profile.cpf ?? "",
      emailMarketing: effectiveEmail,
      whatsappMarketing: effectiveWhatsapp,
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Comunicações</h3>

        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Promoções por e-mail</p>
            <p className="text-muted-foreground text-xs">
              Receba ofertas, lançamentos e novidades por e-mail.
            </p>
          </div>
          <Switch
            checked={effectiveEmail}
            onCheckedChange={setEmailMarketing}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Notificações por WhatsApp</p>
            <p className="text-muted-foreground text-xs">
              Receba atualizações de pedidos e promoções via WhatsApp.
            </p>
          </div>
          <Switch
            checked={effectiveWhatsapp}
            onCheckedChange={setWhatsappMarketing}
          />
        </div>
      </div>

      <Button
        className="w-full"
        onClick={handleSave}
        disabled={updateProfile.isPending}
      >
        {updateProfile.isPending ? "Salvando..." : "Salvar preferências"}
      </Button>
    </div>
  );
}

export function ProfileSheet({ open, onOpenChange, userId }: ProfileSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Meu cadastro</SheetTitle>
        </SheetHeader>

        <div className="px-1 pb-6">
          <Tabs defaultValue="personal" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="personal" className="flex-1 gap-1.5">
                <UserIcon className="size-3.5" />
                Dados
              </TabsTrigger>
              <TabsTrigger value="security" className="flex-1 gap-1.5">
                <KeyRoundIcon className="size-3.5" />
                Segurança
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex-1 gap-1.5">
                Preferências
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-4">
              <PersonalDataTab userId={userId} />
            </TabsContent>

            <TabsContent value="security" className="mt-4">
              <SecurityTab userId={userId} />
            </TabsContent>

            <TabsContent value="preferences" className="mt-4">
              <PreferencesTab userId={userId} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
