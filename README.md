# Frontend — De Role

Frontend Next.js (App Router, TypeScript, Tailwind e Shadcn UI) da plataforma de
eventos. Consome **exclusivamente o API Gateway**; não acessa banco nem serviços
internos.

## Rodando localmente

1. Copie `.env.example` para `.env.local` e ajuste a URL do gateway:

```bash
cp .env.example .env.local
```

Para desenvolvimento local do monorepo:

```bash
API_GATEWAY_URL=http://localhost:4000 npm run dev
```

Acesse `http://localhost:3000`.

## Variáveis de ambiente

| Variável | Onde usar | Descrição |
| --- | --- | --- |
| `API_GATEWAY_URL` | servidor | URL do gateway usada pelas route handlers e server components |
| `NEXT_PUBLIC_API_GATEWAY_URL` | opcional/browser | Só se alguma chamada precisar sair do browser. O padrão é same-origin |

Nunca coloque `INTERNAL_API_KEY`, `DATABASE_URL`, `JWT_SECRET` ou
`ADMIN_ACCESS_HASH` neste projeto. O frontend não fala com o banco e não conhece
segredos de backend.

## Arquitetura

O browser chama apenas rotas do próprio Next.js (`/api/*`). Essas rotas são um
proxy fino para o gateway:

```
browser -> Next.js route handler -> API Gateway -> serviços internos
```

- O JWT administrativo fica em cookie `httpOnly`, `secure` (em produção),
  `sameSite=lax`. Nada é salvo em `localStorage`/`sessionStorage`.
- O login recebe o e-mail e a senha no browser, calcula o hash SHA-256 da credencial
  (`e-mail:senha`) e envia somente o hash para o backend.
- Erros usam o envelope canônico `{ success: false, error: { code, message } }`.
- `401` limpa o cookie e devolve o usuário para o login.

### Rotas públicas

| Rota Next | Gateway | Descrição |
| --- | --- | --- |
| `GET /api/events` | `GET /api/events` | Lista paginada de eventos |
| `GET /api/events/[idOrSlug]` | `GET /api/events/:idOrSlug` | Detalhe por UUID ou slug |
| `POST /api/guests` | `POST /api/guests` | Cria convidado/ingresso |
| `POST /api/guests/lookup` | `POST /api/guests/lookup` | Consulta por e-mail, CPF ou nome |

### Rotas administrativas

| Rota Next | Gateway | Descrição |
| --- | --- | --- |
| `POST /api/admin/login` | `POST /api/admin/login` | Define o cookie httpOnly |
| `POST /api/admin/logout` | `POST /api/admin/logout` | Revoga a sessão e limpa o cookie |
| `GET /api/admin/me` | `GET /api/admin/me` | Valida a sessão |
| `GET /api/admin/dashboard` | `GET /api/admin/dashboard` | Totais e eventos |
| `GET/POST /api/admin/events` | `GET/POST /api/admin/events` | Lista/cria eventos |
| `PATCH/DELETE /api/admin/events/[id]` | `PATCH/DELETE /api/admin/events/:id` | Atualiza/cancela evento |
| `GET /api/admin/guests` | `GET /api/admin/guests` | Lista convidados |
| `GET /api/admin/guests/stats` | `GET /api/admin/guests/stats` | Estatísticas |
| `POST /api/admin/guests/[id]/check-in` | idem | Check-in |
| `POST /api/admin/guests/[id]/cancel` | idem | Cancelamento |

## Telas

- `/` — listagem de eventos ativos, busca e paginação.
- `/eventos/[slug]` — detalhe do evento, termos, disponibilidade e inscrição.
- `/verificar` — consulta de ingresso por e-mail, CPF ou nome.
- `/admin` — login, dashboard, CRUD de eventos, convidados e check-in.

## Formatação

- Dinheiro: `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`
  a partir de `priceInCents`.
- Datas: ISO UTC formatadas em `America/Sao_Paulo`.
- CPF: a API devolve mascarado; o frontend nunca tenta desmascarar.
- `imageUrl` é um caminho relativo dentro de `public/`; `null` usa placeholder.

## Scripts

```bash
npm run dev      # desenvolvimento (Turbopack)
npm run build    # build de produção
npm run start    # executa o build
npm run lint     # lint
```

## Deploy

Configure `API_GATEWAY_URL` no ambiente do deploy (Vercel ou outro). As rotas de
API do Next rodam no servidor, então o browser não precisa de CORS para falar
com o backend.

O projeto na Vercel está conectado ao repositório GitHub `ReimaoHenrique/de_role`.
Todo push na branch `main` dispara um deploy de produção automático.
