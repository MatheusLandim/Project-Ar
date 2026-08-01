"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Cliente,
  Projeto,
  Fornecedor,
  DespesaFixa,
  ReceitaRecorrente,
  ContaPagar,
  ContaReceber,
  ProLabore,
  NotaFiscal,
  Pagamento,
  contaPagarStatus,
  contaReceberStatus,
  pagamentoStatus,
  TIPOS_CONTA_PAGAR,
  TIPOS_CONTA_RECEBER,
  mesReferenciaAtual,
  labelMesReferencia,
  pastaCompetencia,
  Configuracoes,
  FinanceiroStatus,
  LinhaReceber,
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
  ReceitaRecorrenteForm,
  ReceitaRecorrenteInput,
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
import { PastaEntidade } from "@/components/PastaEntidade";
import { AnexosLancamento } from "@/components/AnexosLancamento";
import { ContextMenu, MenuContextoState, useFecharMenuAoClicarFora, BotaoMenu } from "@/components/ContextMenu";
import { ConfirmModal, ConfirmState } from "@/components/PromptDialog";
import { EntidadeTipo, LancamentoTipo } from "@/lib/types";

type Tab = "fluxo" | "pagar" | "receber" | "prolabore";

const TABS: { id: Tab; label: string }[] = [
  { id: "fluxo", label: "Fluxo de Caixa" },
  { id: "pagar", label: "Contas a Pagar" },
  { id: "receber", label: "Contas a Receber" },
  { id: "prolabore", label: "Pró-labore" },
];

