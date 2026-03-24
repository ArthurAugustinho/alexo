# Alexo — Guia completo do projeto para o Claude Code

Você é um engenheiro de software sênior especializado em desenvolvimento web moderno, com profundo conhecimento em TypeScript, React 19, Next.js 15 (App Router), Postgres, Drizzle, shadcn/ui e Tailwind CSS. Você é atencioso, ultiliza as regras ACID e SOLID, também é preciso e focado em entregar soluções de alta qualidade e fáceis de manter.

## Visão geral

Plataforma de e-commerce de moda e vestuário. Monólito full stack em Next.js 15
com App Router. Um único app entrega storefront público, autenticação, carrinho,
checkout, pagamento Stripe e painel administrativo.

---

## Stack principal

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack em dev) |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui |
| Tipagem e validação | TypeScript + Zod |
| Banco de dados | PostgreSQL |
| ORM e migrations | Drizzle ORM + Drizzle Kit |
| Estado client-side | TanStack React Query |
| Autenticação | Better Auth |
| Pagamento | Stripe |
| Frete | Melhor Envio API v2 |
| Feedback visual | Sonner (toasts) |
| Ícones | Lucide React |
| Formulários | React Hook Form + zodResolver |
| Máscaras | React Number Format |
| Drag and drop | @dnd-kit/core |

---

## Perfis de acesso

```
customer    → acesso à loja pública
admin       → painel administrativo (/admin/*)
super_admin → tudo de admin + gestão de vitrine (/admin/vitrine/*)
```

Proteção implementada em dois layers obrigatórios:
1. Layout server-side (redireciona se role insuficiente)
2. Server Action (rejeita com erro se role insuficiente — double-check obrigatório)

---

## Padrões de código — SEGUIR SEMPRE

### Componentes de UI — shadcn/ui primeiro
- **SEMPRE usar componentes do shadcn/ui** antes de criar qualquer coisa do zero
- Referência: https://ui.shadcn.com/ para lista completa de componentes disponíveis
- Componentes instalados ficam em `src/components/ui/` — importar sempre dali
- Exemplos: `Dialog`, `Sheet`, `Tooltip`, `Accordion`, `AlertDialog`, `Form`, `Input`, `Button`
- Só usar Radix UI diretamente se o shadcn não tiver o componente necessário

### Formulários — padrão obrigatório
- **Sempre** React Hook Form + zodResolver
- **Sempre** usar o componente `src/components/ui/form.tsx` do shadcn
- Referência de implementação: `src/app/authentication/components/sign-in-form.tsx`
  e `src/app/authentication/components/sign-up-form.tsx`
- Schema Zod separado do componente
- Feedback de erro **inline** abaixo do campo — nunca apenas toast
- Toast **Sonner** para sucesso e erro global da operação

### Busca de dados
- Server Components para leitura inicial — **nunca useEffect para dados do banco**
- Queries diretas com Drizzle ORM — **sem SQL raw**
- Sempre importar `db` de `src/db/index.ts` e o schema de `src/db/schema.ts`
- `noStore()` em páginas com dados dinâmicos para evitar cache indevido

### Mutações — Server Actions
- Sempre via **Server Actions** com `'use server'`
- Cada action fica em **pasta própria** com dois arquivos obrigatórios:
  ```
  src/actions/nome-da-action/
    index.ts    → lógica da action
    schema.ts   → schema Zod do payload
  ```
- **Referência obrigatória**: ver `src/actions/add-cart-product/` antes de criar qualquer action nova
- Validar input com Zod (schema.ts da própria pasta)
- Verificar autenticação/autorização **na própria action** — nunca confiar só no middleware
- Chamar `revalidatePath()` após toda mutação

### React Query — padrão de hooks
- Usar React Query para interagir com Server Actions em Client Components
- Referências de implementação:
  - Query: `src/hooks/queries/use-cart.ts`
  - Mutation: `src/hooks/mutations/use-increase-cart-product.ts`
  - Componente consumindo: `src/components/common/cart.tsx` e `cart-item.tsx`
