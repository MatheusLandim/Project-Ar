# Project Ar — Controle Financeiro HVAC

App de controle financeiro para sua empresa de projetos de climatização.
Cadastre projetos, acompanhe o status e registre pagamentos (pagos, pendentes
e em atraso). Tudo salvo na nuvem (Supabase) e acessível de qualquer lugar,
com login por e‑mail e senha.

**Stack:** Next.js 14 (App Router) · Supabase (Postgres + Auth) · Tailwind CSS
· Deploy na Vercel.

---

## Visão geral do que você vai fazer

1. Criar um projeto no **Supabase** e rodar o SQL do banco.
2. Subir este código no **GitHub**.
3. Conectar na **Vercel** e configurar 2 variáveis de ambiente.
4. Pronto — acesse pelo link da Vercel de qualquer dispositivo.

Tempo estimado: ~15 minutos.

---

## Passo 1 — Supabase (banco + login)

1. Acesse <https://supabase.com> e crie uma conta (pode usar o GitHub).
2. **New project** → escolha um nome (ex.: `project-ar`), defina uma senha
   forte para o banco e a região mais próxima (ex.: South America / São Paulo).
3. Quando o projeto terminar de provisionar, vá em **SQL Editor → New query**,
   cole TODO o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql)
   e clique em **Run**. Isso cria as tabelas `projetos` e `pagamentos` com a
   segurança por usuário (RLS) já configurada.
4. (Recomendado para começar rápido) Em **Authentication → Sign In / Providers →
   Email**, desligue a opção **"Confirm email"**. Assim você cria a conta e já
   entra direto, sem precisar confirmar por e‑mail. Pode religar depois.
5. Pegue suas credenciais em **Project Settings → API**:
   - **Project URL** → será o `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → será o `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> A chave `anon` é segura para o navegador: o que protege seus dados é o RLS,
> que garante que cada usuário só acessa os próprios registros. Nunca use a
> chave `service_role` neste app.

---

## Passo 2 — Subir o código no GitHub

1. Crie um repositório novo no GitHub (pode ser privado), ex.: `project-ar`.
2. Na pasta deste projeto, rode:

   ```bash
   git init
   git add .
   git commit -m "Project Ar - controle financeiro"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/project-ar.git
   git push -u origin main
   ```

---

## Passo 3 — Deploy na Vercel

1. Acesse <https://vercel.com>, entre com o GitHub e clique em **Add New… →
   Project**.
2. Selecione o repositório `project-ar`. A Vercel detecta Next.js
   automaticamente — não precisa mexer em build settings.
3. Em **Environment Variables**, adicione as duas variáveis (mesmos valores do
   Passo 1.5):

   | Name                            | Value                                  |
   | ------------------------------- | -------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | `https://xxxx.supabase.co`             |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (chave anon completa)  |

4. Clique em **Deploy**. Em ~1 minuto você recebe um link tipo
   `https://project-ar.vercel.app`.
5. (Opcional, recomendado) No Supabase, em **Authentication → URL
   Configuration**, defina o **Site URL** como a URL da Vercel.

Pronto! Abra o link, crie sua conta e comece a cadastrar projetos. Funciona no
celular e no computador — dá pra "instalar" pela opção *Adicionar à tela de
início* do navegador.

---

## Rodar localmente (opcional, para testar/editar antes)

Pré‑requisito: **Node.js 18.18+**.

```bash
# 1. instalar dependências
npm install

# 2. configurar as variáveis
cp .env.local.example .env.local
#   abra .env.local e cole sua URL e a anon key do Supabase

# 3. rodar
npm run dev
```

Acesse <http://localhost:3000>.

---

## Como usar

- **Novo projeto:** cadastra cliente, obra, tipo (Residencial, Comercial,
  Industrial, PMOC, Retrofit…), valor do contrato, status e datas.
- **Status do projeto:** Proposta → Aprovado → Em execução → Concluído (ou
  Cancelado). Dá pra mudar direto no card.
- **Pagamentos:** lance parcelas/entradas com vencimento. "Dar baixa" marca como
  pago na data de hoje. O sistema mostra automaticamente o que está **pendente**
  e o que está **em atraso** (vencido e não pago).
- **Visão geral (topo):** total contratado, recebido, a receber e em atraso,
  somando todos os projetos.

---

## Estrutura do projeto

```
project-ar/
├─ supabase/schema.sql        # banco de dados (rode no SQL Editor)
├─ middleware.ts              # protege as rotas (exige login)
├─ src/
│  ├─ app/
│  │  ├─ login/               # tela de login/cadastro
│  │  └─ dashboard/           # painel principal
│  ├─ components/             # cards, formulário, KPIs, pagamentos
│  └─ lib/
│     ├─ supabase/            # clientes do Supabase (browser/server)
│     ├─ types.ts             # tipos e regras de status
│     └─ format.ts            # formatação de R$ e datas
└─ .env.local.example
```

---

## Dúvidas comuns

**"Não foi possível carregar os dados" no painel.** Confirme que você rodou o
`schema.sql` no Supabase e que as duas variáveis de ambiente estão corretas na
Vercel (e refez o deploy depois de adicioná‑las).

**Criei a conta mas não consigo entrar.** Se deixou o "Confirm email" ligado,
confirme pelo link enviado ao seu e‑mail. Para começar sem isso, desligue a
opção (Passo 1.4).

**Quero adicionar mais usuários da empresa.** Cada pessoa cria a própria conta
no app. Por padrão, cada conta vê apenas os próprios projetos. Se quiser que a
equipe compartilhe a mesma base, me avise — dá pra evoluir o modelo para
"empresa/equipe".
