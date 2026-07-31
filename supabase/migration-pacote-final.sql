-- ============================================================
--  Project Ar — PACOTE FINAL DE ATUALIZAÇÕES
--  Rode este arquivo inteiro de uma vez no SQL Editor do Supabase.
--  Todas as instruções são seguras de rodar mais de uma vez
--  (usam "if not exists" / "if exists"), então não tem risco de
--  duplicar nada mesmo que algum trecho já tenha sido aplicado.
--
--  Ordem das atualizações incluídas aqui:
--   1. Pastas livres (estilo Windows) — clientes/fornecedores/obras
--   2. Pessoas de contato por parceiro (múltiplas pessoas por empresa)
--   3. RT/ART com "Não" explícito + campo de imposto (NF/Recibo) por obra
--   4. Novos nomes de status da obra (+ "Em revisão")
--   5. Pastas unificadas em Fornecedores (fixa / variável / recorrente)
--   6. Mês de competência nas contas a pagar
--   7. Recebimentos recorrentes (nova tabela + campos em contas_receber)
--   8. Pró-labore com tipo de transferência
-- ============================================================


-- ============================================================
--  Arquivo original: migration-pastas-livres.sql
-- ============================================================
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


-- ============================================================
--  Arquivo original: migration-pessoas-cliente.sql
-- ============================================================
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


-- ============================================================
--  Arquivo original: migration-rt-art-imposto.sql
-- ============================================================
-- ============================================================
--  Project Ar — ATUALIZAÇÃO: "Não" explícito para RT/ART e
--  campo de imposto por obra.
--
--  Nem toda obra tem RT ou ART. Antes isso era inferido pelo
--  percentual/valor estar em zero; agora fica explícito com uma
--  coluna própria (tem_rt / tem_art), então dá pra marcar "Não"
--  mesmo que no futuro o percentual mude.
-- ============================================================

alter table public.projetos add column if not exists tem_rt boolean not null default true;
alter table public.projetos add column if not exists tem_art boolean not null default true;
alter table public.projetos add column if not exists com_imposto boolean not null default true;

-- Preenche o histórico: obras que já não tinham percentual/valor
-- de RT ou ART lançado viram "Não" automaticamente.
update public.projetos set tem_rt = false where coalesce(rt_percentual, 0) = 0;
update public.projetos set tem_art = false where coalesce(art_valor, 0) = 0;

-- ============================================================
--  Fim da atualização.
-- ============================================================


-- ============================================================
--  Arquivo original: migration-status-obra.sql
-- ============================================================
-- ============================================================
--  Project Ar — ATUALIZAÇÃO: novos nomes de status da obra
--
--  "Em execução" agora é "Em execução (projeto preliminar)"
--  "Concluído" agora é "Concluído (projeto executivo)"
--  Novo status: "Em revisão"
--
--  Este UPDATE renomeia as obras que já estavam com o status
--  antigo, sem precisar editar uma por uma.
-- ============================================================

update public.projetos
  set status = 'Em execução (projeto preliminar)'
  where status = 'Em execução';

update public.projetos
  set status = 'Concluído (projeto executivo)'
  where status = 'Concluído';

-- ============================================================
--  Fim da atualização.
-- ============================================================


-- ============================================================
--  Arquivo original: migration-pastas-fornecedores.sql
-- ============================================================
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


-- ============================================================
--  Arquivo original: migration-mes-competencia.sql
-- ============================================================
-- ============================================================
--  Project Ar — ATUALIZAÇÃO: mês de competência da despesa
--
--  Guarda o mês a que a despesa realmente se refere (ex.: o DAS
--  de junho, pago em julho, continua marcado como "Junho/2026"),
--  separado da data de vencimento/pagamento. É esse campo que
--  organiza a pasta da despesa fixa em Ano/Mês.
-- ============================================================

alter table public.contas_pagar add column if not exists mes_competencia text;

-- ============================================================
--  Fim da atualização.
-- ============================================================


-- ============================================================
--  Arquivo original: migration-receitas-recorrentes.sql
-- ============================================================
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


-- ============================================================
--  Arquivo original: migration-prolabore-transferencia.sql
-- ============================================================
-- ============================================================
--  Project Ar — ATUALIZAÇÃO: pró-labore com tipo de transferência
-- ============================================================

alter table public.pro_labore add column if not exists forma_transferencia text;

-- ============================================================
--  Fim da atualização.
-- ============================================================

