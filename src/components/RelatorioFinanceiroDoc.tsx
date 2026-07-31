"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";
import {
  ContaPagar,
  LinhaReceber,
  ProLabore,
  Documento,
  Projeto,
  Configuracoes,
  labelMesReferencia,
  mesReferenciaAtual,
  PASTAS_MES,
} from "@/lib/types";
import { brl, formatDate } from "@/lib/format";

const NAVY = "#102336";
const BLUE = "#3E7CB1";
const INK = "#0B1B2B";
const MUTED = "#3f4a57";
const LINE = "#e2e8f0";

const RAZAO_SOCIAL = "PROJECT AR LTDA";
const CNPJ = "50.784.117/0001-81";

// Validade do link assinado de cada anexo no PDF (7 dias). Se o relatório
// for aberto depois disso, é só gerar de novo pela tela de Fluxo de Caixa.
const VALIDADE_LINK_SEGUNDOS = 60 * 60 * 24 * 7;

type BaseData = "vencimento" | "pagamento";

function linhasNoPeriodo<T>(itens: T[], mesInicio: string, mesFim: string, campoData: (t: T) => string | null) {
  return itens.filter((i) => {
    const d = campoData(i);
    if (!d) return false;
    const mesItem = d.slice(0, 7);
    return mesItem >= mesInicio && mesItem <= mesFim;
  });
}

// Pastas da obra cujos arquivos podem entrar no relatório — mesmos nomes
// das pastas padrão criadas em cada obra. "Aprovação" fica de fora, não é
// documento contábil.
const PASTAS_CONTABEIS = ["Boleto", "Notas Fiscais e Recibos", "Comprovantes"];
function daPastaContabil(pasta: string | null) {
  if (!pasta) return false;
  return PASTAS_CONTABEIS.some((p) => pasta === p || pasta.startsWith(`${p}/`));
}

// Pastas de fornecedor (fixa/variável/recorrente): a subpasta final dentro
// de Ano/Mês precisa ser uma das categorias contábeis (Boletos, Comprovantes,
// Recibos, Notas Fiscais).
function daPastaContabilFornecedor(pasta: string | null) {
  if (!pasta) return false;
  const partes = pasta.split("/");
  const ultima = partes[partes.length - 1];
  return PASTAS_MES.includes(ultima);
}

type AnexoLink = { nome: string; url: string };
type Candidato = {
  id: string;
  nome: string;
  pasta: string;
  url: string;
  origemNome: string;
  lancamentoIds: string[];
};

