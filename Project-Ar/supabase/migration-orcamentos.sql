-- ============================================================
--  Project Ar — ATUALIZAÇÃO 7: Orçamentos / Propostas
--  Gera propostas no app (e o aprovado vira obra). Seguro.
-- ============================================================

create table if not exists public.orcamentos (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  numero              text,
  cliente_id          uuid references public.clientes(id) on delete set null,
  cliente_nome        text not null,
  titulo              text not null default 'Proposta de Projeto',
  status              text not null default 'Rascunho',  -- Rascunho | Enviado | Aprovado | Recusado
  intro               text,
  escopo              text,
  ambientes           text,
  normas              text,
  servicos            text,
  revisoes            text,
  nao_inclusos        text,
  itens               jsonb not null default '[]'::jsonb,  -- [{descricao, valor}]
  desconto            numeric(12,2) default 0,
  condicoes_pagamento text,
  prazos              text,
  validade_dias       integer default 15,
  fecho               text,
  signatario_nome     text,
  signatario_cargo    text,
  obra_id             uuid references public.projetos(id) on delete set null,
  criado_em           timestamptz not null default now()
);
create index if not exists orcamentos_user_id_idx on public.orcamentos(user_id);

alter table public.orcamentos enable row level security;
drop policy if exists "orcamentos do dono" on public.orcamentos;
create policy "orcamentos do dono" on public.orcamentos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
