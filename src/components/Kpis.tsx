"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Projeto, pagamentoStatus } from "@/lib/types";
import { brl } from "@/lib/format";

type Periodo = "mensal" | "3m" | "6m" | "1a" | "todos";

const PERIODOS: { key: Periodo; label: string; meses: number | null }[] = [
  { key: "mensal", label: "Mensal", meses: 1 },
  { key: "3m", label: "3 meses", meses: 3 },
  { key: "6m", label: "6 meses", meses: 6 },
  { key: "1a", label: "1 ano", meses: 12 },
  { key: "todos", label: "Todos", meses: null },
];

// Janela do período: do 1º dia do mês atual até o fim do período
// selecionado (ex.: "3 meses" = mês atual + próximos 2 meses).
// meses = null ("Todos") não aplica limite algum.
function janelaPeriodo(meses: number | null) {
  const hoje = new Date();
  const inicio = meses === null ? new Date(2000, 0, 1) : new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim =
    meses === null
      ? new Date(2100, 0, 1)
      : new Date(hoje.getFullYear(), hoje.getMonth() + meses, 0);
  fim.setHours(23, 59, 59, 999);
  return { inicio, fim };
}

function dentro(data: string | null, inicio: Date, fim: Date): boolean {
  if (!data) return false;
  const d = new Date(data + "T00:00:00");
  return d >= inicio && d <= fim;
}

function FunnelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Kpis({ projetos }: { projetos: Projeto[] }) {
  const [periodo, setPeriodo] = useState<Periodo>("1a");
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const meses = PERIODOS.find((p) => p.key === periodo)!.meses;
  const periodoLabel = PERIODOS.find((p) => p.key === periodo)!.label;

  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener("mousedown", onClickFora);
    return () => document.removeEventListener("mousedown", onClickFora);
  }, []);

  const cards = useMemo(() => {
    const { inicio, fim } = janelaPeriodo(meses);

    let contratado = 0;
    let recebido = 0;
    let aReceber = 0;
    let atrasado = 0;

    for (const p of projetos) {
      if (p.status !== "Cancelado") {
        const refContrato = p.data_inicio ?? p.criado_em;
        if (dentro(refContrato, inicio, fim)) {
          contratado += Number(p.valor_total);
        }
      }
      for (const pg of p.pagamentos) {
        const st = pagamentoStatus(pg);
        const v = Number(pg.valor);
        if (st === "pago") {
          if (dentro(pg.data_pagamento, inicio, fim)) recebido += v;
        } else if (st === "atrasado") {
          if (dentro(pg.data_vencimento, inicio, fim)) atrasado += v;
        } else {
          if (dentro(pg.data_vencimento, inicio, fim)) aReceber += v;
        }
      }
    }

    const ativosNoPeriodo = projetos.filter(
      (p) =>
        p.status !== "Cancelado" &&
        dentro(p.data_inicio ?? p.criado_em, inicio, fim)
    ).length;

    return [
      { label: "Contratado", value: contratado, hint: `${ativosNoPeriodo} projeto(s) no período`, bar: "from-brand to-brand-dark", text: "text-ink" },
      { label: "Recebido", value: recebido, hint: "pagamentos quitados", bar: "from-emerald-400 to-emerald-600", text: "text-emerald-500" },
      { label: "A receber", value: aReceber, hint: "pendentes no prazo", bar: "from-amber-400 to-amber-600", text: "text-amber-500" },
      { label: "Em atraso", value: atrasado, hint: "vencidos não pagos", bar: "from-rose-400 to-rose-600", text: "text-rose-500" },
    ];
  }, [projetos, meses]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="t-colors flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-ink/5"
          >
            <FunnelIcon />
            {periodoLabel}
          </button>
          {menuAberto && (
            <div className="absolute right-0 top-full z-20 mt-1.5 w-36 overflow-hidden rounded-xl border border-line glass-strong shadow-card">
              {PERIODOS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setPeriodo(p.key);
                    setMenuAberto(false);
                  }}
                  className={`t-colors block w-full px-3 py-2 text-left text-xs font-medium ${
                    periodo === p.key
                      ? "bg-brand-soft text-brand-dark"
                      : "text-ink-soft hover:bg-ink/5"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
    </div>
  );
}
