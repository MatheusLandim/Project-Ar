-- ============================================================
--  Project Ar — ATUALIZAÇÃO: pró-labore com tipo de transferência
-- ============================================================

alter table public.pro_labore add column if not exists forma_transferencia text;

-- ============================================================
--  Fim da atualização.
-- ============================================================
