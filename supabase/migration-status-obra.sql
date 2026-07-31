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
