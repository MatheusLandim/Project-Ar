"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Projeto, rtValor, artValor, mesReferenciaAtual } from "@/lib/types";
import { brl, formatDate, hoje } from "@/lib/format";
import { ContextMenu, MenuContextoState, useFecharMenuAoClicarFora, BotaoMenu } from "@/components/ContextMenu";

type Linha = {
  key: string;
  projeto: Projeto;
  tipo: "RT" | "ART";
  pct: number;
  valor: number;
  pago: boolean;
  data: string | null;
  obs: string | null;
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
  const [menu, setMenu] = useState<MenuContextoState | null>(null);
  const [detalhe, setDetalhe] = useState<Linha | null>(null);
  useFecharMenuAoClicarFora(!!menu, () => setMenu(null));

  const linhas = useMemo<Linha[]>(() => {
    const all: Linha[] = [];
    for (const p of projetos) {
      if (p.tem_rt && Number(p.rt_percentual) > 0) {
        all.push({
          key: p.id + "-rt",
          projeto: p,
          tipo: "RT",
          pct: Number(p.rt_percentual),
          valor: rtValor(p),
          pago: !!p.rt_pago,
          data: p.rt_data_pagamento,
          obs: p.rt_obs,
        });
      }
      if (p.tem_art && Number(p.art_valor) > 0) {
        all.push({
          key: p.id + "-art",
          projeto: p,
          tipo: "ART",
          pct: 0,
          valor: artValor(p),
          pago: !!p.art_pago,
          data: p.art_data_pagamento,
          obs: p.art_obs,
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
    const marcandoComoPago = !l.pago;
    const campos =
      l.tipo === "RT"
        ? { rt_pago: marcandoComoPago, rt_data_pagamento: marcandoComoPago ? hoje() : null }
        : { art_pago: marcandoComoPago, art_data_pagamento: marcandoComoPago ? hoje() : null };
    await supabase.from("projetos").update(campos).eq("id", l.projeto.id);

    // Mantém um lançamento espelho em Contas a Pagar, pra RT/ART entrarem
    // no Fluxo de Caixa e no relatório mensal junto com o resto.
    const tipoContaPagar = l.tipo === "RT" ? "rt" : "art";
    if (marcandoComoPago) {
      const { data: existente } = await supabase
        .from("contas_pagar")
        .select("id")
        .eq("obra_id", l.projeto.id)
        .eq("tipo", tipoContaPagar)
        .maybeSingle();
      if (!existente) {
        await supabase.from("contas_pagar").insert({
          tipo: tipoContaPagar,
          descricao: `${l.tipo} — ${l.projeto.projeto || l.projeto.cliente}`,
          valor: l.valor,
          obra_id: l.projeto.id,
          vinculo_tipo: "obra",
          vinculo_id: l.projeto.id,
          vencimento: hoje(),
          data_pagamento: hoje(),
          mes_competencia: mesReferenciaAtual(),
          observacoes: l.obs,
        });
      }
    } else {
      // Reabrindo: remove o lançamento espelho, se existir
      await supabase.from("contas_pagar").delete().eq("obra_id", l.projeto.id).eq("tipo", tipoContaPagar);
    }
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
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu({
                  x: e.clientX,
                  y: e.clientY,
                  opcoes: [
                    { label: "Ver detalhes", onClick: () => setDetalhe(l) },
                    { label: l.pago ? "Reabrir" : "Marcar pago", onClick: () => toggle(l) },
                  ],
                });
              }}
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
                  {l.tipo === "RT"
                    ? `${l.pct}% sobre ${brl(Number(l.projeto.valor_total))}`
                    : "Valor cobrado pelo engenheiro"}
                  {l.pago && l.data && <> · pago {formatDate(l.data)}</>}
                </p>
                {l.obs && (
                  <p className="text-xs text-ink-faint">Pagar a: {l.obs}</p>
                )}
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
              <BotaoMenu
                onAbrir={(pos) =>
                  setMenu({
                    ...pos,
                    opcoes: [
                      { label: "Ver detalhes", onClick: () => setDetalhe(l) },
                      { label: l.pago ? "Reabrir" : "Marcar pago", onClick: () => toggle(l) },
                    ],
                  })
                }
              />
            </div>
          ))
        )}
      </div>

      {menu && <ContextMenu menu={menu} onFechar={() => setMenu(null)} />}

      {detalhe && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-navy/60 p-4 backdrop-blur-sm"
          onClick={() => setDetalhe(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl glass-strong p-5 shadow-card sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ring-1 ring-inset ${
                    detalhe.tipo === "RT"
                      ? "bg-brand/10 text-brand ring-brand/25"
                      : "bg-sky-500/10 text-sky-500 ring-sky-500/25"
                  }`}
                >
                  {detalhe.tipo}
                </span>
                <h2 className="mt-1.5 font-display text-lg font-bold text-ink">
                  {detalhe.projeto.cliente}
                </h2>
                <p className="text-sm text-ink-soft">{detalhe.projeto.projeto}</p>
              </div>
              <button
                onClick={() => setDetalhe(null)}
                className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-ink/5"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-sm">
              {detalhe.projeto.endereco && (
                <p className="flex justify-between gap-3">
                  <span className="text-ink-faint">Endereço</span>
                  <span className="text-right font-medium text-ink">{detalhe.projeto.endereco}</span>
                </p>
              )}
              <p className="flex justify-between gap-3">
                <span className="text-ink-faint">Status da obra</span>
                <span className="font-medium text-ink">{detalhe.projeto.status}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-ink-faint">Valor do contrato</span>
                <span className="tnum font-medium text-ink">{brl(Number(detalhe.projeto.valor_total))}</span>
              </p>
              {detalhe.tipo === "RT" && (
                <p className="flex justify-between gap-3">
                  <span className="text-ink-faint">Percentual de RT</span>
                  <span className="tnum font-medium text-ink">{detalhe.pct}%</span>
                </p>
              )}
              <p className="flex justify-between gap-3">
                <span className="text-ink-faint">Valor {detalhe.tipo}</span>
                <span className="tnum font-bold text-ink">{brl(detalhe.valor)}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span className="text-ink-faint">Status do pagamento</span>
                <span className={`font-semibold ${detalhe.pago ? "text-emerald-500" : "text-amber-500"}`}>
                  {detalhe.pago ? "Pago" : "Pendente"}
                </span>
              </p>
              {detalhe.pago && detalhe.data && (
                <p className="flex justify-between gap-3">
                  <span className="text-ink-faint">Pago em</span>
                  <span className="font-medium text-ink">{formatDate(detalhe.data)}</span>
                </p>
              )}
              {detalhe.obs && (
                <p className="flex justify-between gap-3">
                  <span className="text-ink-faint">Pagar a</span>
                  <span className="text-right font-medium text-ink">{detalhe.obs}</span>
                </p>
              )}
            </div>

            <button
              onClick={() => {
                toggle(detalhe);
                setDetalhe(null);
              }}
              className={`t-colors mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold ${
                detalhe.pago
                  ? "border border-line text-ink-soft hover:bg-ink/5"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {detalhe.pago ? "Reabrir" : "Marcar como pago"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
