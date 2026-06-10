"use client";

import { Projeto, pagamentoStatus } from "@/lib/types";
import { brl } from "@/lib/format";

export function Kpis({ projetos }: { projetos: Projeto[] }) {
  let contratado = 0;
  let recebido = 0;
  let aReceber = 0;
  let atrasado = 0;

  for (const p of projetos) {
    if (p.status !== "Cancelado") contratado += Number(p.valor_total);
    for (const pg of p.pagamentos) {
      const st = pagamentoStatus(pg);
      const v = Number(pg.valor);
      if (st === "pago") recebido += v;
      else if (st === "atrasado") atrasado += v;
      else aReceber += v;
    }
  }

  const cards = [
    {
      label: "Total contratado",
      value: contratado,
      hint: `${projetos.filter((p) => p.status !== "Cancelado").length} projetos ativos`,
      accent: "text-ink",
      bar: "bg-brand",
    },
    {
      label: "Recebido",
      value: recebido,
      hint: "pagamentos quitados",
      accent: "text-emerald-700",
      bar: "bg-emerald-500",
    },
    {
      label: "A receber",
      value: aReceber,
      hint: "pendentes no prazo",
      accent: "text-amber-700",
      bar: "bg-amber-500",
    },
    {
      label: "Em atraso",
      value: atrasado,
      hint: "vencidos não pagos",
      accent: "text-rose-700",
      bar: "bg-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5"
        >
          <span
            className={`absolute inset-x-0 top-0 h-1 ${c.bar}`}
            aria-hidden
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {c.label}
          </p>
          <p
            className={`tnum mt-2 font-display text-xl font-bold sm:text-2xl ${c.accent}`}
          >
            {brl(c.value)}
          </p>
          <p className="mt-1 text-xs text-ink-soft">{c.hint}</p>
        </div>
      ))}
    </div>
  );
}
