# Atualização 9 — Módulo Financeiro

Adiciona ao menu lateral o item **Financeiro** (Fluxo de Caixa, Contas a
Pagar, Contas a Receber, Cartão de Crédito, Pró-labore, Notas Fiscais,
Despesas Fixas) e o item **Fornecedores**, separado, no mesmo nível de
Clientes. São **2 passos** para colocar no ar.

## Passo 1 — Atualizar o banco (1 minuto)

Rode, **nesta ordem**, no Supabase → seu projeto → **SQL Editor** → **New
query** (cole o conteúdo de cada arquivo, um de cada vez, e clique em Run):

1. `supabase/migration-financeiro.sql`
2. `supabase/migration-financeiro-v2.sql`
3. `supabase/migration-financeiro-v3.sql`
4. `supabase/migration-financeiro-v4.sql`

Deve aparecer **Success** nos quatro. Isso cria as tabelas `fornecedores`,
`despesas_fixas`, `contas_pagar`, `contas_receber`, `pro_labore`,
`notas_fiscais` e `documentos` (pastas internas + anexos por lançamento),
já compartilhadas com toda a equipe.

> Seguro rodar mesmo com dados existentes: nada é apagado.

## Passo 2 — Subir o código (GitHub → Vercel)

1. No GitHub, abra o repositório do Project Ar.
2. Arraste os arquivos deste zip para a **raiz** do repositório — confira
   que `package.json` e a pasta `src` ficam soltos na raiz, e não dentro
   de uma pasta `Project-Ar-main/` extra (esse é o erro mais comum e faz
   parecer que "nada mudou" depois do deploy).
3. **Commit changes.** A Vercel republica sozinha em ~2 minutos.

## Como funciona

- **Cartão de Crédito** é a mesma tabela de Contas a Pagar, filtrada pelo
  tipo "Cartão de Crédito" — lance a fatura do mês como um lançamento
  normal; ele aparece nos dois lugares.

- **Fornecedores** tem página própria no menu (não fica dentro de
  Financeiro), igual a Clientes: cadastro, edição, exclusão e pasta.

- **Nada de link externo.** Não existe mais campo para colar link de
  nuvem em lançamento nenhum. Tudo fica dentro do próprio sistema:
  - Cada **cliente** e cada **fornecedor** tem uma **pasta interna**
    (botão **📁 Pasta** na ficha dele, ou na aba Financeiro pelo ícone
    📁 de cada lançamento) com notas fiscais, boletos e comprovantes,
    organizados por categoria, upload direto pelo navegador.
  - Cada **lançamento** (Contas a Pagar, Contas a Receber, Nota Fiscal)
    tem seu próprio botão **📎 Anexos** — o comprovante/boleto/nota
    anexado ali fica vinculado especificamente àquele lançamento (e
    também aparece na pasta geral do cliente/fornecedor quando ele está
    selecionado). Esse vínculo por lançamento é o que alimenta o
    relatório mensal.

- **Despesas Fixas:** cadastre Contabilidade, DAS, DARF, Convênio etc.
  com o dia de vencimento. Na aba **Fluxo de Caixa**, o botão **"Gerar
  despesas fixas do mês"** cria os lançamentos do mês em Contas a Pagar
  (não duplica se já tiverem sido gerados).

- **Relatório mensal:** na aba **Fluxo de Caixa**, clique em **"Relatório
  mensal (contabilidade)"**, escolha o mês e depois **Baixar PDF**. O
  relatório busca automaticamente os anexos (📎) de cada conta paga/
  recebida no período e gera, para cada um, um link de download real —
  quem receber o PDF clica e baixa o arquivo original em alta qualidade
  (boleto, nota fiscal, comprovante). Esses links ficam válidos por 7
  dias; se o relatório for reaberto depois disso, é só gerar de novo.
  O relatório traz só o que foi **pago**/**recebido** no mês, o
  pró-labore, subtotais, identificação da Project Ar Ltda e o rodapé de
  confidencialidade — sem data/hora de geração.

### O que ainda não está automatizado (avise se quiser evoluir)

- A geração das despesas fixas do mês depende do botão citado acima;
  ainda não roda sozinha todo dia 1º (dá pra automatizar com Vercel Cron).
- O pró-labore continua com um campo de link de comprovante (não uma
  pasta interna) — pode evoluir para o mesmo padrão se fizer sentido.
- Despesas Fixas (Contabilidade/DAS/DARF/Convênio) ainda usam um campo de
  link de pasta, já que não têm um cliente/fornecedor associado.

---

# Atualização — visual premium + RT + upload de documentos

Você já tem o app no ar. Para aplicar esta versão nova, são só **2 passos**.

---

## Passo 1 — Atualizar o banco (1 minuto)

Esta versão tem campos novos (endereço, engenharia, RT) e o upload de arquivos.
Precisamos avisar o banco sobre isso.

1. Entre no **Supabase** → seu projeto → **SQL Editor** → **New query**.
2. Abra o arquivo **`supabase/migration.sql`** (vem no zip), copie TODO o conteúdo,
   cole e clique em **Run**.
3. Deve aparecer **Success**. Pronto — isso cria os campos novos, a tabela de
   documentos e o "balde" seguro onde os arquivos (notas/boletos) ficam guardados.

> É seguro rodar mesmo já tendo projetos cadastrados: nada é apagado.

---

## Passo 2 — Atualizar o código no GitHub (auto-publica)

1. Descompacte o novo `project-ar.zip` no seu PC.
2. Abra seu repositório no GitHub: https://github.com/MatheusLandim/Project-Ar
3. **Importante:** entre na mesma pasta onde está hoje o arquivo `package.json`
   (se ao abrir o repositório você já vê o `package.json` na lista, é aqui mesmo;
   se ele está dentro de uma pasta, entre nela primeiro).
4. Clique em **Add file → Upload files**.
5. No seu PC, abra a pasta `project-ar` descompactada, selecione **tudo que está
   dentro** dela (Ctrl+A) e **arraste** para a janela do GitHub. Os arquivos com o
   mesmo nome são substituídos automaticamente, e os novos são adicionados.
6. Clique em **Commit changes**.

Assim que você confirmar, a **Vercel detecta a mudança e republica sozinha**.
Acompanhe na aba **Deployments**. Em ~2 minutos o app novo está no ar.

---

## O que mudou nesta versão

- 🎨 **Visual premium** com a identidade Project Ar (azul-marinho + azul-gelo),
  efeito de vidro, animações suaves e o logo no topo.
- 🌗 **Modo claro/escuro** com botão de alternância (ao lado de "Sair").
- 🏗️ **Engenharia/Arquitetura** e **endereço da obra** em cada projeto.
- 📊 **RT (Responsabilidade Técnica):** informe a % e o app calcula o valor a
  pagar, mostra no card e deixa marcar como pago. Há também um total de
  "RT a pagar" no painel.
- 📎 **Documentos:** dentro de cada projeto, aba **Documentos** para anexar
  **Notas Fiscais** e **Boletos** (PDF ou imagem). Ficam guardados na nuvem,
  com acesso só seu, e podem ser abertos/baixados a qualquer momento.

---

## Se aparecer erro depois de atualizar

- **"Não foi possível carregar os dados":** quase sempre é o Passo 1 que faltou.
  Rode o `migration.sql` no Supabase e recarregue o app.
- **Upload falha:** confirme no Supabase, em **Storage**, que existe um balde
  chamado **anexos** (o SQL cria automaticamente). Se não existir, rode o
  `migration.sql` de novo.
