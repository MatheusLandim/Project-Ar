"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Projeto, pagamentoStatus } from "@/lib/types";
import { brl, formatDate, hoje } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

export function PaymentManager({
  projeto,
  onChanged,
}: {
  projeto: Projeto;
  onChanged: () => void;
}) {
  const supabase = createClient();
  const [adding, setAdding] = useState(false);
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [venc, setVenc] = useState("");
  const [busy, setBusy] = useState(false);

  const pagamentos = [...projeto.pagamentos].sort((a, b) =>
    (a.data_vencimento ?? "").localeCompare(b.data_vencimento ?? "")
  );

  const totalLancado = pagamentos.reduce((s, p) => s + Number(p.valor), 0);
  const saldo = Number(projeto.valor_total) - totalLancado;

  async function addPagamento(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await supabase.from("pagamentos").insert({
      projeto_id: projeto.id,
      descricao: desc.trim() || null,
      valor: Number(valor) || 0,
      data_vencimento: venc || null,
      data_pagamento: null,
    });
    setDesc("");
    setValor("");
    setVenc("");
    setAdding(false);
    setBusy(false);
    onChanged();
  }

  async function togglePago(id: string, pago: boolean) {
    await supabase
      .from("pagamentos")
      .update({ data_pagamento: pago ? null : hoje() })
      .eq("id", id);
    onChanged();
  }

  async function removePagamento(id: string) {
    await supabase.from("pagamentos").delete().eq("id", id);
    onChanged();
  }

  return (
    <div className="rounded-xl border border-line bg-canvas/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-ink">Pagamentos</h4>
        <div className="flex items-center gap-3 text-xs text-ink-soft">
          <span className="tnum">
            Lançado: <strong className="text-ink">{brl(totalLancado)}</strong>
          </span>
          <span
            className={`tnum ${
              Math.abs(saldo) < 0.01
                ? "text-emerald-700"
                : saldo > 0
                ? "text-amber-700"
                : "text-rose-700"
            }`}
          >
            {saldo >= 0 ? "A lançar" : "Excedente"}: <strong>{brl(Math.abs(saldo))}</strong>
          </span>
        </div>
      </div>

      {pagamentos.length === 0 && !adding && (
        <p className="py-2 text-sm text-ink-soft">
          Nenhum pagamento lançado. Cadastre as parcelas ou a entrada deste
          projeto.
        </p>
      )}

      <ul className="divide-y divide-line">
        {pagamentos.map((p) => {
          const st = pagamentoStatus(p);
          return (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {p.descricao || "Pagamento"}
                </p>
                <p className="text-xs text-ink-soft">
                  Vence {formatDate(p.data_vencimento)}
                  {p.data_pagamento && (
                    <> · pago em {formatDate(p.data_pagamento)}</>
                  )}
                </p>
              </div>
              <span className="tnum text-sm font-semibold text-ink">
                {brl(Number(p.valor))}
              </span>
              <StatusBadge status={st} kind="pagamento" />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => togglePago(p.id, !!p.data_pagamento)}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    p.data_pagamento
                      ? "text-ink-soft hover:bg-slate-200"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {p.data_pagamento ? "Reabrir" : "Dar baixa"}
                </button>
                <button
                  onClick={() => removePagamento(p.id)}
                  className="rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                  aria-label="Excluir pagamento"
                >
                  Excluir
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {adding ? (
        <form
          onSubmit={addPagamento}
          className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-line bg-white p-3 sm:grid-cols-[1fr_140px_150px_auto]"
        >
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Descrição (ex.: Entrada, Parcela 1)"
            className="rounded-md border border-line px-2.5 py-2 text-sm"
          />
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Valor"
            className="tnum rounded-md border border-line px-2.5 py-2 text-sm"
          />
          <input
            type="date"
            value={venc}
            onChange={(e) => setVenc(e.target.value)}
            className="rounded-md border border-line px-2.5 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-md px-2 py-2 text-sm text-ink-soft hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand/40 px-3 py-2 text-sm font-medium text-brand hover:bg-brand-soft"
        >
          + Lançar pagamento
        </button>
      )}
    </div>
  );
}