export function FinanceiroView({
  clientes,
  projetos,
  reloadProjetos,
  configuracoes,
}: {
  clientes: Cliente[];
  projetos: Projeto[];
  reloadProjetos: () => void;
  configuracoes?: Configuracoes | null;
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("fluxo");
  const [mesSelecionado, setMesSelecionado] = useState(mesReferenciaAtual());

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [despesasFixas, setDespesasFixas] = useState<DespesaFixa[]>([]);
  const [receitasRecorrentes, setReceitasRecorrentes] = useState<ReceitaRecorrente[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [proLabore, setProLabore] = useState<ProLabore[]>([]);
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [avisoAcao, setAvisoAcao] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>(null);

  const load = useCallback(async () => {
    const [forn, desp, rects, pag, rec, pro, notas] = await Promise.all([
      supabase.from("fornecedores").select("*").order("nome"),
      supabase.from("despesas_fixas").select("*").order("descricao"),
      supabase.from("receitas_recorrentes").select("*").order("descricao"),
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
    setReceitasRecorrentes((rects.data as ReceitaRecorrente[]) ?? []);
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
  const [showReceitaRecorrente, setShowReceitaRecorrente] = useState(false);
  const [editReceitaRecorrente, setEditReceitaRecorrente] = useState<ReceitaRecorrente | undefined>();
  const [showProLabore, setShowProLabore] = useState(false);
  const [editProLabore, setEditProLabore] = useState<ProLabore | undefined>();
  const [showNota, setShowNota] = useState(false);
  const [editNota, setEditNota] = useState<NotaFiscal | undefined>();
  const [showFornecedor, setShowFornecedor] = useState(false);
  const [showCliente, setShowCliente] = useState(false);
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [showPasta, setShowPasta] = useState<{ tipo: EntidadeTipo; id: string; nome: string } | null>(null);
  const [showAnexos, setShowAnexos] = useState<{
    tipo: LancamentoTipo;
    id: string;
    titulo: string;
    entidadeTipo?: EntidadeTipo | null;
    entidadeId?: string | null;
    pastaFixa?: string | null;
  } | null>(null);

  // Se o lançamento é de uma despesa fixa, o anexo vai automático pra
  // pasta dessa despesa, organizada por ano/mês de competência. Senão,
  // Se o lançamento tem despesa fixa, resolve o fornecedor (pasta) ligado
  // a ela. Senão, usa o fornecedor selecionado direto no lançamento.
  function fornecedorDoLancamento(c: ContaPagar): string | null {
    if (c.despesa_fixa_id) {
      return despesasFixas.find((d) => d.id === c.despesa_fixa_id)?.fornecedor_id ?? null;
    }
    return c.fornecedor_id;
  }

  function infoAnexoPagar(c: ContaPagar) {
    const fId = fornecedorDoLancamento(c);
    if (fId) {
      return {
        entidadeTipo: "fornecedor" as EntidadeTipo,
        entidadeId: fId,
        pastaFixa: c.mes_competencia ? pastaCompetencia(c.mes_competencia) : null,
      };
    }
    // Sem fornecedor vinculado (ex.: RT/ART, despesa ligada direto à obra):
    // a pasta é a da própria obra.
    if (c.obra_id) {
      return {
        entidadeTipo: "projeto" as EntidadeTipo,
        entidadeId: c.obra_id,
        pastaFixa: null,
      };
    }
    return { entidadeTipo: null, entidadeId: null, pastaFixa: null };
  }

  // ---------- CRUD: Contas a Pagar ----------
  async function salvarPagar(data: ContaPagarInput): Promise<string | null> {
    let id: string | null = editPagar?.id ?? null;
    if (editPagar) {
      await supabase.from("contas_pagar").update(data).eq("id", editPagar.id);
    } else {
      const { data: inserida } = await supabase.from("contas_pagar").insert(data).select("id").single();
      id = inserida?.id ?? null;
    }

    // Garante que a pasta Ano/Mês já existe na pasta do fornecedor
    // vinculado, mesmo antes de anexar algo.
    const fId = data.despesa_fixa_id
      ? despesasFixas.find((d) => d.id === data.despesa_fixa_id)?.fornecedor_id ?? null
      : data.fornecedor_id;
    if (fId && data.mes_competencia) {
      const { error } = await supabase.from("pastas_documentos").insert({
        entidade_tipo: "fornecedor",
        entidade_id: fId,
        caminho: pastaCompetencia(data.mes_competencia),
      });
      if (error && !error.message.includes("duplicate")) {
        // silencioso — a pasta aparece de qualquer forma quando um arquivo for anexado
      }
    }

    setShowPagar(false);
    setEditPagar(undefined);
    await load();
    return id;
  }
  function excluirPagar(c: ContaPagar) {
    setConfirmDialog({
      titulo: "Excluir este lançamento?",
      mensagem: c.descricao,
      textoConfirmar: "Excluir",
      perigo: true,
      onConfirmar: async () => {
        const { error } = await supabase.from("contas_pagar").delete().eq("id", c.id);
        if (error) {
          setAvisoAcao(`Não deu pra excluir: ${error.message}`);
          return;
        }
        setErro(null);
        await load();
      },
    });
  }
  async function baixarPagar(c: ContaPagar) {
    await supabase
      .from("contas_pagar")
      .update({ data_pagamento: c.data_pagamento ? null : hoje() })
      .eq("id", c.id);
    await load();
  }

  // ---------- CRUD: Contas a Receber ----------
  async function salvarReceber(data: ContaReceberInput): Promise<string | null> {
    let id: string | null = editReceber?.id ?? null;
    if (editReceber) {
      await supabase.from("contas_receber").update(data).eq("id", editReceber.id);
    } else {
      const { data: inserida } = await supabase.from("contas_receber").insert(data).select("id").single();
      id = inserida?.id ?? null;
    }

    // Garante que a pasta Ano/Mês já existe na pasta do contratante, mesmo
    // antes de anexar algo.
    if (data.fornecedor_id && data.mes_competencia) {
      const { error } = await supabase.from("pastas_documentos").insert({
        entidade_tipo: "fornecedor",
        entidade_id: data.fornecedor_id,
        caminho: pastaCompetencia(data.mes_competencia),
      });
      if (error && !error.message.includes("duplicate")) {
        // silencioso — a pasta aparece de qualquer forma quando um arquivo for anexado
      }
    }

    setShowReceber(false);
    setEditReceber(undefined);
    await load();
    return id;
  }
  // Ações unificadas: cobrem tanto os lançamentos nativos de Contas a
  // Receber quanto os "Recebimentos" antigos (tabela pagamentos, ligados a
  // obras) — mesmo procedimento de dar baixa/reabrir/excluir para os dois.
  async function baixarLinhaReceber(l: LinhaReceber) {
    if (l.origem === "receber") {
      await supabase.from("contas_receber").update({ data_recebimento: l.dataRecebimento ? null : hoje() }).eq("id", l.id);
      await load();
    } else {
      await supabase.from("pagamentos").update({ data_pagamento: l.dataRecebimento ? null : hoje() }).eq("id", l.id);
      await reloadProjetos();
    }
  }
  function excluirLinhaReceber(l: LinhaReceber) {
    setConfirmDialog({
      titulo: "Excluir este lançamento?",
      mensagem: l.titulo,
      textoConfirmar: "Excluir",
      perigo: true,
      onConfirmar: async () => {
        if (l.origem === "receber") {
          const { error } = await supabase.from("contas_receber").delete().eq("id", l.id);
          if (error) {
            setAvisoAcao(`Não deu pra excluir: ${error.message}`);
            return;
          }
          await load();
        } else {
          const { error } = await supabase.from("pagamentos").delete().eq("id", l.id);
          if (error) {
            setAvisoAcao(`Não deu pra excluir: ${error.message}`);
            return;
          }
          await reloadProjetos();
        }
        setErro(null);
      },
    });
  }

  // ---------- CRUD: Despesas Fixas ----------
  async function salvarDespesa(data: DespesaFixaInput) {
    if (editDespesa) await supabase.from("despesas_fixas").update(data).eq("id", editDespesa.id);
    else await supabase.from("despesas_fixas").insert(data);
    setShowDespesa(false);
    setEditDespesa(undefined);
    await load();
  }
  function excluirDespesa(d: DespesaFixa) {
    setConfirmDialog({
      titulo: "Excluir esta despesa fixa?",
      mensagem: `${d.descricao} — lançamentos já gerados não serão apagados.`,
      textoConfirmar: "Excluir",
      perigo: true,
      onConfirmar: async () => {
        const { error } = await supabase.from("despesas_fixas").delete().eq("id", d.id);
        if (error) {
          setAvisoAcao(`Não deu pra excluir: ${error.message}`);
          return;
        }
        setErro(null);
        await load();
      },
    });
  }

  // ---------- CRUD: Recebimentos Recorrentes ----------
  async function salvarReceitaRecorrente(data: ReceitaRecorrenteInput) {
    if (editReceitaRecorrente) await supabase.from("receitas_recorrentes").update(data).eq("id", editReceitaRecorrente.id);
    else await supabase.from("receitas_recorrentes").insert(data);
    setShowReceitaRecorrente(false);
    setEditReceitaRecorrente(undefined);
    await load();
  }
  function excluirReceitaRecorrente(r: ReceitaRecorrente) {
    setConfirmDialog({
      titulo: "Excluir este recebimento recorrente?",
      mensagem: `${r.descricao} — lançamentos já gerados não serão apagados.`,
      textoConfirmar: "Excluir",
      perigo: true,
      onConfirmar: async () => {
        const { error } = await supabase.from("receitas_recorrentes").delete().eq("id", r.id);
        if (error) {
          setAvisoAcao(`Não deu pra excluir: ${error.message}`);
          return;
        }
        setErro(null);
        await load();
      },
    });
  }
  async function gerarRecebimentosDoMes() {
    setGerando(true);
    const mes = mesSelecionado;
    const ano = Number(mes.split("-")[0]);
    const mesNum = Number(mes.split("-")[1]);
    const ativas = receitasRecorrentes.filter((r) => r.ativo);
    let criados = 0;
    for (const r of ativas) {
      const jaExiste = contasReceber.some(
        (c) =>
          c.receita_recorrente_id === r.id &&
          c.vencimento &&
          c.vencimento.startsWith(mes)
      );
      if (jaExiste) continue;
      const dia = String(Math.min(28, r.dia_vencimento)).padStart(2, "0");
      const vencimento = `${ano}-${String(mesNum).padStart(2, "0")}-${dia}`;
      await supabase.from("contas_receber").insert({
        tipo: "boleto",
        valor: r.valor ?? 0,
        vencimento,
        fornecedor_id: r.fornecedor_id,
        receita_recorrente_id: r.id,
        mes_competencia: mes,
      });
      criados++;
    }
    await load();
    setGerando(false);
    alert(
      criados > 0
        ? `${criados} lançamento(s) gerado(s) para ${labelMesReferencia(mes)}.`
        : `Nenhum lançamento novo — os recebimentos recorrentes de ${labelMesReferencia(mes)} já foram gerados.`
    );
  }

  // ---------- CRUD: Pró-labore ----------
  async function salvarProLabore(data: ProLaboreInput, comprovante: File | null) {
    let comprovanteUrl = data.comprovante_url;
    if (comprovante) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const limpo = comprovante.name.replace(/[^\w.\-]+/g, "_");
        const path = `${user.id}/prolabore/${Date.now()}_${limpo}`;
        const up = await supabase.storage.from("anexos").upload(path, comprovante);
        if (!up.error) comprovanteUrl = path;
      }
    }
    const payload = { ...data, comprovante_url: comprovanteUrl };
    if (editProLabore) await supabase.from("pro_labore").update(payload).eq("id", editProLabore.id);
    else await supabase.from("pro_labore").insert(payload);
    setShowProLabore(false);
    setEditProLabore(undefined);
    await load();
  }
  async function abrirComprovanteProLabore(p: ProLabore) {
    if (!p.comprovante_url) return;
    const { data, error } = await supabase.storage.from("anexos").createSignedUrl(p.comprovante_url, 120);
    if (!error && data) window.open(data.signedUrl, "_blank");
  }
  function excluirProLabore(p: ProLabore) {
    setConfirmDialog({
      titulo: "Excluir este pró-labore?",
      textoConfirmar: "Excluir",
      perigo: true,
      onConfirmar: async () => {
        const { error } = await supabase.from("pro_labore").delete().eq("id", p.id);
        if (error) {
          setAvisoAcao(`Não deu pra excluir: ${error.message}`);
          return;
        }
        setErro(null);
        await load();
      },
    });
  }

  // ---------- CRUD: Notas Fiscais ----------
  async function salvarNota(data: NotaFiscalInput) {
    if (editNota) await supabase.from("notas_fiscais").update(data).eq("id", editNota.id);
    else await supabase.from("notas_fiscais").insert(data);
    setShowNota(false);
    setEditNota(undefined);
    await load();
  }
  function excluirNota(n: NotaFiscal) {
    setConfirmDialog({
      titulo: "Excluir esta nota fiscal?",
      textoConfirmar: "Excluir",
      perigo: true,
      onConfirmar: async () => {
        const { error } = await supabase.from("notas_fiscais").delete().eq("id", n.id);
        if (error) {
          setAvisoAcao(`Não deu pra excluir: ${error.message}`);
          return;
        }
        setErro(null);
        await load();
      },
    });
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
    const mes = mesSelecionado;
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
        fornecedor_id: d.fornecedor_id,
        valor: d.valor ?? 0,
        vencimento,
        vinculo_tipo: "despesa_fixa",
        pasta_url: d.pasta_url,
        despesa_fixa_id: d.id,
        mes_competencia: mes,
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

  // ---------- Unificação: Contas a Receber + Recebimentos (obras) ----------
  const linhasReceber = useMemo<LinhaReceber[]>(() => {
    const nativas: LinhaReceber[] = contasReceber.map((c) => {
      const tipoLabel = TIPOS_CONTA_RECEBER[c.tipo] + (c.numero_nf ? ` · NF ${c.numero_nf}` : "");
      if (c.fornecedor_id) {
        // Recebimento recorrente: mostra o contratante (pasta em Fornecedores)
        const f = fornecedores.find((x) => x.id === c.fornecedor_id);
        const r = receitasRecorrentes.find((x) => x.id === c.receita_recorrente_id);
        return {
          id: c.id,
          origem: "receber",
          titulo: f?.nome ?? "—",
          subtitulo: `${r?.descricao || "Recebimento recorrente"} · ${tipoLabel}`,
          valor: Number(c.valor),
          vencimento: c.vencimento,
          dataRecebimento: c.data_recebimento,
          status: contaReceberStatus(c),
          clienteId: c.cliente_id,
          obraId: c.obra_id,
          fornecedorId: c.fornecedor_id,
          mesCompetencia: c.mes_competencia,
        };
      }
      // Ligado a cliente/obra: mostra o nome da obra junto do cliente
      const obra = c.obra_id ? projetos.find((x) => x.id === c.obra_id) : null;
      return {
        id: c.id,
        origem: "receber",
        titulo: clientes.find((x) => x.id === c.cliente_id)?.nome ?? "—",
        subtitulo: (obra ? `${obra.projeto} · ` : "") + tipoLabel,
        valor: Number(c.valor),
        vencimento: c.vencimento,
        dataRecebimento: c.data_recebimento,
        status: contaReceberStatus(c),
        clienteId: c.cliente_id,
        obraId: c.obra_id,
        fornecedorId: c.fornecedor_id,
        mesCompetencia: c.mes_competencia,
      };
    });
    const deObras: LinhaReceber[] = [];
    for (const p of projetos) {
      for (const pg of p.pagamentos ?? []) {
        deObras.push({
          id: pg.id,
          origem: "obra",
          titulo: p.cliente,
          subtitulo: (pg.descricao || "Recebimento") + ` · ${p.projeto}`,
          valor: Number(pg.valor),
          vencimento: pg.data_vencimento,
          dataRecebimento: pg.data_pagamento,
          status: pagamentoStatus(pg),
          clienteId: p.cliente_id,
          obraId: p.id,
          fornecedorId: null,
          mesCompetencia: null,
        });
      }
    }
    return [...nativas, ...deObras].sort((a, b) => (a.vencimento ?? "9999").localeCompare(b.vencimento ?? "9999"));
  }, [contasReceber, projetos, clientes, fornecedores, receitasRecorrentes]);

  // ---------- Totais / Fluxo de caixa (mês selecionado) ----------
  const totais = useMemo(() => {
    const doMes = (data: string | null) => !!data && data.startsWith(mesSelecionado);
    let aPagar = 0, pago = 0, atrasadoPagar = 0;
    for (const c of contasPagar) {
      if (!c.vencimento?.startsWith(mesSelecionado) && !doMes(c.data_pagamento)) continue;
      const st = contaPagarStatus(c);
      if (st === "pago") pago += Number(c.valor);
      else if (st === "atrasado") atrasadoPagar += Number(c.valor);
      else aPagar += Number(c.valor);
    }
    let aReceber = 0, recebido = 0, atrasadoReceber = 0;
    for (const l of linhasReceber) {
      if (!l.vencimento?.startsWith(mesSelecionado) && !doMes(l.dataRecebimento)) continue;
      if (l.status === "pago") recebido += l.valor;
      else if (l.status === "atrasado") atrasadoReceber += l.valor;
      else aReceber += l.valor;
    }
    const proLaboreMes = proLabore
      .filter((p) => p.mes_referencia === mesSelecionado)
      .reduce((s, p) => s + Number(p.valor), 0);
    const saldo = recebido - (pago + proLaboreMes);
    return { aPagar, pago, atrasadoPagar, aReceber, recebido, atrasadoReceber, proLaboreMes, saldo };
  }, [contasPagar, linhasReceber, proLabore, mesSelecionado]);

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
      {avisoAcao && (
        <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-700">
          ⚠ {avisoAcao}
          <button onClick={() => setAvisoAcao(null)} className="ml-2 underline">
            fechar
          </button>
        </p>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
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
        <button
          onClick={() => setShowRelatorio(true)}
          className="t-colors rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
        >
          Relatório (contabilidade)
        </button>
      </div>

      {tab === "fluxo" && (
        <FluxoCaixaTab
          totais={totais}
          mesSelecionado={mesSelecionado}
          onMudarMes={setMesSelecionado}
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
          onAbrirPasta={(c) => {
            const fId = fornecedorDoLancamento(c);
            const f = fornecedores.find((x) => x.id === fId);
            if (f) {
              setShowPasta({ tipo: "fornecedor", id: f.id, nome: f.nome });
              return;
            }
            if (c.obra_id) {
              const p = projetos.find((x) => x.id === c.obra_id);
              if (p) setShowPasta({ tipo: "projeto", id: p.id, nome: p.projeto || p.cliente });
            }
          }}
          onAbrirAnexos={(c) => setShowAnexos({
            tipo: "pagar",
            id: c.id,
            titulo: c.descricao,
            ...infoAnexoPagar(c),
          })}
          despesasFixas={despesasFixas}
          mesSelecionado={mesSelecionado}
          onGerarDespesasFixas={gerarLancamentosDoMes}
          gerandoDespesasFixas={gerando}
          onNovaDespesaFixa={() => { setEditDespesa(undefined); setShowDespesa(true); }}
          onEditarDespesaFixa={(d) => { setEditDespesa(d); setShowDespesa(true); }}
          onExcluirDespesaFixa={excluirDespesa}
          onAbrirPastaDespesaFixa={(d) => {
            const f = fornecedores.find((x) => x.id === d.fornecedor_id);
            if (f) setShowPasta({ tipo: "fornecedor", id: f.id, nome: f.nome });
            else setAvisoAcao("Essa despesa fixa ainda não tem uma pasta vinculada. Edite e escolha uma em Fornecedores.");
          }}
        />
      )}

      {tab === "receber" && (
        <ContasReceberTab
          linhas={linhasReceber}
          onNew={() => { setEditReceber(undefined); setShowReceber(true); }}
          onEdit={(l) => {
            const c = contasReceber.find((x) => x.id === l.id);
            if (c) { setEditReceber(c); setShowReceber(true); }
          }}
          onDelete={excluirLinhaReceber}
          onBaixar={baixarLinhaReceber}
          onAbrirPasta={(l) => {
            if (l.fornecedorId) {
              const f = fornecedores.find((x) => x.id === l.fornecedorId);
              if (f) setShowPasta({ tipo: "fornecedor", id: f.id, nome: f.nome });
              return;
            }
            const cli = clientes.find((x) => x.id === l.clienteId);
            if (cli) setShowPasta({ tipo: "cliente", id: cli.id, nome: cli.nome });
          }}
          onAbrirAnexos={(l) => setShowAnexos({
            tipo: "receber",
            id: l.id,
            titulo: l.titulo,
            entidadeTipo: l.fornecedorId ? "fornecedor" : l.clienteId ? "cliente" : null,
            entidadeId: l.fornecedorId ?? l.clienteId,
            pastaFixa: l.fornecedorId && l.mesCompetencia ? pastaCompetencia(l.mesCompetencia) : null,
          })}
          receitasRecorrentes={receitasRecorrentes}
          mesSelecionado={mesSelecionado}
          onGerarRecebimentos={gerarRecebimentosDoMes}
          gerandoRecebimentos={gerando}
          onNovaReceitaRecorrente={() => { setEditReceitaRecorrente(undefined); setShowReceitaRecorrente(true); }}
          onEditarReceitaRecorrente={(r) => { setEditReceitaRecorrente(r); setShowReceitaRecorrente(true); }}
          onExcluirReceitaRecorrente={excluirReceitaRecorrente}
          onAbrirPastaReceitaRecorrente={(r) => {
            const f = fornecedores.find((x) => x.id === r.fornecedor_id);
            if (f) setShowPasta({ tipo: "fornecedor", id: f.id, nome: f.nome });
            else setAvisoAcao("Esse recebimento recorrente ainda não tem uma pasta vinculada. Edite e escolha uma em Fornecedores.");
          }}
        />
      )}

      {tab === "prolabore" && (
        <ProLaboreTab
          registros={proLabore}
          onNew={() => { setEditProLabore(undefined); setShowProLabore(true); }}
          onEdit={(p) => { setEditProLabore(p); setShowProLabore(true); }}
          onDelete={excluirProLabore}
          onAbrirComprovante={abrirComprovanteProLabore}
        />
      )}

      {showPagar && (
        <ContaPagarForm
          initial={editPagar}
          fornecedores={fornecedores}
          projetos={projetos}
          despesasFixas={despesasFixas}
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
          fornecedores={fornecedores}
          receitasRecorrentes={receitasRecorrentes}
          onCancel={() => { setShowReceber(false); setEditReceber(undefined); }}
          onSave={salvarReceber}
          onNovoCliente={() => setShowCliente(true)}
        />
      )}
      {showDespesa && (
        <DespesaFixaForm
          initial={editDespesa}
          fornecedores={fornecedores.filter((f) => f.tipo_pasta === "fixa")}
          onCancel={() => { setShowDespesa(false); setEditDespesa(undefined); }}
          onSave={salvarDespesa}
        />
      )}
      {showReceitaRecorrente && (
        <ReceitaRecorrenteForm
          initial={editReceitaRecorrente}
          fornecedores={fornecedores.filter((f) => f.tipo_pasta === "receita_recorrente")}
          onCancel={() => { setShowReceitaRecorrente(false); setEditReceitaRecorrente(undefined); }}
          onSave={salvarReceitaRecorrente}
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
          mes={mesSelecionado}
          contasPagar={contasPagar}
          recebiveis={linhasReceber}
          proLabore={proLabore}
          projetos={projetos}
          configuracoes={configuracoes}
          nomeFornecedor={nomeFornecedor}
          onClose={() => setShowRelatorio(false)}
        />
      )}
      {showPasta && (
        <PastaEntidade
          entidadeTipo={showPasta.tipo}
          entidadeId={showPasta.id}
          nomeEntidade={showPasta.nome}
          onClose={() => setShowPasta(null)}
        />
      )}
      {showAnexos && (
        <AnexosLancamento
          lancamentoTipo={showAnexos.tipo}
          lancamentoId={showAnexos.id}
          entidadeTipo={showAnexos.entidadeTipo}
          entidadeId={showAnexos.entidadeId}
          pastaFixa={showAnexos.pastaFixa}
          titulo={showAnexos.titulo}
          onClose={() => setShowAnexos(null)}
        />
      )}
      {confirmDialog && <ConfirmModal estado={confirmDialog} onFechar={() => setConfirmDialog(null)} />}
    </div>
  );
}

// ===================== Fluxo de Caixa =====================

function FluxoCaixaTab({
  totais,
  mesSelecionado,
  onMudarMes,
}: {
  totais: {
    aPagar: number; pago: number; atrasadoPagar: number;
    aReceber: number; recebido: number; atrasadoReceber: number;
    proLaboreMes: number; saldo: number;
  };
  mesSelecionado: string;
  onMudarMes: (mes: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-ink-soft">
            Resumo de <strong className="text-ink">{labelMesReferencia(mesSelecionado)}</strong>
          </p>
          <input
            type="month"
            value={mesSelecionado}
            onChange={(e) => e.target.value && onMudarMes(e.target.value)}
            className="t-colors rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink"
            title="Escolha o mês do resumo"
          />
          {mesSelecionado !== mesReferenciaAtual() && (
            <button
              onClick={() => onMudarMes(mesReferenciaAtual())}
              className="t-colors rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft"
            >
              Voltar ao mês atual
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Saldo — destaque principal */}
        <div className="rounded-2xl border border-line glass p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Saldo do período (recebido − pago)
          </p>
          <p
            className={`tnum mt-1.5 font-display text-xl font-extrabold ${
              totais.saldo >= 0 ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {brl(totais.saldo)}
          </p>
        </div>

        {/* A pagar */}
        <div>
          <h3 className="mb-2.5 font-display text-base font-bold text-ink">A pagar</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat label="A pagar" value={brl(totais.aPagar)} tone="amber" />
            <MiniStat label="Pago no período" value={brl(totais.pago)} tone="emerald" />
            <MiniStat label="Atrasados" value={brl(totais.atrasadoPagar)} tone="rose" />
          </div>
        </div>

        {/* A receber */}
        <div>
          <h3 className="mb-2.5 font-display text-base font-bold text-ink">A receber</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat label="A receber" value={brl(totais.aReceber)} tone="amber" />
            <MiniStat label="Recebido no período" value={brl(totais.recebido)} tone="emerald" />
            <MiniStat label="Atrasados" value={brl(totais.atrasadoReceber)} tone="rose" />
          </div>
        </div>

        {/* Pró-labore */}
        <div>
          <h3 className="mb-2.5 font-display text-base font-bold text-ink">Pró-labore</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat label="Pró-labore do período" value={brl(totais.proLaboreMes)} tone="amber" />
          </div>
        </div>
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
  onAbrirPasta,
  onAbrirAnexos,
  tituloVazio,
  despesasFixas,
  mesSelecionado,
  onGerarDespesasFixas,
  gerandoDespesasFixas,
  onNovaDespesaFixa,
  onEditarDespesaFixa,
  onExcluirDespesaFixa,
  onAbrirPastaDespesaFixa,
}: {
  contas: ContaPagar[];
  nomeFornecedor: (id: string | null) => string;
  onNew: () => void;
  onEdit: (c: ContaPagar) => void;
  onDelete: (c: ContaPagar) => void;
  onBaixar: (c: ContaPagar) => void;
  onAbrirPasta: (c: ContaPagar) => void;
  onAbrirAnexos: (c: ContaPagar) => void;
  tituloVazio?: string;
  despesasFixas: DespesaFixa[];
  mesSelecionado: string;
  onGerarDespesasFixas: () => void;
  gerandoDespesasFixas: boolean;
  onNovaDespesaFixa: () => void;
  onEditarDespesaFixa: (d: DespesaFixa) => void;
  onExcluirDespesaFixa: (d: DespesaFixa) => void;
  onAbrirPastaDespesaFixa: (d: DespesaFixa) => void;
}) {
  const [filtro, setFiltro] = useState<"todos" | "atrasado" | "pendente" | "pago">("todos");
  const lista = contas.filter((c) => filtro === "todos" || contaPagarStatus(c) === filtro);
  const [menu, setMenu] = useState<MenuContextoState | null>(null);
  useFecharMenuAoClicarFora(!!menu, () => setMenu(null));
  const [mostrarFixas, setMostrarFixas] = useState(false);

  return (
    <div>
      <TopBar
        onNew={onNew}
        newLabel="+ Novo lançamento"
        filtro={filtro}
        setFiltro={setFiltro}
        extraButton={{
          label: mostrarFixas ? "Ocultar despesas fixas" : "Despesas fixas",
          onClick: () => setMostrarFixas((v) => !v),
        }}
      />

      {mostrarFixas && (
        <div className="mt-4 rounded-2xl border border-line glass p-4">
          <h3 className="mb-3 font-display text-sm font-bold text-ink">Despesas fixas</h3>
          <DespesasFixasTab
            despesas={despesasFixas}
            mesSelecionado={mesSelecionado}
            onGerarLancamentos={onGerarDespesasFixas}
            gerando={gerandoDespesasFixas}
            onNew={onNovaDespesaFixa}
            onEdit={onEditarDespesaFixa}
            onDelete={onExcluirDespesaFixa}
            onAbrirPasta={onAbrirPastaDespesaFixa}
          />
        </div>
      )}

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
                <li
                  key={c.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenu({
                      x: e.clientX,
                      y: e.clientY,
                      opcoes: [
                        { label: "Anexos", onClick: () => onAbrirAnexos(c) },
                        ...(c.fornecedor_id || c.despesa_fixa_id
                          ? [{ label: "Abrir pasta", onClick: () => onAbrirPasta(c) }]
                          : []),
                        { label: "Editar", onClick: () => onEdit(c) },
                        { label: "Excluir", tone: "danger", onClick: () => onDelete(c) },
                      ],
                    });
                  }}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {c.descricao}
                      {c.tipo !== "rt" && c.tipo !== "art" && (
                        <span className="font-normal text-ink-faint"> · {TIPOS_CONTA_PAGAR[c.tipo]}</span>
                      )}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {nomeFornecedor(c.fornecedor_id)} · vence {formatDate(c.vencimento)}
                      {c.data_pagamento && <> · pago {formatDate(c.data_pagamento)}</>}
                      {c.mes_competencia && <> · competência {labelMesReferencia(c.mes_competencia)}</>}
                    </p>
                  </div>
                  <span className="tnum text-sm font-semibold text-ink">{brl(Number(c.valor))}</span>
                  <StatusBadge status={st} kind="pagamento" />
                  <BotaoMenu
                    onAbrir={(pos) =>
                      setMenu({
                        ...pos,
                        opcoes: [
                          { label: c.data_pagamento ? "Reabrir" : "Marcar como pago", onClick: () => onBaixar(c) },
                          { label: "Anexos", onClick: () => onAbrirAnexos(c) },
                          ...(c.fornecedor_id || c.despesa_fixa_id
                            ? [{ label: "Abrir pasta", onClick: () => onAbrirPasta(c) }]
                            : []),
                          { label: "Editar", onClick: () => onEdit(c) },
                          { label: "Excluir", tone: "danger" as const, onClick: () => onDelete(c) },
                        ],
                      })
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {menu && <ContextMenu menu={menu} onFechar={() => setMenu(null)} />}
    </div>
  );
}

// ===================== Contas a Receber =====================

function ContasReceberTab({
  linhas: todasLinhas,
  onNew,
  onEdit,
  onDelete,
  onBaixar,
  onAbrirPasta,
  onAbrirAnexos,
  receitasRecorrentes,
  mesSelecionado,
  onGerarRecebimentos,
  gerandoRecebimentos,
  onNovaReceitaRecorrente,
  onEditarReceitaRecorrente,
  onExcluirReceitaRecorrente,
  onAbrirPastaReceitaRecorrente,
}: {
  linhas: LinhaReceber[];
  onNew: () => void;
  onEdit: (l: LinhaReceber) => void;
  onDelete: (l: LinhaReceber) => void;
  onBaixar: (l: LinhaReceber) => void;
  onAbrirPasta: (l: LinhaReceber) => void;
  onAbrirAnexos: (l: LinhaReceber) => void;
  receitasRecorrentes: ReceitaRecorrente[];
  mesSelecionado: string;
  onGerarRecebimentos: () => void;
  gerandoRecebimentos: boolean;
  onNovaReceitaRecorrente: () => void;
  onEditarReceitaRecorrente: (r: ReceitaRecorrente) => void;
  onExcluirReceitaRecorrente: (r: ReceitaRecorrente) => void;
  onAbrirPastaReceitaRecorrente: (r: ReceitaRecorrente) => void;
}) {
  const [filtro, setFiltro] = useState<"todos" | "atrasado" | "pendente" | "pago">("todos");
  const lista = todasLinhas.filter((l) => filtro === "todos" || l.status === filtro);
  const [mostrarRecorrentes, setMostrarRecorrentes] = useState(false);
  const [menu, setMenu] = useState<MenuContextoState | null>(null);
  useFecharMenuAoClicarFora(!!menu, () => setMenu(null));

  return (
    <div>
      <TopBar
        onNew={onNew}
        newLabel="+ Novo lançamento"
        filtro={filtro}
        setFiltro={setFiltro}
        extraButton={{
          label: mostrarRecorrentes ? "Ocultar recebimentos recorrentes" : "Recebimentos recorrentes",
          onClick: () => setMostrarRecorrentes((v) => !v),
        }}
      />

      {mostrarRecorrentes && (
        <div className="mt-4 rounded-2xl border border-line glass p-4">
          <h3 className="mb-3 font-display text-sm font-bold text-ink">Recebimentos recorrentes</h3>
          <ReceitasRecorrentesTab
            receitas={receitasRecorrentes}
            mesSelecionado={mesSelecionado}
            onGerarLancamentos={onGerarRecebimentos}
            gerando={gerandoRecebimentos}
            onNew={onNovaReceitaRecorrente}
            onEdit={onEditarReceitaRecorrente}
            onDelete={onExcluirReceitaRecorrente}
            onAbrirPasta={onAbrirPastaReceitaRecorrente}
          />
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-line glass">
        {lista.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">Nenhum lançamento neste filtro.</p>
        ) : (
          <ul className="divide-y divide-line">
            {lista.map((l) => (
              <li
                key={`${l.origem}-${l.id}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({
                    x: e.clientX,
                    y: e.clientY,
                    opcoes: [
                      { label: l.dataRecebimento ? "Reabrir" : "Marcar como recebido", onClick: () => onBaixar(l) },
                      { label: "Anexos", onClick: () => onAbrirAnexos(l) },
                      ...(l.clienteId || l.fornecedorId
                        ? [{ label: "Abrir pasta", onClick: () => onAbrirPasta(l) }]
                        : []),
                      ...(l.origem === "receber"
                        ? [{ label: "Editar", onClick: () => onEdit(l) }]
                        : []),
                      { label: "Excluir", tone: "danger" as const, onClick: () => onDelete(l) },
                    ],
                  });
                }}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {l.titulo}
                    <span className="font-normal text-ink-faint"> · {l.subtitulo}</span>
                    {l.origem === "obra" && (
                      <span className="ml-1.5 rounded-full bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold text-ink-faint">obra</span>
                    )}
                  </p>
                  <p className="text-xs text-ink-soft">
                    vence {formatDate(l.vencimento)}
                    {l.dataRecebimento && <> · recebido {formatDate(l.dataRecebimento)}</>}
                  </p>
                </div>
                <span className="tnum text-sm font-semibold text-ink">{brl(l.valor)}</span>
                <StatusBadge status={l.status} kind="pagamento" />
                <BotaoMenu
                  onAbrir={(pos) =>
                    setMenu({
                      ...pos,
                      opcoes: [
                        { label: l.dataRecebimento ? "Reabrir" : "Marcar como recebido", onClick: () => onBaixar(l) },
                        { label: "Anexos", onClick: () => onAbrirAnexos(l) },
                        ...(l.clienteId || l.fornecedorId
                          ? [{ label: "Abrir pasta", onClick: () => onAbrirPasta(l) }]
                          : []),
                        ...(l.origem === "receber"
                          ? [{ label: "Editar", onClick: () => onEdit(l) }]
                          : []),
                        { label: "Excluir", tone: "danger" as const, onClick: () => onDelete(l) },
                      ],
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {menu && <ContextMenu menu={menu} onFechar={() => setMenu(null)} />}
    </div>
  );
}

// ===================== Pró-labore =====================

function ProLaboreTab({
  registros,
  onNew,
  onEdit,
  onDelete,
  onAbrirComprovante,
}: {
  registros: ProLabore[];
  onNew: () => void;
  onEdit: (p: ProLabore) => void;
  onDelete: (p: ProLabore) => void;
  onAbrirComprovante: (p: ProLabore) => void;
}) {
  const [menu, setMenu] = useState<MenuContextoState | null>(null);
  useFecharMenuAoClicarFora(!!menu, () => setMenu(null));

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
              <li
                key={p.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({
                    x: e.clientX,
                    y: e.clientY,
                    opcoes: [
                      { label: "Editar", onClick: () => onEdit(p) },
                      { label: "Excluir", tone: "danger", onClick: () => onDelete(p) },
                    ],
                  });
                }}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{labelMesReferencia(p.mes_referencia)}</p>
                  <p className="text-xs text-ink-soft">
                    {p.data_pagamento ? `pago ${formatDate(p.data_pagamento)}` : "não pago"}
                    {p.forma_transferencia && <> · {p.forma_transferencia}</>}
                    {p.comprovante_url && (
                      <>
                        {" · "}
                        <button onClick={() => onAbrirComprovante(p)} className="text-brand underline">comprovante</button>
                      </>
                    )}
                  </p>
                </div>
                <span className="tnum text-sm font-semibold text-ink">{brl(Number(p.valor))}</span>
                <BotaoMenu
                  onAbrir={(pos) =>
                    setMenu({
                      ...pos,
                      opcoes: [
                        { label: "Editar", onClick: () => onEdit(p) },
                        { label: "Excluir", tone: "danger", onClick: () => onDelete(p) },
                      ],
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {menu && <ContextMenu menu={menu} onFechar={() => setMenu(null)} />}
    </div>
  );
}

// ===================== Notas Fiscais =====================

function NotasFiscaisTab({
  notas,
  onNew,
  onEdit,
  onDelete,
  onAbrirPasta,
  onAbrirAnexos,
}: {
  notas: NotaFiscal[];
  onNew: () => void;
  onEdit: (n: NotaFiscal) => void;
  onDelete: (n: NotaFiscal) => void;
  onAbrirPasta: (n: NotaFiscal) => void;
  onAbrirAnexos: (n: NotaFiscal) => void;
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
                  </p>
                </div>
                <span className="tnum text-sm font-semibold text-ink">{brl(Number(n.valor))}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${n.status === "cancelada" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-600"}`}>
                  {n.status === "cancelada" ? "Cancelada" : "Emitida"}
                </span>
                <button
                  onClick={() => onAbrirAnexos(n)}
                  title="Anexo desta nota (arquivo PDF/XML)"
                  className="t-colors rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-ink/5"
                >
                  📎
                </button>
                {(n.cliente_id || n.fornecedor_id) && (
                  <button
                    onClick={() => onAbrirPasta(n)}
                    title="Abrir pasta"
                    className="t-colors rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-ink/5"
                  >
                    📁
                  </button>
                )}
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
  mesSelecionado,
  onGerarLancamentos,
  gerando,
  onNew,
  onEdit,
  onDelete,
  onAbrirPasta,
}: {
  despesas: DespesaFixa[];
  mesSelecionado: string;
  onGerarLancamentos: () => void;
  gerando: boolean;
  onNew: () => void;
  onEdit: (d: DespesaFixa) => void;
  onDelete: (d: DespesaFixa) => void;
  onAbrirPasta: (d: DespesaFixa) => void;
}) {
  const [menu, setMenu] = useState<MenuContextoState | null>(null);
  useFecharMenuAoClicarFora(!!menu, () => setMenu(null));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={onGerarLancamentos}
          disabled={gerando}
          className="t-colors rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5 disabled:opacity-60"
          title={`Gera as despesas fixas para ${labelMesReferencia(mesSelecionado)}`}
        >
          {gerando ? "Gerando…" : `Gerar despesas fixas de ${labelMesReferencia(mesSelecionado)}`}
        </button>
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
              <li
                key={d.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({
                    x: e.clientX,
                    y: e.clientY,
                    opcoes: [
                      { label: "Ver pasta (ano/mês)", onClick: () => onAbrirPasta(d) },
                      { label: "Editar", onClick: () => onEdit(d) },
                      { label: "Excluir", tone: "danger", onClick: () => onDelete(d) },
                    ],
                  });
                }}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {d.descricao}
                    {!d.ativo && <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-semibold text-ink-faint">pausada</span>}
                  </p>
                  <p className="text-xs text-ink-soft">
                    vence todo dia {d.dia_vencimento} {d.categoria && `· ${d.categoria}`}
                  </p>
                </div>
                <span className="tnum text-sm font-semibold text-ink">
                  {d.valor != null ? brl(Number(d.valor)) : "valor variável"}
                </span>
                <BotaoMenu
                  onAbrir={(pos) =>
                    setMenu({
                      ...pos,
                      opcoes: [
                        { label: "Ver pasta (ano/mês)", onClick: () => onAbrirPasta(d) },
                        { label: "Editar", onClick: () => onEdit(d) },
                        { label: "Excluir", tone: "danger", onClick: () => onDelete(d) },
                      ],
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {menu && <ContextMenu menu={menu} onFechar={() => setMenu(null)} />}
    </div>
  );
}

// ===================== Recebimentos Recorrentes =====================

function ReceitasRecorrentesTab({
  receitas,
  mesSelecionado,
  onGerarLancamentos,
  gerando,
  onNew,
  onEdit,
  onDelete,
  onAbrirPasta,
}: {
  receitas: ReceitaRecorrente[];
  mesSelecionado: string;
  onGerarLancamentos: () => void;
  gerando: boolean;
  onNew: () => void;
  onEdit: (r: ReceitaRecorrente) => void;
  onDelete: (r: ReceitaRecorrente) => void;
  onAbrirPasta: (r: ReceitaRecorrente) => void;
}) {
  const [menu, setMenu] = useState<MenuContextoState | null>(null);
  useFecharMenuAoClicarFora(!!menu, () => setMenu(null));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={onGerarLancamentos}
          disabled={gerando}
          className="t-colors rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5 disabled:opacity-60"
          title={`Gera os recebimentos recorrentes de ${labelMesReferencia(mesSelecionado)}`}
        >
          {gerando ? "Gerando…" : `Gerar recebimentos de ${labelMesReferencia(mesSelecionado)}`}
        </button>
        <button onClick={onNew} className="t-colors rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark">
          + Novo recebimento recorrente
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line glass">
        {receitas.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">Nenhum recebimento recorrente cadastrado.</p>
        ) : (
          <ul className="divide-y divide-line">
            {receitas.map((r) => (
              <li
                key={r.id}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({
                    x: e.clientX,
                    y: e.clientY,
                    opcoes: [
                      { label: "Ver pasta (ano/mês)", onClick: () => onAbrirPasta(r) },
                      { label: "Editar", onClick: () => onEdit(r) },
                      { label: "Excluir", tone: "danger", onClick: () => onDelete(r) },
                    ],
                  });
                }}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {r.descricao}
                    {!r.ativo && <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-semibold text-ink-faint">pausado</span>}
                  </p>
                  <p className="text-xs text-ink-soft">
                    vence todo dia {r.dia_vencimento} {r.categoria && `· ${r.categoria}`}
                  </p>
                </div>
                <span className="tnum text-sm font-semibold text-ink">
                  {r.valor != null ? brl(Number(r.valor)) : "valor variável"}
                </span>
                <BotaoMenu
                  onAbrir={(pos) =>
                    setMenu({
                      ...pos,
                      opcoes: [
                        { label: "Ver pasta (ano/mês)", onClick: () => onAbrirPasta(r) },
                        { label: "Editar", onClick: () => onEdit(r) },
                        { label: "Excluir", tone: "danger", onClick: () => onDelete(r) },
                      ],
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {menu && <ContextMenu menu={menu} onFechar={() => setMenu(null)} />}
    </div>
  );
}

// ===================== Utilitários de UI =====================

function TopBar({
  onNew,
  newLabel,
  filtro,
  setFiltro,
  extraButton,
}: {
  onNew: () => void;
  newLabel: string;
  filtro: string;
  setFiltro: (f: "todos" | "atrasado" | "pendente" | "pago") => void;
  extraButton?: { label: string; onClick: () => void };
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
      <div className="flex flex-wrap gap-2">
        {extraButton && (
          <button
            onClick={extraButton.onClick}
            className="t-colors rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5"
          >
            {extraButton.label}
          </button>
        )}
        <button onClick={onNew} className="t-colors rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark">
          {newLabel}
        </button>
      </div>
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
