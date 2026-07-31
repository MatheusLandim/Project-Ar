"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Documento,
  PastaDocumento,
  EntidadeTipo,
  juntarCaminho,
} from "@/lib/types";
import { formatDate } from "@/lib/format";
import { ContextMenu, MenuContextoState, useFecharMenuAoClicarFora, BotaoMenu } from "@/components/ContextMenu";

function tamanhoLegivel(bytes: number | null) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function PastaEntidade({
  entidadeTipo,
  entidadeId,
  nomeEntidade,
  onClose,
}: {
  entidadeTipo: EntidadeTipo;
  entidadeId: string;
  nomeEntidade: string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [pastas, setPastas] = useState<PastaDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [caminhoAtual, setCaminhoAtual] = useState(""); // "" = raiz
  const [menu, setMenu] = useState<MenuContextoState | null>(null);
  useFecharMenuAoClicarFora(!!menu, () => setMenu(null));

  async function load() {
    setLoading(true);
    const [d, p] = await Promise.all([
      supabase
        .from("documentos")
        .select("*")
        .eq("entidade_tipo", entidadeTipo)
        .eq("entidade_id", entidadeId)
        .order("criado_em", { ascending: false }),
      supabase
        .from("pastas_documentos")
        .select("*")
        .eq("entidade_tipo", entidadeTipo)
        .eq("entidade_id", entidadeId),
    ]);
    if (!d.error) setDocs((d.data as Documento[]) ?? []);
    if (!p.error) setPastas((p.data as PastaDocumento[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entidadeTipo, entidadeId]);

  // Subpastas do nível atual: pastas cadastradas + pastas "implícitas"
  // (que só existem porque tem arquivo dentro), sem duplicar.
  const subpastas = useMemo(() => {
    const prefixo = caminhoAtual ? `${caminhoAtual}/` : "";
    const nomes = new Set<string>();
    for (const p of pastas) {
      if (caminhoAtual ? p.caminho.startsWith(prefixo) : true) {
        const resto = p.caminho.slice(prefixo.length);
        if (resto && !resto.includes("/")) nomes.add(resto);
      }
    }
    for (const d of docs) {
      const pasta = d.pasta ?? "";
      if (!pasta) continue;
      if (caminhoAtual && !pasta.startsWith(prefixo)) continue;
      const resto = caminhoAtual ? pasta.slice(prefixo.length) : pasta;
      const primeiro = resto.split("/")[0];
      if (primeiro) nomes.add(primeiro);
    }
    return Array.from(nomes).sort((a, b) => a.localeCompare(b));
  }, [pastas, docs, caminhoAtual]);

  // Contagem de itens (arquivos, recursivo) por subpasta, pra mostrar no card
  function contarItens(nomeSub: string) {
    const caminhoSub = juntarCaminho(caminhoAtual, nomeSub);
    return docs.filter(
      (d) => d.pasta === caminhoSub || (d.pasta ?? "").startsWith(`${caminhoSub}/`)
    ).length;
  }

  // Arquivos exatamente neste nível
  const arquivosAqui = useMemo(
    () =>
      docs
        .filter((d) => (d.pasta ?? "") === caminhoAtual)
        .sort((a, b) => b.criado_em.localeCompare(a.criado_em)),
    [docs, caminhoAtual]
  );

  const migalhas = useMemo(() => {
    const partes = caminhoAtual.split("/").filter(Boolean);
    const acc: { nome: string; caminho: string }[] = [];
    let atual = "";
    for (const parte of partes) {
      atual = juntarCaminho(atual, parte);
      acc.push({ nome: parte, caminho: atual });
    }
    return acc;
  }, [caminhoAtual]);

  async function novaPasta() {
    const nome = window.prompt("Nome da nova pasta:");
    if (!nome || !nome.trim()) return;
    const caminho = juntarCaminho(caminhoAtual, nome.trim());
    const { error } = await supabase.from("pastas_documentos").insert({
      entidade_tipo: entidadeTipo,
      entidade_id: entidadeId,
      caminho,
    });
    if (error && !error.message.includes("duplicate")) {
      setErro(error.message);
      return;
    }
    await load();
  }

  async function renomearPasta(nomeSub: string) {
    const caminhoAntigo = juntarCaminho(caminhoAtual, nomeSub);
    const novoNome = window.prompt("Novo nome da pasta:", nomeSub);
    if (!novoNome || !novoNome.trim() || novoNome.trim() === nomeSub) return;
    const caminhoNovo = juntarCaminho(caminhoAtual, novoNome.trim());

    // Atualiza a própria pasta e todas as subpastas/arquivos dentro dela
    const pastasAlvo = pastas.filter(
      (p) => p.caminho === caminhoAntigo || p.caminho.startsWith(`${caminhoAntigo}/`)
    );
    const docsAlvo = docs.filter(
      (d) => d.pasta === caminhoAntigo || (d.pasta ?? "").startsWith(`${caminhoAntigo}/`)
    );

    await Promise.all([
      ...pastasAlvo.map((p) =>
        supabase
          .from("pastas_documentos")
          .update({ caminho: caminhoNovo + p.caminho.slice(caminhoAntigo.length) })
          .eq("id", p.id)
      ),
      ...docsAlvo.map((d) =>
        supabase
          .from("documentos")
          .update({ pasta: caminhoNovo + (d.pasta ?? "").slice(caminhoAntigo.length) })
          .eq("id", d.id)
      ),
    ]);

    if (pastasAlvo.length === 0) {
      // pasta só existia "implicitamente" (por ter arquivo dentro) — registra ela
      await supabase.from("pastas_documentos").insert({
        entidade_tipo: entidadeTipo,
        entidade_id: entidadeId,
        caminho: caminhoNovo,
      });
    }

    await load();
  }

  async function excluirPasta(nomeSub: string) {
    const caminhoAlvo = juntarCaminho(caminhoAtual, nomeSub);
    const qtd = contarItens(nomeSub);
    const aviso =
      qtd > 0
        ? `Essa pasta tem ${qtd} arquivo(s) dentro (incluindo subpastas). Excluir tudo?`
        : "Excluir esta pasta vazia?";
    if (!window.confirm(aviso)) return;

    const docsAlvo = docs.filter(
      (d) => d.pasta === caminhoAlvo || (d.pasta ?? "").startsWith(`${caminhoAlvo}/`)
    );
    const pastasAlvo = pastas.filter(
      (p) => p.caminho === caminhoAlvo || p.caminho.startsWith(`${caminhoAlvo}/`)
    );

    if (docsAlvo.length > 0) {
      await supabase.storage.from("anexos").remove(docsAlvo.map((d) => d.path));
      await supabase
        .from("documentos")
        .delete()
        .in("id", docsAlvo.map((d) => d.id));
    }
    if (pastasAlvo.length > 0) {
      await supabase
        .from("pastas_documentos")
        .delete()
        .in("id", pastasAlvo.map((p) => p.id));
    }
    await load();
  }

  async function renomearArquivo(d: Documento) {
    const novoNome = window.prompt("Novo nome do arquivo:", d.nome);
    if (!novoNome || !novoNome.trim() || novoNome.trim() === d.nome) return;
    await supabase.from("documentos").update({ nome: novoNome.trim() }).eq("id", d.id);
    await load();
  }

  async function enviar(file: File) {
    setErro(null);
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada. Entre novamente.");

      const limpo = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${user.id}/pastas/${entidadeTipo}/${entidadeId}/${Date.now()}_${limpo}`;

      const up = await supabase.storage.from("anexos").upload(path, file);
      if (up.error) throw up.error;

      const ins = await supabase.from("documentos").insert({
        entidade_tipo: entidadeTipo,
        entidade_id: entidadeId,
        pasta: caminhoAtual,
        nome: file.name,
        path,
        tamanho: file.size,
      });
      if (ins.error) throw ins.error;

      await load();
    } catch (e: any) {
      setErro(e?.message ?? "Falha ao enviar o arquivo.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function abrir(p: string) {
    const { data, error } = await supabase.storage.from("anexos").createSignedUrl(p, 120);
    if (!error && data) window.open(data.signedUrl, "_blank");
  }

  async function excluirArquivo(id: string, p: string) {
    if (!confirm("Excluir este arquivo?")) return;
    await supabase.storage.from("anexos").remove([p]);
    await supabase.from("documentos").delete().eq("id", id);
    await load();
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-navy/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl glass-strong shadow-card"
      >
        <header className="border-b border-line px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                Pasta de{" "}
                {entidadeTipo === "cliente"
                  ? "cliente"
                  : entidadeTipo === "fornecedor"
                  ? "fornecedor"
                  : "despesa fixa"}
              </p>
              <h2 className="truncate font-display text-lg font-bold text-ink">{nomeEntidade}</h2>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-ink/5"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          {/* Migalhas de pão */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1 text-xs">
            <button
              onClick={() => setCaminhoAtual("")}
              className={`t-colors rounded-md px-1.5 py-0.5 font-medium hover:bg-ink/5 ${
                caminhoAtual === "" ? "text-ink" : "text-brand"
              }`}
            >
              🏠 Início
            </button>
            {migalhas.map((m, i) => (
              <span key={m.caminho} className="flex items-center gap-1">
                <span className="text-ink-faint">/</span>
                <button
                  onClick={() => setCaminhoAtual(m.caminho)}
                  className={`t-colors rounded-md px-1.5 py-0.5 font-medium hover:bg-ink/5 ${
                    i === migalhas.length - 1 ? "text-ink" : "text-brand"
                  }`}
                >
                  {m.nome}
                </button>
              </span>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg glass" />
              ))}
            </div>
          ) : subpastas.length === 0 && arquivosAqui.length === 0 ? (
            <p className="text-sm text-ink-soft">
              Pasta vazia. Crie uma subpasta ou envie o primeiro arquivo abaixo.
            </p>
          ) : (
            <div className="space-y-1.5">
              {subpastas.map((nomeSub) => (
                <div
                  key={nomeSub}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenu({
                      x: e.clientX,
                      y: e.clientY,
                      opcoes: [
                        {
                          label: "Abrir",
                          onClick: () => setCaminhoAtual(juntarCaminho(caminhoAtual, nomeSub)),
                        },
                        { label: "Renomear", onClick: () => renomearPasta(nomeSub) },
                        { label: "Excluir", tone: "danger", onClick: () => excluirPasta(nomeSub) },
                      ],
                    });
                  }}
                  className="t-colors flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 hover:bg-ink/5"
                >
                  <button
                    onClick={() => setCaminhoAtual(juntarCaminho(caminhoAtual, nomeSub))}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    title="Abrir · clique direito para mais opções"
                  >
                    <span className="text-base leading-none">📁</span>
                    <span className="flex-1 truncate text-sm font-semibold text-ink">
                      {nomeSub}
                    </span>
                    <span className="tnum text-xs text-ink-faint">{contarItens(nomeSub)}</span>
                  </button>
                  <BotaoMenu
                    onAbrir={(pos) =>
                      setMenu({
                        ...pos,
                        opcoes: [
                          {
                            label: "Abrir",
                            onClick: () => setCaminhoAtual(juntarCaminho(caminhoAtual, nomeSub)),
                          },
                          { label: "Renomear", onClick: () => renomearPasta(nomeSub) },
                          { label: "Excluir", tone: "danger", onClick: () => excluirPasta(nomeSub) },
                        ],
                      })
                    }
                  />
                </div>
              ))}

              {arquivosAqui.map((d) => (
                <div
                  key={d.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenu({
                      x: e.clientX,
                      y: e.clientY,
                      opcoes: [
                        { label: "Abrir / baixar", onClick: () => abrir(d.path) },
                        { label: "Renomear", onClick: () => renomearArquivo(d) },
                        { label: "Excluir", tone: "danger", onClick: () => excluirArquivo(d.id, d.path) },
                      ],
                    });
                  }}
                  className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2"
                >
                  <span className="text-base leading-none">📄</span>
                  <button
                    onClick={() => abrir(d.path)}
                    className="min-w-0 flex-1 text-left"
                    title="Abrir / baixar · clique direito para mais opções"
                  >
                    <p className="truncate text-sm font-medium text-ink hover:text-brand">{d.nome}</p>
                    <p className="text-xs text-ink-faint">
                      {d.tamanho ? `${tamanhoLegivel(d.tamanho)} · ` : ""}
                      {formatDate(d.criado_em.slice(0, 10))}
                    </p>
                  </button>
                  <BotaoMenu
                    onAbrir={(pos) =>
                      setMenu({
                        ...pos,
                        opcoes: [
                          { label: "Abrir / baixar", onClick: () => abrir(d.path) },
                          { label: "Renomear", onClick: () => renomearArquivo(d) },
                          { label: "Excluir", tone: "danger", onClick: () => excluirArquivo(d.id, d.path) },
                        ],
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {erro && (
            <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{erro}</p>
          )}
          {menu && <ContextMenu menu={menu} onFechar={() => setMenu(null)} />}
        </div>

        <div className="border-t border-line px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={novaPasta}
              className="t-colors inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5"
            >
              + Nova pasta
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.xml,.dwg,.dxf,.zip,.rar,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) enviar(f);
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="t-colors inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "Enviando…" : "+ Enviar arquivo aqui"}
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            O arquivo vai para a pasta atual{caminhoAtual ? ` (${caminhoAtual})` : " (início)"}.
          </p>
        </div>
      </div>
    </div>
  );
}
