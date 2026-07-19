"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Documento, EntidadeTipo, LancamentoTipo, PASTAS_ENTIDADE, iconePasta } from "@/lib/types";
import { formatDate } from "@/lib/format";

function tamanhoLegivel(bytes: number | null) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function AnexosLancamento({
  lancamentoTipo,
  lancamentoId,
  entidadeTipo,
  entidadeId,
  titulo,
  onClose,
}: {
  lancamentoTipo: LancamentoTipo;
  lancamentoId: string;
  entidadeTipo?: EntidadeTipo | null;
  entidadeId?: string | null;
  titulo: string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [pasta, setPasta] = useState("Comprovantes");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("documentos")
      .select("*")
      .eq("lancamento_tipo", lancamentoTipo)
      .eq("lancamento_id", lancamentoId)
      .order("criado_em", { ascending: false });
    if (!error) setDocs((data as Documento[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lancamentoTipo, lancamentoId]);

  async function enviar(file: File) {
    setErro(null);
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada. Entre novamente.");

      const limpo = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${user.id}/pastas/lancamento/${lancamentoTipo}/${lancamentoId}/${Date.now()}_${limpo}`;

      const up = await supabase.storage.from("anexos").upload(path, file);
      if (up.error) throw up.error;

      const ins = await supabase.from("documentos").insert({
        entidade_tipo: entidadeTipo ?? null,
        entidade_id: entidadeId ?? null,
        lancamento_tipo: lancamentoTipo,
        lancamento_id: lancamentoId,
        pasta: pasta.trim() || "Outros",
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

  async function excluir(id: string, p: string) {
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
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Anexos</p>
            <h2 className="font-display text-lg font-bold text-ink">{titulo}</h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-ink/5"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg glass" />
              ))}
            </div>
          ) : docs.length === 0 ? (
            <p className="text-sm text-ink-soft">
              Nenhum arquivo anexado ainda. Envie o comprovante, boleto ou nota fiscal
              deste lançamento abaixo — ele já sai vinculado no relatório mensal.
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="text-base leading-none">{iconePasta(d.pasta)}</span>
                  <button onClick={() => abrir(d.path)} className="min-w-0 flex-1 text-left" title="Abrir / baixar">
                    <p className="truncate text-sm font-medium text-ink hover:text-brand">{d.nome}</p>
                    <p className="text-xs text-ink-faint">
                      {d.pasta} · {d.tamanho ? `${tamanhoLegivel(d.tamanho)} · ` : ""}
                      {formatDate(d.criado_em.slice(0, 10))}
                    </p>
                  </button>
                  <button
                    onClick={() => abrir(d.path)}
                    className="t-colors rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand-soft"
                  >
                    Abrir
                  </button>
                  <button
                    onClick={() => excluir(d.id, d.path)}
                    className="t-colors rounded-md px-2 py-1 text-xs text-rose-500 hover:bg-rose-500/10"
                  >
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          )}

          {erro && (
            <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{erro}</p>
          )}
        </div>

        <div className="border-t border-line px-6 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Enviar arquivo</p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={pasta}
              onChange={(e) => setPasta(e.target.value)}
              className="t-colors rounded-lg border border-line bg-surface px-2.5 py-2 text-sm text-ink"
            >
              {PASTAS_ENTIDADE.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.xml,.zip,.rar,.doc,.docx,.xls,.xlsx"
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
              {busy ? "Enviando…" : "+ Enviar"}
            </button>
          </div>
          {entidadeId && (
            <p className="mt-2 text-[11px] text-ink-faint">
              Também aparece na pasta geral do {entidadeTipo === "cliente" ? "cliente" : "fornecedor"}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
