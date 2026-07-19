-- ============================================================
--  Project Ar — ATUALIZAÇÃO 2: ART (rode no Supabase > SQL Editor)
--  Adiciona a ART ao lado da RT. Seguro mesmo com dados já cadastrados.
-- ============================================================

alter table public.projetos add column if not exists art_percentual numeric(5,2) default 0;
alter table public.projetos add column if not exists art_pago boolean default false;
alter table public.projetos add column if not exists art_data_pagamento date;
