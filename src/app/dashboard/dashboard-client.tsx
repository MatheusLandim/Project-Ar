"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Projeto,
  Cliente,
  Orcamento,
  ContaPagar,
  ContaReceber,
  PessoaCliente,
  Configuracoes,
  Perfil,
  totalOrcamento,
  pagamentoStatus,
} from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Sidebar, View } from "@/components/Sidebar";
import { ProjectForm, ProjetoInput } from "@/components/ProjectForm";
import { ClienteForm, ClienteInput } from "@/components/ClienteForm";
import { OrcamentoForm, OrcamentoInput } from "@/components/OrcamentoForm";
import { OrcamentoViewer } from "@/components/OrcamentoViewer";
import { OverviewView } from "@/components/views/OverviewView";
import { ClientesView } from "@/components/views/ClientesView";
import { OrcamentosView } from "@/components/views/OrcamentosView";
import { RtView } from "@/components/views/RtView";
import { DocumentosView } from "@/components/views/DocumentosView";
import { FinanceiroView } from "@/components/views/FinanceiroView";
import { FornecedoresView } from "@/components/views/FornecedoresView";
import { ConfiguracoesView, aplicarPaleta } from "@/components/views/ConfiguracoesView";

const TITULOS: Record<View, { t: string; s: string }> = {
  overview: { t: "Visão geral", s: "Resumo de contratos, recebimentos e alertas." },
  clientes: { t: "Obras / Clientes", s: "Cada obra, seu status, sua pasta e o que já contratou." },
  orcamentos: { t: "Orçamentos", s: "Crie propostas, gere o PDF e aprove o projeto." },
  rt: { t: "RT / ART", s: "Taxas de responsabilidade técnica que você paga." },
  documentos: { t: "Documentos", s: "Notas fiscais e boletos anexados." },
  financeiro: {
    t: "Financeiro",
    s: "Contas a pagar, a receber, cartão, pró-labore e relatório mensal.",
  },
  fornecedores: {
    t: "Fornecedores",
    s: "Cadastro de fornecedores e a pasta de documentos de cada um.",
  },
  configuracoes: {
    t: "Configurações",
    s: "Aparência, dados da empresa e permissões de acesso.",
  },
};

