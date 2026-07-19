-- ============================================================
--  Project Ar — ATUALIZAÇÃO 5: ART por valor fixo
--  A ART passa a ser um valor em R$ (cobrado pelo engenheiro),
--  não mais percentual. Seguro com dados existentes.
-- ============================================================

alter table public.projetos add column if not exists art_valor numeric(12,2) default 0;

-- Converte ART antigas (que estavam em %) para o valor correspondente
update public.projetos
set art_valor = round(valor_total * coalesce(art_percentual, 0) / 100, 2)
where (art_valor is null or art_valor = 0)
  and coalesce(art_percentual, 0) > 0;
