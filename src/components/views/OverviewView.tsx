"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Projeto,
  ContaPagar,
  ContaReceber,
  STATUS_PROJETO,
  pagamentoStatus,
  contaPagarStatus,
  contaReceberStatus,
  rtValor,
  artValor,
} from "@/lib/types";
import { brl, formatDate } from "@/lib/format";
import { Kpis } from "@/components/Kpis";
import { View } from "@/components/Sidebar";

const STATUS_COR: Record<string, string> = {
  Proposta: "bg-slate-400",
  Aprovado: "bg-sky-500",
  "Em execução (projeto preliminar)": "bg-brand",
  "Em revisão": "bg-amber-500",
  "Concluído (projeto executivo)": "bg-emerald-500",
  Cancelado: "bg-rose-500",
};

// Vencendo nos próximos N dias (inclui o que já está atrasado).
const JANELA_ALERTA_DIAS = 15;

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

export function OverviewView({
  projetos,
  contasPagar,
  contasReceber,
  onNavigate,
}: {
  projetos: Projeto[];
  contasPagar: ContaPagar[];
  contasReceber: ContaReceber[];
  onNavigate: (v: View) => void;
}) {
  const [filtroAberto, setFiltroAberto] = useState(false);
  const [dataDe, setDataDe] = useState("");
  const [dataAte, setDataAte] = useState("");
  const filtroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (filtroRef.current && !filtroRef.current.contains(e.target as Node)) {
        setFiltroAberto(false);
      }
    }
    document.addEventListener("mousedown", onClickFora);
    return () => document.removeEventListener("mousedown", onClickFora);
  }, []);

  const filtroAtivo = Boolean(dataDe || dataAte);
  const filtroLabel = filtroAtivo
    ? `${dataDe ? formatDate(dataDe) : "…"} – ${dataAte ? formatDate(dataAte) : "…"}`
    : "Período";

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

    const rtApagar = projetos.reduce((s, p) => {
      let v = 0;
      if (p.tem_rt && !p.rt_pago) v += rtValor(p);
      if (p.tem_art && !p.art_pago) v += artValor(p);
      return s + v;
    }, 0);

    // Contas a pagar / a receber vencendo em breve ou já vencidas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + JANELA_ALERTA_DIAS);

    const emJanela = (venc: string | null) => {
      if (!venc) return false;
      const d = new Date(venc + "T00:00:00");
      return d <= limite; // inclui atrasadas (d < hoje) e as que vencem até o limite
    };

    let pagarQtd = 0;
    let pagarTotal = 0;
    for (const c of contasPagar) {
      const st = contaPagarStatus(c);
      if ((st === "pendente" || st === "atrasado") && emJanela(c.vencimento)) {
        pagarQtd++;
        pagarTotal += Number(c.valor);
      }
    }

    let receberQtd = 0;
    let receberTotal = 0;
    for (const c of contasReceber) {
      const st = contaReceberStatus(c);
      if ((st === "pendente" || st === "atrasado") && emJanela(c.vencimento)) {
        receberQtd++;
        receberTotal += Number(c.valor);
      }
    }

    // Obras por status, respeitando o filtro de período (data de início/criação)
    let projetosFiltrados = projetos;
    if (dataDe || dataAte) {
      projetosFiltrados = projetos.filter((p) => {
        const ref = p.data_inicio ?? p.criado_em;
        if (!ref) return false;
        const d = ref.slice(0, 10);
        if (dataDe && d < dataDe) return false;
        if (dataAte && d > dataAte) return false;
        return true;
      });
    }

    const porStatus = STATUS_PROJETO.map((s) => {
      const doStatus = projetosFiltrados.filter((p) => p.status === s);
      return {
        status: s,
        qtd: doStatus.length,
        obras: doStatus.map((p) => ({
          id: p.id,
          nome: p.projeto || "Obra sem nome",
          cliente: p.cliente,
        })),
      };
    });
    const totalProj = projetosFiltrados.length || 1;

    return {
      atrasadoTotal,
      atrasadoQtd,
      proximos: proximos.slice(0, 5),
      rtApagar,
      pagarQtd,
      pagarTotal,
      receberQtd,
      receberTotal,
      porStatus,
      totalProj,
    };
  }, [projetos, contasPagar, contasReceber, dataDe, dataAte]);

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
              onClick={() => onNavigate("financeiro")}
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
              onClick={() => onNavigate("financeiro")}
              className="t-colors flex w-full items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-left hover:bg-emerald-500/10"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500">
                ↓
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">
                  {dados.receberQtd} conta(s) a receber vencendo
                </p>
                <p className="tnum text-xs text-emerald-500">
                  {brl(dados.receberTotal)} nos próximos {JANELA_ALERTA_DIAS} dias
                </p>
              </div>
              <span className="text-ink-faint">›</span>
            </button>

            <button
              onClick={() => onNavigate("financeiro")}
              className="t-colors flex w-full items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-left hover:bg-orange-500/10"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500/15 text-orange-500">
                ↑
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">
                  {dados.pagarQtd} conta(s) a pagar vencendo
                </p>
                <p className="tnum text-xs text-orange-500">
                  {brl(dados.pagarTotal)} nos próximos {JANELA_ALERTA_DIAS} dias
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
                <p className="text-sm font-semibold text-ink">RT / ART a pagar</p>
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
              onClick={() => onNavigate("financeiro")}
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
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-faint">
            Obras por status
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("clientes")}
              className="text-xs font-medium text-brand hover:underline"
            >
              ver obras
            </button>
            <div ref={filtroRef} className="relative">
              <button
                onClick={() => setFiltroAberto((v) => !v)}
                className={`t-colors flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  filtroAtivo
                    ? "border-brand bg-brand-soft text-brand-dark"
                    : "border-line text-ink-soft hover:bg-ink/5"
                }`}
              >
                <FunnelIcon />
                {filtroLabel}
              </button>
              {filtroAberto && (
                <div className="absolute right-0 top-full z-20 mt-1.5 w-64 rounded-xl border border-line glass-strong p-3 shadow-card">
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    De
                  </label>
                  <input
                    type="date"
                    value={dataDe}
                    onChange={(e) => setDataDe(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line bg-transparent px-2 py-1.5 text-sm text-ink"
                  />
                  <label className="mt-2.5 block text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    Até
                  </label>
                  <input
                    type="date"
                    value={dataAte}
                    onChange={(e) => setDataAte(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-line bg-transparent px-2 py-1.5 text-sm text-ink"
                  />
                  <div className="mt-3 flex justify-between gap-2">
                    <button
                      onClick={() => {
                        setDataDe("");
                        setDataAte("");
                      }}
                      className="text-xs font-medium text-ink-faint hover:text-ink"
                    >
                      Limpar
                    </button>
                    <button
                      onClick={() => setFiltroAberto(false)}
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {dados.porStatus
            .filter((s) => s.qtd > 0)
            .map((s) => (
              <div key={s.status} className="rounded-xl border border-line bg-surface p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  <span className={`h-2 w-2 rounded-full ${STATUS_COR[s.status]}`} />
                  {s.status}
                </p>
                <ul className="mt-1.5 space-y-1">
                  {s.obras.map((o) => (
                    <li key={o.id} className="truncate text-xs text-ink">
                      <span className="font-medium">{o.nome}</span>
                      <span className="text-ink-faint"> · {o.cliente}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
