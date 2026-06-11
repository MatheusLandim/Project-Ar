"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Projeto, rtValor, artValor } from "@/lib/types";
import { brl, formatDate, hoje } from "@/lib/format";

type Linha = {
  key: string;
  projeto: Projeto;
  tipo: "RT" | "ART";
  pct: number;
  valor: number;
  pago: boolean;
  data: string | null;
};

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

  const linhas = useMemo<Linha[]>(() => {
    const all: Linha[] = [];
    for (const p of projetos) {
      if (Number(p.rt_percentual) > 0) {
        all.push({
          key: p.id + "-rt",
          projeto: p,
          tipo: "RT",
          pct: Number(p.rt_percentual),
          valor: rtValor(p),
          pago: !!p.rt_pago,
          data: p.rt_data_pagamento,
        });
      }
      if (Number(p.art_percentual) > 0) {
        all.push({
          key: p.id + "-art",
          projeto: p,
          tipo: "ART",
          pct: Number(p.art_percentual),
          valor: artValor(p),
          pago: !!p.art_pago,
          data: p.art_data_pagamento,
        });
      }
    }
    return all;
  }, [projetos]);

  const visiveis = useMemo(() => {
    if (filtro === "apagar") return linhas.filter((l) => !l.pago);
    if (filtro === "pagos") return linhas.filter((l) => l.pago);
    return linhas;
  }, [linhas, filtro]);

  const totalApagar = linhas
    .filter((l) => !l.pago)
    .reduce((s, l) => s + l.valor, 0);
  const totalPago = linhas
    .filter((l) => l.pago)
    .reduce((s, l) => s + l.valor, 0);

  async function toggle(l: Linha) {
    const campos =
      l.tipo === "RT"
        ? { rt_pago: !l.pago, rt_data_pagamento: !l.pago ? hoje() : null }
        : { art_pago: !l.pago, art_data_pagamento: !l.pago ? hoje() : null };
    await supabase.from("projetos").update(campos).eq("id", l.projeto.id);
    reload();
  }

  return (
    <div className="animate-fade-up">
      <p className="mb-4 rounded-xl border border-line glass px-4 py-2.5 text-xs text-ink-soft">
        Estas são as taxas de responsabilidade técnica (RT/ART) que{" "}
        <strong className="text-ink">você paga</strong> sobre a obra — controle à
        parte dos seus recebimentos.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line glass p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            RT/ART a pagar
          </p>
          <p className="tnum mt-1.5 font-display text-xl font-bold text-amber-500">
            {brl(totalApagar)}
          </p>
        </div>
        <div className="rounded-2xl border border-line glass p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            RT/ART já pago
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
              Nenhuma RT/ART neste filtro
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Informe a % de RT e/ou ART ao cadastrar ou editar uma obra.
            </p>
          </div>
        ) : (
          visiveis.map((l) => (
            <div
              key={l.key}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line glass px-4 py-3.5 sm:px-5"
            >
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ring-1 ring-inset ${
                  l.tipo === "RT"
                    ? "bg-brand/10 text-brand ring-brand/25"
                    : "bg-sky-500/10 text-sky-500 ring-sky-500/25"
                }`}
              >
                {l.tipo}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {l.projeto.cliente}
                  <span className="font-normal text-ink-faint">
                    {" "}
                    · {l.projeto.projeto}
                  </span>
                </p>
                <p className="text-xs text-ink-soft">
                  {l.pct}% sobre {brl(Number(l.projeto.valor_total))}
                  {l.pago && l.data && <> · pago {formatDate(l.data)}</>}
                </p>
              </div>
              <span className="tnum text-base font-bold text-ink">
                {brl(l.valor)}
              </span>
              <button
                onClick={() => toggle(l)}
                className={`t-colors rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  l.pago
                    ? "text-ink-soft hover:bg-ink/5"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {l.pago ? "Reabrir" : "Marcar pago"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
