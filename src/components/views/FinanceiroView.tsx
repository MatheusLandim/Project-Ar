"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Cliente,
  Projeto,
  Fornecedor,
  DespesaFixa,
  ContaPagar,
  ContaReceber,
  ProLabore,
  NotaFiscal,
  contaPagarStatus,
  contaReceberStatus,
  TIPOS_CONTA_PAGAR,
  TIPOS_CONTA_RECEBER,
  mesReferenciaAtual,
  labelMesReferencia,
} from "@/lib/types";
import { brl, formatDate, hoje } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ContaPagarForm,
  ContaPagarInput,
  ContaReceberForm,
  ContaReceberInput,
  DespesaFixaForm,
  DespesaFixaInput,
  ProLaboreForm,
  ProLaboreInput,
  NotaFiscalForm,
  NotaFiscalInput,
  FornecedorQuickForm,
  FornecedorInput,
  ClienteQuickForm,
  ClienteQuickInput,
} from "@/components/FinanceiroForms";
import { RelatorioMensalViewer } from "@/components/RelatorioFinanceiroDoc";

type Tab =
  | "fluxo"
  | "pagar"
  | "receber"
  | "cartao"
  | "prolabore"
  | "notas"
  | "despesas";

const TABS: { id: Tab; label: string }[] = [
  { id: "fluxo", label: "Fluxo de Caixa" },
  { id: "pagar", label: "Contas a Pagar" },
  { id: "receber", label: "Contas a Receber" },
  { id: "cartao", label: "Cartão de Crédito" },
  { id: "prolabore", label: "Pró-labore" },
  { id: "notas", label: "Notas Fiscais" },
  { id: "despesas", label: "Despesas Fixas" },
];

