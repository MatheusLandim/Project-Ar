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
