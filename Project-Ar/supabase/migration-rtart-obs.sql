-- ============================================================
--  Project Ar — ATUALIZAÇÃO 6: Observações de pagamento RT/ART
--  Campo livre para registrar a quem pagar (nome, PIX, banco).
--  Seguro com dados existentes.
-- ============================================================

alter table public.projetos add column if not exists rt_obs text;
alter table public.projetos add column if not exists art_obs text;