- **SEMPRE criar hooks customizados** — nunca usar useQuery/useMutation diretamente no componente
- **SEMPRE criar e exportar função que retorna a query/mutation key**:
  ```typescript
  // ✅ CORRETO
  export const getCartQueryKey = () => ['cart']

  export const useCart = () => useQuery({
    queryKey: getCartQueryKey(),
    queryFn: () => getCart(),
  })

  // Em outro hook, invalidar sem hardcodar string:
  queryClient.invalidateQueries({ queryKey: getCartQueryKey() })
  ```

### Estado client-side
- **useOptimistic** para feedback imediato em toggles e remoções
- **useMemo** para valores derivados — **nunca useEffect para derivar estado**
- **useFieldArray** do React Hook Form para arrays de inputs dinâmicos
- **watch()** para reatividade inline (badges, contadores) — nunca useEffect

### Localização de componentes
- Componente usado em **apenas uma página** → criar dentro da pasta da página:
  ```
  src/app/cart/identification/components/addresses.tsx
  ```
- Componente **reutilizável** → criar em `src/components/{domínio}/`

### Rules of Hooks — CRÍTICO
- **TODOS os hooks ANTES de qualquer early return** — violação causa crash em produção
- Nunca chamar hook dentro de condicional, loop ou após `return`
- Padrão correto:
  ```tsx
  // ✅ CORRETO
  function Componente({ dados }) {
    const valor = useMemo(() => dados ? calcular(dados) : null, [dados])
    if (!dados) return null
    return <div>{valor}</div>
  }

  // ❌ ERRADO — quebra a aplicação
  function Componente({ dados }) {
    if (!dados) return null
    const valor = useMemo(() => calcular(dados), [dados])
    return <div>{valor}</div>
  }
  ```

### Tipagem
- **Sem `any`** em nenhuma circunstância
- Tipos de formulário via `z.infer<typeof schema>` — nunca duplicar manualmente
- Tipos do banco via inferência do Drizzle — nunca duplicar manualmente

### Nomenclatura e organização
- Arquivos: **kebab-case** (`product-card.tsx`, `use-cart.ts`)
- Componentes: **PascalCase** no código (`ProductCard`)
- Nomes de variáveis descritivos: `isLoading`, `hasError`, `isAvailable`
- **Named exports** para componentes e hooks
- **Default export** apenas para páginas (`page.tsx`, `layout.tsx`)
- Comentários apenas onde a lógica não for óbvia — código deve ser autoexplicativo

### Máscaras de input
- **Sempre** usar `react-number-format` para inputs com máscara (CEP, preço, telefone)

---

## Estrutura de diretórios

```
src/
  app/                        → rotas, layouts e páginas (App Router)
    (store)/                  → grupo de rotas da loja pública
    admin/                    → painel administrativo
    api/
      auth/[...all]/          → Better Auth handler
      search/                 → GET busca de produtos com autocomplete
      shipping/calculate/     → POST cotação de frete (Melhor Envio)
      stripe/webhook/         → POST confirmação assíncrona de pagamento

  actions/                    → Server Actions — UMA PASTA POR ACTION
    add-cart-product/
      index.ts                ← lógica ← REFERÊNCIA PRINCIPAL
      schema.ts               ← Zod schema
    remove-cart-product/
    decrease-cart-product-quantity/
    finish-order/
    create-checkout-session/
    get-cart/
    [demais actions seguem o mesmo padrão de pasta]

  components/
    admin/                    → componentes do painel admin
    common/                   → header, footer, cart, cart-item, search-bar...
    home/                     → banner-carousel, product-carousel, best-sellers
    product/                  → product-card, variant-selector, wishlist-button,
                                 size-recommender-modal, shipping-calculator
    search/                   → filter-panel, filter-drawer, active-filters,
                                 search-results-grid, search-pagination
    shipping/                 → shipping-calculator
    ui/                       → componentes shadcn/ui instalados ← IMPORTAR SEMPRE DAQUI
    wishlist/                 → wishlist-item-card, wishlist-clear-button

  db/
    index.ts                  → conexão Drizzle ← importar `db` daqui
    schema.ts                 → schema relacional completo ← FONTE DE VERDADE

  helpers/                    → funções puras sem side effects
    normalize-search.ts       → remove acentos e caracteres especiais para busca
    highlight-match.tsx       → highlight de termo buscado no texto
    build-search-url.ts       → monta URL com searchParams de filtros
    recommend-size.ts         → algoritmo puro de recomendação de tamanho
    generate-slug.ts          → gera slug de variante (produto + cor + tamanho)

  hooks/
    queries/
      use-cart.ts             ← REFERÊNCIA de query hook
      use-user-addresses.ts
    mutations/
      use-finish-order.ts
      use-increase-cart-product.ts  ← REFERÊNCIA de mutation hook
    use-variant-selector.ts
    use-product-search.ts
    use-shipping-calculator.ts

  lib/
    auth.ts                   → configuração Better Auth
    admin-auth.ts             → helpers de autenticação admin
    admin-roles.ts            → verificação de roles
    super-admin.ts            → sync super_admin via env
    admin-dashboard.ts        → métricas do dashboard (real vs estimated)
    storefront-showcase.ts    → queries da vitrine pública
    shipping-schema.ts        → Zod schemas do Melhor Envio
    product-variant-schema.ts → Zod schema de variante (storefront)
    admin-variant-schema.ts   → Zod schema de variante (admin)

    queries/                  → queries Drizzle por domínio
      variants.ts
      banners.ts
      featured.ts
      wishlist.ts
      search.ts
      size-charts.ts

  providers/
    react-query.tsx           → ReactQueryProvider global

drizzle/
  migrations/                 → arquivos SQL gerados pelo Drizzle Kit
```

