-- ============================================================
--  Project Ar — ATUALIZAÇÃO 11: Pastas internas de Clientes e
--  Fornecedores (arquivos guardados no próprio sistema, mesmo
--  bucket 'anexos' já usado nas obras).
--  Rode DEPOIS da migration-financeiro-v2.sql. Seguro: só cria
--  tabela nova, não apaga nada.
-- ============================================================

create table if not exists public.documentos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entidade_tipo text not null,        -- 'cliente' | 'fornecedor'
  entidade_id   uuid not null,
  pasta         text default 'Outros', -- Notas Fiscais | Boletos | Comprovantes | Outros
  nome          text not null,
  path          text not null,
  tamanho       int,
  criado_em     timestamptz not null default now()
);
create index if not exists documentos_entidade_idx on public.documentos(entidade_tipo, entidade_id);

alter table public.documentos enable row level security;
drop policy if exists "documentos compartilhado" on public.documentos;
create policy "documentos compartilhado" on public.documentos
  for all to authenticated using (true) with check (true);

-- Reaproveita o bucket 'anexos' que já existe (mesmas políticas de
-- storage já aplicadas em migration-compartilhar.sql). Nada a criar
-- aqui além da tabela de metadados acima.

-- ============================================================
--  Fim da atualização 11.
-- ============================================================
