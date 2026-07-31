-- ============================================================
--  Project Ar — ATUALIZAÇÃO: Pastas livres (estilo explorador
--  de arquivos) para Clientes e Fornecedores.
--
--  A tabela `documentos` já existia e guarda os arquivos com uma
--  coluna `pasta` (texto livre). A partir de agora essa coluna
--  passa a guardar o CAMINHO completo da pasta, com "/" separando
--  os níveis. Ex.: "Notas Fiscais/Nota sinal".
--
--  Essa tabela nova (`pastas_documentos`) serve só para permitir
--  criar uma pasta vazia (sem nenhum arquivo dentro ainda) e ela
--  continuar existindo — igual pasta vazia no Windows.
-- ============================================================

create table if not exists public.pastas_documentos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entidade_tipo text not null,        -- 'cliente' | 'fornecedor'
  entidade_id   uuid not null,
  caminho       text not null,        -- caminho completo, ex: "Notas Fiscais/Nota sinal"
  criado_em     timestamptz not null default now(),
  unique (entidade_tipo, entidade_id, caminho)
);

create index if not exists pastas_documentos_entidade_idx
  on public.pastas_documentos(entidade_tipo, entidade_id);

alter table public.pastas_documentos enable row level security;

drop policy if exists "pastas_documentos compartilhado" on public.pastas_documentos;
create policy "pastas_documentos compartilhado" on public.pastas_documentos
  for all to authenticated using (true) with check (true);

-- ============================================================
--  Fim da atualização.
-- ============================================================
