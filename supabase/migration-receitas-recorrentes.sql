-- ============================================================
--  Project Ar — ATUALIZAÇÃO: recebimentos recorrentes
--
--  Contratos em que recebemos um valor todo mês (ex.: manutenção
--  mensal via PIX, com boleto e NF emitidos por nós). Diferente
--  dos recebíveis "variáveis" ligados a obra/orçamento aprovado.
--  A pasta desse contratante fica em Fornecedores, na seção
--  "Recebimentos recorrentes" (dentro de despesas variáveis),
--  com a mesma estrutura Ano/Mês/Tipo de documento.
-- ============================================================

create table if not exists public.receitas_recorrentes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  descricao       text not null,
  categoria       text,
  fornecedor_id   uuid references public.fornecedores(id) on delete set null,
  valor           numeric(12,2),
  dia_vencimento  int not null default 5,
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now()
);

alter table public.receitas_recorrentes enable row level security;
drop policy if exists "receitas_recorrentes compartilhado" on public.receitas_recorrentes;
create policy "receitas_recorrentes compartilhado" on public.receitas_recorrentes
  for all to authenticated using (true) with check (true);

alter table public.contas_receber add column if not exists fornecedor_id uuid references public.fornecedores(id) on delete set null;
alter table public.contas_receber add column if not exists receita_recorrente_id uuid references public.receitas_recorrentes(id) on delete set null;
alter table public.contas_receber add column if not exists mes_competencia text;

-- ============================================================
--  Fim da atualização.
-- ============================================================
