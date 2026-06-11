"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Projeto, rtValor } from "@/lib/types";
import { brl, formatDate, hoje } from "@/lib/format";

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "apagar", label: "A pagar" },
  { id: "pagos", label: "Pagos" },
];

export function RtView({
  projetos,
  reload,
}: {
  projetos: Projeto[];
  reload: () => void;
}) {
  const supabase = createClient();
  const [filtro, setFiltro] = useState("todos");

  const comRt = useMemo(
    () => projetos.filter((p) => Number(p.rt_percentual) > 0),
    [projetos]
  );

  const visiveis = useMemo(() => {
    return comRt.filter((p) => {
      if (filtro === "apagar") return !p.rt_pago;
      if (filtro === "pagos") return !!p.rt_pago;
      return true;
    });
  }, [comRt, filtro]);

  const totalApagar = useMemo(
    () => comRt.filter((p) => !p.rt_pago).reduce((s, p) => s + rtValor(p), 0),
    [comRt]
  );
  const totalPago = useMemo(
    () => comRt.filter((p) => p.rt_pago).reduce((s, p) => s + rtValor(p), 0),
    [comRt]
  );

  async function toggleRt(p: Projeto) {
    await supabase
      .from("projetos")
      .update({
        rt_pago: !p.rt_pago,
        rt_data_pagamento: !p.rt_pago ? hoje() : null,
      })
      .eq("id", p.id);
    reload();
  }

  return (
    <div className="animate-fade-up">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line glass p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            RT a pagar
          </p>
          <p className="tnum mt-1.5 font-display text-xl font-bold text-amber-500">
            {brl(totalApagar)}
          </p>
        </div>
        <div className="rounded-2xl border border-line glass p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            RT já pago
          </p>
          <p className="tnum mt-1.5 font-display text-xl font-bold text-emerald-500">
            {brl(totalPago)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-1.5">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`t-colors rounded-full px-3 py-1.5 text-sm font-medium ${
              filtro === f.id
                ? "bg-ink text-canvas"
                : "glass text-ink-soft hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {visiveis.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line glass p-10 text-center">
            <p className="font-display text-base font-bold text-ink">
              Nenhuma RT neste filtro
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Informe a % de RT ao cadastrar ou editar uma obra para acompanhar
              aqui.
            </p>
          </div>
        ) : (
          visiveis.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line glass px-4 py-3.5 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {p.cliente}
                  <span className="font-normal text-ink-faint"> · {p.projeto}</span>
                </p>
                <p className="text-xs text-ink-soft">
                  {Number(p.rt_percentual)}% sobre {brl(Number(p.valor_total))}
                  {p.rt_pago && p.rt_data_pagamento && (
                    <> · pago {formatDate(p.rt_data_pagamento)}</>
                  )}
                </p>
              </div>
              <span className="tnum text-base font-bold text-ink">
                {brl(rtValor(p))}
              </span>
              <button
                onClick={() => toggleRt(p)}
                className={`t-colors rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  p.rt_pago
                    ? "text-ink-soft hover:bg-ink/5"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {p.rt_pago ? "Reabrir" : "Marcar pago"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
