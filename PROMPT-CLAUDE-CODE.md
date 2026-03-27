# Prompt — Integrar Docker na aplicação Alexo

## O que fazer

Integrar os arquivos Docker na aplicação Next.js 15 existente para permitir
deploy em qualquer VPS com Docker instalado.

## Arquivos a criar/modificar

### 1. Ativar output standalone (MODIFICAR next.config.ts)

Adicionar `output: 'standalone'` na configuração do Next.js:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  // ... manter todas as outras configurações existentes
}
```

### 2. Criar src/app/api/health/route.ts (CRIAR)

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`)
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch {
    return NextResponse.json({ status: 'unhealthy' }, { status: 503 })
  }
}
```

### 3. Criar Dockerfile na raiz (CRIAR)

Copiar exatamente o conteúdo do arquivo Dockerfile fornecido.
Multi-stage build com 3 estágios: deps → builder → runner.
Imagem final baseada em node:20-alpine (~150MB).

### 4. Criar .dockerignore na raiz (CRIAR)

```
.git
.gitignore
.env*
!.env.example
node_modules
.next
*.md
*.log
.DS_Store
coverage
public/uploads
```

### 5. Criar docker-compose.yml na raiz (CRIAR)

Copiar exatamente o conteúdo do arquivo docker-compose.yml fornecido.
Substituir SEU_USUARIO_DOCKERHUB pelo usuário real do Docker Hub.

### 6. Adicionar /public/uploads/*/  ao .gitignore (VERIFICAR)

Verificar se as pastas de upload já estão no .gitignore:
```
/public/uploads/brands/
/public/uploads/avatars/
/public/uploads/reviews/
/public/uploads/returns/
```

## Verificação após implementar

Rodar localmente para confirmar que o build funciona:

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  -t bewear:test \
  .

docker run -p 3001:3000 --env-file .env bewear:test
```

Acessar http://localhost:3001 e confirmar que a loja carrega.
Acessar http://localhost:3001/api/health e confirmar { "status": "ok" }.

## Restrições

- NÃO alterar nenhuma lógica de negócio
- NÃO alterar rotas, componentes ou Server Actions existentes
- Apenas adicionar os arquivos de infraestrutura Docker
- next build deve continuar funcionando sem o Docker (npm run build)
