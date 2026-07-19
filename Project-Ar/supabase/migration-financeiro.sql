-- ============================================================
--  Project Ar — ATUALIZAÇÃO 9: Módulo Financeiro
--  Contas a Pagar, Contas a Receber, Cartão de Crédito, Pró-labore,
--  Notas Fiscais, Despesas Fixas e Fornecedores.
--  Seguro: usa "create table if not exists", não apaga dados.
--  Compartilhado com toda a equipe logada (mesmo padrão da
--  migration-compartilhar.sql já aplicada no sistema).
-- ============================================================

-- ----------- Tabela: fornecedores -----------
create table if not exists public.fornecedores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome       text not null,
  cnpj_cpf   text,
  categoria  text,
  pasta_url  text,
  criado_em  timestamptz not null default now()
);

-- ----------- Tabela: despesas_fixas -----------
create table if not exists public.despesas_fixas (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  descricao      text not null,
  categoria      text,
  valor          numeric(12,2),        -- nulo se o valor variar todo mês (DAS, DARF, cartão)
  dia_vencimento int not null default 5,
  pasta_url      text,
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now()
);

-- ----------- Tabela: contas_pagar -----------
create table if not exists public.contas_pagar (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo             text not null default 'despesa_extra', -- boleto | nota_fiscal | despesa_extra | cartao_credito
  descricao        text not null,
  fornecedor_id    uuid references public.fornecedores(id) on delete set null,
  categoria        text,
  valor            numeric(12,2) not null default 0,
  vencimento       date,
  data_pagamento   date,
  forma_pagamento  text,
  anexo_url        text,
  obra_id          uuid references public.projetos(id) on delete set null,
  vinculo_tipo     text default 'nenhum', -- obra | empresa | despesa_fixa | nenhum
  vinculo_id       uuid,
  pasta_url        text,
  despesa_fixa_id  uuid references public.despesas_fixas(id) on delete set null,
  observacoes      text,
  criado_em        timestamptz not null default now()
);
create index if not exists contas_pagar_vencimento_idx on public.contas_pagar(vencimento);
create index if not exists contas_pagar_despesa_fixa_idx on public.contas_pagar(despesa_fixa_id);

-- ----------- Tabela: contas_receber -----------
create table if not exists public.contas_receber (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_id       uuid references public.clientes(id) on delete set null,
  obra_id          uuid references public.projetos(id) on delete set null,
  tipo             text not null default 'boleto', -- boleto | pix | nota_fiscal
  valor            numeric(12,2) not null default 0,
  vencimento       date,
  data_recebimento date,
  numero_nf        text,
  anexo_url        text,
  pasta_url        text,
  observacoes      text,
  criado_em        timestamptz not null default now()
);
create index if not exists contas_receber_vencimento_idx on public.contas_receber(vencimento);

-- ----------- Tabela: pro_labore -----------
create table if not exists public.pro_labore (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  mes_referencia   text not null,  -- ex: "2026-07"
  valor            numeric(12,2) not null default 0,
  data_pagamento   date,
  comprovante_url  text,
  criado_em        timestamptz not null default now()
);
create index if not exists pro_labore_mes_idx on public.pro_labore(mes_referencia);

-- ----------- Tabela: notas_fiscais -----------
create table if not exists public.notas_fiscais (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  direcao              text not null default 'emitida', -- emitida | recebida
  numero               text,
  tipo                 text default 'servico',          -- servico | produto
  cliente_fornecedor   text,
  valor                numeric(12,2) not null default 0,
  data_emissao         date,
  impostos             numeric(12,2),
  status               text not null default 'emitida', -- emitida | cancelada
  arquivo_url          text,
  criado_em            timestamptz not null default now()
);

-- ----------- Row Level Security (compartilhado com a equipe) -----------
alter table public.fornecedores    enable row level security;
alter table public.despesas_fixas  enable row level security;
alter table public.contas_pagar    enable row level security;
alter table public.contas_receber  enable row level security;
alter table public.pro_labore      enable row level security;
alter table public.notas_fiscais   enable row level security;

drop policy if exists "fornecedores compartilhado" on public.fornecedores;
create policy "fornecedores compartilhado" on public.fornecedores
  for all to authenticated using (true) with check (true);

drop policy if exists "despesas_fixas compartilhado" on public.despesas_fixas;
create policy "despesas_fixas compartilhado" on public.despesas_fixas
  for all to authenticated using (true) with check (true);

drop policy if exists "contas_pagar compartilhado" on public.contas_pagar;
create policy "contas_pagar compartilhado" on public.contas_pagar
  for all to authenticated using (true) with check (true);

drop policy if exists "contas_receber compartilhado" on public.contas_receber;
create policy "contas_receber compartilhado" on public.contas_receber
  for all to authenticated using (true) with check (true);

drop policy if exists "pro_labore compartilhado" on public.pro_labore;
create policy "pro_labore compartilhado" on public.pro_labore
  for all to authenticated using (true) with check (true);

drop policy if exists "notas_fiscais compartilhado" on public.notas_fiscais;
create policy "notas_fiscais compartilhado" on public.notas_fiscais
  for all to authenticated using (true) with check (true);

-- ============================================================
--  Fim da atualização 9. Depois de rodar este SQL, o módulo
--  Financeiro já aparece no menu lateral do sistema.
-- ============================================================
