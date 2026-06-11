"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Projeto, pagamentoStatus } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Sidebar, View } from "@/components/Sidebar";
import { ProjectForm, ProjetoInput } from "@/components/ProjectForm";
import { OverviewView } from "@/components/views/OverviewView";
import { ObrasView } from "@/components/views/ObrasView";
import { PagamentosView } from "@/components/views/PagamentosView";
import { RtView } from "@/components/views/RtView";
import { DocumentosView } from "@/components/views/DocumentosView";

const TITULOS: Record<View, { t: string; s: string }> = {
  overview: { t: "Visão geral", s: "Resumo de contratos, recebimentos e alertas." },
  obras: { t: "Obras", s: "Seus projetos e contratos." },
  pagamentos: { t: "Pagamentos", s: "Todos os recebimentos em um só lugar." },
  rt: { t: "RT a pagar", s: "Responsabilidade técnica por obra." },
  documentos: { t: "Documentos", s: "Notas fiscais e boletos anexados." },
};

export default function DashboardClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [view, setView] = useState<View>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    if (editing) await supabase.from("projetos").update(input).eq("id", editing.id);
    else await supabase.from("projetos").insert(input);
    setShowForm(false);
    setEditing(undefined);
    await load();
  }

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function novaObra() {
    setEditing(undefined);
    setShowForm(true);
  }
  function editarObra(p: Projeto) {
    setEditing(p);
    setShowForm(true);
  }
  function irPara(v: View) {
    setView(v);
    setSidebarOpen(false);
  }

  const counts = useMemo<Partial<Record<View, number>>>(() => {
    let atras = 0;
    for (const p of projetos)
      for (const pg of p.pagamentos)
        if (pagamentoStatus(pg) === "atrasado") atras++;
    const rt = projetos.filter(
      (p) => Number(p.rt_percentual) > 0 && !p.rt_pago
    ).length;
    return { pagamentos: atras || undefined, rt: rt || undefined };
  }, [projetos]);

  return (
    <div className="app-bg min-h-screen">
      <Sidebar
        active={view}
        onSelect={irPara}
        counts={counts}
        userEmail={userEmail}
        onSignOut={sair}
        onNew={novaObra}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Topo mobile */}
      <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-xl border border-line text-ink-soft"
          aria-label="Abrir menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <Logo />
        <button
          onClick={novaObra}
          className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-glow"
          aria-label="Nova obra"
        >
          +
        </button>
      </header>

      <main className="relative z-10 lg:pl-72">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink">
              {TITULOS[view].t}
            </h1>
            <p className="text-sm text-ink-soft">{TITULOS[view].s}</p>
          </div>

          {loading ? (
            <SkeletonList />
          ) : erro ? (
            <ErrorBox msg={erro} />
          ) : view === "overview" ? (
            <OverviewView projetos={projetos} onNavigate={irPara} />
          ) : view === "obras" ? (
            <ObrasView
              projetos={projetos}
              reload={load}
              onNew={novaObra}
              onEdit={editarObra}
            />
          ) : view === "pagamentos" ? (
            <PagamentosView projetos={projetos} reload={load} />
          ) : view === "rt" ? (
            <RtView projetos={projetos} reload={load} />
          ) : (
            <DocumentosView projetos={projetos} reload={load} />
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
        <div key={i} className="h-28 animate-pulse rounded-2xl glass" />
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
        Verifique se você rodou o SQL de atualização (migration.sql) no Supabase.
      </p>
    </div>
  );
}
