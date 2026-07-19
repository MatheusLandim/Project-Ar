"use client";

import { useMemo, useState } from "react";
import { LogoMark } from "@/components/Logo";
import {
  ContaPagar,
  ContaReceber,
  ProLabore,
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

function linhasDoMes<T>(itens: T[], mes: string, campoData: (t: T) => string | null) {
  return itens.filter((i) => {
    const d = campoData(i);
    return !!d && d.startsWith(mes);
  });
}

export function RelatorioMensalViewer({
  mes: mesInicial,
  contasPagar,
  contasReceber,
  proLabore,
  nomeFornecedor,
  nomeCliente,
  onClose,
}: {
  mes?: string;
  contasPagar: ContaPagar[];
  contasReceber: ContaReceber[];
  proLabore: ProLabore[];
  nomeFornecedor: (id: string | null) => string;
  nomeCliente: (id: string | null) => string;
  onClose: () => void;
}) {
  const [mes, setMes] = useState(mesInicial ?? mesReferenciaAtual());

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
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="t-colors rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
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

      <div
        className="flex justify-center overflow-auto bg-slate-300 p-4"
        style={{ height: "calc(100vh - 56px)" }}
      >
        <div className="shadow-2xl">
          <RelatorioDoc
            mes={mes}
            contasPagar={contasPagar}
            contasReceber={contasReceber}
            proLabore={proLabore}
            nomeFornecedor={nomeFornecedor}
            nomeCliente={nomeCliente}
          />
        </div>
      </div>
    </div>
  );
}

function RelatorioDoc({
  mes,
  contasPagar,
  contasReceber,
  proLabore,
  nomeFornecedor,
  nomeCliente,
}: {
  mes: string;
  contasPagar: ContaPagar[];
  contasReceber: ContaReceber[];
  proLabore: ProLabore[];
  nomeFornecedor: (id: string | null) => string;
  nomeCliente: (id: string | null) => string;
}) {
  const pagos = useMemo(
    () => linhasDoMes(contasPagar, mes, (c) => c.data_pagamento),
    [contasPagar, mes]
  );
  const recebidos = useMemo(
    () => linhasDoMes(contasReceber, mes, (c) => c.data_recebimento),
    [contasReceber, mes]
  );
  const proLaboreMes = useMemo(
    () => proLabore.filter((p) => p.mes_referencia === mes),
    [proLabore, mes]
  );

  const totalPago = pagos.reduce((s, c) => s + Number(c.valor), 0);
  const totalRecebido = recebidos.reduce((s, c) => s + Number(c.valor), 0);
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
            <Tabela
              colunas={["Descrição", "Fornecedor", "Pago em", "Comprovante", "Valor"]}
              linhas={pagos.map((c) => [
                c.descricao,
                nomeFornecedor(c.fornecedor_id),
                formatDate(c.data_pagamento),
                c.anexo_url ? "Ver comprovante" : "—",
                brl(Number(c.valor)),
              ])}
              links={pagos.map((c) => c.anexo_url)}
              linkColuna={3}
            />
          )}
          <Subtotal label="Subtotal pago" valor={totalPago} />
        </Secao>

        <Secao titulo="Contas a Receber (recebidas no período)">
          {recebidos.length === 0 ? (
            <VazioLinha texto="Nenhuma conta recebida neste período." />
          ) : (
            <Tabela
              colunas={["Cliente", "Tipo", "Recebido em", "Comprovante", "Valor"]}
              linhas={recebidos.map((c) => [
                nomeCliente(c.cliente_id),
                c.tipo,
                formatDate(c.data_recebimento),
                c.anexo_url ? "Ver comprovante" : "—",
                brl(Number(c.valor)),
              ])}
              links={recebidos.map((c) => c.anexo_url)}
              linkColuna={3}
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