export default function DashboardClient({ userEmail, userId }: { userEmail: string; userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [pessoasCliente, setPessoasCliente] = useState<PessoaCliente[]>([]);
  const [configuracoes, setConfiguracoes] = useState<Configuracoes | null>(null);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [view, setView] = useState<View>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Projeto | undefined>(undefined);
  const [showClienteForm, setShowClienteForm] = useState(false);
  const [obraParaAbrir, setObraParaAbrir] = useState<string | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | undefined>(
    undefined
  );
  const [showOrcForm, setShowOrcForm] = useState(false);
  const [editingOrc, setEditingOrc] = useState<Orcamento | undefined>(undefined);
  const [viewingOrc, setViewingOrc] = useState<Orcamento | undefined>(undefined);

  const load = useCallback(async () => {
    const [proj, cli, orc, cp, cr, pes, conf, prf] = await Promise.all([
      supabase
        .from("projetos")
        .select("*, pagamentos(*), anexos(*)")
        .order("criado_em", { ascending: false }),
      supabase.from("clientes").select("*").order("nome"),
      supabase.from("orcamentos").select("*").order("criado_em", { ascending: false }),
      supabase.from("contas_pagar").select("*").order("vencimento"),
      supabase.from("contas_receber").select("*").order("vencimento"),
      supabase.from("pessoas_cliente").select("*").order("nome"),
      supabase.from("configuracoes").select("*").eq("id", 1).maybeSingle(),
      supabase.from("perfis").select("*").order("criado_em", { ascending: false }),
    ]);
    if (proj.error) setErro(proj.error.message);
    else {
      setProjetos((proj.data as Projeto[]) ?? []);
      setErro(null);
    }
    if (!cli.error) setClientes((cli.data as Cliente[]) ?? []);
    if (!orc.error) setOrcamentos((orc.data as Orcamento[]) ?? []);
    if (!cp.error) setContasPagar((cp.data as ContaPagar[]) ?? []);
    if (!cr.error) setContasReceber((cr.data as ContaReceber[]) ?? []);
    if (!pes.error) setPessoasCliente((pes.data as PessoaCliente[]) ?? []);
    if (!conf.error) setConfiguracoes((conf.data as Configuracoes) ?? null);
    if (!prf.error) setPerfis((prf.data as Perfil[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // Lembra a aba selecionada entre recarregamentos da página
  useEffect(() => {
    try {
      const saved = localStorage.getItem("projectar_view");
      const validas: View[] = [
        "overview",
        "clientes",
        "orcamentos",
        "rt",
        "documentos",
        "financeiro",
        "fornecedores",
        "configuracoes",
      ];
      if (saved && validas.includes(saved as View)) setView(saved as View);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("projectar_view", view);
    } catch {}
  }, [view]);

  // Meu perfil (permissões). Sem linha em "perfis" = acesso total, do
  // jeito que sempre foi antes dessa função existir.
  const meuPerfil = perfis.find((p) => p.user_id === userId) ?? null;
  const souAdmin = !meuPerfil || meuPerfil.is_admin;
  const allowedItems: View[] | null =
    souAdmin || !meuPerfil ? null : ([...meuPerfil.areas, "configuracoes"] as View[]);

  // Aplica a cor do site assim que as configurações chegam (e de novo
  // quando o tema claro/escuro muda, pra pegar o par de cores certo).
  useEffect(() => {
    if (configuracoes) aplicarPaleta(configuracoes.paleta_cor);
  }, [configuracoes]);

  // Se a pessoa está numa aba que não é mais permitida (ex.: um admin
  // tirou o acesso dela), manda pra primeira aba que ela pode ver.
  useEffect(() => {
    if (allowedItems && !allowedItems.includes(view)) {
      setView(allowedItems[0] ?? "configuracoes");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meuPerfil]);

  // Garante que o cliente exista no cadastro (cria se for novo) e devolve o id
  async function resolverClienteId(nome: string): Promise<string | null> {
    const alvo = nome.trim().toLowerCase();
    if (!alvo) return null;
    const existente = clientes.find((c) => c.nome.trim().toLowerCase() === alvo);
    if (existente) return existente.id;
    const { data } = await supabase
      .from("clientes")
      .insert({ nome: nome.trim() })
      .select("id")
      .single();
    return data?.id ?? null;
  }

  async function salvar(input: ProjetoInput): Promise<string | null> {
    try {
      const cliente_id = await resolverClienteId(input.cliente);
      const payload = { ...input, cliente_id };
      const { error } = editing
        ? await supabase.from("projetos").update(payload).eq("id", editing.id)
        : await supabase.from("projetos").insert(payload);
      if (error) return error.message;
      setShowForm(false);
      setEditing(undefined);
      await load();
      return null;
    } catch (e: unknown) {
      return e instanceof Error ? e.message : "Erro ao salvar a obra.";
    }
  }

  async function atualizarObra(id: string, campos: Record<string, unknown>) {
    const { error } = await supabase.from("projetos").update(campos).eq("id", id);
    if (error) return error.message;
    await load();
    return null;
  }

  async function salvarCliente(input: ClienteInput) {
    const { pessoas, ...clienteData } = input;
    let clienteId = editingCliente?.id ?? null;
    if (editingCliente) {
      await supabase.from("clientes").update(clienteData).eq("id", editingCliente.id);
    } else {
      const { data } = await supabase
        .from("clientes")
        .insert(clienteData)
        .select("id")
        .single();
      clienteId = data?.id ?? null;
    }
    if (clienteId) {
      await supabase.from("pessoas_cliente").delete().eq("cliente_id", clienteId);
      if (pessoas.length > 0) {
        await supabase.from("pessoas_cliente").insert(
          pessoas.map((p) => ({ ...p, cliente_id: clienteId }))
        );
      }
    }
    setShowClienteForm(false);
    setEditingCliente(undefined);
    await load();
  }

  async function excluirCliente(c: Cliente) {
    await supabase.from("clientes").delete().eq("id", c.id);
    await load();
  }

  const proximoNumero = `ORC-${String(orcamentos.length + 1).padStart(4, "0")}`;

  async function salvarOrcamento(input: OrcamentoInput) {
    const cliente_id = await resolverClienteId(input.cliente_nome);
    const payload = { ...input, cliente_id };
    if (editingOrc)
      await supabase.from("orcamentos").update(payload).eq("id", editingOrc.id);
    else await supabase.from("orcamentos").insert(payload);
    setShowOrcForm(false);
    setEditingOrc(undefined);
    await load();
  }

  async function excluirOrcamento(o: Orcamento) {
    await supabase.from("orcamentos").delete().eq("id", o.id);
    await load();
  }

  async function converterOrcamento(o: Orcamento) {
    const cliente_id = await resolverClienteId(o.cliente_nome);
    const { data } = await supabase
      .from("projetos")
      .insert({
        cliente: o.cliente_nome,
        cliente_id,
        projeto: o.titulo || "Projeto de Climatização",
        valor_total: totalOrcamento(o),
        status: "Aprovado",
      })
      .select("id")
      .single();
    if (data?.id)
      await supabase
        .from("orcamentos")
        .update({ obra_id: data.id, status: "Aprovado" })
        .eq("id", o.id);
    await load();
    setView("clientes");
    if (data?.id) setObraParaAbrir(data.id);
  }

  function novoOrcamento() {
    setEditingOrc(undefined);
    setShowOrcForm(true);
  }
  function editarOrcamento(o: Orcamento) {
    setEditingOrc(o);
    setShowOrcForm(true);
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
  function novoCliente() {
    setEditingCliente(undefined);
    setShowClienteForm(true);
  }
  function editarCliente(c: Cliente) {
    setEditingCliente(c);
    setShowClienteForm(true);
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
      (p) =>
        (p.tem_rt && !p.rt_pago) ||
        (p.tem_art && !p.art_pago)
    ).length;
    return { financeiro: atras || undefined, rt: rt || undefined };
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
        allowedItems={allowedItems}
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
            <OverviewView
              projetos={projetos}
              contasPagar={contasPagar}
              contasReceber={contasReceber}
              onNavigate={irPara}
            />
          ) : view === "clientes" ? (
            <ClientesView
              clientes={clientes}
              projetos={projetos}
              pessoasCliente={pessoasCliente}
              onNew={novoCliente}
              onNovaObra={novaObra}
              onEdit={editarCliente}
              onDelete={excluirCliente}
              onAtualizarObra={atualizarObra}
              obraParaAbrir={obraParaAbrir}
              onObraAberta={() => setObraParaAbrir(null)}
            />
          ) : view === "orcamentos" ? (
            <OrcamentosView
              orcamentos={orcamentos}
              reload={load}
              onNew={novoOrcamento}
              onEdit={editarOrcamento}
              onView={(o) => setViewingOrc(o)}
              onConvert={converterOrcamento}
              onDelete={excluirOrcamento}
            />
          ) : view === "rt" ? (
            <RtView projetos={projetos} reload={load} />
          ) : view === "documentos" ? (
            <DocumentosView />
          ) : view === "fornecedores" ? (
            <FornecedoresView />
          ) : view === "configuracoes" ? (
            configuracoes && (
              <ConfiguracoesView
                configuracoes={configuracoes}
                perfis={perfis}
                souAdmin={souAdmin}
                reload={load}
              />
            )
          ) : (
            <FinanceiroView clientes={clientes} projetos={projetos} reloadProjetos={load} configuracoes={configuracoes} />
          )}
        </div>
      </main>

      {showForm && (
        <ProjectForm
          initial={editing}
          clientes={clientes}
          onCancel={() => {
            setShowForm(false);
            setEditing(undefined);
          }}
          onSave={salvar}
        />
      )}

      {showClienteForm && (
        <ClienteForm
          initial={editingCliente}
          initialPessoas={
            editingCliente
              ? pessoasCliente.filter((p) => p.cliente_id === editingCliente.id)
              : undefined
          }
          onCancel={() => {
            setShowClienteForm(false);
            setEditingCliente(undefined);
          }}
          onSave={salvarCliente}
        />
      )}

      {showOrcForm && (
        <OrcamentoForm
          initial={editingOrc}
          clientes={clientes}
          proximoNumero={proximoNumero}
          onCancel={() => {
            setShowOrcForm(false);
            setEditingOrc(undefined);
          }}
          onSave={salvarOrcamento}
        />
      )}

      {viewingOrc && (
        <OrcamentoViewer orc={viewingOrc} onClose={() => setViewingOrc(undefined)} />
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
