"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Projeto, Pagamento, pagamentoStatus } from "@/lib/types";
import { brl, formatDate, hoje } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

type Linha = Pagamento & { _cliente: string; _projeto: string };

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "atrasado", label: "Em atraso" },
  { id: "pendente", label: "Pendentes" },
  { id: "pago", label: "Pagos" },
];

export function PagamentosView({
  projetos,
  reload,
}: {
  projetos: Projeto[];
  reload: () => void;
}) {
  const supabase = createClient();
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");

  const linhas = useMemo<Linha[]>(() => {
    const all: Linha[] = [];
    for (const p of projetos) {
      for (const pg of p.pagamentos) {
        all.push({ ...pg, _cliente: p.cliente, _projeto: p.projeto });
      }
    }
    const q = busca.trim().toLowerCase();
    return all
      .filter((l) => {
        const okF = filtro === "todos" || pagamentoStatus(l) === filtro;
        const okB =
          !q ||
          l._cliente.toLowerCase().includes(q) ||
          l._projeto.toLowerCase().includes(q) ||
          (l.descricao ?? "").toLowerCase().includes(q);
        return okF && okB;
      })
      .sort((a, b) =>
        (a.data_vencimento ?? "9999").localeCompare(b.data_vencimento ?? "9999")
      );
  }, [projetos, filtro, busca]);

  const totais = useMemo(() => {
    let pago = 0,
      pendente = 0,
      atrasado = 0;
    for (const p of projetos)
      for (const pg of p.pagamentos) {
        const st = pagamentoStatus(pg);
        if (st === "pago") pago += Number(pg.valor);
        else if (st === "atrasado") atrasado += Number(pg.valor);
        else pendente += Number(pg.valor);
      }
    return { pago, pendente, atrasado };
  }, [projetos]);

  async function darBaixa(id: string, pago: boolean) {
    await supabase
      .from("pagamentos")
      .update({ data_pagamento: pago ? null : hoje() })
      .eq("id", id);
    reload();
  }

  return (
    <div className="animate-fade-up">
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Recebido" value={brl(totais.pago)} tone="emerald" />
        <MiniStat label="A receber" value={brl(totais.pendente)} tone="amber" />
        <MiniStat label="Em atraso" value={brl(totais.atrasado)} tone="rose" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente, obra ou descrição…"
          className="t-colors flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-1.5">
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
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-line glass">
        {linhas.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">
            Nenhum pagamento neste filtro.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {linhas.map((l) => {
              const st = pagamentoStatus(l);
              return (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {l._cliente}
                      <span className="font-normal text-ink-faint">
                        {" "}
                        · {l._projeto}
                      </span>
                    </p>
                    <p className="text-xs text-ink-soft">
                      {l.descricao || "Pagamento"} · vence{" "}
                      {formatDate(l.data_vencimento)}
                      {l.data_pagamento && (
                        <> · pago {formatDate(l.data_pagamento)}</>
                      )}
                    </p>
                  </div>
                  <span className="tnum text-sm font-semibold text-ink">
                    {brl(Number(l.valor))}
                  </span>
                  <StatusBadge status={st} kind="pagamento" />
                  <button
                    onClick={() => darBaixa(l.id, !!l.data_pagamento)}
                    className={`t-colors rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      l.data_pagamento
                        ? "text-ink-soft hover:bg-ink/5"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {l.data_pagamento ? "Reabrir" : "Dar baixa"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber" | "rose";
}) {
  const map = {
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    rose: "text-rose-500",
  };
  return (
    <div className="rounded-2xl border border-line glass p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
      <p className={`tnum mt-1.5 font-display text-lg font-bold ${map[tone]}`}>
        {value}
      </p>
    </div>
  );
}
