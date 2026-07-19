"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/Logo";
import {
  ContaPagar,
  LinhaReceber,
  ProLabore,
  Documento,
  labelMesReferencia,
  mesReferenciaAtual,
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

function linhasDoMes<T>(itens: T[], mes: string, campoData: (t: T) => string | null) {
  return itens.filter((i) => {
    const d = campoData(i);
    return !!d && d.startsWith(mes);
  });
}

type AnexoLink = { nome: string; url: string };

export function RelatorioMensalViewer({
  mes: mesInicial,
  contasPagar,
  recebiveis,
  proLabore,
  nomeFornecedor,
  onClose,
}: {
  mes?: string;
  contasPagar: ContaPagar[];
  recebiveis: LinhaReceber[];
  proLabore: ProLabore[];
  nomeFornecedor: (id: string | null) => string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [mes, setMes] = useState(mesInicial ?? mesReferenciaAtual());
  const [anexosPorLancamento, setAnexosPorLancamento] = useState<Record<string, AnexoLink[]>>({});
  const [carregandoAnexos, setCarregandoAnexos] = useState(true);
  const [erroAnexos, setErroAnexos] = useState<string | null>(null);

  const pagos = useMemo(
    () => linhasDoMes(contasPagar, mes, (c) => c.data_pagamento),
    [contasPagar, mes]
  );
  const recebidos = useMemo(
    () => linhasDoMes(recebiveis, mes, (l) => l.dataRecebimento),
    [recebiveis, mes]
  );

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setCarregandoAnexos(true);
      setErroAnexos(null);
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

      if (consultas.length === 0) {
        if (!cancelado) {
          setAnexosPorLancamento({});
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
      if (!cancelado) {
        setAnexosPorLancamento(mapa);
        if (falhasAssinatura > 0 && docs.length > 0) {
          setErroAnexos(
            `${falhasAssinatura} de ${docs.length} anexo(s) não geraram link de download. Verifique as políticas de Storage do bucket "anexos" no Supabase.`
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
  }, [mes, pagos.length, recebidos.length]);

  return (
    <div className="fixed inset-0 z-[60] bg-navy/70 backdrop-blur-sm">
      <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-ink">Relatório mensal — contabilidade</span>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink"
          />
          {carregandoAnexos && (
            <span className="text-xs text-ink-faint">carregando anexos…</span>
          )}
        </div>
        <div className="flex gap-2">
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

      <div className="no-print border-b border-line bg-canvas/60 px-4 py-2 text-xs text-ink-faint">
        A coluna <strong>Anexos</strong> só mostra link quando o lançamento tem arquivo enviado pelo botão{" "}
        <strong>📎</strong> na lista de Contas a Pagar / Contas a Receber. Um traço (—) significa que ainda não
        tem nada anexado nesse lançamento.
      </div>

      <div
        className="flex justify-center overflow-auto bg-slate-300 p-4"
        style={{ height: "calc(100vh - 56px)" }}
      >
        <div className="shadow-2xl">
          <RelatorioDoc
            mes={mes}
            pagos={pagos}
            recebidos={recebidos}
            proLabore={proLabore}
            nomeFornecedor={nomeFornecedor}
            anexosPorLancamento={anexosPorLancamento}
          />
        </div>
      </div>
    </div>
  );
}

function RelatorioDoc({
  mes,
  pagos,
  recebidos,
  proLabore,
  nomeFornecedor,
  anexosPorLancamento,
}: {
  mes: string;
  pagos: ContaPagar[];
  recebidos: LinhaReceber[];
  proLabore: ProLabore[];
  nomeFornecedor: (id: string | null) => string;
  anexosPorLancamento: Record<string, AnexoLink[]>;
}) {
  const proLaboreMes = useMemo(
    () => proLabore.filter((p) => p.mes_referencia === mes),
    [proLabore, mes]
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
            <p style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>{RAZAO_SOCIAL}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: MUTED }}>CNPJ {CNPJ}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 11, color: MUTED }}>Período de referência</p>
            <p style={{ margin: "2px 0 0", fontWeight: 700, fontSize: 13 }}>{labelMesReferencia(mes)}</p>
          </div>
        </div>

        <Secao titulo="Contas a Pagar (pagas no período)">
          {pagos.length === 0 ? (
            <VazioLinha texto="Nenhuma conta paga neste período." />
          ) : (
            <TabelaLancamentos
              colunas={["Descrição", "Fornecedor", "Pago em", "Anexos", "Valor"]}
              linhas={pagos.map((c) => ({
                id: c.id,
                celulas: [c.descricao, nomeFornecedor(c.fornecedor_id), formatDate(c.data_pagamento)],
                valor: brl(Number(c.valor)),
              }))}
              anexosPorLancamento={anexosPorLancamento}
            />
          )}
          <Subtotal label="Subtotal pago" valor={totalPago} />
        </Secao>

        <Secao titulo="Contas a Receber (recebidas no período)">
          {recebidos.length === 0 ? (
            <VazioLinha texto="Nenhuma conta recebida neste período." />
          ) : (
            <TabelaLancamentos
              colunas={["Cliente", "Origem", "Recebido em", "Anexos", "Valor"]}
              linhas={recebidos.map((l) => ({
                id: l.id,
                celulas: [l.titulo, l.subtitulo, formatDate(l.dataRecebimento)],
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
