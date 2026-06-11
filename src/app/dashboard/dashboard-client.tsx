"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Projeto, STATUS_PROJETO } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
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
      .select("*, pagamentos(*), anexos(*)")
      .order("criado_em", { ascending: false });

    if (error) setErro(error.message);
    else {
      setProjetos((data as Projeto[]) ?? []);
      setErro(null);
    }
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
        (p.tipo ?? "").toLowerCase().includes(q) ||
        (p.engenharia ?? "").toLowerCase().includes(q) ||
        (p.endereco ?? "").toLowerCase().includes(q);
      return okStatus && okBusca;
    });
  }, [projetos, busca, filtro]);

  return (
    <div className="app-bg">
      <header className="sticky top-0 z-30 border-b border-line glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-ink-soft md:inline">
              {userEmail}
            </span>
            <ThemeToggle />
            <button
              onClick={sair}
              className="t-colors rounded-xl border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-ink/5"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
              Visão geral
            </h1>
            <p className="text-sm text-ink-soft">
              Acompanhe contratos, status, RT e recebimentos.
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(undefined);
              setShowForm(true);
            }}
            className="t-colors inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
          >
            <span className="text-base leading-none">+</span> Novo projeto
          </button>
        </div>

        <Kpis projetos={projetos} />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente, obra, engenharia, endereço…"
            className="t-colors flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink sm:max-w-xs"
          />
          <div className="flex flex-wrap gap-1.5">
            {["Todos", ...STATUS_PROJETO].map((s) => (
              <button
                key={s}
                onClick={() => setFiltro(s)}
                className={`t-colors rounded-full px-3 py-1.5 text-sm font-medium ${
                  filtro === s
                    ? "bg-ink text-canvas"
                    : "glass text-ink-soft hover:text-ink"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

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
          className="h-28 animate-pulse rounded-2xl glass"
        />
      ))}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-500">
      <p className="font-semibold">Não foi possível carregar os dados.</p>
      <p className="mt-1 opacity-90">{msg}</p>
      <p className="mt-2 opacity-90">
        Verifique se você rodou o SQL de atualização (migration.sql) no Supabase
        e se as variáveis de ambiente estão corretas.
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
    <div className="rounded-2xl border border-dashed border-line glass p-10 text-center">
      <p className="font-display text-lg font-bold text-ink">
        {filtrando ? "Nenhum projeto encontrado" : "Comece seu primeiro projeto"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">
        {filtrando
          ? "Ajuste a busca ou o filtro de status para ver outros projetos."
          : "Cadastre um contrato para acompanhar status, RT, pagamentos e documentos."}
      </p>
      {!filtrando && (
        <button
          onClick={onNew}
          className="t-colors mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
        >
          + Novo projeto
        </button>
      )}
    </div>
  );
}
