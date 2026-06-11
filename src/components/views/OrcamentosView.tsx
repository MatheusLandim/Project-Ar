"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Orcamento, STATUS_ORCAMENTO, totalOrcamento } from "@/lib/types";
import { brl, formatDate } from "@/lib/format";

const STATUS_COR: Record<string, string> = {
  Rascunho: "bg-slate-500/10 text-slate-400 ring-slate-400/25",
  Enviado: "bg-sky-500/10 text-sky-500 ring-sky-500/25",
  Aprovado: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/25",
  Recusado: "bg-rose-500/10 text-rose-500 ring-rose-500/25",
};

export function OrcamentosView({
  orcamentos,
  reload,
  onNew,
  onEdit,
  onView,
  onConvert,
  onDelete,
}: {
  orcamentos: Orcamento[];
  reload: () => void;
  onNew: () => void;
  onEdit: (o: Orcamento) => void;
  onView: (o: Orcamento) => void;
  onConvert: (o: Orcamento) => void;
  onDelete: (o: Orcamento) => void;
}) {
  const supabase = createClient();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [confirm, setConfirm] = useState<string | null>(null);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return orcamentos.filter((o) => {
      const okF = filtro === "Todos" || o.status === filtro;
      const okB =
        !q ||
        o.cliente_nome.toLowerCase().includes(q) ||
        (o.numero ?? "").toLowerCase().includes(q) ||
        o.titulo.toLowerCase().includes(q);
      return okF && okB;
    });
  }, [orcamentos, busca, filtro]);

  async function mudarStatus(id: string, status: string) {
    await supabase.from("orcamentos").update({ status }).eq("id", id);
    reload();
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar nº, cliente ou título…"
          className="t-colors flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {["Todos", ...STATUS_ORCAMENTO].map((s) => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={`t-colors rounded-full px-3 py-1.5 text-sm font-medium ${
                filtro === s
                  ? "bg-ink text-canvas"
                  : "glass text-ink-soft hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={onNew}
          className="t-colors ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
        >
          + Novo orçamento
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {visiveis.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line glass p-10 text-center">
            <p className="font-display text-base font-bold text-ink">
              {busca || filtro !== "Todos"
                ? "Nenhum orçamento encontrado"
                : "Crie seu primeiro orçamento"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
              Monte a proposta, gere o PDF com a marca Project Ar e, quando
              aprovada, transforme em obra com um clique.
            </p>
          </div>
        ) : (
          visiveis.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-line glass p-4 shadow-card sm:p-5"
            >
              <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold text-ink">
                      {o.cliente_nome}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        STATUS_COR[o.status] ?? STATUS_COR.Rascunho
                      }`}
                    >
                      {o.status}
                    </span>
                    {o.obra_id && (
                      <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand ring-1 ring-inset ring-brand/25">
                        virou obra
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    #{o.numero} · {o.titulo} · {formatDate(o.criado_em.slice(0, 10))}
                  </p>
                </div>
                <p className="tnum font-display text-lg font-bold text-ink">
                  {brl(totalOrcamento(o))}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onView(o)}
                  className="t-colors rounded-lg bg-ink/5 px-3 py-1.5 text-sm font-medium text-ink hover:bg-ink/10"
                >
                  Ver / PDF
                </button>
                <button
                  onClick={() => onEdit(o)}
                  className="t-colors rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-ink/5"
                >
                  Editar
                </button>
                <select
                  value={o.status}
                  onChange={(e) => mudarStatus(o.id, e.target.value)}
                  className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink"
                  title="Mudar status"
                >
                  {STATUS_ORCAMENTO.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {!o.obra_id && (
                  <button
                    onClick={() => onConvert(o)}
                    className="t-colors rounded-lg border border-brand/40 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-soft"
                  >
                    Converter em obra
                  </button>
                )}
                <div className="ml-auto">
                  {confirm === o.id ? (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <button
                        onClick={() => {
                          onDelete(o);
                          setConfirm(null);
                        }}
                        className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Excluir
                      </button>
                      <button
                        onClick={() => setConfirm(null)}
                        className="rounded-md px-2 py-1 text-xs text-ink-soft hover:bg-ink/5"
                      >
                        Não
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirm(o.id)}
                      className="t-colors rounded-lg px-3 py-1.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
