# Arquitetura do Projeto

## Visao geral

Este projeto e um monolito full stack construido com Next.js 15, React 19,
TypeScript, PostgreSQL e Drizzle ORM. A mesma aplicacao entrega:

- storefront publico
- autenticacao de clientes e administradores
- carrinho e checkout
- integracao de pagamento com Stripe
- painel administrativo
- gestao de vitrine, catalogo e variantes

O sistema usa App Router, Server Components para composicao e leitura inicial,
Client Components para interacao rica, Server Actions para mutacoes e Drizzle
como camada de persistencia.

## Stack principal

- Framework web: Next.js 15
- UI: React 19 + Tailwind CSS 4 + Radix UI
- Tipagem e validacao: TypeScript + Zod
- Banco de dados: PostgreSQL
- ORM e migrations: Drizzle ORM + Drizzle Kit
- Estado client-side: TanStack React Query
- Autenticacao: Better Auth
- Pagamento: Stripe
- Feedback de interface: Sonner

## Mapa de alto nivel

```text
[Browser]
   |
   v
[Next.js App Router]
   |
   +--> src/app/layout.tsx
   |      +--> ReactQueryProvider
   |      +--> Sonner Toaster
   |
   +--> Rotas publicas
   |      +--> Home
   |      +--> Categoria
   |      +--> Produto
   |      +--> Carrinho
   |      +--> Checkout
   |      +--> My Orders
   |      +--> Authentication
   |
   +--> Rotas admin
   |      +--> /admin
   |      +--> /admin/dashboard
   |      +--> /admin/vitrine/*
   |      +--> /admin/produtos/[id]/variantes
   |
   +--> API routes
   |      +--> /api/auth/[...all]
   |      +--> /api/stripe/webhook
   |
   +--> Server Actions
   |      +--> src/actions/*
   |      +--> src/lib/actions/*
   |
   +--> Camada de dominio
   |      +--> src/lib/*
   |
   +--> Persistencia
          +--> src/db/index.ts
          +--> src/db/schema.ts
          +--> PostgreSQL
```

## Estrutura de diretorios

```text
src/
  app/          -> rotas, layouts e composicao de paginas
  actions/      -> server actions principais
  components/   -> UI por dominio e componentes base
  db/           -> conexao e schema do banco
  helpers/      -> utilitarios pequenos
  hooks/        -> hooks client-side e integracao com React Query
  lib/          -> modulos de dominio e regras compartilhadas
  providers/    -> providers globais

drizzle/        -> migrations SQL e snapshots do schema
public/         -> assets publicos
docs/           -> documentacao
```

## Camadas da aplicacao

### 1. Camada de entrada e composicao

Responsavel pela estrutura global da app e pelos providers compartilhados.

- Layout raiz: `src/app/layout.tsx`
- Provider de React Query: `src/providers/react-query.tsx`

Responsabilidades:

- carregar fontes
- registrar `ReactQueryProvider`
- registrar `Toaster`
- servir como raiz da arvore de paginas

### 2. Camada de apresentacao

Localizada em `src/app` e `src/components`.

Subdivisoes principais:

- `src/components/common`: header, footer, lista de produtos, itens de carrinho
- `src/components/home`: banners e carrosseis da home
- `src/components/product`: detalhe, imagem, acoes e seletor de variantes
- `src/components/admin`: shell, dashboard, gestao de produtos, banners e afins
- `src/components/ui`: wrappers de Radix UI e primitives de interface

### 3. Camada de interacao client-side

Localizada principalmente em `src/hooks`.

Papeis:

- sincronizar dados client-side via React Query
- encapsular mutations de carrinho e checkout
- controlar comportamento de selecao de variante

Arquivos relevantes:

- `src/hooks/queries/use-cart.ts`
- `src/hooks/queries/use-user-addresses.ts`
- `src/hooks/mutations/use-finish-order.ts`
- `src/hooks/use-variant-selector.ts`

### 4. Camada de aplicacao

Representada pelas Server Actions em `src/actions` e `src/lib/actions`.

Papeis:

- validar input
- consultar sessao/autorizacao
- aplicar regras de negocio
- persistir alteracoes
- revalidar rotas

Exemplos:

- carrinho: `add-cart-product`, `remove-cart-product`, `decrease-cart-product-quantity`
- checkout: `finish-order`, `create-checkout-session`
- admin catalogo: `create-admin-product`, `update-admin-product`, `delete-admin-product`
- admin variantes: `src/lib/actions/variants.ts`

### 5. Camada de dominio

Localizada em `src/lib`.

Papeis:

- encapsular regras compartilhadas
- definir schemas Zod de dominio
- centralizar autenticacao e autorizacao
- montar consultas compostas para home e admin

Arquivos-chave:

- auth: `src/lib/auth.ts`
- admin auth: `src/lib/admin-auth.ts`
- super admin: `src/lib/super-admin.ts`
- vitrine publica: `src/lib/storefront-showcase.ts`
- dashboard admin: `src/lib/admin-dashboard.ts`
- variantes: `src/lib/product-variant-schema.ts`
- variantes admin: `src/lib/admin-variant-schema.ts`

### 6. Camada de persistencia

Centralizada em:

- conexao: `src/db/index.ts`
- schema relacional: `src/db/schema.ts`
- configuracao de migration: `drizzle.config.ts`

O Drizzle trabalha diretamente com PostgreSQL e usa o schema TypeScript como
fonte de verdade para tipos, queries relacionais e migrations.

## Dominios funcionais

### Storefront

Responsavel pela experiencia publica da loja.

Rotas principais:

- `/`
- `/category/[slug]`
- `/product/[slug]`
- `/product-variant/[slug]`

Componentes e modulos principais:

- `src/app/page.tsx`
- `src/lib/storefront-showcase.ts`
- `src/components/home`
- `src/components/product`

Observacoes de arquitetura:

- a home usa `Suspense` para seções independentes
- a vitrine publica e derivada de banners sazonais e produtos curados
- a navegacao de produto usa `product` e `product_variant`
- a pagina de produto e client-driven apenas no que exige interacao

### Autenticacao e autorizacao

Responsavel por sessao, login, papeis e acesso administrativo.

Componentes e modulos principais:

- `src/lib/auth.ts`
- `src/app/api/auth/[...all]/route.ts`
- `src/lib/admin-auth.ts`
- `src/lib/admin-roles.ts`
- `src/lib/super-admin.ts`

Regras principais:

- `customer`: fluxo publico da loja
- `admin`: dashboard e catalogo
- `super_admin`: tudo de `admin` + gestao de vitrine

### Carrinho, pedido e checkout

Responsavel por compor a compra do usuario.

Fluxo principal:

1. usuario adiciona `product_variant` ao carrinho
2. carrinho e lido por server action e consumido por React Query
3. usuario informa ou seleciona endereco
4. `finishOrder` converte carrinho em `order` + `order_item`
5. `createCheckoutSession` abre o pagamento no Stripe
6. webhook marca o pedido como `paid`

Arquivos principais:

- `src/actions/get-cart/index.ts`
- `src/actions/add-cart-product/index.ts`
- `src/actions/finish-order/index.ts`
- `src/actions/create-checkout-session/index.ts`
- `src/app/api/stripe/webhook/route.ts`

### Painel administrativo

Responsavel por analytics, categorias, produtos, banners, destaques e
variantes.

Subareas:

- `/admin`: login e cadastro de vendedores
- `/admin/dashboard`: analytics + catalogo
- `/admin/vitrine/*`: banners e mais vendidos
- `/admin/produtos/[id]/variantes`: gestao detalhada de variantes

Arquivos principais:

- `src/app/admin/page.tsx`
- `src/app/admin/dashboard/page.tsx`
- `src/components/admin/admin-shell.tsx`
- `src/lib/admin-dashboard.ts`
- `src/lib/actions/variants.ts`
- `src/lib/queries/variants.ts`

## Mapa das rotas

