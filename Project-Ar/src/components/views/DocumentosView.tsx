"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Projeto, Anexo, pastaDeAnexo, iconePasta } from "@/lib/types";
import { formatDate } from "@/lib/format";

type Linha = Anexo & { _cliente: string; _projeto: string; _pasta: string };

function tamanhoLegivel(bytes: number | null) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function DocumentosView({
  projetos,
  reload,
}: {
  projetos: Projeto[];
  reload: () => void;
}) {
  const supabase = createClient();
  const [filtro, setFiltro] = useState("Todos");
  const [busca, setBusca] = useState("");

  const todas = useMemo<Linha[]>(() => {
    const all: Linha[] = [];
    for (const p of projetos) {
      for (const a of p.anexos ?? []) {
        all.push({
          ...a,
          _cliente: p.cliente,
          _projeto: p.projeto,
          _pasta: pastaDeAnexo(a),
        });
      }
    }
    return all;
  }, [projetos]);

  const pastas = useMemo(() => {
    const set = new Set<string>();
    todas.forEach((l) => set.add(l._pasta));
    return ["Todos", ...[...set].sort()];
  }, [todas]);

  const linhas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return todas
      .filter((l) => {
        const okF = filtro === "Todos" || l._pasta === filtro;
        const okB =
          !q ||
          l.nome.toLowerCase().includes(q) ||
          l._cliente.toLowerCase().includes(q) ||
          l._projeto.toLowerCase().includes(q);
        return okF && okB;
      })
      .sort((a, b) => b.criado_em.localeCompare(a.criado_em));
  }, [todas, filtro, busca]);

  async function abrir(path: string) {
    const { data, error } = await supabase.storage
      .from("anexos")
      .createSignedUrl(path, 120);
    if (!error && data) window.open(data.signedUrl, "_blank");
  }

  async function excluir(id: string, path: string) {
    await supabase.storage.from("anexos").remove([path]);
    await supabase.from("anexos").delete().eq("id", id);
    reload();
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por arquivo, cliente ou obra…"
          className="t-colors flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {pastas.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`t-colors rounded-full px-3 py-1.5 text-sm font-medium ${
                filtro === f
                  ? "bg-ink text-canvas"
                  : "glass text-ink-soft hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {linhas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line glass p-10 text-center">
            <p className="font-display text-base font-bold text-ink">
              Nenhum documento aqui
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Suba projetos, revisões, notas e boletos dentro de cada obra, na
              aba Documentos.
            </p>
          </div>
        ) : (
          linhas.map((l) => (
            <div
              key={l.id}
              className="t-colors flex items-center gap-3 rounded-xl border border-line glass px-4 py-3 hover:border-brand/40"
            >
              <span className="text-xl leading-none">
                {iconePasta(l._pasta)}
              </span>
              <button
                onClick={() => abrir(l.path)}
                className="min-w-0 flex-1 text-left"
                title="Abrir / baixar"
              >
                <p className="truncate text-sm font-medium text-ink hover:text-brand">
                  {l.nome}
                </p>
                <p className="text-xs text-ink-faint">
                  {l._pasta} · {l._cliente} ·{" "}
                  {formatDate(l.criado_em.slice(0, 10))}
                  {l.tamanho ? ` · ${tamanhoLegivel(l.tamanho)}` : ""}
                </p>
              </button>
              <button
                onClick={() => abrir(l.path)}
                className="t-colors rounded-md px-2.5 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft"
              >
                Abrir
              </button>
              <button
                onClick={() => excluir(l.id, l.path)}
                className="t-colors rounded-md px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10"
              >
                Excluir
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
