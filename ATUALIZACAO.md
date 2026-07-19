# Atualização 9 — Módulo Financeiro

Adiciona ao menu lateral o item **Financeiro**, com sete abas: Fluxo de Caixa,
Contas a Pagar, Contas a Receber, Cartão de Crédito, Pró-labore, Notas Fiscais
e Despesas Fixas. São **2 passos** para colocar no ar.

## Passo 1 — Atualizar o banco (1 minuto)

1. Entre no **Supabase** → seu projeto → **SQL Editor** → **New query**.
2. Abra o arquivo **`supabase/migration-financeiro.sql`** (vem neste zip),
   copie TODO o conteúdo, cole e clique em **Run**.
3. Deve aparecer **Success**. Isso cria as tabelas `fornecedores`,
   `despesas_fixas`, `contas_pagar`, `contas_receber`, `pro_labore` e
   `notas_fiscais`, já compartilhadas com toda a equipe (mesmo padrão do
   restante do sistema).

> Seguro rodar mesmo com dados existentes: nada é apagado.

## Passo 2 — Subir o código (GitHub → Vercel)

1. No GitHub, abra o repositório do Project Ar.
2. Arraste os arquivos deste zip para a raiz do repositório (mesmo processo
   de sempre) — os arquivos com o mesmo nome são substituídos, os novos são
   adicionados.
3. **Commit changes.** A Vercel republica sozinha em ~2 minutos.

## Como usar

- **Contas a Pagar / a Receber:** clique em **+ Novo lançamento**. Ao
  escolher fornecedor ou cliente, dá para cadastrar um novo na hora com o
  botão **+ novo**, sem sair da tela.
- **Cartão de Crédito** é a mesma tabela de Contas a Pagar, filtrada pelo
  tipo "Cartão de Crédito" — lance a fatura do mês como um lançamento normal.
- **Despesas Fixas:** cadastre Contabilidade, DAS, DARF, Convênio etc. com o
  dia de vencimento. Na aba **Fluxo de Caixa**, o botão **"Gerar despesas
  fixas do mês"** cria os lançamentos do mês em Contas a Pagar (não duplica
  se já tiverem sido gerados). Edite ou exclua cada lançamento gerado sem
  afetar os meses seguintes.
- **Relatório mensal:** na aba **Fluxo de Caixa**, clique em **"Relatório
  mensal (contabilidade)"**, escolha o mês e depois **Baixar PDF** (usa a
  função de impressão do navegador, o mesmo recurso já usado para os
  orçamentos). O relatório traz só o que foi **pago**/**recebido** no mês,
  o pró-labore, subtotais, identificação da Project Ar Ltda e o rodapé de
  confidencialidade — sem data/hora de geração.

### Simplificações desta primeira versão (avise se quiser evoluir)

- A geração das despesas fixas do mês é feita pelo botão citado acima; não
  há ainda uma rotina automática 100% sem clique (cron) publicando isso
  sozinha todo dia 1º — dá para adicionar depois com um Vercel Cron.
- Os links de comprovante/pasta abrem a URL que você colar (nuvem, Drive
  etc.) diretamente em nova aba, em vez de uma página própria de
  visualização — mais simples e já cobre o caso de uso principal.
- O relatório mensal não gera o `.zip` de anexos automaticamente; o PDF já
  traz os links de cada comprovante.

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