```text
/
|-- /authentication
|-- /login
|-- /category/[slug]
|-- /product/[slug]
|-- /product-variant/[slug]
|-- /cart/identification
|-- /cart/confirmation
|-- /checkout/cancel
|-- /checkout/success
|-- /my-orders
|-- /admin
|   |-- /dashboard
|   |-- /vitrine
|   |   |-- /banners
|   |   `-- /mais-vendidos
|   `-- /produtos/[id]/variantes
`-- /api
    |-- /auth/[...all]
    `-- /stripe/webhook
```

## Modelo de dados

### Entidades principais

```text
user
  -> session
  -> account
  -> shipping_address
  -> cart
  -> order

category
  -> product
      -> product_variant
          -> cart_item
          -> order_item

featured_products
  -> product

seasonal_banner
```

### Regras de modelagem

- `product` representa o item comercial de alto nivel
- `product_variant` representa a unidade vendavel
- `cart_item` e `order_item` apontam sempre para `product_variant`
- `order_item.priceInCents` preserva o preco historico do momento da compra
- `product_variant.isAvailable` controla disponibilidade de venda

### Enums principais

- `user_role`: `customer | admin | super_admin`
- `product_variant_size`: `PP | P | M | G | GG | GGG`
- `order_status`: `pending | paid | canceled`

## Fluxos arquiteturais

### Fluxo de pagina de produto

```text
Request
  -> page.tsx server component
  -> query Drizzle busca product + variants
  -> ProductDetailsClient
  -> useVariantSelector
  -> VariantSelector + ProductActions
  -> addProductToCart server action
  -> cart_item
```

### Fluxo de checkout

```text
Carrinho
  -> getCart
  -> user seleciona endereco
  -> finishOrder
  -> cria order + order_item
  -> createCheckoutSession
  -> Stripe Checkout
  -> webhook /api/stripe/webhook
  -> order.status = paid
```

### Fluxo de admin de variantes

```text
Admin page
  -> getVariantsByProductId
  -> VariantTable
  -> toggle/create/update/delete
  -> src/lib/actions/variants.ts
  -> product_variant
  -> revalidatePath
```

## Padroes usados no projeto

### Leitura de dados

- preferencia por Server Components
- consultas diretas com Drizzle
- serializacao ja tipada a partir do schema

### Mutacoes

- executadas por Server Actions
- input validado com Zod
- autorizacao feita na propria action quando necessario
- invalidacao de UI via `revalidatePath`

### Estado client-side

- React Query usado para cache local e mutations
- hooks encapsulam acesso a actions
- formularios usam React Hook Form + `zodResolver`

### Tipagem

- Drizzle inferindo tipos do banco
- Zod inferindo tipos de formularios e payloads
- hooks e componentes consumindo tipos de dominio centralizados

## Integracoes externas

### Better Auth

Responsavel por:

- login com email e senha
- login social com Google
- gerenciamento de sessao
- persistencia de usuario, conta, sessao e verificacao no PostgreSQL

### Stripe

Responsavel por:

- criacao da sessao de pagamento
- redirecionamento para checkout hospedado
- confirmacao assicrona via webhook

## Decisoes importantes

- aplicacao monolitica para simplificar deploy e acoplamento entre frontend e backend
- banco como fonte de verdade unica
- `product_variant` como centro das operacoes comerciais
- separacao de componentes por dominio em vez de separacao puramente tecnica
- uso de layouts server-side para proteger areas administrativas

## Pontos de atencao

- existem duas rotas de detalhe de produto: `/product/[slug]` e
  `/product-variant/[slug]`
- parte das actions antigas esta em `src/actions`, enquanto features novas
  ja aparecem em `src/lib/actions`
- o dashboard admin mistura metricas reais e metricas estimadas quando o volume
  de dados ainda e baixo
- o sistema hoje trabalha com disponibilidade booleana, nao com estoque
  numerico

## Arquivos mais importantes para onboarding

- `src/app/layout.tsx`
- `src/db/schema.ts`
- `src/lib/auth.ts`
- `src/lib/admin-auth.ts`
- `src/lib/storefront-showcase.ts`
- `src/actions/get-cart/index.ts`
- `src/actions/finish-order/index.ts`
- `src/app/admin/dashboard/page.tsx`
- `src/lib/actions/variants.ts`