---

## Modelo de dados (schema.ts)

### Identidade e autenticação
```
user          → id, name, email, role (customer|admin|super_admin), emailVerified, image
session       → id, userId, token, expiresAt
account       → userId, provider, ...
verification  → identifier, value, expiresAt
```

### Catálogo
```
category        → id, name, slug, createdAt
product         → id, categoryId, name, slug, description, brand,
                  sizeType (alphabetic|numeric), originPostalCode,
                  priceInCents, shippingCostInCents,
                  weightGrams, widthCm, heightCm, lengthCm, createdAt
product_variant → id, productId, name, slug, size (varchar 10), color,
                  priceInCents, imageUrl, stock (integer), isAvailable, createdAt
product_sizes   → id, productId, sizeValue (varchar 10), position
size_charts     → id, categoryId, sizeLabel, bustMin/Max, waistMin/Max,
                  hipMin/Max, heightMin/Max, weightMin/Max, position
```

### Curadoria da vitrine
```
seasonal_banner   → id, imageUrl, title, subtitle, linkUrl, startDate, endDate
featured_products → id, productId, position
```

### Compra
```
cart             → id, userId
cart_item        → id, cartId, productVariantId, quantity
shipping_address → id, userId, street, number, complement, city, state, zipCode
order            → id, userId, shippingAddressId, status (pending|paid|canceled),
                   totalInCents, createdAt
order_item       → id, orderId, productVariantId, quantity, priceInCents (snapshot)
```

### Social
```
wishlist_items → id, userId, productId, createdAt
                 UNIQUE(userId, productId)
```

### Enums principais
```typescript
user_role:            'customer' | 'admin' | 'super_admin'
size_type:            'alphabetic' | 'numeric'
order_status:         'pending' | 'paid' | 'canceled'
product_variant.size: varchar(10) — 'PP'|'P'|'M'|'G'|'GG'|'GGG' ou numérico
```

---

## Decisões arquiteturais importantes

### Produto e variante
- `product_variant` é a **unidade vendável real** — toda operação de compra usa `variantId`
- `cart_item` e `order_item` sempre apontam para `product_variant` — nunca para `product`
- `order_item.priceInCents` é **snapshot** do preço no momento da compra — imutável
- `isAvailable = stock > 0` — sempre sincronizar ambos ao salvar stock

### Preços
- Todos os preços em **centavos** no banco (`priceInCents`)
- Converter para BRL na UI:
  ```typescript
  (priceInCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  ```

### Rotas de produto
- URL canônica: `/product/[slug]`
- `/product-variant/[slug]` → redirect 308 para `/product/[slug]` — manter para SEO

### Estado de filtros na busca
- Todos os filtros da página `/search` vivem na **URL como searchParams** — sem useState
- URL compartilhável: `/search?q=bone&colors=Preto&sizes=M&priceMin=5000`