export function FinanceiroView({
  clientes,
  projetos,
}: {
  clientes: Cliente[];
  projetos: Projeto[];
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("fluxo");

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [despesasFixas, setDespesasFixas] = useState<DespesaFixa[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [proLabore, setProLabore] = useState<ProLabore[]>([]);
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [forn, desp, pag, rec, pro, notas] = await Promise.all([
      supabase.from("fornecedores").select("*").order("nome"),
      supabase.from("despesas_fixas").select("*").order("descricao"),
      supabase.from("contas_pagar").select("*").order("vencimento"),
      supabase.from("contas_receber").select("*").order("vencimento"),
      supabase.from("pro_labore").select("*").order("mes_referencia", { ascending: false }),
      supabase.from("notas_fiscais").select("*").order("data_emissao", { ascending: false }),
    ]);
    if (pag.error) {
      setErro(pag.error.message);
    } else {
      setErro(null);
    }
    setFornecedores((forn.data as Fornecedor[]) ?? []);
    setDespesasFixas((desp.data as DespesaFixa[]) ?? []);
    setContasPagar((pag.data as ContaPagar[]) ?? []);
    setContasReceber((rec.data as ContaReceber[]) ?? []);
    setProLabore((pro.data as ProLabore[]) ?? []);
    setNotasFiscais((notas.data as NotaFiscal[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- Modais ----------
  const [showPagar, setShowPagar] = useState(false);
  const [editPagar, setEditPagar] = useState<ContaPagar | undefined>();
  const [showReceber, setShowReceber] = useState(false);
  const [editReceber, setEditReceber] = useState<ContaReceber | undefined>();
  const [showDespesa, setShowDespesa] = useState(false);
  const [editDespesa, setEditDespesa] = useState<DespesaFixa | undefined>();
  const [showProLabore, setShowProLabore] = useState(false);
  const [editProLabore, setEditProLabore] = useState<ProLabore | undefined>();
  const [showNota, setShowNota] = useState(false);
  const [editNota, setEditNota] = useState<NotaFiscal | undefined>();
  const [showFornecedor, setShowFornecedor] = useState(false);
  const [showCliente, setShowCliente] = useState(false);
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [gerando, setGerando] = useState(false);

  // ---------- CRUD: Contas a Pagar ----------
  async function salvarPagar(data: ContaPagarInput) {
    if (editPagar) await supabase.from("contas_pagar").update(data).eq("id", editPagar.id);
    else await supabase.from("contas_pagar").insert(data);
    setShowPagar(false);
    setEditPagar(undefined);
    await load();
  }
  async function excluirPagar(c: ContaPagar) {
    if (!confirm("Excluir este lançamento de Contas a Pagar?")) return;
    await supabase.from("contas_pagar").delete().eq("id", c.id);
    await load();
  }
  async function baixarPagar(c: ContaPagar) {
    await supabase
      .from("contas_pagar")
      .update({ data_pagamento: c.data_pagamento ? null : hoje() })
      .eq("id", c.id);
    await load();
  }

  // ---------- CRUD: Contas a Receber ----------
  async function salvarReceber(data: ContaReceberInput) {
    if (editReceber) await supabase.from("contas_receber").update(data).eq("id", editReceber.id);
    else await supabase.from("contas_receber").insert(data);
    setShowReceber(false);
    setEditReceber(undefined);
    await load();
  }
  async function excluirReceber(c: ContaReceber) {
    if (!confirm("Excluir este lançamento de Contas a Receber?")) return;
    await supabase.from("contas_receber").delete().eq("id", c.id);
    await load();
  }
  async function baixarReceber(c: ContaReceber) {
    await supabase
      .from("contas_receber")
      .update({ data_recebimento: c.data_recebimento ? null : hoje() })
      .eq("id", c.id);
    await load();
  }

  // ---------- CRUD: Despesas Fixas ----------
  async function salvarDespesa(data: DespesaFixaInput) {
    if (editDespesa) await supabase.from("despesas_fixas").update(data).eq("id", editDespesa.id);
    else await supabase.from("despesas_fixas").insert(data);
    setShowDespesa(false);
    setEditDespesa(undefined);
    await load();
  }
  async function excluirDespesa(d: DespesaFixa) {
    if (!confirm("Excluir esta despesa fixa? Lançamentos já gerados não serão apagados.")) return;
    await supabase.from("despesas_fixas").delete().eq("id", d.id);
    await load();
  }

  // ---------- CRUD: Pró-labore ----------
  async function salvarProLabore(data: ProLaboreInput) {
    if (editProLabore) await supabase.from("pro_labore").update(data).eq("id", editProLabore.id);
    else await supabase.from("pro_labore").insert(data);
    setShowProLabore(false);
    setEditProLabore(undefined);
    await load();
  }
  async function excluirProLabore(p: ProLabore) {
    if (!confirm("Excluir este pró-labore?")) return;
    await supabase.from("pro_labore").delete().eq("id", p.id);
    await load();
  }

  // ---------- CRUD: Notas Fiscais ----------
  async function salvarNota(data: NotaFiscalInput) {
    if (editNota) await supabase.from("notas_fiscais").update(data).eq("id", editNota.id);
    else await supabase.from("notas_fiscais").insert(data);
    setShowNota(false);
    setEditNota(undefined);
    await load();
  }
  async function excluirNota(n: NotaFiscal) {
    if (!confirm("Excluir esta nota fiscal?")) return;
    await supabase.from("notas_fiscais").delete().eq("id", n.id);
    await load();
  }

  // ---------- Cadastro rápido ----------
  async function salvarFornecedor(data: FornecedorInput) {
    await supabase.from("fornecedores").insert(data);
    setShowFornecedor(false);
    await load();
  }
  async function salvarClienteRapido(data: ClienteQuickInput) {
    await supabase.from("clientes").insert(data);
    setShowCliente(false);
    // clientes list comes from the parent (dashboard-client); it will
    // refresh on its own polling/next load. We also refetch here so the
    // new client shows up immediately in the select.
    window.location.reload();
  }

  // ---------- Gerar lançamentos do mês (despesas fixas) ----------
  async function gerarLancamentosDoMes() {
    setGerando(true);
    const mes = mesReferenciaAtual();
    const ano = Number(mes.split("-")[0]);
    const mesNum = Number(mes.split("-")[1]);
    const ativas = despesasFixas.filter((d) => d.ativo);
    let criados = 0;
    for (const d of ativas) {
      const jaExiste = contasPagar.some(
        (c) =>
          c.despesa_fixa_id === d.id &&
          c.vencimento &&
          c.vencimento.startsWith(mes)
      );
      if (jaExiste) continue;
      const dia = String(Math.min(28, d.dia_vencimento)).padStart(2, "0");
      const vencimento = `${ano}-${String(mesNum).padStart(2, "0")}-${dia}`;
      await supabase.from("contas_pagar").insert({
        tipo: d.categoria === "Cartão de Crédito" ? "cartao_credito" : "boleto",
        descricao: d.descricao,
        categoria: d.categoria,
        valor: d.valor ?? 0,
        vencimento,
        vinculo_tipo: "despesa_fixa",
        pasta_url: d.pasta_url,
        despesa_fixa_id: d.id,
      });
      criados++;
    }
    await load();
    setGerando(false);
    alert(
      criados > 0
        ? `${criados} lançamento(s) gerado(s) para ${labelMesReferencia(mes)}.`
        : `Nenhum lançamento novo — as despesas fixas de ${labelMesReferencia(mes)} já foram geradas.`
    );
  }

  // ---------- Totais / Fluxo de caixa (mês atual) ----------
  const mesAtual = mesReferenciaAtual();
  const totais = useMemo(() => {
    const doMes = (data: string | null) => !!data && data.startsWith(mesAtual);
    let aPagar = 0, pago = 0, atrasadoPagar = 0;
    for (const c of contasPagar) {
      if (!c.vencimento?.startsWith(mesAtual) && !doMes(c.data_pagamento)) continue;
      const st = contaPagarStatus(c);
      if (st === "pago") pago += Number(c.valor);
      else if (st === "atrasado") atrasadoPagar += Number(c.valor);
      else aPagar += Number(c.valor);
    }
    let aReceber = 0, recebido = 0, atrasadoReceber = 0;
    for (const c of contasReceber) {
      if (!c.vencimento?.startsWith(mesAtual) && !doMes(c.data_recebimento)) continue;
      const st = contaReceberStatus(c);
      if (st === "pago") recebido += Number(c.valor);
      else if (st === "atrasado") atrasadoReceber += Number(c.valor);
      else aReceber += Number(c.valor);
    }
    const proLaboreMes = proLabore
      .filter((p) => p.mes_referencia === mesAtual)
      .reduce((s, p) => s + Number(p.valor), 0);
    const saldo = recebido - (pago + proLaboreMes);
    return { aPagar, pago, atrasadoPagar, aReceber, recebido, atrasadoReceber, proLaboreMes, saldo };
  }, [contasPagar, contasReceber, proLabore, mesAtual]);

  const nomeFornecedor = (id: string | null) =>
    fornecedores.find((f) => f.id === id)?.nome ?? "—";
  const nomeCliente = (id: string | null) =>
    clientes.find((c) => c.id === id)?.nome ?? "—";

  if (loading) return <SkeletonList />;
  if (erro)
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-500">
        <p className="font-semibold">Não foi possível carregar o módulo financeiro.</p>
        <p className="mt-1 opacity-90">{erro}</p>
        <p className="mt-2 opacity-90">
          Rode o SQL <code>supabase/migration-financeiro.sql</code> no Supabase (SQL Editor) e recarregue a página.
        </p>
      </div>
    );

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`t-colors rounded-full px-3.5 py-1.5 text-sm font-medium ${
              tab === t.id ? "bg-ink text-canvas" : "glass text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "fluxo" && (
        <FluxoCaixaTab
          totais={totais}
          mesAtual={mesAtual}
          onGerarLancamentos={gerarLancamentosDoMes}
          gerando={gerando}
          onVerRelatorio={() => setShowRelatorio(true)}
        />
      )}

      {tab === "pagar" && (
        <ContasPagarTab
          contas={contasPagar}
          nomeFornecedor={nomeFornecedor}
          onNew={() => { setEditPagar(undefined); setShowPagar(true); }}
          onEdit={(c) => { setEditPagar(c); setShowPagar(true); }}
          onDelete={excluirPagar}
          onBaixar={baixarPagar}
        />
      )}

      {tab === "cartao" && (
        <ContasPagarTab
          contas={contasPagar.filter((c) => c.tipo === "cartao_credito")}
          nomeFornecedor={nomeFornecedor}
          onNew={() => { setEditPagar(undefined); setShowPagar(true); }}
          onEdit={(c) => { setEditPagar(c); setShowPagar(true); }}
          onDelete={excluirPagar}
          onBaixar={baixarPagar}
          tituloVazio="Nenhuma despesa de cartão de crédito lançada."
        />
      )}

      {tab === "receber" && (
        <ContasReceberTab
          contas={contasReceber}
          nomeCliente={nomeCliente}
          onNew={() => { setEditReceber(undefined); setShowReceber(true); }}
          onEdit={(c) => { setEditReceber(c); setShowReceber(true); }}
          onDelete={excluirReceber}
          onBaixar={baixarReceber}
        />
      )}

      {tab === "prolabore" && (
        <ProLaboreTab
          registros={proLabore}
          onNew={() => { setEditProLabore(undefined); setShowProLabore(true); }}
          onEdit={(p) => { setEditProLabore(p); setShowProLabore(true); }}
          onDelete={excluirProLabore}
        />
      )}

      {tab === "notas" && (
        <NotasFiscaisTab
          notas={notasFiscais}
          onNew={() => { setEditNota(undefined); setShowNota(true); }}
          onEdit={(n) => { setEditNota(n); setShowNota(true); }}
          onDelete={excluirNota}
        />
      )}

      {tab === "despesas" && (
        <DespesasFixasTab
          despesas={despesasFixas}
          onNew={() => { setEditDespesa(undefined); setShowDespesa(true); }}
          onEdit={(d) => { setEditDespesa(d); setShowDespesa(true); }}
          onDelete={excluirDespesa}
        />
      )}

      {showPagar && (
        <ContaPagarForm
          initial={editPagar}
          fornecedores={fornecedores}
          projetos={projetos}
          onCancel={() => { setShowPagar(false); setEditPagar(undefined); }}
          onSave={salvarPagar}
          onNovoFornecedor={() => setShowFornecedor(true)}
        />
      )}
      {showReceber && (
        <ContaReceberForm
          initial={editReceber}
          clientes={clientes}
          projetos={projetos}
          onCancel={() => { setShowReceber(false); setEditReceber(undefined); }}
          onSave={salvarReceber}
          onNovoCliente={() => setShowCliente(true)}
        />
      )}
      {showDespesa && (
        <DespesaFixaForm
          initial={editDespesa}
          onCancel={() => { setShowDespesa(false); setEditDespesa(undefined); }}
          onSave={salvarDespesa}
        />
      )}
      {showProLabore && (
        <ProLaboreForm
          initial={editProLabore}
          onCancel={() => { setShowProLabore(false); setEditProLabore(undefined); }}
          onSave={salvarProLabore}
        />
      )}
      {showNota && (
        <NotaFiscalForm
          initial={editNota}
          clientes={clientes}
          fornecedores={fornecedores}
          onCancel={() => { setShowNota(false); setEditNota(undefined); }}
          onSave={salvarNota}
        />
      )}
      {showFornecedor && (
        <FornecedorQuickForm onCancel={() => setShowFornecedor(false)} onSave={salvarFornecedor} />
      )}
      {showCliente && (
        <ClienteQuickForm onCancel={() => setShowCliente(false)} onSave={salvarClienteRapido} />
      )}
      {showRelatorio && (
        <RelatorioMensalViewer
          mes={mesAtual}
          contasPagar={contasPagar}
          contasReceber={contasReceber}
          proLabore={proLabore}
          nomeFornecedor={nomeFornecedor}
          nomeCliente={nomeCliente}
          onClose={() => setShowRelatorio(false)}
        />
      )}
    </div>
  );
}

// ===================== Fluxo de Caixa =====================

function FluxoCaixaTab({
  totais,
  mesAtual,
  onGerarLancamentos,
  gerando,
  onVerRelatorio,
}: {
  totais: {
    aPagar: number; pago: number; atrasadoPagar: number;
    aReceber: number; recebido: number; atrasadoReceber: number;
    proLaboreMes: number; saldo: number;
  };
  mesAtual: string;
  onGerarLancamentos: () => void;
  gerando: boolean;
  onVerRelatorio: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          Resumo de <strong className="text-ink">{labelMesReferencia(mesAtual)}</strong>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onGerarLancamentos}
            disabled={gerando}
            className="t-colors rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5 disabled:opacity-60"
          >
            {gerando ? "Gerando…" : "Gerar despesas fixas do mês"}
          </button>
          <button
            onClick={onVerRelatorio}
            className="t-colors rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
          >
            Relatório mensal (contabilidade)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="A pagar" value={brl(totais.aPagar)} tone="amber" />
        <MiniStat label="Pago no mês" value={brl(totais.pago)} tone="emerald" />
        <MiniStat label="A receber" value={brl(totais.aReceber)} tone="amber" />
        <MiniStat label="Recebido no mês" value={brl(totais.recebido)} tone="emerald" />
        <MiniStat label="Atrasados (pagar)" value={brl(totais.atrasadoPagar)} tone="rose" />
        <MiniStat label="Atrasados (receber)" value={brl(totais.atrasadoReceber)} tone="rose" />
        <MiniStat label="Pró-labore do mês" value={brl(totais.proLaboreMes)} tone="amber" />
        <MiniStat
          label="Saldo (recebido − pago)"
          value={brl(totais.saldo)}
          tone={totais.saldo >= 0 ? "emerald" : "rose"}
        />
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
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={`tnum mt-1.5 font-display text-lg font-bold ${map[tone]}`}>{value}</p>
    </div>
  );
}

// ===================== Contas a Pagar / Cartão =====================

function ContasPagarTab({
  contas,
  nomeFornecedor,
  onNew,
  onEdit,
  onDelete,
  onBaixar,
  tituloVazio,
}: {
  contas: ContaPagar[];
  nomeFornecedor: (id: string | null) => string;
  onNew: () => void;
  onEdit: (c: ContaPagar) => void;
  onDelete: (c: ContaPagar) => void;
  onBaixar: (c: ContaPagar) => void;
  tituloVazio?: string;
}) {
  const [filtro, setFiltro] = useState<"todos" | "atrasado" | "pendente" | "pago">("todos");
  const lista = contas.filter((c) => filtro === "todos" || contaPagarStatus(c) === filtro);

  return (
    <div>
      <TopBar onNew={onNew} newLabel="+ Novo lançamento" filtro={filtro} setFiltro={setFiltro} />
      <div className="mt-4 overflow-hidden rounded-2xl border border-line glass">
        {lista.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">
            {tituloVazio ?? "Nenhum lançamento neste filtro."}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {lista.map((c) => {
              const st = contaPagarStatus(c);
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {c.descricao}
                      <span className="font-normal text-ink-faint"> · {TIPOS_CONTA_PAGAR[c.tipo]}</span>
                    </p>
                    <p className="text-xs text-ink-soft">
                      {nomeFornecedor(c.fornecedor_id)} · vence {formatDate(c.vencimento)}
                      {c.data_pagamento && <> · pago {formatDate(c.data_pagamento)}</>}
                      {c.pasta_url && (
                        <>
                          {" · "}
                          <a href={c.pasta_url} target="_blank" rel="noreferrer" className="text-brand underline">pasta</a>
                        </>
                      )}
                      {c.anexo_url && (
                        <>
                          {" · "}
                          <a href={c.anexo_url} target="_blank" rel="noreferrer" className="text-brand underline">comprovante</a>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="tnum text-sm font-semibold text-ink">{brl(Number(c.valor))}</span>
                  <StatusBadge status={st} kind="pagamento" />
                  <button
                    onClick={() => onBaixar(c)}
                    className={`t-colors rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      c.data_pagamento ? "text-ink-soft hover:bg-ink/5" : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {c.data_pagamento ? "Reabrir" : "Pagar"}
                  </button>
                  <button onClick={() => onEdit(c)} className="rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-ink/5">✎</button>
                  <button onClick={() => onDelete(c)} className="rounded-lg px-2 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10">🗑</button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ===================== Contas a Receber =====================

function ContasReceberTab({
  contas,
  nomeCliente,
  onNew,
  onEdit,
  onDelete,
  onBaixar,
}: {
  contas: ContaReceber[];
  nomeCliente: (id: string | null) => string;
  onNew: () => void;
  onEdit: (c: ContaReceber) => void;
  onDelete: (c: ContaReceber) => void;
  onBaixar: (c: ContaReceber) => void;
}) {
  const [filtro, setFiltro] = useState<"todos" | "atrasado" | "pendente" | "pago">("todos");
  const lista = contas.filter((c) => filtro === "todos" || contaReceberStatus(c) === filtro);

  return (
    <div>
      <TopBar onNew={onNew} newLabel="+ Novo lançamento" filtro={filtro} setFiltro={setFiltro} />
      <div className="mt-4 overflow-hidden rounded-2xl border border-line glass">
        {lista.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">Nenhum lançamento neste filtro.</p>
        ) : (
          <ul className="divide-y divide-line">
            {lista.map((c) => {
              const st = contaReceberStatus(c);
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {nomeCliente(c.cliente_id)}
                      <span className="font-normal text-ink-faint"> · {TIPOS_CONTA_RECEBER[c.tipo]}</span>
                    </p>
                    <p className="text-xs text-ink-soft">
                      vence {formatDate(c.vencimento)}
                      {c.data_recebimento && <> · recebido {formatDate(c.data_recebimento)}</>}
                      {c.numero_nf && <> · NF {c.numero_nf}</>}
                      {c.pasta_url && (
                        <>
                          {" · "}
                          <a href={c.pasta_url} target="_blank" rel="noreferrer" className="text-brand underline">pasta</a>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="tnum text-sm font-semibold text-ink">{brl(Number(c.valor))}</span>
                  <StatusBadge status={st} kind="pagamento" />
                  <button
                    onClick={() => onBaixar(c)}
                    className={`t-colors rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                      c.data_recebimento ? "text-ink-soft hover:bg-ink/5" : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {c.data_recebimento ? "Reabrir" : "Receber"}
                  </button>
                  <button onClick={() => onEdit(c)} className="rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-ink/5">✎</button>
                  <button onClick={() => onDelete(c)} className="rounded-lg px-2 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10">🗑</button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ===================== Pró-labore =====================

function ProLaboreTab({
  registros,
  onNew,
  onEdit,
  onDelete,
}: {
  registros: ProLabore[];
  onNew: () => void;
  onEdit: (p: ProLabore) => void;
  onDelete: (p: ProLabore) => void;
}) {
  return (
    <div>
      <div className="flex justify-end">
        <button onClick={onNew} className="t-colors rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark">
          + Novo pró-labore
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line glass">
        {registros.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">Nenhum pró-labore lançado.</p>
        ) : (
          <ul className="divide-y divide-line">
            {registros.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{labelMesReferencia(p.mes_referencia)}</p>
                  <p className="text-xs text-ink-soft">
                    {p.data_pagamento ? `pago ${formatDate(p.data_pagamento)}` : "não pago"}
                    {p.comprovante_url && (
                      <>
                        {" · "}
                        <a href={p.comprovante_url} target="_blank" rel="noreferrer" className="text-brand underline">comprovante</a>
                      </>
                    )}
                  </p>
                </div>
                <span className="tnum text-sm font-semibold text-ink">{brl(Number(p.valor))}</span>
                <button onClick={() => onEdit(p)} className="rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-ink/5">✎</button>
                <button onClick={() => onDelete(p)} className="rounded-lg px-2 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10">🗑</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ===================== Notas Fiscais =====================

function NotasFiscaisTab({
  notas,
  onNew,
  onEdit,
  onDelete,
}: {
  notas: NotaFiscal[];
  onNew: () => void;
  onEdit: (n: NotaFiscal) => void;
  onDelete: (n: NotaFiscal) => void;
}) {
  return (
    <div>
      <div className="flex justify-end">
        <button onClick={onNew} className="t-colors rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark">
          + Nova nota fiscal
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line glass">
        {notas.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">Nenhuma nota fiscal lançada.</p>
        ) : (
          <ul className="divide-y divide-line">
            {notas.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {n.direcao === "emitida" ? "Emitida" : "Recebida"} {n.numero ? `nº ${n.numero}` : ""}
                    <span className="font-normal text-ink-faint"> · {n.cliente_fornecedor || "—"}</span>
                  </p>
                  <p className="text-xs text-ink-soft">
                    {formatDate(n.data_emissao)} · {n.tipo === "servico" ? "Serviço" : "Produto"}
                    {n.arquivo_url && (
                      <>
                        {" · "}
                        <a href={n.arquivo_url} target="_blank" rel="noreferrer" className="text-brand underline">arquivo</a>
                      </>
                    )}
                    {n.pasta_url && (
                      <>
                        {" · "}
                        <a href={n.pasta_url} target="_blank" rel="noreferrer" className="text-brand underline">pasta</a>
                      </>
                    )}
                  </p>
                </div>
                <span className="tnum text-sm font-semibold text-ink">{brl(Number(n.valor))}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${n.status === "cancelada" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-600"}`}>
                  {n.status === "cancelada" ? "Cancelada" : "Emitida"}
                </span>
                <button onClick={() => onEdit(n)} className="rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-ink/5">✎</button>
                <button onClick={() => onDelete(n)} className="rounded-lg px-2 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10">🗑</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ===================== Despesas Fixas =====================

function DespesasFixasTab({
  despesas,
  onNew,
  onEdit,
  onDelete,
}: {
  despesas: DespesaFixa[];
  onNew: () => void;
  onEdit: (d: DespesaFixa) => void;
  onDelete: (d: DespesaFixa) => void;
}) {
  return (
    <div>
      <div className="flex justify-end">
        <button onClick={onNew} className="t-colors rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark">
          + Nova despesa fixa
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line glass">
        {despesas.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">Nenhuma despesa fixa cadastrada.</p>
        ) : (
          <ul className="divide-y divide-line">
            {despesas.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {d.descricao}
                    {!d.ativo && <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-semibold text-ink-faint">pausada</span>}
                  </p>
                  <p className="text-xs text-ink-soft">
                    vence todo dia {d.dia_vencimento} {d.categoria && `· ${d.categoria}`}
                    {d.pasta_url && (
                      <>
                        {" · "}
                        <a href={d.pasta_url} target="_blank" rel="noreferrer" className="text-brand underline">pasta</a>
                      </>
                    )}
                  </p>
                </div>
                <span className="tnum text-sm font-semibold text-ink">
                  {d.valor != null ? brl(Number(d.valor)) : "valor variável"}
                </span>
                <button onClick={() => onEdit(d)} className="rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-ink/5">✎</button>
                <button onClick={() => onDelete(d)} className="rounded-lg px-2 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10">🗑</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ===================== Utilitários de UI =====================

function TopBar({
  onNew,
  newLabel,
  filtro,
  setFiltro,
}: {
  onNew: () => void;
  newLabel: string;
  filtro: string;
  setFiltro: (f: "todos" | "atrasado" | "pendente" | "pago") => void;
}) {
  const FILTROS = [
    { id: "todos", label: "Todos" },
    { id: "atrasado", label: "Em atraso" },
    { id: "pendente", label: "Pendentes" },
    { id: "pago", label: "Pagos" },
  ] as const;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-1.5">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`t-colors rounded-full px-3 py-1.5 text-sm font-medium ${
              filtro === f.id ? "bg-ink text-canvas" : "glass text-ink-soft hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <button onClick={onNew} className="t-colors rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark">
        {newLabel}
      </button>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl glass" />
      ))}
    </div>
  );
}
