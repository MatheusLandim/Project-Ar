-- ============================================================
--  Project Ar — ATUALIZAÇÃO: pastas unificadas em Fornecedores
--
--  Toda pasta (fixa ou variável) agora vive em Fornecedores.
--  tipo_pasta diz se aparece na seção "Despesas Fixas" ou
--  "Despesas Variáveis" — a estrutura da pasta (Ano/Mês/Tipo de
--  documento) é igual nos dois casos.
-- ============================================================

alter table public.fornecedores add column if not exists tipo_pasta text not null default 'variavel';
alter table public.despesas_fixas add column if not exists fornecedor_id uuid references public.fornecedores(id) on delete set null;

-- ============================================================
--  Fim da atualização.
-- ============================================================
