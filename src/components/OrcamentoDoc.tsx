"use client";

import { LogoMark } from "@/components/Logo";
import { EMPRESA } from "@/lib/orcamento-defaults";
import { Orcamento, totalOrcamento } from "@/lib/types";
import { brl } from "@/lib/format";

const NAVY = "#102336";
const BLUE = "#3E7CB1";
const INK = "#0B1B2B";
const MUTED = "#3f4a57";
const LINE = "#e2e8f0";

function Linhas({ texto, className }: { texto?: string | null; className?: string }) {
  if (!texto) return null;
  return (
    <>
      {texto.split("\n").map((l, i) => {
        const t = l.trim();
        if (!t) return <div key={i} style={{ height: 6 }} />;
        const bullet = t.startsWith("•");
        const negrito = !bullet && !/^\d/.test(t) && t.length < 60 && !t.endsWith(";") && !t.endsWith(".");
        return (
          <p
            key={i}
            className={className}
            style={{
              margin: bullet ? "2px 0 2px 14px" : "2px 0",
              fontWeight: negrito ? 700 : 400,
              color: negrito ? INK : MUTED,
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            {t}
          </p>
        );
      })}
    </>
  );
}

function Rodape() {
  return (
    <div
      style={{
        marginTop: 18,
        background: NAVY,
        color: "#dfe7f0",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 10,
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      }}
    >
      <strong style={{ letterSpacing: 1 }}>{EMPRESA.nome}</strong>
      <span>
        {EMPRESA.site} / {EMPRESA.telefone}
      </span>
    </div>
  );
}

const H = (n: string) => (
  <h3 style={{ color: INK, fontSize: 13, fontWeight: 800, margin: "16px 0 4px" }}>{n}</h3>
);

export function OrcamentoDoc({ orc }: { orc: Orcamento }) {
  const total = totalOrcamento(orc);
  const subtotal = (orc.itens ?? []).reduce((s, i) => s + (Number(i.valor) || 0), 0);

  return (
    <div
      id="orc-print"
      style={{
        fontFamily: "Inter, Arial, sans-serif",
        color: INK,
        background: "#fff",
      }}
    >
      {/* CAPA */}
      <section
        className="orc-page"
        style={{
          position: "relative",
          width: "210mm",
          minHeight: "296mm",
          background: "#fff",
          padding: "26mm 20mm 18mm 28mm",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "12mm",
            background: NAVY,
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              background: NAVY,
              borderRadius: 10,
              padding: "12px 18px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              printColorAdjust: "exact",
              WebkitPrintColorAdjust: "exact",
            }}
          >
            <LogoMark className="h-12 w-12" />
            <div style={{ color: "#fff", fontWeight: 800, letterSpacing: 2, marginTop: 6 }}>
              PROJECT <span style={{ color: BLUE }}>AR</span>
            </div>
            <div style={{ color: "#9fb3c8", fontSize: 7, letterSpacing: 2, marginTop: 2 }}>
              UM NOVO MUNDO DE REFRIGERAÇÃO
            </div>
          </div>
        </div>

        <div style={{ marginTop: "60mm" }}>
          <h1 style={{ color: NAVY, fontSize: 54, lineHeight: 1.02, fontWeight: 800, margin: 0 }}>
            {orc.titulo || "Proposta"}
          </h1>
          <p style={{ color: BLUE, fontSize: 20, fontWeight: 800, marginTop: 10 }}>
            Cliente: {orc.cliente_nome}
          </p>
        </div>

        <div style={{ position: "absolute", right: "20mm", bottom: "16mm", fontSize: 12, color: INK }}>
          <div>📱 {EMPRESA.telefone}</div>
          <div style={{ marginTop: 4 }}>📷 {EMPRESA.instagram}</div>
          <div style={{ marginTop: 4 }}>🌐 {EMPRESA.site}</div>
        </div>
      </section>

      {/* CORPO */}
      <section
        className="orc-page"
        style={{
          width: "210mm",
          background: "#fff",
          padding: "18mm 18mm 0",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ color: INK, fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>
          Proposta de Projeto de Climatização
        </h2>
        <p style={{ color: MUTED, fontSize: 11 }}>Prezado(a) Cliente,</p>
        <Linhas texto={orc.intro} />

        {H("1. Escopo de Fornecimento")}
        <Linhas texto={orc.escopo} />

        {H("2. Locais e Ambientes Considerados na Proposta")}
        <Linhas texto={orc.ambientes} />

        {H("3. Normas Técnicas e Recomendações")}
        <Linhas texto={orc.normas} />

        {H("4. Descrição dos Serviços")}
        <Linhas texto={orc.servicos} />

        {H("5. Revisões de Projeto")}
        <Linhas texto={orc.revisoes} />

        {H("6. Serviços não inclusos nesta proposta")}
        <Linhas texto={orc.nao_inclusos} />

        <Rodape />
      </section>

      {/* ORÇAMENTO */}
      <section
        className="orc-page"
        style={{
          width: "210mm",
          background: "#fff",
          padding: "18mm 18mm 0",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ color: INK, fontSize: 18, fontWeight: 800, margin: "0 0 10px" }}>
          Orçamento:
        </h2>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              <th
                style={{
                  background: NAVY,
                  color: "#fff",
                  textAlign: "left",
                  padding: "10px 14px",
                  printColorAdjust: "exact",
                  WebkitPrintColorAdjust: "exact",
                }}
              >
                Serviço
              </th>
              <th
                style={{
                  background: BLUE,
                  color: "#fff",
                  textAlign: "right",
                  padding: "10px 14px",
                  width: "32%",
                  printColorAdjust: "exact",
                  WebkitPrintColorAdjust: "exact",
                }}
              >
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {(orc.itens ?? []).map((it, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
                <td style={{ padding: "10px 14px", color: INK }}>{it.descricao}</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: INK }}>
                  {brl(Number(it.valor) || 0)}
                </td>
              </tr>
            ))}
            {Number(orc.desconto) > 0 && (
              <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                <td style={{ padding: "10px 14px", color: INK }}>Descontos</td>
                <td style={{ padding: "10px 14px", textAlign: "right", color: "#dc2626" }}>
                  - {brl(Number(orc.desconto))}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: "12px 14px", fontWeight: 800, color: INK }}>Valor total:</td>
              <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 800, color: INK }}>
                {brl(total)}
              </td>
            </tr>
          </tbody>
        </table>

        {H("Condições de pagamento")}
        <Linhas texto={orc.condicoes_pagamento} />

        {H("Prazos")}
        <Linhas texto={orc.prazos} />

        {H("Validade da proposta")}
        <p style={{ color: MUTED, fontSize: 11 }}>
          Esta proposta tem validade por {orc.validade_dias ?? 15} dias.
        </p>

        <div style={{ height: 14 }} />
        <Linhas texto={orc.fecho} />

        <p style={{ color: MUTED, fontSize: 11, marginTop: 16 }}>Atenciosamente,</p>
        <p style={{ color: BLUE, fontSize: 13, fontWeight: 800, marginTop: 6, marginBottom: 0, fontStyle: "italic" }}>
          {orc.signatario_nome}
        </p>
        <p style={{ color: BLUE, fontSize: 13, fontWeight: 800, margin: 0, fontStyle: "italic" }}>
          {orc.signatario_cargo}
        </p>

        <Rodape />
        <div style={{ height: 20 }} />
      </section>
    </div>
  );
}
