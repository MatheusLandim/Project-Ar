-- ============================================================
--  Project Ar — Controle Financeiro HVAC
--  Schema do banco de dados (Supabase / PostgreSQL)
--  Como usar: Supabase > SQL Editor > New query > cole tudo > Run
-- ============================================================

-- ----------- Tabela: projetos -----------
create table if not exists public.projetos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente       text not null,
  projeto       text not null,
  tipo          text,
  valor_total   numeric(12,2) not null default 0,
  status        text not null default 'Proposta',
  data_inicio   date,
  data_previsao date,
  observacoes   text,
  criado_em     timestamptz not null default now()
);

-- ----------- Tabela: pagamentos -----------
create table if not exists public.pagamentos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  projeto_id      uuid not null references public.projetos(id) on delete cascade,
  descricao       text,
  valor           numeric(12,2) not null default 0,
  data_vencimento date,
  data_pagamento  date,
  criado_em       timestamptz not null default now()
);

create index if not exists pagamentos_projeto_id_idx on public.pagamentos(projeto_id);
create index if not exists projetos_user_id_idx on public.projetos(user_id);

-- ----------- Row Level Security -----------
-- Garante que cada usuário só enxerga e altera os PRÓPRIOS dados.
alter table public.projetos   enable row level security;
alter table public.pagamentos enable row level security;

drop policy if exists "projetos do dono" on public.projetos;
create policy "projetos do dono" on public.projetos
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "pagamentos do dono" on public.pagamentos;
create policy "pagamentos do dono" on public.pagamentos
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
