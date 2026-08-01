"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Documento, PastaDocumento, DOCUMENTOS_GERAL_ID, juntarCaminho } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { ContextMenu, MenuContextoState, useFecharMenuAoClicarFora, BotaoMenu } from "@/components/ContextMenu";
import { PromptModal, ConfirmModal, PromptState, ConfirmState } from "@/components/PromptDialog";

// Pastas iniciais sugeridas — só um ponto de partida, 100% editáveis
// (renomeia, exclui, cria outras do jeito que quiser, igual Windows).
const PASTAS_INICIAIS = ["Projetos", "Propostas", "Documentos", "Contratos"];

function tamanhoLegivel(bytes: number | null) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function IconePasta() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-ink-faint">
      <path
        d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeArquivo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-ink-faint">
      <path
        d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3.5V8h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}



export function DocumentosView() {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [pastas, setPastas] = useState<PastaDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [caminhoAtual, setCaminhoAtual] = useState(""); // "" = raiz
  const [busca, setBusca] = useState("");
  const [menu, setMenu] = useState<MenuContextoState | null>(null);
  const [prompt, setPrompt] = useState<PromptState>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>(null);
  useFecharMenuAoClicarFora(!!menu, () => setMenu(null));

  async function load() {
    setLoading(true);
    const [d, p] = await Promise.all([
      supabase
        .from("documentos")
        .select("*")
        .eq("entidade_tipo", "empresa")
        .eq("entidade_id", DOCUMENTOS_GERAL_ID)
        .order("criado_em", { ascending: false }),
      supabase
        .from("pastas_documentos")
        .select("*")
        .eq("entidade_tipo", "empresa")
        .eq("entidade_id", DOCUMENTOS_GERAL_ID),
    ]);
    const docsData = !d.error ? ((d.data as Documento[]) ?? []) : [];
    let pastasData = !p.error ? ((p.data as PastaDocumento[]) ?? []) : [];

    // Primeira vez que a aba é aberta (100% vazia): cria as pastas
    // iniciais sugeridas. Depois disso você pode mexer à vontade.
    if (docsData.length === 0 && pastasData.length === 0) {
      const { data: inseridas } = await supabase
        .from("pastas_documentos")
        .insert(
          PASTAS_INICIAIS.map((caminho) => ({
            entidade_tipo: "empresa",
            entidade_id: DOCUMENTOS_GERAL_ID,
            caminho,
          }))
        )
        .select("*");
      if (inseridas) pastasData = inseridas as PastaDocumento[];
    }

    setDocs(docsData);
    setPastas(pastasData);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buscando = busca.trim().length > 0;

  const resultadosBusca = useMemo(() => {
    if (!buscando) return [];
    const q = busca.trim().toLowerCase();
    return docs
      .filter((d) => d.nome.toLowerCase().includes(q))
      .sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  }, [docs, busca, buscando]);

  const subpastas = useMemo(() => {
    const prefixo = caminhoAtual ? `${caminhoAtual}/` : "";
    const contagem = new Map<string, number>();
    for (const p of pastas) {
      if (caminhoAtual && !p.caminho.startsWith(prefixo)) continue;
      const resto = caminhoAtual ? p.caminho.slice(prefixo.length) : p.caminho;
      const primeiro = resto.split("/")[0];
      if (primeiro && !contagem.has(primeiro)) contagem.set(primeiro, 0);
    }
    for (const d of docs) {
      const pasta = d.pasta ?? "";
      if (!pasta) continue;
      if (caminhoAtual && !pasta.startsWith(prefixo)) continue;
      const resto = caminhoAtual ? pasta.slice(prefixo.length) : pasta;
      const primeiro = resto.split("/")[0];
      if (primeiro) contagem.set(primeiro, (contagem.get(primeiro) ?? 0) + 1);
    }
    return Array.from(contagem.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [pastas, docs, caminhoAtual]);

  const arquivosAqui = useMemo(
    () =>
      docs
        .filter((d) => (d.pasta ?? "") === caminhoAtual)
        .sort((a, b) => b.criado_em.localeCompare(a.criado_em)),
    [docs, caminhoAtual]
  );

  const partesCaminho = useMemo(() => caminhoAtual.split("/").filter(Boolean), [caminhoAtual]);

  function irPara(index: number) {
    setCaminhoAtual(partesCaminho.slice(0, index + 1).join("/"));
  }
  function subirUmNivel() {
    setCaminhoAtual(partesCaminho.slice(0, -1).join("/"));
  }

  function novaPasta() {
    setPrompt({
      titulo: "Nome da nova pasta",
      placeholder: "Ex.: Contratos 2026",
      onConfirmar: async (nome) => {
        const caminho = juntarCaminho(caminhoAtual, nome);
        const { error } = await supabase.from("pastas_documentos").insert({
          entidade_tipo: "empresa",
          entidade_id: DOCUMENTOS_GERAL_ID,
          caminho,
        });
        if (error && !error.message.toLowerCase().includes("duplicate")) {
          setErro(`Não deu pra criar a pasta: ${error.message}`);
          return;
        }
        setErro(null);
        await load();
      },
    });
  }

  function renomearPasta(nomeSub: string) {
    const caminhoAntigo = juntarCaminho(caminhoAtual, nomeSub);
    setPrompt({
      titulo: `Renomear "${nomeSub}"`,
      valorInicial: nomeSub,
      onConfirmar: async (novoNome) => {
        if (novoNome.trim() === nomeSub) return;
        const caminhoNovo = juntarCaminho(caminhoAtual, novoNome.trim());

        const pastasAlvo = pastas.filter(
          (p) => p.caminho === caminhoAntigo || p.caminho.startsWith(`${caminhoAntigo}/`)
        );
        const docsAlvo = docs.filter(
          (d) => d.pasta === caminhoAntigo || (d.pasta ?? "").startsWith(`${caminhoAntigo}/`)
        );

        const resultados = await Promise.all([
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
        const erroEncontrado = resultados.find((r) => r.error)?.error;
        if (erroEncontrado) {
          setErro(`Não deu pra renomear: ${erroEncontrado.message}`);
          return;
        }

        if (pastasAlvo.length === 0) {
          const { error } = await supabase.from("pastas_documentos").insert({
            entidade_tipo: "empresa",
            entidade_id: DOCUMENTOS_GERAL_ID,
            caminho: caminhoNovo,
          });
          if (error) {
            setErro(`Não deu pra renomear: ${error.message}`);
            return;
          }
        }
        setErro(null);
        await load();
      },
    });
  }

  function excluirPasta(nomeSub: string) {
    const caminhoAlvo = juntarCaminho(caminhoAtual, nomeSub);
    const docsAlvo = docs.filter(
      (d) => d.pasta === caminhoAlvo || (d.pasta ?? "").startsWith(`${caminhoAlvo}/`)
    );
    const pastasAlvo = pastas.filter(
      (p) => p.caminho === caminhoAlvo || p.caminho.startsWith(`${caminhoAlvo}/`)
    );
    setConfirmDialog({
      titulo: `Excluir "${nomeSub}"?`,
      mensagem:
        docsAlvo.length > 0
          ? `Essa pasta tem ${docsAlvo.length} arquivo(s) dentro (incluindo subpastas). Todos serão excluídos junto.`
          : "Essa pasta está vazia.",
      textoConfirmar: "Excluir",
      perigo: true,
      onConfirmar: async () => {
        if (docsAlvo.length > 0) {
          const del1 = await supabase.storage.from("anexos").remove(docsAlvo.map((d) => d.path));
          if (del1.error) {
            setErro(`Não deu pra excluir os arquivos: ${del1.error.message}`);
            return;
          }
          const del2 = await supabase.from("documentos").delete().in("id", docsAlvo.map((d) => d.id));
          if (del2.error) {
            setErro(`Não deu pra excluir os arquivos do banco: ${del2.error.message}`);
            return;
          }
        }
        if (pastasAlvo.length > 0) {
          const del3 = await supabase.from("pastas_documentos").delete().in("id", pastasAlvo.map((p) => p.id));
          if (del3.error) {
            setErro(`Não deu pra excluir a pasta: ${del3.error.message}`);
            return;
          }
        }
        setErro(null);
        await load();
      },
    });
  }

  function renomearArquivo(d: Documento) {
    setPrompt({
      titulo: `Renomear "${d.nome}"`,
      valorInicial: d.nome,
      onConfirmar: async (novoNome) => {
        if (novoNome.trim() === d.nome) return;
        const { error } = await supabase.from("documentos").update({ nome: novoNome.trim() }).eq("id", d.id);
        if (error) {
          setErro(`Não deu pra renomear o arquivo: ${error.message}`);
          return;
        }
        setErro(null);
        await load();
      },
    });
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
      const path = `${user.id}/pastas/empresa/${DOCUMENTOS_GERAL_ID}/${Date.now()}_${limpo}`;

      const up = await supabase.storage.from("anexos").upload(path, file);
      if (up.error) throw up.error;

      const ins = await supabase.from("documentos").insert({
        entidade_tipo: "empresa",
        entidade_id: DOCUMENTOS_GERAL_ID,
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

  async function abrir(path: string) {
    const { data, error } = await supabase.storage.from("anexos").createSignedUrl(path, 120);
    if (!error && data) window.open(data.signedUrl, "_blank");
  }

  function excluirArquivo(id: string, path: string, nome: string) {
    setConfirmDialog({
      titulo: `Excluir "${nome}"?`,
      textoConfirmar: "Excluir",
      perigo: true,
      onConfirmar: async () => {
        const del1 = await supabase.storage.from("anexos").remove([path]);
        if (del1.error) {
          setErro(`Não deu pra excluir o arquivo: ${del1.error.message}`);
          return;
        }
        const del2 = await supabase.from("documentos").delete().eq("id", id);
        if (del2.error) {
          setErro(`Não deu pra excluir o arquivo do banco: ${del2.error.message}`);
          return;
        }
        setErro(null);
        await load();
      },
    });
  }

  return (
    <div className="animate-fade-up">
      {erro && (
        <p className="mb-3 rounded-lg bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-500">
          ⚠ {erro}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar arquivo em qualquer pasta…"
          className="t-colors flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink sm:max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={novaPasta}
            className="t-colors inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2.5 text-sm font-medium text-ink-soft hover:bg-ink/5"
          >
            + Nova pasta
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) enviar(f);
            }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy || buscando}
            className="t-colors inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? "Enviando…" : "+ Enviar arquivo aqui"}
          </button>
        </div>
      </div>

      {!buscando && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1 text-sm">
            <button
              onClick={() => setCaminhoAtual("")}
              className={`t-colors rounded-md px-1.5 py-0.5 font-semibold hover:bg-ink/5 ${
                caminhoAtual === "" ? "text-ink" : "text-brand"
              }`}
            >
              Documentos
            </button>
            {partesCaminho.map((parte, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-ink-faint">/</span>
                <button
                  onClick={() => irPara(i)}
                  className={`t-colors rounded-md px-1.5 py-0.5 font-semibold hover:bg-ink/5 ${
                    i === partesCaminho.length - 1 ? "text-ink" : "text-brand"
                  }`}
                >
                  {parte}
                </button>
              </span>
            ))}
          </div>
          {caminhoAtual && (
            <button
              onClick={subirUmNivel}
              className="t-colors rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-ink/5"
            >
              ↑ Subir
            </button>
          )}
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl glass" />
            ))}
          </div>
        ) : buscando ? (
          resultadosBusca.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line glass p-10 text-center">
              <p className="text-sm text-ink-soft">Nenhum arquivo encontrado com esse nome.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {resultadosBusca.map((d) => (
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
                        { label: "Excluir", tone: "danger", onClick: () => excluirArquivo(d.id, d.path, d.nome) },
                      ],
                    });
                  }}
                  className="flex items-center gap-3 rounded-xl border border-line glass px-4 py-3"
                >
                  <IconeArquivo />
                  <button onClick={() => abrir(d.path)} className="min-w-0 flex-1 text-left" title="Abrir / baixar · clique direito para mais opções">
                    <p className="truncate text-sm font-medium text-ink hover:text-brand">{d.nome}</p>
                    <p className="text-xs text-ink-faint">
                      {(d.pasta || "Documentos")} ·{" "}
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
                          { label: "Excluir", tone: "danger", onClick: () => excluirArquivo(d.id, d.path, d.nome) },
                        ],
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )
        ) : subpastas.length === 0 && arquivosAqui.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line glass p-10 text-center">
            <p className="font-display text-base font-bold text-ink">Pasta vazia</p>
            <p className="mt-1 text-sm text-ink-soft">
              Crie uma subpasta ou envie o primeiro arquivo aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {subpastas.map(([nomeSub, qtd]) => (
              <div
                key={nomeSub}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({
                    x: e.clientX,
                    y: e.clientY,
                    opcoes: [
                      { label: "Abrir", onClick: () => setCaminhoAtual(juntarCaminho(caminhoAtual, nomeSub)) },
                      { label: "Renomear", onClick: () => renomearPasta(nomeSub) },
                      { label: "Excluir", tone: "danger", onClick: () => excluirPasta(nomeSub) },
                    ],
                  });
                }}
                className="t-colors flex items-center gap-2 rounded-xl border border-line glass px-4 py-3 hover:border-brand/40"
              >
                <button
                  onClick={() => setCaminhoAtual(juntarCaminho(caminhoAtual, nomeSub))}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  title="Abrir · clique direito para mais opções"
                >
                  <IconePasta />
                  <span className="flex-1 truncate text-sm font-semibold text-ink">{nomeSub}</span>
                  <span className="tnum text-xs text-ink-faint">{qtd}</span>
                </button>
                <BotaoMenu
                  onAbrir={(pos) =>
                    setMenu({
                      ...pos,
                      opcoes: [
                        { label: "Abrir", onClick: () => setCaminhoAtual(juntarCaminho(caminhoAtual, nomeSub)) },
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
                      { label: "Excluir", tone: "danger", onClick: () => excluirArquivo(d.id, d.path, d.nome) },
                    ],
                  });
                }}
                className="t-colors flex items-center gap-3 rounded-xl border border-line glass px-4 py-3 hover:border-brand/40"
              >
                <IconeArquivo />
                <button onClick={() => abrir(d.path)} className="min-w-0 flex-1 text-left" title="Abrir / baixar · clique direito para mais opções">
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
                        { label: "Excluir", tone: "danger", onClick: () => excluirArquivo(d.id, d.path, d.nome) },
                      ],
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {menu && <ContextMenu menu={menu} onFechar={() => setMenu(null)} />}
      {prompt && <PromptModal estado={prompt} onFechar={() => setPrompt(null)} />}
      {confirmDialog && <ConfirmModal estado={confirmDialog} onFechar={() => setConfirmDialog(null)} />}
    </div>
  );
}
