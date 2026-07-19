-- ============================================================
--  Project Ar — ATUALIZAÇÃO 10: Pastas de Clientes/Fornecedores
--  ligadas aos lançamentos financeiros.
--  Rode DEPOIS da migration-financeiro.sql. Seguro: só adiciona
--  colunas, não apaga nada.
-- ============================================================

-- Cliente passa a ter uma pasta própria (documentos, notas, boletos)
alter table public.clientes
  add column if not exists pasta_url text;

-- Nota fiscal passa a poder linkar direto no cadastro de cliente/fornecedor,
-- puxando a pasta de lá em vez de precisar digitar toda vez.
alter table public.notas_fiscais
  add column if not exists cliente_id uuid references public.clientes(id) on delete set null,
  add column if not exists fornecedor_id uuid references public.fornecedores(id) on delete set null,
  add column if not exists pasta_url text;

-- ============================================================
--  Fim da atualização 10.
-- ============================================================