export function RelatorioMensalViewer({
  mes: mesInicial,
  contasPagar,
  recebiveis,
  proLabore,
  projetos,
  configuracoes,
  nomeFornecedor,
  onClose,
}: {
  mes?: string;
  contasPagar: ContaPagar[];
  recebiveis: LinhaReceber[];
  proLabore: ProLabore[];
  projetos: Projeto[];
  configuracoes?: Configuracoes | null;
  nomeFornecedor: (id: string | null) => string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [mesInicio, setMesInicio] = useState(mesInicial ?? mesReferenciaAtual());
  const [mesFim, setMesFim] = useState(mesInicial ?? mesReferenciaAtual());
  const [baseData, setBaseData] = useState<BaseData>(
    configuracoes?.relatorio_base_padrao === "vencimento" ? "vencimento" : "pagamento"
  );
  const [anexosDiretos, setAnexosDiretos] = useState<Record<string, AnexoLink[]>>({});
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [carregandoAnexos, setCarregandoAnexos] = useState(true);
  const [erroAnexos, setErroAnexos] = useState<string | null>(null);
  const [mostrarSelecao, setMostrarSelecao] = useState(false);

  // "mes" continua existindo pra compor os textos/título do documento
  // (quando o período é um único mês, mostra só ele; senão, o intervalo).
  const periodoLabel =
    mesInicio === mesFim
      ? labelMesReferencia(mesInicio)
      : `${labelMesReferencia(mesInicio)} – ${labelMesReferencia(mesFim)}`;

  const campoDataPagar = (c: ContaPagar) => (baseData === "vencimento" ? c.vencimento : c.data_pagamento);
  const campoDataReceber = (l: LinhaReceber) => (baseData === "vencimento" ? l.vencimento : l.dataRecebimento);

  const pagos = useMemo(
    () => linhasNoPeriodo(contasPagar, mesInicio, mesFim, campoDataPagar),
    [contasPagar, mesInicio, mesFim, baseData]
  );
  const recebidos = useMemo(
    () => linhasNoPeriodo(recebiveis, mesInicio, mesFim, campoDataReceber),
    [recebiveis, mesInicio, mesFim, baseData]
  );

  const nomeObra = (id: string) => projetos.find((p) => p.id === id)?.projeto || "Obra";

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setCarregandoAnexos(true);
      setErroAnexos(null);
      setSelecionados(new Set());
      const idsPagar = pagos.map((c) => c.id);
      const idsReceber = recebidos.map((c) => c.id);
      const consultas: any[] = [];
      if (idsPagar.length > 0)
        consultas.push(
          supabase.from("documentos").select("*").eq("lancamento_tipo", "pagar").in("lancamento_id", idsPagar)
        );
      if (idsReceber.length > 0)
        consultas.push(
          supabase.from("documentos").select("*").eq("lancamento_tipo", "receber").in("lancamento_id", idsReceber)
        );

      // Obras ligadas aos lançamentos do mês: também busca o que já está
      // salvo nas pastas Boleto / Notas Fiscais e Recibos / Comprovantes
      // de cada obra, como candidatos a incluir (você escolhe quais entram).
      const obraIdsPagar = new Map<string, string[]>(); // obra_id -> [lancamento ids]
      for (const c of pagos) {
        if (!c.obra_id) continue;
        obraIdsPagar.set(c.obra_id, [...(obraIdsPagar.get(c.obra_id) ?? []), c.id]);
      }
      const obraIdsReceber = new Map<string, string[]>();
      for (const l of recebidos) {
        if (!l.obraId) continue;
        obraIdsReceber.set(l.obraId, [...(obraIdsReceber.get(l.obraId) ?? []), l.id]);
      }
      const todasObraIds = Array.from(
        new Set([...Array.from(obraIdsPagar.keys()), ...Array.from(obraIdsReceber.keys())])
      );
      let consultaObras: any = null;
      if (todasObraIds.length > 0) {
        consultaObras = await supabase
          .from("documentos")
          .select("*")
          .eq("entidade_tipo", "projeto")
          .in("entidade_id", todasObraIds);
      }

      // Fornecedores ligados aos lançamentos do mês (despesa fixa, despesa
      // variável com fornecedor, ou recebimento recorrente): busca o que já
      // está salvo na pasta Ano/Mês/Boletos-Comprovantes-Recibos-Notas
      // Fiscais de cada um, como candidatos também.
      const fornecedorIdsPagar = new Map<string, string[]>();
      for (const c of pagos) {
        if (!c.fornecedor_id) continue;
        fornecedorIdsPagar.set(c.fornecedor_id, [...(fornecedorIdsPagar.get(c.fornecedor_id) ?? []), c.id]);
      }
      const fornecedorIdsReceber = new Map<string, string[]>();
      for (const l of recebidos) {
        if (!l.fornecedorId) continue;
        fornecedorIdsReceber.set(l.fornecedorId, [...(fornecedorIdsReceber.get(l.fornecedorId) ?? []), l.id]);
      }
      const todosFornecedorIds = Array.from(
        new Set([...Array.from(fornecedorIdsPagar.keys()), ...Array.from(fornecedorIdsReceber.keys())])
      );
      let consultaFornecedores: any = null;
      if (todosFornecedorIds.length > 0) {
        consultaFornecedores = await supabase
          .from("documentos")
          .select("*")
          .eq("entidade_tipo", "fornecedor")
          .in("entidade_id", todosFornecedorIds);
      }

      if (consultas.length === 0 && !consultaObras && !consultaFornecedores) {
        if (!cancelado) {
          setAnexosDiretos({});
          setCandidatos([]);
          setCarregandoAnexos(false);
        }
        return;
      }

      const resultados = await Promise.all(consultas);
      const erroConsulta = resultados.find((r: any) => r.error)?.error as any;
      if (erroConsulta) {
        if (!cancelado) {
          setErroAnexos(
            `Não foi possível buscar os anexos (${erroConsulta.message}). Confira se rodou a migration-financeiro-v4.sql no Supabase.`
          );
          setCarregandoAnexos(false);
        }
        return;
      }
      const docs: Documento[] = resultados.flatMap((r: any) => (r.data as Documento[]) ?? []);

      const mapa: Record<string, AnexoLink[]> = {};
      let falhasAssinatura = 0;
      let totalAnexos = docs.length;
      await Promise.all(
        docs.map(async (d) => {
          if (!d.lancamento_id) return;
          const { data, error } = await supabase.storage.from("anexos").createSignedUrl(d.path, VALIDADE_LINK_SEGUNDOS);
          if (!mapa[d.lancamento_id]) mapa[d.lancamento_id] = [];
          if (data?.signedUrl) {
            mapa[d.lancamento_id].push({ nome: d.nome, url: data.signedUrl });
          } else {
            // Mostra o nome do arquivo mesmo se o link não puder ser gerado,
            // pra deixar claro que o anexo existe (em vez de sumir da tela).
            falhasAssinatura++;
            mapa[d.lancamento_id].push({ nome: `${d.nome} (erro ao gerar link${error ? ": " + error.message : ""})`, url: "" });
          }
        })
      );

      // Candidatos das pastas da obra e das pastas de fornecedor
      // (deduplicados por arquivo).
      const listaCandidatos: Candidato[] = [];
      if (consultaObras && !consultaObras.error) {
        for (const d of (consultaObras.data as Documento[]) ?? []) {
          if (!daPastaContabil(d.pasta)) continue;
          const lancamentoIds = [
            ...(obraIdsPagar.get(d.entidade_id ?? "") ?? []),
            ...(obraIdsReceber.get(d.entidade_id ?? "") ?? []),
          ];
          if (lancamentoIds.length === 0) continue;
          totalAnexos++;
          const { data, error } = await supabase.storage.from("anexos").createSignedUrl(d.path, VALIDADE_LINK_SEGUNDOS);
          if (!data?.signedUrl) falhasAssinatura++;
          listaCandidatos.push({
            id: d.id,
            nome: d.nome,
            pasta: d.pasta ?? "",
            url: data?.signedUrl ?? "",
            origemNome: nomeObra(d.entidade_id ?? ""),
            lancamentoIds,
          });
        }
      }
      if (consultaFornecedores && !consultaFornecedores.error) {
        for (const d of (consultaFornecedores.data as Documento[]) ?? []) {
          if (!daPastaContabilFornecedor(d.pasta)) continue;
          const lancamentoIds = [
            ...(fornecedorIdsPagar.get(d.entidade_id ?? "") ?? []),
            ...(fornecedorIdsReceber.get(d.entidade_id ?? "") ?? []),
          ];
          if (lancamentoIds.length === 0) continue;
          totalAnexos++;
          const { data, error } = await supabase.storage.from("anexos").createSignedUrl(d.path, VALIDADE_LINK_SEGUNDOS);
          if (!data?.signedUrl) falhasAssinatura++;
          listaCandidatos.push({
            id: d.id,
            nome: d.nome,
            pasta: d.pasta ?? "",
            url: data?.signedUrl ?? "",
            origemNome: nomeFornecedor(d.entidade_id ?? ""),
            lancamentoIds,
          });
        }
      }

      if (!cancelado) {
        setAnexosDiretos(mapa);
        setCandidatos(listaCandidatos);
        // Por padrão, todos os candidatos entram — você desmarca o que não
        // for desse mês.
        setSelecionados(new Set(listaCandidatos.map((c) => c.id)));
        if (falhasAssinatura > 0 && totalAnexos > 0) {
          setErroAnexos(
            `${falhasAssinatura} de ${totalAnexos} anexo(s) não geraram link de download. Verifique as políticas de Storage do bucket "anexos" no Supabase.`
          );
        }
        setCarregandoAnexos(false);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesInicio, mesFim, baseData, pagos.length, recebidos.length]);

  // Anexos finais mostrados/impressos no relatório: os diretos (sempre
  // entram) + os candidatos das pastas da obra que estiverem marcados.
  const anexosPorLancamento = useMemo(() => {
    const mapa: Record<string, AnexoLink[]> = {};
    for (const [id, lista] of Object.entries(anexosDiretos)) {
      mapa[id] = [...lista];
    }
    for (const c of candidatos) {
      if (!selecionados.has(c.id)) continue;
      const nomeComPasta = `${c.nome} (${c.origemNome} · ${c.pasta})`;
      for (const lancamentoId of c.lancamentoIds) {
        if (!mapa[lancamentoId]) mapa[lancamentoId] = [];
        mapa[lancamentoId].push({ nome: nomeComPasta, url: c.url });
      }
    }
    return mapa;
  }, [anexosDiretos, candidatos, selecionados]);

  function alternar(id: string) {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  return (
    <div className="fixed inset-0 z-[60] bg-navy/70 backdrop-blur-sm">
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-ink">Relatório — contabilidade</span>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-ink-faint">De</label>
            <input
              type="month"
              value={mesInicio}
              onChange={(e) => {
                const v = e.target.value;
                setMesInicio(v);
                if (v > mesFim) setMesFim(v);
              }}
              className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink"
            />
            <label className="text-xs text-ink-faint">até</label>
            <input
              type="month"
              value={mesFim}
              onChange={(e) => {
                const v = e.target.value;
                setMesFim(v);
                if (v < mesInicio) setMesInicio(v);
              }}
              className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink"
            />
          </div>
          <div className="flex overflow-hidden rounded-lg border border-line text-xs font-semibold">
            <button
              onClick={() => setBaseData("pagamento")}
              className={`t-colors px-2.5 py-1.5 ${
                baseData === "pagamento" ? "bg-brand text-white" : "bg-canvas text-ink-soft hover:bg-ink/5"
              }`}
              title="Considera a data em que foi pago/recebido"
            >
              Pagamento/Recebimento
            </button>
            <button
              onClick={() => setBaseData("vencimento")}
              className={`t-colors px-2.5 py-1.5 ${
                baseData === "vencimento" ? "bg-brand text-white" : "bg-canvas text-ink-soft hover:bg-ink/5"
              }`}
              title="Considera a data de vencimento, pago ou não"
            >
              Vencimento
            </button>
          </div>
          {carregandoAnexos && (
            <span className="text-xs text-ink-faint">carregando anexos…</span>
          )}
        </div>
        <div className="flex gap-2">
          {candidatos.length > 0 && (
            <button
              onClick={() => setMostrarSelecao((v) => !v)}
              className="t-colors rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5"
            >
              {mostrarSelecao ? "Ocultar" : "Selecionar"} anexos ({selecionados.size}/{candidatos.length})
            </button>
          )}
          <button
            onClick={() => window.print()}
            disabled={carregandoAnexos}
            className="t-colors rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark disabled:opacity-60"
          >
            Baixar PDF
          </button>
          <button
            onClick={onClose}
            className="t-colors rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5"
          >
            Fechar
          </button>
        </div>
      </div>

      {erroAnexos && (
        <div className="no-print border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-700">
          ⚠ {erroAnexos}
        </div>
      )}

      {mostrarSelecao && candidatos.length > 0 && (
        <div className="no-print max-h-64 overflow-y-auto border-b border-line bg-canvas/60 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Arquivos encontrados nas pastas das obras e dos fornecedores (Boleto(s) / Notas Fiscais / Recibos / Comprovantes)
            </p>
            <div className="flex gap-2 text-xs font-semibold text-brand">
              <button onClick={() => setSelecionados(new Set(candidatos.map((c) => c.id)))}>
                Marcar todos
              </button>
              <button onClick={() => setSelecionados(new Set())}>Desmarcar todos</button>
            </div>
          </div>
          <div className="space-y-1">
            {candidatos.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selecionados.has(c.id)}
                  onChange={() => alternar(c.id)}
                  className="h-4 w-4 accent-brand"
                />
                <span className="min-w-0 flex-1 truncate text-ink">{c.nome}</span>
                <span className="flex-shrink-0 text-xs text-ink-faint">
                  {c.origemNome} · {c.pasta}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="no-print border-b border-line bg-canvas/60 px-4 py-2 text-xs text-ink-faint">
        Anexos vêm do lançamento (📎) e das pastas Boleto, Notas Fiscais, Recibos e Comprovantes da obra
        ou do fornecedor (fixo, variável ou recebimento recorrente) vinculado — use "Selecionar anexos"
        acima pra escolher quais desses arquivos entram neste relatório.
      </div>

      <div
        className="flex justify-center overflow-auto bg-slate-300 p-4"
        style={{ height: "calc(100vh - 56px)" }}
      >
        <div className="shadow-2xl">
          <RelatorioDoc
            mesInicio={mesInicio}
            mesFim={mesFim}
            periodoLabel={periodoLabel}
            baseData={baseData}
            pagos={pagos}
            recebidos={recebidos}
            proLabore={proLabore}
            nomeFornecedor={nomeFornecedor}
            anexosPorLancamento={anexosPorLancamento}
            configuracoes={configuracoes}
          />
        </div>
      </div>
    </div>
  );
}

function RelatorioDoc({
  mesInicio,
  mesFim,
  periodoLabel,
  baseData,
  pagos,
  recebidos,
  proLabore,
  nomeFornecedor,
  anexosPorLancamento,
  configuracoes,
}: {
  mesInicio: string;
  mesFim: string;
  periodoLabel: string;
  baseData: BaseData;
  pagos: ContaPagar[];
  recebidos: LinhaReceber[];
  proLabore: ProLabore[];
  nomeFornecedor: (id: string | null) => string;
  anexosPorLancamento: Record<string, AnexoLink[]>;
  configuracoes?: Configuracoes | null;
}) {
  const proLaboreMes = useMemo(
    () => proLabore.filter((p) => p.mes_referencia >= mesInicio && p.mes_referencia <= mesFim),
    [proLabore, mesInicio, mesFim]
  );

  const totalPago = pagos.reduce((s, c) => s + Number(c.valor), 0);
  const totalRecebido = recebidos.reduce((s, l) => s + l.valor, 0);
  const totalProLabore = proLaboreMes.reduce((s, p) => s + Number(p.valor), 0);

  return (
    <div
      id="fin-print"
      className="orc-page"
      style={{
        width: "210mm",
        minHeight: "297mm",
        background: "#fff",
        color: INK,
        fontFamily: "var(--font-body, ui-sans-serif)",
      }}
    >
      {/* Cabeçalho */}
      <div style={{ background: NAVY, padding: "22px 28px", display: "flex", alignItems: "center", gap: 14 }}>
        <LogoMark className="h-10 w-10" />
        <div>
          <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: 0.3 }}>
            PROJECT <span style={{ color: BLUE }}>AR</span>
          </p>
          <p style={{ margin: 0, color: "#c7d3de", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
            Relatório Financeiro
          </p>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>{configuracoes?.razao_social || RAZAO_SOCIAL}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: MUTED }}>CNPJ {configuracoes?.cnpj || CNPJ}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 11, color: MUTED }}>Período de referência</p>
            <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 13 }}>{periodoLabel}</p>
          </div>
        </div>

        <Secao titulo={`Contas a Pagar (${baseData === "vencimento" ? "vencidas" : "pagas"} no período)`}>
          {pagos.length === 0 ? (
            <VazioLinha texto="Nenhuma conta neste período." />
          ) : (
            <TabelaLancamentos
              colunas={["Descrição", "Fornecedor", baseData === "vencimento" ? "Vencimento" : "Pago em", "Anexos", "Valor"]}
              linhas={pagos.map((c) => ({
                id: c.id,
                celulas: [
                  c.descricao,
                  nomeFornecedor(c.fornecedor_id),
                  formatDate(baseData === "vencimento" ? c.vencimento : c.data_pagamento),
                ],
                valor: brl(Number(c.valor)),
              }))}
              anexosPorLancamento={anexosPorLancamento}
            />
          )}
          <Subtotal label="Subtotal pago" valor={totalPago} />
        </Secao>

        <Secao titulo={`Contas a Receber (${baseData === "vencimento" ? "vencidas" : "recebidas"} no período)`}>
          {recebidos.length === 0 ? (
            <VazioLinha texto="Nenhuma conta neste período." />
          ) : (
            <TabelaLancamentos
              colunas={["Cliente", "Origem", baseData === "vencimento" ? "Vencimento" : "Recebido em", "Anexos", "Valor"]}
              linhas={recebidos.map((l) => ({
                id: l.id,
                celulas: [l.titulo, l.subtitulo, formatDate(baseData === "vencimento" ? l.vencimento : l.dataRecebimento)],
                valor: brl(l.valor),
              }))}
              anexosPorLancamento={anexosPorLancamento}
            />
          )}
          <Subtotal label="Subtotal recebido" valor={totalRecebido} />
        </Secao>

        <Secao titulo="Pró-labore">
          {proLaboreMes.length === 0 ? (
            <VazioLinha texto="Nenhum pró-labore lançado neste período." />
          ) : (
            <Tabela
              colunas={["Mês", "Pago em", "Comprovante", "Valor"]}
              linhas={proLaboreMes.map((p) => [
                labelMesReferencia(p.mes_referencia),
                formatDate(p.data_pagamento),
                p.comprovante_url ? "Ver comprovante" : "—",
                brl(Number(p.valor)),
              ])}
              links={proLaboreMes.map((p) => p.comprovante_url)}
              linkColuna={2}
            />
          )}
          <Subtotal label="Subtotal pró-labore" valor={totalProLabore} />
        </Secao>

        <div
          style={{
            marginTop: 22,
            borderTop: `2px solid ${NAVY}`,
            paddingTop: 10,
            display: "flex",
            justifyContent: "flex-end",
            gap: 24,
          }}
        >
          <p style={{ margin: 0, fontWeight: 800, fontSize: 13 }}>
            Saldo do período: {brl(totalRecebido - (totalPago + totalProLabore))}
          </p>
        </div>
      </div>

      <div style={{ marginTop: 18, background: NAVY, color: "#dfe7f0", padding: "10px 28px" }}>
        <p style={{ margin: 0, fontSize: 9.5, lineHeight: 1.5 }}>
          Documento gerado automaticamente pelo sistema. Informações confidenciais e protegidas, de uso restrito.
        </p>
      </div>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p
        style={{
          margin: "0 0 8px",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: BLUE,
        }}
      >
        {titulo}
      </p>
      {children}
    </div>
  );
}

