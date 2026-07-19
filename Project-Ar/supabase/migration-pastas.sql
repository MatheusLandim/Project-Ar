-- ============================================================
--  Project Ar — ATUALIZAÇÃO 3: Pastas de documentos
--  Permite organizar arquivos por pasta (Projeto, Revisões, etc.)
--  Seguro mesmo com arquivos já enviados.
-- ============================================================

-- Nova coluna de pasta
alter table public.anexos add column if not exists pasta text;

-- Organiza os arquivos antigos em pastas, com base no tipo já existente
update public.anexos
set pasta = case tipo
  when 'nota_fiscal' then 'Notas Fiscais'
  when 'boleto' then 'Boletos'
  else 'Outros'
end
where pasta is null;
