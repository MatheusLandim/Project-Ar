"use client";

import { Projeto, pagamentoStatus, rtValor } from "@/lib/types";
import { brl } from "@/lib/format";

export function Kpis({ projetos }: { projetos: Projeto[] }) {
  let contratado = 0;
  let recebido = 0;
  let aReceber = 0;
  let atrasado = 0;
  let rtPagar = 0;

  for (const p of projetos) {
    if (p.status !== "Cancelado") {
      contratado += Number(p.valor_total);
      if (!p.rt_pago) rtPagar += rtValor(p);
    }
    for (const pg of p.pagamentos) {
      const st = pagamentoStatus(pg);
      const v = Number(pg.valor);
      if (st === "pago") recebido += v;
      else if (st === "atrasado") atrasado += v;
      else aReceber += v;
    }
  }

  const ativos = projetos.filter((p) => p.status !== "Cancelado").length;

  const cards = [
    { label: "Contratado", value: contratado, hint: `${ativos} projetos ativos`, bar: "from-brand to-brand-dark", text: "text-ink" },
    { label: "Recebido", value: recebido, hint: "pagamentos quitados", bar: "from-emerald-400 to-emerald-600", text: "text-emerald-500" },
    { label: "A receber", value: aReceber, hint: "pendentes no prazo", bar: "from-amber-400 to-amber-600", text: "text-amber-500" },
    { label: "Em atraso", value: atrasado, hint: "vencidos não pagos", bar: "from-rose-400 to-rose-600", text: "text-rose-500" },
    { label: "RT a pagar", value: rtPagar, hint: "resp. técnica pendente", bar: "from-sky-400 to-sky-600", text: "text-sky-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((c, i) => (
        <div
          key={c.label}
          style={{ animationDelay: `${i * 60}ms` }}
          className="animate-fade-up t-colors relative overflow-hidden rounded-2xl glass p-4 shadow-card hover:-translate-y-0.5"
        >
          <span
            className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.bar}`}
          />
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            {c.label}
          </p>
          <p className={`tnum mt-2 font-display text-xl font-extrabold ${c.text}`}>
            {brl(c.value)}
          </p>
          <p className="mt-1 text-xs text-ink-soft">{c.hint}</p>
        </div>
      ))}
    </div>
  );
}
