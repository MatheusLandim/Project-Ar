-- ============================================================
--  Project Ar — ATUALIZAÇÃO 12: Anexos por lançamento
--  Permite anexar comprovante/boleto/nota fiscal diretamente em
--  cada conta a pagar, conta a receber ou nota fiscal (além da
--  pasta geral do cliente/fornecedor), para que o relatório
--  mensal já saia com os arquivos certos linkados.
--  Rode DEPOIS da migration-financeiro-v3.sql.
-- ============================================================

alter table public.documentos
  alter column entidade_tipo drop not null,
  alter column entidade_id drop not null;

alter table public.documentos
  add column if not exists lancamento_tipo text,   -- 'pagar' | 'receber' | 'nota'
  add column if not exists lancamento_id uuid;

create index if not exists documentos_lancamento_idx
  on public.documentos(lancamento_tipo, lancamento_id);

-- ============================================================
--  Fim da atualização 12.
-- ============================================================
