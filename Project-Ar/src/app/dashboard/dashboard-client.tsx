"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Projeto, STATUS_PROJETO } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Kpis } from "@/components/Kpis";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectForm, ProjetoInput } from "@/components/ProjectForm";

export default function DashboardClient({
  userEmail,
}: {
  userEmail: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<string>("Todos");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Projeto | undefined>(undefined);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("projetos")
      .select("*, pagamentos(*)")
      .order("criado_em", { ascending: false });

    if (error) setErro(error.message);
    else setProjetos((data as Projeto[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function salvar(input: ProjetoInput) {
    if (editing) {
      await supabase.from("projetos").update(input).eq("id", editing.id);
    } else {
      await supabase.from("projetos").insert(input);
    }
    setShowForm(false);
    setEditing(undefined);
    await load();
  }

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return projetos.filter((p) => {
      const okStatus = filtro === "Todos" || p.status === filtro;
      const okBusca =
        !q ||
        p.cliente.toLowerCase().includes(q) ||
        p.projeto.toLowerCase().includes(q) ||
        (p.tipo ?? "").toLowerCase().includes(q);
      return okStatus && okBusca;
    });
  }, [projetos, busca, filtro]);

  return (
    <div className="min-h-screen">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-soft sm:inline">
              {userEmail}
            </span>
            <button
              onClick={sair}
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-slate-100"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              Visão geral
            </h1>
            <p className="text-sm text-ink-soft">
              Acompanhe contratos, status e recebimentos.
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(undefined);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-dark"
          >
            <span className="text-base leading-none">+</span> Novo projeto
          </button>
        </div>

        <Kpis projetos={projetos} />

        {/* Filtros */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cliente, obra ou tipo…"
              className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["Todos", ...STATUS_PROJETO].map((s) => (
              <button
                key={s}
                onClick={() => setFiltro(s)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  filtro === s
                    ? "bg-ink text-white"
                    : "bg-surface text-ink-soft ring-1 ring-inset ring-line hover:bg-slate-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="mt-5 space-y-4">
          {loading ? (
            <SkeletonList />
          ) : erro ? (
            <ErrorBox msg={erro} />
          ) : visiveis.length === 0 ? (
            <EmptyState
              filtrando={busca !== "" || filtro !== "Todos"}
              onNew={() => {
                setEditing(undefined);
                setShowForm(true);
              }}
            />
          ) : (
            visiveis.map((p) => (
              <ProjectCard
                key={p.id}
                projeto={p}
                onChanged={load}
                onEdit={(proj) => {
                  setEditing(proj);
                  setShowForm(true);
                }}
              />
            ))
          )}
        </div>
      </main>

      {showForm && (
        <ProjectForm
          initial={editing}
          onCancel={() => {
            setShowForm(false);
            setEditing(undefined);
          }}
          onSave={salvar}
        />
      )}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-2xl border border-line bg-surface"
        />
      ))}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
      <p className="font-semibold">Não foi possível carregar os dados.</p>
      <p className="mt-1 text-rose-600">{msg}</p>
      <p className="mt-2 text-rose-600">
        Verifique se o schema SQL foi aplicado no Supabase e se as variáveis de
        ambiente estão corretas.
      </p>
    </div>
  );
}

function EmptyState({
  filtrando,
  onNew,
}: {
  filtrando: boolean;
  onNew: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
      <p className="font-display text-lg font-bold text-ink">
        {filtrando ? "Nenhum projeto encontrado" : "Comece seu primeiro projeto"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
        {filtrando
          ? "Ajuste a busca ou o filtro de status para ver outros projetos."
          : "Cadastre um contrato para acompanhar status e pagamentos em um só lugar."}
      </p>
      {!filtrando && (
        <button
          onClick={onNew}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Novo projeto
        </button>
      )}
    </div>
  );
}
