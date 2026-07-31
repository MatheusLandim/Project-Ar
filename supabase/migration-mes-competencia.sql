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
