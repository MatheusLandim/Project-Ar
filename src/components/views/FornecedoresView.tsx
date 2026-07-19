"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Fornecedor } from "@/lib/types";
import { FornecedorQuickForm, FornecedorInput } from "@/components/FinanceiroForms";
import { PastaEntidade } from "@/components/PastaEntidade";

export function FornecedoresView() {
  const supabase = createClient();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Fornecedor | undefined>(undefined);
  const [confirmando, setConfirmando] = useState<string | null>(null);
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
    setConfirmando(null);
    await load();
  }

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return fornecedores.filter(
      (f) =>
        !q ||
        f.nome.toLowerCase().includes(q) ||
        (f.cnpj_cpf ?? "").toLowerCase().includes(q) ||
        (f.categoria ?? "").toLowerCase().includes(q)
    );
  }, [fornecedores, busca]);

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
          Rode o SQL <code>supabase/migration-financeiro.sql</code> no Supabase e recarregue a página.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar fornecedor, CNPJ ou categoria…"
          className="t-colors flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink sm:max-w-sm"
        />
        <button
          onClick={() => { setEditing(undefined); setShowForm(true); }}
          className="t-colors inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
        >
          + Novo fornecedor
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line glass p-10 text-center">
            <p className="font-display text-base font-bold text-ink">
              {busca ? "Nenhum fornecedor encontrado" : "Cadastre seu primeiro fornecedor"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
              Cada fornecedor tem uma pasta própria pra guardar notas fiscais, boletos e
              comprovantes, acessível direto das Contas a Pagar.
            </p>
          </div>
        ) : (
          lista.map((f) => (
            <div key={f.id} className="rounded-2xl border border-line glass p-4 shadow-card sm:p-5">
              <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-bold text-ink">{f.nome}</h3>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {[f.categoria, f.cnpj_cpf].filter(Boolean).join(" · ") || "Sem dados adicionais"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPastaFornecedor(f)}
                    className="t-colors rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-ink/5"
                  >
                    📁 Pasta
                  </button>
                  <button
                    onClick={() => { setEditing(f); setShowForm(true); }}
                    className="t-colors rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-ink/5"
                  >
                    Editar
                  </button>
                  {confirmando === f.id ? (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <button
                        onClick={() => excluir(f)}
                        className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Excluir
                      </button>
                      <button
                        onClick={() => setConfirmando(null)}
                        className="rounded-md px-2 py-1 text-xs text-ink-soft hover:bg-ink/5"
                      >
                        Não
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmando(f.id)}
                      className="t-colors rounded-lg px-3 py-1.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <FornecedorQuickForm
          initial={editing}
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
