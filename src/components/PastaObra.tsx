"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Documento, PastaDocumento, Projeto, STATUS_PROJETO, juntarCaminho } from "@/lib/types";
import { brl, formatDate } from "@/lib/format";
import { ContextMenu, MenuContextoState, useFecharMenuAoClicarFora, BotaoMenu } from "@/components/ContextMenu";

const PASTAS_PADRAO = ["Aprovação", "Boleto", "Notas Fiscais e Recibos", "Comprovantes"];

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

export function PastaObra({
  projeto,
  onVoltar,
  onSalvar,
}: {
  projeto: Projeto;
  onVoltar: () => void;
  onSalvar: (id: string, campos: Record<string, unknown>) => Promise<string | null>;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [pastas, setPastas] = useState<PastaDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [caminhoAtual, setCaminhoAtual] = useState(""); // "" = raiz da obra
  const [menu, setMenu] = useState<MenuContextoState | null>(null);
  useFecharMenuAoClicarFora(!!menu, () => setMenu(null));

  // Resumo editável da obra
  const [eNome, setENome] = useState(projeto.projeto ?? "");
  const [eEndereco, setEEndereco] = useState(projeto.endereco ?? "");
  const [eStatus, setEStatus] = useState(projeto.status);
  const [eValor, setEValor] = useState(String(projeto.valor_total ?? ""));
  const [eComImposto, setEComImposto] = useState(projeto.com_imposto);
  const [eTemRt, setETemRt] = useState(projeto.tem_rt);
  const [eRt, setERt] = useState(projeto.rt_percentual ? String(projeto.rt_percentual) : "");
  const [eTemArt, setETemArt] = useState(projeto.tem_art);
  const [eArt, setEArt] = useState(projeto.art_valor ? String(projeto.art_valor) : "");
  const [salvandoResumo, setSalvandoResumo] = useState(false);
  const [erroResumo, setErroResumo] = useState<string | null>(null);
  const [salvoOk, setSalvoOk] = useState(false);

  useEffect(() => {
    setENome(projeto.projeto ?? "");
    setEEndereco(projeto.endereco ?? "");
    setEStatus(projeto.status);
    setEValor(String(projeto.valor_total ?? ""));
    setEComImposto(projeto.com_imposto);
    setETemRt(projeto.tem_rt);
    setERt(projeto.rt_percentual ? String(projeto.rt_percentual) : "");
    setETemArt(projeto.tem_art);
    setEArt(projeto.art_valor ? String(projeto.art_valor) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeto.id]);

  async function salvarResumo() {
    setSalvandoResumo(true);
    setErroResumo(null);
    setSalvoOk(false);
    const erro = await onSalvar(projeto.id, {
      projeto: eNome.trim(),
      endereco: eEndereco.trim() || null,
      status: eStatus,
      valor_total: Number(eValor) || 0,
      com_imposto: eComImposto,
      tem_rt: eTemRt,
      rt_percentual: eTemRt ? Number(eRt) || 0 : 0,
      tem_art: eTemArt,
      art_valor: eTemArt ? Number(eArt) || 0 : 0,
    });
    setSalvandoResumo(false);
    if (erro) setErroResumo(erro);
    else {
      setSalvoOk(true);
      setTimeout(() => setSalvoOk(false), 2500);
    }
  }

  async function load() {
    setLoading(true);
    const [d, p] = await Promise.all([
      supabase
        .from("documentos")
        .select("*")
        .eq("entidade_tipo", "projeto")
        .eq("entidade_id", projeto.id)
        .order("criado_em", { ascending: false }),
      supabase
        .from("pastas_documentos")
        .select("*")
        .eq("entidade_tipo", "projeto")
        .eq("entidade_id", projeto.id),
    ]);
    const docsData = !d.error ? ((d.data as Documento[]) ?? []) : [];
    let pastasData = !p.error ? ((p.data as PastaDocumento[]) ?? []) : [];

    // Obra nova / pasta nunca aberta: cria as pastas padrão automaticamente.
    // Se depois você renomear ou excluir alguma, ela não volta sozinha —
    // isso só roda quando a pasta está 100% vazia.
    if (docsData.length === 0 && pastasData.length === 0) {
      const { data: inseridas } = await supabase
        .from("pastas_documentos")
        .insert(
          PASTAS_PADRAO.map((caminho) => ({
            entidade_tipo: "projeto",
            entidade_id: projeto.id,
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
    setCaminhoAtual("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projeto.id]);

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

  async function novaPasta() {
    const nome = window.prompt("Nome da nova pasta:");
    if (!nome || !nome.trim()) return;
    const caminho = juntarCaminho(caminhoAtual, nome.trim());
    const { error } = await supabase.from("pastas_documentos").insert({
      entidade_tipo: "projeto",
      entidade_id: projeto.id,
      caminho,
    });
    if (error && !error.message.includes("duplicate")) {
      setErro(error.message);
      return;
    }
    await load();
  }

  async function renomearPasta(nomeSub: string) {
    if (caminhoAtual === "" && PASTAS_PADRAO.includes(nomeSub)) {
      alert(
        "Essa é uma pasta padrão e fica com o nome fixo para não bagunçar a ligação com o relatório de contabilidade. Você pode criar subpastas livres dentro dela (ex.: \"Boleto 2026\")."
      );
      return;
    }
    const caminhoAntigo = juntarCaminho(caminhoAtual, nomeSub);
    const novoNome = window.prompt("Novo nome da pasta:", nomeSub);
    if (!novoNome || !novoNome.trim() || novoNome.trim() === nomeSub) return;
    const caminhoNovo = juntarCaminho(caminhoAtual, novoNome.trim());

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
      await supabase.from("pastas_documentos").insert({
        entidade_tipo: "projeto",
        entidade_id: projeto.id,
        caminho: caminhoNovo,
      });
    }
    await load();
  }

  async function excluirPasta(nomeSub: string) {
    if (caminhoAtual === "" && PASTAS_PADRAO.includes(nomeSub)) {
      alert(
        "Essa é uma pasta padrão e não pode ser excluída, pra manter a ligação com o relatório de contabilidade. Se quiser, esvazie ela movendo os arquivos pra uma subpasta."
      );
      return;
    }
    const caminhoAlvo = juntarCaminho(caminhoAtual, nomeSub);
    const docsAlvo = docs.filter(
      (d) => d.pasta === caminhoAlvo || (d.pasta ?? "").startsWith(`${caminhoAlvo}/`)
    );
    const pastasAlvo = pastas.filter(
      (p) => p.caminho === caminhoAlvo || p.caminho.startsWith(`${caminhoAlvo}/`)
    );
    const aviso =
      docsAlvo.length > 0
        ? `Essa pasta tem ${docsAlvo.length} arquivo(s) dentro (incluindo subpastas). Excluir tudo?`
        : "Excluir esta pasta vazia?";
    if (!window.confirm(aviso)) return;

    if (docsAlvo.length > 0) {
      await supabase.storage.from("anexos").remove(docsAlvo.map((d) => d.path));
      await supabase.from("documentos").delete().in("id", docsAlvo.map((d) => d.id));
    }
    if (pastasAlvo.length > 0) {
      await supabase.from("pastas_documentos").delete().in("id", pastasAlvo.map((p) => p.id));
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
      const path = `${user.id}/pastas/projeto/${projeto.id}/${Date.now()}_${limpo}`;

      const up = await supabase.storage.from("anexos").upload(path, file);
      if (up.error) throw up.error;

      const ins = await supabase.from("documentos").insert({
        entidade_tipo: "projeto",
        entidade_id: projeto.id,
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

  function irPara(index: number) {
    setCaminhoAtual(partesCaminho.slice(0, index + 1).join("/"));
  }
  function subirUmNivel() {
    setCaminhoAtual(partesCaminho.slice(0, -1).join("/"));
  }

  return (
    <div className="animate-fade-up">
      <button
        onClick={onVoltar}
        className="t-colors mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
      >
        ← Voltar para clientes
      </button>

      {/* Resumo editável da obra */}
      <div className="rounded-2xl border border-line glass p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Resumo da obra
            </p>
            <h2 className="truncate font-display text-lg font-bold text-ink">
              {eNome || "Obra sem nome"}
            </h2>
            <p className="text-xs text-ink-soft">{projeto.cliente}</p>
          </div>
          <div className="flex items-center gap-2">
            {salvoOk && (
              <span className="text-xs font-semibold text-emerald-500">Salvo ✓</span>
            )}
            <button
              onClick={salvarResumo}
              disabled={salvandoResumo}
              className="t-colors rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark disabled:opacity-60"
            >
              {salvandoResumo ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Nome da obra
            </span>
            <input
              value={eNome}
              onChange={(e) => setENome(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Endereço
            </span>
            <input
              value={eEndereco}
              onChange={(e) => setEEndereco(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink"
              placeholder="Cidade / endereço da obra"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Status
            </span>
            <select
              value={eStatus}
              onChange={(e) => setEStatus(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            >
              {STATUS_PROJETO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Valor total do contrato (R$)
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={eValor}
              onChange={(e) => setEValor(e.target.value)}
              className="tnum w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink"
            />
          </label>
        </div>

        <div className="mt-4">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Imposto
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label
              className={`t-colors flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 ${
                eComImposto ? "border-brand bg-brand-soft" : "border-line hover:bg-ink/5"
              }`}
            >
              <input
                type="radio"
                name="imposto-obra"
                checked={eComImposto}
                onChange={() => setEComImposto(true)}
                className="h-4 w-4 accent-brand"
              />
              <span className={`text-sm font-semibold ${eComImposto ? "text-brand-dark" : "text-ink-soft"}`}>
                Imposto incluído (NF)
              </span>
            </label>
            <label
              className={`t-colors flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 ${
                !eComImposto ? "border-brand bg-brand-soft" : "border-line hover:bg-ink/5"
              }`}
            >
              <input
                type="radio"
                name="imposto-obra"
                checked={!eComImposto}
                onChange={() => setEComImposto(false)}
                className="h-4 w-4 accent-brand"
              />
              <span className={`text-sm font-semibold ${!eComImposto ? "text-brand-dark" : "text-ink-soft"}`}>
                Sem imposto (Recibo)
              </span>
            </label>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Essa obra tem RT?
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setETemRt(true)}
                className={`t-colors flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  eTemRt ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink-soft hover:bg-ink/5"
                }`}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setETemRt(false)}
                className={`t-colors flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  !eTemRt ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink-soft hover:bg-ink/5"
                }`}
              >
                Não
              </button>
            </div>
            {eTemRt && (
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={eRt}
                onChange={(e) => setERt(e.target.value)}
                className="tnum mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink"
                placeholder="RT (%)"
              />
            )}
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Essa obra tem ART?
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setETemArt(true)}
                className={`t-colors flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  eTemArt ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink-soft hover:bg-ink/5"
                }`}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setETemArt(false)}
                className={`t-colors flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  !eTemArt ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink-soft hover:bg-ink/5"
                }`}
              >
                Não
              </button>
            </div>
            {eTemArt && (
              <input
                type="number"
                step="0.01"
                min="0"
                value={eArt}
                onChange={(e) => setEArt(e.target.value)}
                className="tnum mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink"
                placeholder="ART (R$)"
              />
            )}
          </div>
        </div>

        {erroResumo && (
          <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{erroResumo}</p>
        )}
      </div>

      {/* Documentos da obra — abaixo do resumo */}
      <div className="mt-4 rounded-2xl border border-line glass p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Documentos
          </p>
          {caminhoAtual && (
            <button
              onClick={subirUmNivel}
              className="t-colors rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-ink/5"
            >
              ↑ Subir
            </button>
          )}
        </div>

        {partesCaminho.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1 text-xs">
            {partesCaminho.map((parte, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-ink-faint">/</span>}
                <button
                  onClick={() => irPara(i)}
                  className={`t-colors rounded-md px-1.5 py-0.5 font-medium hover:bg-ink/5 ${
                    i === partesCaminho.length - 1 ? "text-ink" : "text-brand"
                  }`}
                >
                  {parte}
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mt-4">
          {loading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg glass" />
              ))}
            </div>
          ) : subpastas.length === 0 && arquivosAqui.length === 0 ? (
            <p className="text-sm text-ink-soft">
              Pasta vazia. Crie uma subpasta ou envie o primeiro arquivo abaixo.
            </p>
          ) : (
            <div className="space-y-1.5">
              {subpastas.map(([nomeSub, qtd]) => {
                const fixa = caminhoAtual === "" && PASTAS_PADRAO.includes(nomeSub);
                return (
                  <div
                    key={nomeSub}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMenu({
                        x: e.clientX,
                        y: e.clientY,
                        nota: fixa ? "Pasta padrão" : undefined,
                        opcoes: fixa
                          ? [
                              {
                                label: "Abrir",
                                onClick: () => setCaminhoAtual(juntarCaminho(caminhoAtual, nomeSub)),
                              },
                            ]
                          : [
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
                      <IconePasta />
                      <span className="flex-1 truncate text-sm font-semibold text-ink">
                        {nomeSub}
                      </span>
                      {fixa && (
                        <span className="rounded-md bg-ink/5 px-1.5 py-0.5 text-[10px] font-semibold text-ink-faint">
                          padrão
                        </span>
                      )}
                      <span className="tnum text-xs text-ink-faint">{qtd}</span>
                    </button>
                    <BotaoMenu
                      onAbrir={(pos) =>
                        setMenu({
                          ...pos,
                          nota: fixa ? "Pasta padrão" : undefined,
                          opcoes: fixa
                            ? [
                                {
                                  label: "Abrir",
                                  onClick: () => setCaminhoAtual(juntarCaminho(caminhoAtual, nomeSub)),
                                },
                              ]
                            : [
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
                );
              })}

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
                  <IconeArquivo />
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

        <div className="mt-4 border-t border-line pt-4">
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
            O arquivo vai para a pasta atual{caminhoAtual ? ` (${caminhoAtual})` : " (raiz da obra)"}.
          </p>
        </div>
      </div>
    </div>
  );
}
