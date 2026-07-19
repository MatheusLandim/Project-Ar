-- ============================================================
--  Project Ar — ATUALIZAÇÃO 4: Cadastro de Clientes
--  Cria a ficha de cliente e liga às obras. Seguro com dados existentes.
-- ============================================================

create table if not exists public.clientes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome         text not null,
  tipo_pessoa  text default 'PJ',   -- PF | PJ
  documento    text,                -- CPF / CNPJ
  email        text,
  telefone     text,
  contato      text,                -- pessoa de contato
  endereco     text,
  observacoes  text,
  criado_em    timestamptz not null default now()
);
create index if not exists clientes_user_id_idx on public.clientes(user_id);

alter table public.clientes enable row level security;
drop policy if exists "clientes do dono" on public.clientes;
create policy "clientes do dono" on public.clientes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Liga a obra a um cliente (mantém o texto antigo como histórico)
alter table public.projetos
  add column if not exists cliente_id uuid references public.clientes(id) on delete set null;
create index if not exists projetos_cliente_id_idx on public.projetos(cliente_id);
