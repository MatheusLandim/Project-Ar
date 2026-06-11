-- ============================================================
--  Project Ar — ATUALIZAÇÃO 8: Área de trabalho COMPARTILHADA
--  Todos os usuários logados passam a enxergar e editar os
--  mesmos dados (equipe da Project Ar). Seguro: não apaga dados.
--
--  Importante: continue controlando QUEM pode ter login no
--  Supabase (Authentication), pois agora todo usuário logado vê tudo.
-- ============================================================

-- ---------- Tabelas: troca "do dono" por "compartilhado" ----------
drop policy if exists "projetos do dono" on public.projetos;
create policy "projetos compartilhado" on public.projetos
  for all to authenticated using (true) with check (true);

drop policy if exists "pagamentos do dono" on public.pagamentos;
create policy "pagamentos compartilhado" on public.pagamentos
  for all to authenticated using (true) with check (true);

drop policy if exists "anexos do dono" on public.anexos;
create policy "anexos compartilhado" on public.anexos
  for all to authenticated using (true) with check (true);

drop policy if exists "clientes do dono" on public.clientes;
create policy "clientes compartilhado" on public.clientes
  for all to authenticated using (true) with check (true);

drop policy if exists "orcamentos do dono" on public.orcamentos;
create policy "orcamentos compartilhado" on public.orcamentos
  for all to authenticated using (true) with check (true);

-- ---------- Storage: arquivos visíveis para toda a equipe ----------
drop policy if exists "anexos ler" on storage.objects;
create policy "anexos ler" on storage.objects
  for select to authenticated using (bucket_id = 'anexos');

drop policy if exists "anexos enviar" on storage.objects;
create policy "anexos enviar" on storage.objects
  for insert to authenticated with check (bucket_id = 'anexos');

drop policy if exists "anexos excluir" on storage.objects;
create policy "anexos excluir" on storage.objects
  for delete to authenticated using (bucket_id = 'anexos');