### Frete (Melhor Envio)
- Token **NUNCA exposto no client** — toda chamada passa pela API Route interna
- CEP de origem: `product.originPostalCode` com fallback para `MELHOR_ENVIO_CEP_ORIGEM` do `.env`
- Header `User-Agent` obrigatório nas chamadas ao Melhor Envio
- Timeout de 8s com `AbortSignal.timeout(8000)`

### Normalização de busca
- Usar `normalizeSearch()` de `src/helpers/normalize-search.ts`
- PostgreSQL: `unaccent(lower(field)) ILIKE unaccent(lower('%{termo}%'))`
- Extensão `unaccent` deve estar habilitada: `CREATE EXTENSION IF NOT EXISTS unaccent`

### Wishlist
- Armazena `productId` — **não** `variantId`
- Constraint `UNIQUE(userId, productId)` no banco

### Recomendador de tamanho
- Medidas salvas em `localStorage` (chave: `'user_measurements'`) — sem banco
- Algoritmo em `src/helpers/recommend-size.ts` — helper puro, sem side effects
- localStorage lido via **lazy initializer** do useState — nunca via useEffect

### Metadata e SEO
- `/admin/*`, `/checkout/*` e `/cart/*` → `robots: { index: false }`
- `/product/[slug]` → `generateMetadata` dinâmico com `alternates.canonical`
- `NEXT_PUBLIC_APP_URL` obrigatório no `.env`

---

## Mapa de rotas

```
/                              → home (banners + carrosséis)
/category/[slug]               → listagem por categoria
/product/[slug]                → detalhe do produto (URL canônica)
/product-variant/[slug]        → redirect 308 → /product/[slug]
/search                        → resultados de busca com filtros
/wishlist                      → lista de desejos (requer login)
/cart/identification           → identificação do cliente
/cart/confirmation             → confirmação do carrinho
/checkout/success              → pós-pagamento aprovado
/checkout/sucess               → redirect 308 → /checkout/success (typo legado)
/checkout/cancel               → pagamento cancelado
/my-orders                     → histórico de pedidos
/authentication                → cadastro
/login                         → login

/admin                         → login/acesso admin
/admin/dashboard               → analytics + gestão de produtos e categorias
/admin/vitrine/banners         → CRUD banners sazonais (super_admin)
/admin/vitrine/mais-vendidos   → curadoria manual de destaque (super_admin)
/admin/produtos/[id]/variantes → gestão de variantes por produto
/admin/categorias/[id]/medidas → gestão de tabela de medidas por categoria

/api/auth/[...all]             → Better Auth
/api/search                    → GET autocomplete de produtos
/api/shipping/calculate        → POST cotação Melhor Envio
/api/stripe/webhook            → POST confirmação assíncrona
```

---

## Variáveis de ambiente

```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=https://seudominio.com.br

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

MELHOR_ENVIO_TOKEN=eyJ...           # sem aspas, sem "Bearer "
MELHOR_ENVIO_BASE_URL=sandbox.melhorenvio.com.br  # sem https://, sem barra final
MELHOR_ENVIO_CEP_ORIGEM=01021200    # 8 dígitos, sem traço

SUPER_ADMIN_EMAIL=...               # opcional
```

---

## Fluxos principais

### Compra completa
```
Produto → cor + tamanho → addProductToCart → cart_item
→ /cart/identification → /cart/confirmation
→ finishOrder → order + order_items (transação Drizzle)
→ createCheckoutSession → Stripe Checkout
→ webhook → order.status = 'paid' → /checkout/success
```

### Frete
```
ShippingCalculator → CEP → /api/shipping/calculate
→ product.originPostalCode (fallback: env)
→ Melhor Envio API → filtra erros → ordena por preço
```

### Busca
```
SearchBar → debounce 300ms → /api/search?q={normalizeSearch(termo)}
→ sugestões → item clicado → /product/[slug]
→ Enter sem selecionar → /search?q={termo}
→ FilterPanel → "Aplicar filtros" → router.push com searchParams
```

---

## Erros conhecidos e soluções

