# Alexo Commerce

  <p>Plataforma de e-commerce premium de moda e vestuário</p>
  <p>https://alexo.com.br/</p>

  ![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
  ![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
  ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
</div>

---

## Sobre o projeto

O **Alexo Commerce** é um e-commerce completo de moda e vestuário construído com as tecnologias mais modernas do ecossistema JavaScript. A plataforma oferece uma experiência de compra premium com foco em elegância, performance e usabilidade.

### Funcionalidades principais

- Vitrine dinâmica com banners, carrosséis e destaque de produtos
- Sistema completo de variantes (cor, tamanho, estoque)
- Personalização de produtos (nome, número, patches)
- Cálculo de frete via Melhor Envio API v2
- Pagamentos via Stripe com webhooks
- Sistema de cupons de desconto (percentual, fixo, frete grátis, por categoria)
- Address book com busca de CEP via ViaCEP
- Timeline de pedidos com rastreamento real dos Correios (Seu Rastreio)
- Logística reversa (solicitação de devolução pelo cliente)
- Sistema de avaliações verificadas (somente após receber o produto)
- Painel administrativo completo (OMS, vitrine, cupons, devoluções, avaliações)
- Autenticação com Google OAuth via Better Auth
- Analytics e Speed Insights via Vercel

---

## Stack tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 15 | Framework principal (App Router + Turbopack) |
| React | 19 | UI |
| TypeScript | 5 | Tipagem estática |
| Tailwind CSS | 4 | Estilização |
| shadcn/ui | latest | Componentes de interface |
| Lucide React | latest | Ícones |
| React Hook Form | latest | Formulários |
| Zod | latest | Validação de schemas |
| React Number Format | latest | Máscaras de input |
| Sonner | latest | Notificações toast |
| TanStack Query | latest | Cache e estado servidor |

### Backend / Infraestrutura
| Tecnologia | Uso |
|---|---|
| Drizzle ORM | ORM com type-safety |
| PostgreSQL | Banco de dados |
| Better Auth | Autenticação (Google OAuth + email/senha) |
| Stripe | Pagamentos e webhooks |
| Melhor Envio | Cálculo de frete |
| Nodemailer | Envio de emails (SMTP) |
| Seu Rastreio | Rastreamento de encomendas |
| Vercel | Deploy e analytics |

---

## Pré-requisitos

- Node.js 20+
- PostgreSQL 14+
- Conta no Stripe (modo sandbox para desenvolvimento)
- Conta no Melhor Envio (sandbox para desenvolvimento)
- Conta no Google Cloud (OAuth credentials)
- Conta no Seu Rastreio (rastreamento de encomendas)

---

## Configuração local

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/alexo-commerce.git
cd alexo-commerce
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copiar o arquivo de exemplo:

```bash
cp .env.example .env
```

Preencher as variáveis:

```env
# Banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/alexo

# Autenticação
BETTER_AUTH_SECRET=gere-com-openssl-rand-base64-32
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Melhor Envio
MELHOR_ENVIO_TOKEN=eyJ...
MELHOR_ENVIO_BASE_URL=sandbox.melhorenvio.com.br
MELHOR_ENVIO_CEP_ORIGEM=01021200

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM=noreply@alexo-store.com.br

# Rastreamento Correios
SEU_RASTREIO_API_KEY=sr_live_...

# Super Admin (opcional)
SUPER_ADMIN_EMAIL=admin@alexo-store.com.br
```

### 4. Configurar o banco de dados

```bash
# Gerar as migrations
npx drizzle-kit generate

# Aplicar as migrations
npx drizzle-kit push

# (Opcional) Visualizar o banco
npx drizzle-kit studio
```

### 5. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`

---

## Scripts disponíveis

```bash
npm run dev       # Inicia com Turbopack (desenvolvimento)
npm run build     # Build de produção
npm run start     # Inicia o servidor de produção
npm run lint      # Verificação de código
```

---

## Estrutura do projeto

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── (store)/            # Rotas da loja pública
│   ├── admin/              # Painel administrativo
│   ├── account/            # Painel do cliente
│   ├── api/                # API Routes
│   └── cart/               # Fluxo de checkout
├── actions/                # Server Actions
├── components/             # Componentes React
│   ├── common/             # Componentes globais
│   ├── home/               # Componentes da home
│   ├── orders/             # Componentes de pedidos
│   └── product/            # Componentes de produto
├── db/                     # Schema e conexão Drizzle
├── helpers/                # Funções puras auxiliares
├── hooks/                  # Custom hooks (React Query)
└── lib/                    # Queries e utilitários
```

---

## Perfis de acesso

| Perfil | Acesso |
|---|---|
| `customer` | Loja pública, painel do cliente |
| `admin` | Painel admin (pedidos, devoluções, avaliações, cupons) |
| `super_admin` | Tudo de admin + gerenciamento da vitrine |

---

## Deploy

### Vercel (recomendado)

O projeto está configurado para deploy automático na Vercel.

1. Conectar o repositório na Vercel
2. Configurar as variáveis de ambiente no painel da Vercel
3. Cada push na branch `main` dispara um deploy automático

### Docker

```bash
# Build
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=https://alexo-store.com.br \
  -t arthuraugustinho/alexo:latest \
  .

# Push
docker push arthuraugustinho/alexo:latest

# Rodar
docker-compose up -d
```

---

## Configuração do Stripe Webhook

Para receber eventos do Stripe localmente:

```bash
# Instalar Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Eventos tratados:
- `payment_intent.succeeded` → pedido confirmado
- `charge.refunded` → reembolso processado
- `payment_intent.payment_failed` → pagamento falhou

---

## Variáveis de ambiente de produção

Lembrar de atualizar para produção:

```env
MELHOR_ENVIO_BASE_URL=melhorenvio.com.br     # sem sandbox
STRIPE_SECRET_KEY=sk_live_...                # chave live
NEXT_PUBLIC_APP_URL=https://alexo-store.com.br
```

---

## Licença

Projeto proprietário — todos os direitos reservados.

---

<div align="center">
  Desenvolvido com Next.js 15 + React 19
</div>
