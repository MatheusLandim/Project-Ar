"use client";

import { useState } from "react";
import { Projeto, STATUS_PROJETO, TIPOS_PROJETO } from "@/lib/types";
import { brl } from "@/lib/format";

export type ProjetoInput = {
  cliente: string;
  projeto: string;
  tipo: string;
  endereco: string | null;
  engenharia: string | null;
  tem_rt: boolean;
  rt_percentual: number;
  tem_art: boolean;
  art_valor: number;
  rt_obs: string | null;
  art_obs: string | null;
  com_imposto: boolean;
  valor_total: number;
  status: string;
  data_inicio: string | null;
  data_previsao: string | null;
  observacoes: string | null;
};

export function ProjectForm({
  initial,
  clientes = [],
  onCancel,
  onSave,
}: {
  initial?: Projeto;
  clientes?: { id: string; nome: string }[];
  onCancel: () => void;
  onSave: (data: ProjetoInput) => Promise<string | null>;
}) {
  const [cliente, setCliente] = useState(initial?.cliente ?? "");
  const [projeto, setProjeto] = useState(initial?.projeto ?? "");
  const [tipo, setTipo] = useState(initial?.tipo ?? "");
  const [endereco, setEndereco] = useState(initial?.endereco ?? "");
  const [engenharia, setEngenharia] = useState(initial?.engenharia ?? "");
  const [temRt, setTemRt] = useState(initial ? initial.tem_rt : true);
  const [rt, setRt] = useState(
    initial?.rt_percentual ? String(initial.rt_percentual) : ""
  );
  const [temArt, setTemArt] = useState(initial ? initial.tem_art : true);
  const [art, setArt] = useState(
    initial?.art_valor ? String(initial.art_valor) : ""
  );
  const [rtObs, setRtObs] = useState(initial?.rt_obs ?? "");
  const [artObs, setArtObs] = useState(initial?.art_obs ?? "");
  const [comImposto, setComImposto] = useState(initial ? initial.com_imposto : true);
  const [valor, setValor] = useState(
    initial ? String(initial.valor_total) : ""
  );
  const [status, setStatus] = useState(initial?.status ?? "Proposta");
  const [inicio, setInicio] = useState(initial?.data_inicio ?? "");
  const [previsao, setPrevisao] = useState(initial?.data_previsao ?? "");
  const [obs, setObs] = useState(initial?.observacoes ?? "");
  const [saving, setSaving] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const rtValor =
    (Number(valor) || 0) * ((Number(rt) || 0) / 100);
  const artValorCalc = Number(art) || 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErroSalvar(null);
    const err = await onSave({
      cliente: cliente.trim(),
      projeto: projeto.trim(),
      tipo: tipo.trim() || "",
      endereco: endereco.trim() || null,
      engenharia: engenharia.trim() || null,
      tem_rt: temRt,
      rt_percentual: temRt ? Number(rt) || 0 : 0,
      tem_art: temArt,
      art_valor: temArt ? Number(art) || 0 : 0,
      rt_obs: temRt ? rtObs.trim() || null : null,
      art_obs: temArt ? artObs.trim() || null : null,
      com_imposto: comImposto,
      valor_total: Number(valor) || 0,
      status,
      data_inicio: inicio || null,
      data_previsao: previsao || null,
      observacoes: obs.trim() || null,
    });
    setSaving(false);
    if (err) setErroSalvar(err);
  }

  return (
    <Overlay onClose={onCancel}>
      <form
        onSubmit={submit}
        className="animate-scale-in w-full max-w-2xl overflow-hidden rounded-2xl glass-strong shadow-card"
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-bold text-ink">
            {initial ? "Editar projeto" : "Novo projeto"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="t-colors grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-ink/5 hover:text-ink"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <div className="max-h-[72vh] space-y-5 overflow-y-auto px-6 py-5">
          <Section title="Identificação">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Cliente" required>
                <input
                  required
                  list="clientes-lista"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className={input}
                  placeholder="Ex.: Condomínio Solar"
                />
                <datalist id="clientes-lista">
                  {clientes.map((c) => (
                    <option key={c.id} value={c.nome} />
                  ))}
                </datalist>
              </Field>
              <Field label="Projeto / Obra" required>
                <input
                  required
                  value={projeto}
                  onChange={(e) => setProjeto(e.target.value)}
                  className={input}
                  placeholder="Ex.: VRF 3 pavimentos"
                />
              </Field>
              <Field label="Engenharia / Arquitetura">
                <input
                  value={engenharia}
                  onChange={(e) => setEngenharia(e.target.value)}
                  className={input}
                  placeholder="Empresa ou profissional responsável"
                />
              </Field>
              <Field label="Tipo">
                <input
                  list="tipos"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className={input}
                  placeholder="Residencial, Comercial…"
                />
                <datalist id="tipos">
                  {TIPOS_PROJETO.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Endereço da obra">
                  <input
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className={input}
                    placeholder="Rua, número, bairro, cidade"
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Financeiro">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Valor total do contrato (R$)" required>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className={`${input} tnum`}
                    placeholder="0,00"
                  />
                </Field>
                <Field label="Imposto">
                  <div className="space-y-2">
                    <label
                      className={`t-colors flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 ${
                        comImposto ? "border-brand bg-brand-soft" : "border-line hover:bg-ink/5"
                      }`}
                    >
                      <input
                        type="radio"
                        name="imposto"
                        checked={comImposto}
                        onChange={() => setComImposto(true)}
                        className="h-4 w-4 accent-brand"
                      />
                      <span className={`text-sm font-semibold ${comImposto ? "text-brand-dark" : "text-ink-soft"}`}>
                        Imposto incluído (NF)
                      </span>
                    </label>
                    <label
                      className={`t-colors flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 ${
                        !comImposto ? "border-brand bg-brand-soft" : "border-line hover:bg-ink/5"
                      }`}
                    >
                      <input
                        type="radio"
                        name="imposto"
                        checked={!comImposto}
                        onChange={() => setComImposto(false)}
                        className="h-4 w-4 accent-brand"
                      />
                      <span className={`text-sm font-semibold ${!comImposto ? "text-brand-dark" : "text-ink-soft"}`}>
                        Sem imposto (Recibo)
                      </span>
                    </label>
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Essa obra tem RT?">
                  <ToggleSimNao value={temRt} onChange={setTemRt} />
                </Field>
                <Field label="Essa obra tem ART?">
                  <ToggleSimNao value={temArt} onChange={setTemArt} />
                </Field>
              </div>

              {(temRt || temArt) && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {temRt && (
                    <Field label="RT — Responsabilidade Técnica (%)">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={rt}
                        onChange={(e) => setRt(e.target.value)}
                        className={`${input} tnum`}
                        placeholder="Ex.: 10"
                      />
                    </Field>
                  )}
                  {temArt && (
                    <Field label="ART — valor cobrado pelo engenheiro (R$)">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={art}
                        onChange={(e) => setArt(e.target.value)}
                        className={`${input} tnum`}
                        placeholder="Ex.: 350,00"
                      />
                    </Field>
                  )}
                </div>
              )}
            </div>
            {(temRt || temArt) && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {temRt && (
                  <Field label="RT — a quem pagar / dados (PIX, banco)">
                    <input
                      value={rtObs ?? ""}
                      onChange={(e) => setRtObs(e.target.value)}
                      className={input}
                      placeholder="Ex.: CREA-SP · PIX 12.345.678/0001-90"
                    />
                  </Field>
                )}
                {temArt && (
                  <Field label="ART — a quem pagar / dados (PIX, banco)">
                    <input
                      value={artObs ?? ""}
                      onChange={(e) => setArtObs(e.target.value)}
                      className={input}
                      placeholder="Ex.: Eng. João · PIX joao@email.com"
                    />
                  </Field>
                )}
              </div>
            )}
            {((temRt && Number(rt) > 0 && Number(valor) > 0) || (temArt && Number(art) > 0)) && (
              <div className="mt-2 space-y-1.5">
                {temRt && Number(rt) > 0 && Number(valor) > 0 && (
                  <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">
                    RT a pagar ({rt}%):{" "}
                    <strong className="tnum">{brl(rtValor)}</strong>
                  </p>
                )}
                {temArt && Number(art) > 0 && (
                  <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-dark">
                    ART a pagar:{" "}
                    <strong className="tnum">{brl(artValorCalc)}</strong>
                  </p>
                )}
              </div>
            )}
          </Section>

          <Section title="Status e prazos">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={input}
                >
                  {STATUS_PROJETO.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Início">
                <input
                  type="date"
                  value={inicio ?? ""}
                  onChange={(e) => setInicio(e.target.value)}
                  className={input}
                />
              </Field>
              <Field label="Previsão">
                <input
                  type="date"
                  value={previsao ?? ""}
                  onChange={(e) => setPrevisao(e.target.value)}
                  className={input}
                />
              </Field>
            </div>
          </Section>

          <Field label="Observações">
            <textarea
              value={obs ?? ""}
              onChange={(e) => setObs(e.target.value)}
              rows={3}
              className={`${input} resize-none`}
              placeholder="Escopo, condições de pagamento, anotações…"
            />
          </Field>
        </div>

        {erroSalvar && (
          <p className="mx-6 mb-1 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
            Não foi possível salvar: {erroSalvar}
          </p>
        )}
        <footer className="flex justify-end gap-3 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="t-colors rounded-lg px-4 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="t-colors rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar projeto"}
          </button>
        </footer>
      </form>
    </Overlay>
  );
}

export function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-navy/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
        {children}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-brand">
        {title}
      </p>
      {children}
    </div>
  );
}

function ToggleSimNao({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`t-colors flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
          value
            ? "border-brand bg-brand-soft text-brand-dark"
            : "border-line text-ink-soft hover:bg-ink/5"
        }`}
      >
        Sim
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`t-colors flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
          !value
            ? "border-brand bg-brand-soft text-brand-dark"
            : "border-line text-ink-soft hover:bg-ink/5"
        }`}
      >
        Não
      </button>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label} {required && <span className="text-brand">*</span>}
      </span>
      {children}
    </label>
  );
}

const input =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink t-colors";