| Erro | Causa | Solução |
|---|---|---|
| `Rendered more hooks than during the previous render` | Hook após early return | Mover todos os hooks antes do primeiro `return` |
| `column X does not exist` | Migration não aplicada | `npx drizzle-kit push` ou `generate + migrate` |
| Shipping 503 | Token inválido ou falta User-Agent | Ver checklist Melhor Envio abaixo |
| `UNKNOWN: unknown error, open '...kysely.js'` | Cache corrompido no Windows | Deletar `.next/` e reiniciar |
| Compilação lenta | Webpack no Windows | `next dev --turbo` (já configurado no package.json) |
| Imagem externa bloqueada | Hostname não configurado | Adicionar ao `remotePatterns` do `next.config` |

### Checklist Melhor Envio (quando der 503)
- Token sem aspas no `.env`, sem "Bearer " na frente
- Token do ambiente correto — sandbox ≠ produção
- `MELHOR_ENVIO_BASE_URL` sem `https://` e sem barra final
- `MELHOR_ENVIO_CEP_ORIGEM` com 8 dígitos, sem traço
- Header `User-Agent: NomeDaApp (email@conta)` presente no fetch
- Extensão `unaccent` habilitada no PostgreSQL

---

## Requisitos funcionais implementados

| RF | Feature | Status |
|---|---|---|
| RF01 | Vitrine dinâmica (banners + carrosséis) | ✅ |
| RF01-A | Gestão da vitrine pelo super_admin | ✅ |
| RF02 | Grade de variantes (cor + tamanho + stock) | ✅ |
| RF02-A | Gestão de variantes e estoque pelo admin | ✅ |
| RF03 | Busca com autocomplete no header | ✅ |
| RF04 | Página de resultados com filtros avançados | ✅ |
| RF05 | Lista de desejos (wishlist) | ✅ |
| RF06 | Cálculo de frete (Melhor Envio) | ✅ |
| RF07 | Recomendador de tamanho com medidas | ✅ |

---

## Correções aplicadas

| Fix | Descrição |
|---|---|
| FIX-01 | Redirect 308 de /product-variant → /product + canonical metadata |
| FIX-02 | Redirect 308 de /checkout/sucess → /checkout/success |
| FIX-03 | Metadata real substituindo "Create Next App" |
| FIX-04 | Padrão de Server Actions consolidado em src/actions/{action}/ |
| FIX-05 | Badge "Estimado" no dashboard para métricas não reais |
| FIX-06 | Turbopack ativo + correção de Rules of Hooks |

---

## Comandos úteis

```bash
npm run dev                    # Next.js com Turbopack
npm run build                  # build de produção (zero erros = padrão mínimo)

npx drizzle-kit generate       # gerar migration a partir do schema
npx drizzle-kit migrate        # aplicar migrations pendentes
npx drizzle-kit push           # push direto (apenas dev)
npx drizzle-kit studio         # GUI visual do banco

# Limpeza de cache — Windows PowerShell
Remove-Item -Recurse -Force .next
```

---

## O que NÃO fazer — regras absolutas

- ❌ Nunca usar `any` no TypeScript
- ❌ Nunca criar componente de UI sem verificar se shadcn já tem
- ❌ Nunca criar Server Action fora de `src/actions/{nome-da-action}/`
- ❌ Nunca criar Server Action sem `index.ts` + `schema.ts` separados na mesma pasta
- ❌ Nunca usar useQuery/useMutation diretamente no componente — sempre hook customizado
- ❌ Nunca hardcodar query key como string — sempre exportar função `getXQueryKey()`
- ❌ Nunca colocar hook após early return
- ❌ Nunca usar useEffect para derivar estado — usar useMemo
- ❌ Nunca usar useEffect para dados do banco — usar Server Component
- ❌ Nunca expor `MELHOR_ENVIO_TOKEN` ou `STRIPE_SECRET_KEY` no client
- ❌ Nunca criar Server Action sem verificar autenticação/autorização
- ❌ Nunca hardcodar URLs de domínio — usar `NEXT_PUBLIC_APP_URL`
- ❌ Nunca usar SQL raw — usar Drizzle ORM
- ❌ Nunca salvar preços em reais no banco — sempre centavos
- ❌ Nunca criar input com máscara sem `react-number-format`
- ❌ Nunca remover o redirect de `/product-variant/[slug]` — necessário para SEO
- ❌ Nunca indexar rotas de admin, checkout ou carrinho
- ❌ Nunca rodar `npm run dev` para verificar mudanças — usar `npm run build`
