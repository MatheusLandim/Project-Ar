"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Projeto, STATUS_PROJETO, pagamentoStatus } from "@/lib/types";
import { brl, formatDate } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";
import { PaymentManager } from "./PaymentManager";

export function ProjectCard({
  projeto,
  onChanged,
  onEdit,
}: {
  projeto: Projeto;
  onChanged: () => void;
  onEdit: (p: Projeto) => void;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const recebido = projeto.pagamentos
    .filter((p) => pagamentoStatus(p) === "pago")
    .reduce((s, p) => s + Number(p.valor), 0);
  const total = Number(projeto.valor_total);
  const pct = total > 0 ? Math.min(100, (recebido / total) * 100) : 0;
  const temAtraso = projeto.pagamentos.some(
    (p) => pagamentoStatus(p) === "atrasado"
  );

  async function mudarStatus(status: string) {
    await supabase.from("projetos").update({ status }).eq("id", projeto.id);
    onChanged();
  }

  async function excluir() {
    await supabase.from("projetos").delete().eq("id", projeto.id);
    onChanged();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-bold text-ink">
              {projeto.cliente}
            </h3>
            <StatusBadge status={projeto.status} />
            {temAtraso && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                ● Pagamento atrasado
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-ink-soft">
            {projeto.projeto}
            {projeto.tipo && (
              <span className="text-ink-faint"> · {projeto.tipo}</span>
            )}
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            {projeto.data_inicio && <>Início {formatDate(projeto.data_inicio)} · </>}
            {projeto.data_previsao && <>Previsão {formatDate(projeto.data_previsao)}</>}
          </p>
        </div>

        <div className="text-right">
          <p className="tnum font-display text-lg font-bold text-ink">
            {brl(total)}
          </p>
          <p className="tnum text-xs text-emerald-700">
            {brl(recebido)} recebido
          </p>
        </div>
      </div>

      {/* Progresso de recebimento */}
      <div className="px-4 sm:px-5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-lg bg-canvas px-3 py-1.5 text-sm font-medium text-ink hover:bg-slate-200"
        >
          {open ? "Ocultar" : "Pagamentos"}
          <span className="text-ink-faint">
            ({projeto.pagamentos.length})
          </span>
        </button>

        <select
          value={projeto.status}
          onChange={(e) => mudarStatus(e.target.value)}
          className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-ink"
          title="Alterar status"
        >
          {STATUS_PROJETO.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          onClick={() => onEdit(projeto)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-slate-100"
        >
          Editar
        </button>

        <div className="ml-auto">
          {confirming ? (
            <span className="inline-flex items-center gap-2 text-sm">
              <span className="text-ink-soft">Excluir?</span>
              <button
                onClick={excluir}
                className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Sim
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-md px-2 py-1 text-xs text-ink-soft hover:bg-slate-100"
              >
                Não
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              Excluir
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-line p-4 sm:p-5">
          {projeto.observacoes && (
            <p className="mb-3 rounded-lg bg-canvas px-3 py-2 text-sm text-ink-soft">
              {projeto.observacoes}
            </p>
          )}
          <PaymentManager projeto={projeto} onChanged={onChanged} />
        </div>
      )}
    </div>
  );
}