// Tabela com uma coluna de "Anexos" que pode ter vários arquivos por linha
// (cada um vira um link clicável que abre/baixa o arquivo em alta qualidade).
function TabelaLancamentos({
  colunas,
  linhas,
  anexosPorLancamento,
}: {
  colunas: string[];
  linhas: { id: string; celulas: (string | number)[]; valor: string }[];
  anexosPorLancamento: Record<string, AnexoLink[]>;
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
      <thead>
        <tr>
          {colunas.map((c, i) => (
            <th
              key={i}
              style={{
                textAlign: i === colunas.length - 1 ? "right" : "left",
                borderBottom: `1.5px solid ${NAVY}`,
                padding: "5px 6px",
                color: MUTED,
                fontWeight: 700,
              }}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((linha) => {
          const anexos = anexosPorLancamento[linha.id] ?? [];
          return (
            <tr key={linha.id} style={{ borderBottom: `1px solid ${LINE}` }}>
              {linha.celulas.map((v, j) => (
                <td key={j} style={{ padding: "5px 6px" }}>
                  {v}
                </td>
              ))}
              <td style={{ padding: "5px 6px" }}>
                {anexos.length === 0 ? (
                  <span style={{ color: MUTED }}>—</span>
                ) : (
                  anexos.map((a, i) =>
                    a.url ? (
                      <span key={i}>
                        <a href={a.url} target="_blank" rel="noreferrer" style={{ color: BLUE, textDecoration: "underline" }}>
                          {a.nome}
                        </a>
                        {i < anexos.length - 1 && <br />}
                      </span>
                    ) : (
                      <span key={i} style={{ color: "#b45309" }}>
                        {a.nome}
                        {i < anexos.length - 1 && <br />}
                      </span>
                    )
                  )
                )}
              </td>
              <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: 700 }}>{linha.valor}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Tabela({
  colunas,
  linhas,
  links,
  linkColuna,
}: {
  colunas: string[];
  linhas: (string | number)[][];
  links?: (string | null)[];
  linkColuna?: number;
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
      <thead>
        <tr>
          {colunas.map((c, i) => (
            <th
              key={i}
              style={{
                textAlign: i === colunas.length - 1 ? "right" : "left",
                borderBottom: `1.5px solid ${NAVY}`,
                padding: "5px 6px",
                color: MUTED,
                fontWeight: 700,
              }}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((linha, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
            {linha.map((v, j) => (
              <td
                key={j}
                style={{
                  padding: "5px 6px",
                  textAlign: j === linha.length - 1 ? "right" : "left",
                  fontWeight: j === linha.length - 1 ? 700 : 400,
                }}
              >
                {linkColuna === j && links?.[i] ? (
                  <a
                    href={links[i] as string}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: BLUE, textDecoration: "underline" }}
                  >
                    {v}
                  </a>
                ) : (
                  v
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Subtotal({ label, valor }: { label: string; valor: number }) {
  return (
    <p style={{ margin: "8px 2px 0", textAlign: "right", fontSize: 11.5, fontWeight: 800 }}>
      {label}: {brl(valor)}
    </p>
  );
}

function VazioLinha({ texto }: { texto: string }) {
  return <p style={{ margin: 0, fontSize: 11, color: MUTED, fontStyle: "italic" }}>{texto}</p>;
}
