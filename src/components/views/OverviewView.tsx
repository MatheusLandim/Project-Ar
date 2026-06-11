"use client";

import { useMemo } from "react";
import { Projeto, STATUS_PROJETO, pagamentoStatus, rtValor } from "@/lib/types";
import { brl, formatDate } from "@/lib/format";
import { Kpis } from "@/components/Kpis";
import { View } from "@/components/Sidebar";

const STATUS_COR: Record<string, string> = {
  Proposta: "bg-slate-400",
  Aprovado: "bg-sky-500",
  "Em execução": "bg-brand",
  Concluído: "bg-emerald-500",
  Cancelado: "bg-rose-500",
};

export function OverviewView({
  projetos,
  onNavigate,
}: {
  projetos: Projeto[];
  onNavigate: (v: View) => void;
}) {
  const dados = useMemo(() => {
    let atrasadoTotal = 0;
    let atrasadoQtd = 0;
    const proximos: {
      id: string;
      cliente: string;
      valor: number;
      venc: string | null;
    }[] = [];

    for (const p of projetos) {
      for (const pg of p.pagamentos) {
        const st = pagamentoStatus(pg);
        if (st === "atrasado") {
          atrasadoTotal += Number(pg.valor);
          atrasadoQtd++;
        }
        if (st === "pendente") {
          proximos.push({
            id: pg.id,
            cliente: p.cliente,
            valor: Number(pg.valor),
            venc: pg.data_vencimento,
          });
        }
      }
    }
    proximos.sort((a, b) =>
      (a.venc ?? "9999").localeCompare(b.venc ?? "9999")
    );

    const rtApagar = projetos
      .filter((p) => Number(p.rt_percentual) > 0 && !p.rt_pago)
      .reduce((s, p) => s + rtValor(p), 0);

    const porStatus = STATUS_PROJETO.map((s) => ({
      status: s,
      qtd: projetos.filter((p) => p.status === s).length,
    }));
    const totalProj = projetos.length || 1;

    return {
      atrasadoTotal,
      atrasadoQtd,
      proximos: proximos.slice(0, 5),
      rtApagar,
      porStatus,
      totalProj,
    };
  }, [projetos]);

  return (
    <div className="animate-fade-up space-y-6">
      <Kpis projetos={projetos} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Alertas */}
        <div className="rounded-2xl border border-line glass p-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-faint">
            Alertas
          </h3>
          <div className="mt-3 space-y-3">
            <button
              onClick={() => onNavigate("pagamentos")}
              className="t-colors flex w-full items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-left hover:bg-rose-500/10"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/15 text-rose-500">
                !
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">
                  {dados.atrasadoQtd} pagamento(s) em atraso
                </p>
                <p className="tnum text-xs text-rose-500">
                  {brl(dados.atrasadoTotal)} vencidos
                </p>
              </div>
              <span className="text-ink-faint">›</span>
            </button>

            <button
              onClick={() => onNavigate("rt")}
              className="t-colors flex w-full items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-left hover:bg-amber-500/10"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/15 text-amber-500">
                ★
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">RT a pagar</p>
                <p className="tnum text-xs text-amber-500">
                  {brl(dados.rtApagar)} pendentes
                </p>
              </div>
              <span className="text-ink-faint">›</span>
            </button>
          </div>
        </div>

        {/* Próximos vencimentos */}
        <div className="rounded-2xl border border-line glass p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-faint">
              Próximos vencimentos
            </h3>
            <button
              onClick={() => onNavigate("pagamentos")}
              className="text-xs font-medium text-brand hover:underline"
            >
              ver todos
            </button>
          </div>
          {dados.proximos.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">
              Nenhum pagamento pendente. 🎉
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {dados.proximos.map((x) => (
                <li
                  key={x.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {x.cliente}
                    </p>
                    <p className="text-xs text-ink-faint">
                      vence {formatDate(x.venc)}
                    </p>
                  </div>
                  <span className="tnum text-sm font-semibold text-ink">
                    {brl(x.valor)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Obras por status */}
      <div className="rounded-2xl border border-line glass p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-faint">
            Obras por status
          </h3>
          <button
            onClick={() => onNavigate("obras")}
            className="text-xs font-medium text-brand hover:underline"
          >
            ver obras
          </button>
        </div>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-ink/5">
          {dados.porStatus.map((s) =>
            s.qtd > 0 ? (
              <div
                key={s.status}
                className={`${STATUS_COR[s.status]} h-full`}
                style={{ width: `${(s.qtd / dados.totalProj) * 100}%` }}
                title={`${s.status}: ${s.qtd}`}
              />
            ) : null
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {dados.porStatus.map((s) => (
            <span
              key={s.status}
              className="inline-flex items-center gap-1.5 text-xs text-ink-soft"
            >
              <span
                className={`h-2 w-2 rounded-full ${STATUS_COR[s.status]}`}
              />
              {s.status} <span className="tnum font-semibold text-ink">{s.qtd}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
