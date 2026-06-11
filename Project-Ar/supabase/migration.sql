-- ============================================================
--  Project Ar — ATUALIZAÇÃO (rode no Supabase > SQL Editor)
--  Adiciona: endereço, engenharia, RT, e upload de arquivos.
--  Pode rodar com segurança mesmo já tendo dados cadastrados.
-- ============================================================

-- 1) Novos campos em projetos -------------------------------
alter table public.projetos add column if not exists endereco text;
alter table public.projetos add column if not exists engenharia text;
alter table public.projetos add column if not exists rt_percentual numeric(5,2) default 0;
alter table public.projetos add column if not exists rt_pago boolean default false;
alter table public.projetos add column if not exists rt_data_pagamento date;

-- 2) Tabela de anexos (registro das notas/boletos) ----------
create table if not exists public.anexos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  projeto_id  uuid not null references public.projetos(id) on delete cascade,
  tipo        text not null default 'outro',   -- nota_fiscal | boleto | outro
  nome        text not null,
  path        text not null,
  tamanho     bigint,
  criado_em   timestamptz not null default now()
);
create index if not exists anexos_projeto_id_idx on public.anexos(projeto_id);

alter table public.anexos enable row level security;
drop policy if exists "anexos do dono" on public.anexos;
create policy "anexos do dono" on public.anexos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Armazenamento dos arquivos (Storage) -------------------
-- Cria o "balde" privado onde os arquivos físicos ficam guardados.
insert into storage.buckets (id, name, public)
values ('anexos', 'anexos', false)
on conflict (id) do nothing;

-- Cada usuário só acessa arquivos dentro da pasta com o próprio id.
drop policy if exists "anexos enviar" on storage.objects;
create policy "anexos enviar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'anexos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "anexos ler" on storage.objects;
create policy "anexos ler" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'anexos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "anexos excluir" on storage.objects;
create policy "anexos excluir" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'anexos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
