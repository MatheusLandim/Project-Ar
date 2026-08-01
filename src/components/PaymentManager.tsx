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

  // Configuração rápida do plano de pagamento (só aparece antes de ter
  // qualquer parcela lançada, pra não bagunçar um plano já em andamento)
  const [modoPlano, setModoPlano] = useState<"avista" | "sinal" | null>(null);
  const [pVista, setPVista] = useState(String(projeto.valor_total ?? ""));
  const [pVistaData, setPVistaData] = useState("");
  const [pSinal, setPSinal] = useState("");
  const [pSinalData, setPSinalData] = useState("");
  const [pConclusao, setPConclusao] = useState("");
  const [pConclusaoData, setPConclusaoData] = useState("");
  const [criandoPlano, setCriandoPlano] = useState(false);

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

  async function criarPlanoAVista(e: React.FormEvent) {
    e.preventDefault();
    setCriandoPlano(true);
    await supabase.from("pagamentos").insert({
      projeto_id: projeto.id,
      descricao: "À vista",
      valor: Number(pVista) || 0,
      data_vencimento: pVistaData || null,
      data_pagamento: null,
    });
    setModoPlano(null);
    setCriandoPlano(false);
    onChanged();
  }

  async function criarPlanoSinalConclusao(e: React.FormEvent) {
    e.preventDefault();
    setCriandoPlano(true);
    await supabase.from("pagamentos").insert([
      {
        projeto_id: projeto.id,
        descricao: "Sinal",
        valor: Number(pSinal) || 0,
        data_vencimento: pSinalData || null,
        data_pagamento: null,
      },
      {
        projeto_id: projeto.id,
        descricao: "Conclusão",
        valor: Number(pConclusao) || 0,
        data_vencimento: pConclusaoData || null,
        data_pagamento: null,
      },
    ]);
    setModoPlano(null);
    setCriandoPlano(false);
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
    <div className="rounded-xl border border-line bg-canvas/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-ink">Recebimentos</h4>
        <div className="flex items-center gap-3 text-xs text-ink-soft">
          <span className="tnum">
            Lançado: <strong className="text-ink">{brl(totalLancado)}</strong>
          </span>
          <span
            className={`tnum ${
              Math.abs(saldo) < 0.01
                ? "text-emerald-500"
                : saldo > 0
                ? "text-amber-500"
                : "text-rose-500"
            }`}
          >
            {saldo >= 0 ? "A lançar" : "Excedente"}:{" "}
            <strong>{brl(Math.abs(saldo))}</strong>
          </span>
        </div>
      </div>

      {pagamentos.length === 0 && !adding && (
        <div className="mb-3 rounded-lg border border-dashed border-brand/40 bg-brand-soft/20 p-3">
          <p className="text-sm font-semibold text-ink">Como é o pagamento desta obra?</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Escolhe o formato e já lança certinho — depois é só preencher as datas de previsão e marcar
            como recebido quando cair.
          </p>
          {!modoPlano ? (
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() => setModoPlano("avista")}
                className="t-colors flex-1 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-ink/5"
              >
                À vista
              </button>
              <button
                onClick={() => setModoPlano("sinal")}
                className="t-colors flex-1 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-ink/5"
              >
                Sinal + Conclusão
              </button>
            </div>
          ) : modoPlano === "avista" ? (
            <form onSubmit={criarPlanoAVista} className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={pVista}
                onChange={(e) => setPVista(e.target.value)}
                placeholder="Valor à vista"
                className="tnum rounded-md border border-line bg-surface px-2.5 py-2 text-sm text-ink"
              />
              <input
                type="date"
                value={pVistaData}
                onChange={(e) => setPVistaData(e.target.value)}
                placeholder="Previsão (opcional)"
                className="rounded-md border border-line bg-surface px-2.5 py-2 text-sm text-ink"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={criandoPlano}
                  className="t-colors flex-1 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  {criandoPlano ? "Criando…" : "Criar"}
                </button>
                <button
                  type="button"
                  onClick={() => setModoPlano(null)}
                  className="t-colors rounded-md px-2 py-2 text-sm text-ink-soft hover:bg-ink/5"
                >
                  ✕
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={criarPlanoSinalConclusao} className="mt-2.5 space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={pSinal}
                  onChange={(e) => setPSinal(e.target.value)}
                  placeholder="Valor do sinal"
                  className="tnum rounded-md border border-line bg-surface px-2.5 py-2 text-sm text-ink"
                />
                <input
                  type="date"
                  value={pSinalData}
                  onChange={(e) => setPSinalData(e.target.value)}
                  placeholder="Previsão do sinal"
                  className="rounded-md border border-line bg-surface px-2.5 py-2 text-sm text-ink"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={pConclusao}
                  onChange={(e) => setPConclusao(e.target.value)}
                  placeholder="Valor da conclusão"
                  className="tnum rounded-md border border-line bg-surface px-2.5 py-2 text-sm text-ink"
                />
                <input
                  type="date"
                  value={pConclusaoData}
                  onChange={(e) => setPConclusaoData(e.target.value)}
                  placeholder="Previsão da conclusão"
                  className="rounded-md border border-line bg-surface px-2.5 py-2 text-sm text-ink"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={criandoPlano}
                  className="t-colors flex-1 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60 sm:flex-none"
                >
                  {criandoPlano ? "Criando…" : "Criar sinal + conclusão"}
                </button>
                <button
                  type="button"
                  onClick={() => setModoPlano(null)}
                  className="t-colors rounded-md px-2 py-2 text-sm text-ink-soft hover:bg-ink/5"
                >
                  ✕
                </button>
              </div>
            </form>
          )}
        </div>
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
                    <> · recebido em {formatDate(p.data_pagamento)}</>
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
                  className={`t-colors rounded-md px-2 py-1 text-xs font-medium ${
                    p.data_pagamento
                      ? "text-ink-soft hover:bg-ink/5"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {p.data_pagamento ? "Reabrir" : "Receber"}
                </button>
                <button
                  onClick={() => removePagamento(p.id)}
                  className="t-colors rounded-md px-2 py-1 text-xs text-rose-500 hover:bg-rose-500/10"
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
          className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-line bg-surface p-3 sm:grid-cols-[1fr_140px_150px_auto]"
        >
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            list="sugestoes-pagamento"
            placeholder="Sinal, Conclusão, À vista, Medição 1…"
            className="rounded-md border border-line bg-surface px-2.5 py-2 text-sm text-ink"
          />
          <datalist id="sugestoes-pagamento">
            <option value="Sinal" />
            <option value="Conclusão" />
            <option value="À vista" />
            <option value="Medição 1" />
            <option value="Medição 2" />
          </datalist>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Valor"
            className="tnum rounded-md border border-line bg-surface px-2.5 py-2 text-sm text-ink"
          />
          <input
            type="date"
            value={venc}
            onChange={(e) => setVenc(e.target.value)}
            className="rounded-md border border-line bg-surface px-2.5 py-2 text-sm text-ink"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="t-colors rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="t-colors rounded-md px-2 py-2 text-sm text-ink-soft hover:bg-ink/5"
            >
              ✕
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="t-colors mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand/50 px-3 py-2 text-sm font-medium text-brand hover:bg-brand-soft"
        >
          + Lançar recebimento
        </button>
      )}
    </div>
  );
}
