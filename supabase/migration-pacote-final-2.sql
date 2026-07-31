-- ============================================================
--  Project Ar — PACOTE 2: Configurações (permissões, empresa,
--  aparência, relatório)
--  Rode isso DEPOIS de já ter rodado migration-pacote-final.sql
--  (o pacote anterior). Também é seguro rodar mais de uma vez.
-- ============================================================

-- ============================================================
--  Project Ar — ATUALIZAÇÃO: Configurações (permissões, dados
--  da empresa, aparência, padrões do relatório)
--
--  IMPORTANTE sobre permissões: isso controla o que cada pessoa
--  VÊ dentro do site (mostra/esconde abas) — é um controle de
--  uso, não uma trava de banco de dados linha a linha. Todo
--  mundo com login continua no mesmo espaço de dados
--  compartilhado (como já era). Pra restringir de verdade no
--  nível do banco, seria um projeto bem maior — combinou com
--  você que isso aqui resolve o que você precisa por enquanto.
--
--  Quem já tem login hoje (você, Flávio, Matheus, Nilda) continua
--  vendo tudo automaticamente até você criar um perfil pra essa
--  pessoa em Configurações → Usuários — só a partir daí as
--  restrições passam a valer pra ela.
-- ============================================================

create table if not exists public.perfis (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references auth.users(id) on delete set null,
  email     text not null unique,
  nome      text,
  is_admin  boolean not null default false,
  areas     text[] not null default '{}',
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;

drop policy if exists "ver perfis" on public.perfis;
create policy "ver perfis" on public.perfis
  for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.perfis p2
      where p2.user_id = auth.uid() and p2.is_admin = true and p2.ativo = true
    )
  );

-- Sem política de insert/update/delete pra usuários comuns de propósito:
-- toda escrita em perfis passa pela API do site (que usa a chave de
-- serviço do Supabase), nunca direto do navegador.

create table if not exists public.configuracoes (
  id                     int primary key default 1,
  razao_social           text not null default 'PROJECT AR LTDA',
  cnpj                   text not null default '50.784.117/0001-81',
  paleta_cor             text not null default 'azul',
  relatorio_base_padrao  text not null default 'pagamento',
  atualizado_em          timestamptz not null default now(),
  constraint configuracoes_singleton check (id = 1)
);
insert into public.configuracoes (id) values (1) on conflict (id) do nothing;

alter table public.configuracoes enable row level security;

drop policy if exists "ver configuracoes" on public.configuracoes;
create policy "ver configuracoes" on public.configuracoes
  for select to authenticated using (true);

drop policy if exists "editar configuracoes" on public.configuracoes;
create policy "editar configuracoes" on public.configuracoes
  for update to authenticated using (
    exists (
      select 1 from public.perfis p2
      where p2.user_id = auth.uid() and p2.is_admin = true and p2.ativo = true
    )
    or not exists (select 1 from public.perfis)
  );

-- ============================================================
--  Fim da atualização.
-- ============================================================
