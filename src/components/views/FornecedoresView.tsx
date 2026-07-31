"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Fornecedor, TipoPasta } from "@/lib/types";
import { FornecedorQuickForm, FornecedorInput } from "@/components/FinanceiroForms";
import { PastaEntidade } from "@/components/PastaEntidade";

function FornecedorCard({
  f,
  onAbrirPasta,
  onEditar,
  confirmando,
  onConfirmarExcluir,
  onExcluir,
  onCancelarExcluir,
}: {
  f: Fornecedor;
  onAbrirPasta: () => void;
  onEditar: () => void;
  confirmando: boolean;
  onConfirmarExcluir: () => void;
  onExcluir: () => void;
  onCancelarExcluir: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line glass p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        <button onClick={onAbrirPasta} className="min-w-0 flex-1 text-left">
          <h3 className="font-display text-base font-bold text-ink hover:text-brand">{f.nome}</h3>
          <p className="mt-0.5 text-xs text-ink-soft">
            {[f.categoria, f.cnpj_cpf].filter(Boolean).join(" · ") || "Sem dados adicionais"}
          </p>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onAbrirPasta}
            className="t-colors rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-ink/5"
          >
            📁 Pasta
          </button>
          <button
            onClick={onEditar}
            className="t-colors rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-ink/5"
          >
            Editar
          </button>
          {confirmando ? (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <button
                onClick={onExcluir}
                className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Excluir
              </button>
              <button
                onClick={onCancelarExcluir}
                className="rounded-md px-2 py-1 text-xs text-ink-soft hover:bg-ink/5"
              >
                Não
              </button>
            </span>
          ) : (
            <button
              onClick={onConfirmarExcluir}
              className="t-colors rounded-lg px-3 py-1.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Secao({
  titulo,
  destaque,
  busca,
  onBusca,
  lista,
  vazioTexto,
  onAbrirPasta,
  onEditar,
  confirmandoId,
  setConfirmandoId,
  onExcluir,
}: {
  titulo: string;
  destaque?: boolean;
  busca: string;
  onBusca: (v: string) => void;
  lista: Fornecedor[];
  vazioTexto: string;
  onAbrirPasta: (f: Fornecedor) => void;
  onEditar: (f: Fornecedor) => void;
  confirmandoId: string | null;
  setConfirmandoId: (id: string | null) => void;
  onExcluir: (f: Fornecedor) => void;
}) {
  return (
    <div className={destaque ? "rounded-2xl border-2 border-brand/30 bg-brand-soft/20 p-4 sm:p-5" : ""}>
      <h2 className={`font-display font-bold text-ink ${destaque ? "text-xl" : "text-base"}`}>{titulo}</h2>
      <input
        value={busca}
        onChange={(e) => onBusca(e.target.value)}
        placeholder="Buscar nesta seção…"
        className="t-colors mt-2.5 w-full max-w-sm rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink"
      />
      <div className="mt-3 space-y-3">
        {lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line glass p-8 text-center">
            <p className="text-sm text-ink-soft">{vazioTexto}</p>
          </div>
        ) : (
          lista.map((f) => (
            <FornecedorCard
              key={f.id}
              f={f}
              onAbrirPasta={() => onAbrirPasta(f)}
              onEditar={() => onEditar(f)}
              confirmando={confirmandoId === f.id}
              onConfirmarExcluir={() => setConfirmandoId(f.id)}
              onExcluir={() => onExcluir(f)}
              onCancelarExcluir={() => setConfirmandoId(null)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function FornecedoresView() {
  const supabase = createClient();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [buscaFixas, setBuscaFixas] = useState("");
  const [buscaVariaveis, setBuscaVariaveis] = useState("");
  const [buscaRecorrentes, setBuscaRecorrentes] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [tipoNovo, setTipoNovo] = useState<TipoPasta>("variavel");
  const [editing, setEditing] = useState<Fornecedor | undefined>(undefined);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [pastaFornecedor, setPastaFornecedor] = useState<Fornecedor | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("fornecedores").select("*").order("nome");
    if (error) setErro(error.message);
    else {
      setFornecedores((data as Fornecedor[]) ?? []);
      setErro(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function salvar(input: FornecedorInput) {
    if (editing) await supabase.from("fornecedores").update(input).eq("id", editing.id);
    else await supabase.from("fornecedores").insert(input);
    setShowForm(false);
    setEditing(undefined);
    await load();
  }

  async function excluir(f: Fornecedor) {
    await supabase.from("fornecedores").delete().eq("id", f.id);
    setConfirmandoId(null);
    await load();
  }

  function filtrar(lista: Fornecedor[], q: string) {
    const termo = q.trim().toLowerCase();
    if (!termo) return lista;
    return lista.filter(
      (f) =>
        f.nome.toLowerCase().includes(termo) ||
        (f.cnpj_cpf ?? "").toLowerCase().includes(termo) ||
        (f.categoria ?? "").toLowerCase().includes(termo)
    );
  }

  const fixas = useMemo(
    () => filtrar(fornecedores.filter((f) => f.tipo_pasta === "fixa"), buscaFixas),
    [fornecedores, buscaFixas]
  );
  const variaveis = useMemo(
    () => filtrar(fornecedores.filter((f) => f.tipo_pasta === "variavel"), buscaVariaveis),
    [fornecedores, buscaVariaveis]
  );
  const recorrentes = useMemo(
    () => filtrar(fornecedores.filter((f) => f.tipo_pasta === "receita_recorrente"), buscaRecorrentes),
    [fornecedores, buscaRecorrentes]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl glass" />
        ))}
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-500">
        <p className="font-semibold">Não foi possível carregar os fornecedores.</p>
        <p className="mt-1 opacity-90">{erro}</p>
        <p className="mt-2 opacity-90">
          Rode o SQL <code>supabase/migration-pastas-fornecedores.sql</code> no Supabase e recarregue a página.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-sm text-ink-soft">
          Cada pasta guarda documentos organizados por ano e mês. As de despesa fixa ficam em
          destaque no topo; abaixo, as de despesa variável.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setEditing(undefined); setTipoNovo("fixa"); setShowForm(true); }}
            className="t-colors inline-flex items-center gap-2 rounded-xl border border-brand px-4 py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand-soft"
          >
            + Pasta fixa
          </button>
          <button
            onClick={() => { setEditing(undefined); setTipoNovo("variavel"); setShowForm(true); }}
            className="t-colors inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
          >
            + Pasta variável
          </button>
          <button
            onClick={() => { setEditing(undefined); setTipoNovo("receita_recorrente"); setShowForm(true); }}
            className="t-colors inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-ink/5"
          >
            + Recebimento recorrente
          </button>
        </div>
      </div>

      <Secao
        titulo="Despesas fixas"
        destaque
        busca={buscaFixas}
        onBusca={setBuscaFixas}
        lista={fixas}
        vazioTexto="Nenhuma pasta fixa ainda (DAS, convênio, aluguel…)."
        onAbrirPasta={setPastaFornecedor}
        onEditar={(f) => { setEditing(f); setTipoNovo(f.tipo_pasta); setShowForm(true); }}
        confirmandoId={confirmandoId}
        setConfirmandoId={setConfirmandoId}
        onExcluir={excluir}
      />

      <div>
        <Secao
          titulo="Despesas variáveis"
          busca={buscaVariaveis}
          onBusca={setBuscaVariaveis}
          lista={variaveis}
          vazioTexto="Nenhuma pasta variável ainda (obras, manutenções, contas…)."
          onAbrirPasta={setPastaFornecedor}
          onEditar={(f) => { setEditing(f); setTipoNovo(f.tipo_pasta); setShowForm(true); }}
          confirmandoId={confirmandoId}
          setConfirmandoId={setConfirmandoId}
          onExcluir={excluir}
        />

        <div className="mt-6 border-t border-line pt-6">
          <Secao
            titulo="Recebimentos recorrentes"
            busca={buscaRecorrentes}
            onBusca={setBuscaRecorrentes}
            lista={recorrentes}
            vazioTexto="Nenhum recebimento recorrente ainda (contrato mensal, mensalidade…)."
            onAbrirPasta={setPastaFornecedor}
            onEditar={(f) => { setEditing(f); setTipoNovo(f.tipo_pasta); setShowForm(true); }}
            confirmandoId={confirmandoId}
            setConfirmandoId={setConfirmandoId}
            onExcluir={excluir}
          />
        </div>
      </div>

      {showForm && (
        <FornecedorQuickForm
          initial={editing}
          tipoPadrao={tipoNovo}
          onCancel={() => { setShowForm(false); setEditing(undefined); }}
          onSave={salvar}
        />
      )}

      {pastaFornecedor && (
        <PastaEntidade
          entidadeTipo="fornecedor"
          entidadeId={pastaFornecedor.id}
          nomeEntidade={pastaFornecedor.nome}
          onClose={() => setPastaFornecedor(null)}
        />
      )}
    </div>
  );
}
