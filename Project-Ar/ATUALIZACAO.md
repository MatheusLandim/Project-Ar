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
