-- ============================================================
--  Project Ar — ATUALIZAÇÃO: Pessoas de contato por parceiro
--  Uma empresa (parceiro/construtora/engenharia) pode ter mais
--  de uma pessoa de contato. Cada uma com nome, telefone/whatsapp,
--  e-mail e data de nascimento.
-- ============================================================

create table if not exists public.pessoas_cliente (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_id      uuid not null references public.clientes(id) on delete cascade,
  nome            text not null,
  telefone        text,
  email           text,
  data_nascimento date,
  criado_em       timestamptz not null default now()
);

create index if not exists pessoas_cliente_cliente_idx on public.pessoas_cliente(cliente_id);

alter table public.pessoas_cliente enable row level security;

drop policy if exists "pessoas_cliente compartilhado" on public.pessoas_cliente;
create policy "pessoas_cliente compartilhado" on public.pessoas_cliente
  for all to authenticated using (true) with check (true);

-- ============================================================
--  Fim da atualização.
-- ============================================================
