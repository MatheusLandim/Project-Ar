"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Configuracoes, Perfil, AREAS_DISPONIVEIS, PALETAS } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function aplicarPaleta(paletaId: string) {
  const p = PALETAS.find((x) => x.id === paletaId) ?? PALETAS[0];
  const escuro = document.documentElement.classList.contains("dark");
  const cores = escuro ? p.escuro : p.claro;
  document.documentElement.style.setProperty("--c-brand", cores.brand);
  document.documentElement.style.setProperty("--c-brand-dark", cores.brandDark);
  document.documentElement.style.setProperty("--c-brand-soft", cores.brandSoft);
  try {
    localStorage.setItem("paleta", paletaId);
  } catch {}
}

const input = "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink";

export function ConfiguracoesView({
  configuracoes,
  perfis,
  souAdmin,
  reload,
}: {
  configuracoes: Configuracoes;
  perfis: Perfil[];
  souAdmin: boolean;
  reload: () => void;
}) {
  const supabase = createClient();
  const [dark, setDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const [paleta, setPaleta] = useState(configuracoes.paleta_cor);
  const [razaoSocial, setRazaoSocial] = useState(configuracoes.razao_social);
  const [cnpj, setCnpj] = useState(configuracoes.cnpj);
  const [baseRelatorio, setBaseRelatorio] = useState(configuracoes.relatorio_base_padrao);
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);
  const [showConvite, setShowConvite] = useState(false);
  const [editando, setEditando] = useState<Perfil | null>(null);

  function toggleTema() {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
    aplicarPaleta(paleta);
  }

  function escolherPaleta(id: string) {
    setPaleta(id);
    aplicarPaleta(id);
  }

  async function salvarPaletaNaEmpresa() {
    await supabase.from("configuracoes").update({ paleta_cor: paleta }).eq("id", 1);
    reload();
  }

  async function salvarEmpresa(e: React.FormEvent) {
    e.preventDefault();
    setSalvandoEmpresa(true);
    await supabase
      .from("configuracoes")
      .update({ razao_social: razaoSocial, cnpj, relatorio_base_padrao: baseRelatorio })
      .eq("id", 1);
    setSalvandoEmpresa(false);
    reload();
  }

  return (
    <div className="animate-fade-up space-y-8">
      <section className="rounded-2xl border border-line glass p-5">
        <h2 className="font-display text-base font-bold text-ink">Aparência</h2>
        <p className="mt-1 text-sm text-ink-soft">Tema e cor do site — vale pra todo mundo que usa o sistema.</p>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Tema</p>
          <div className="flex gap-2">
            <button
              onClick={() => dark && toggleTema()}
              className={`t-colors rounded-lg border px-4 py-2.5 text-sm font-semibold ${
                !dark ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink-soft hover:bg-ink/5"
              }`}
            >
              ☀️ Claro
            </button>
            <button
              onClick={() => !dark && toggleTema()}
              className={`t-colors rounded-lg border px-4 py-2.5 text-sm font-semibold ${
                dark ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink-soft hover:bg-ink/5"
              }`}
            >
              🌙 Escuro
            </button>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Cor do site</p>
          <div className="flex flex-wrap gap-2">
            {PALETAS.map((p) => (
              <button
                key={p.id}
                onClick={() => escolherPaleta(p.id)}
                className={`t-colors flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                  paleta === p.id ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-ink-soft hover:bg-ink/5"
                }`}
              >
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ background: `rgb(${dark ? p.escuro.brand : p.claro.brand})` }}
                />
                {p.nome}
              </button>
            ))}
          </div>
          {souAdmin && paleta !== configuracoes.paleta_cor && (
            <button
              onClick={salvarPaletaNaEmpresa}
              className="t-colors mt-3 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
            >
              Salvar como cor padrão do site
            </button>
          )}
          {!souAdmin && (
            <p className="mt-2 text-[11px] text-ink-faint">
              Você pode testar as cores agora, mas só um administrador pode deixá-la como padrão pra todo mundo.
            </p>
          )}
        </div>
      </section>

      {souAdmin && (
        <section className="rounded-2xl border border-line glass p-5">
          <h2 className="font-display text-base font-bold text-ink">Dados da empresa e relatório</h2>
          <p className="mt-1 text-sm text-ink-soft">Usados no cabeçalho do relatório mensal de contabilidade.</p>
          <form onSubmit={salvarEmpresa} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Razão social
              </span>
              <input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} className={input} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">CNPJ</span>
              <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} className={input} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Base padrão do relatório mensal
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBaseRelatorio("pagamento")}
                  className={`t-colors flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                    baseRelatorio === "pagamento"
                      ? "border-brand bg-brand-soft text-brand-dark"
                      : "border-line text-ink-soft hover:bg-ink/5"
                  }`}
                >
                  Pagamento/Recebimento
                </button>
                <button
                  type="button"
                  onClick={() => setBaseRelatorio("vencimento")}
                  className={`t-colors flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                    baseRelatorio === "vencimento"
                      ? "border-brand bg-brand-soft text-brand-dark"
                      : "border-line text-ink-soft hover:bg-ink/5"
                  }`}
                >
                  Vencimento
                </button>
              </div>
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={salvandoEmpresa}
                className="t-colors rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark disabled:opacity-60"
              >
                {salvandoEmpresa ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        </section>
      )}

      {souAdmin && (
        <section className="rounded-2xl border border-line glass p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ink">Usuários e permissões</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Controla quais abas cada pessoa vê. Quem ainda não tem perfil aqui continua vendo tudo, como
                sempre viu.
              </p>
            </div>
            <button
              onClick={() => {
                setEditando(null);
                setShowConvite(true);
              }}
              className="t-colors flex-shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
            >
              + Convidar pessoa
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {perfis.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-soft">
                Ninguém com permissões restritas ainda — todo mundo com login vê tudo.
              </p>
            ) : (
              perfis.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {p.nome || p.email}
                      {!p.ativo && (
                        <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-semibold text-ink-faint">
                          desativado
                        </span>
                      )}
                      {p.is_admin && (
                        <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
                          admin
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {p.email}
                      {!p.is_admin && (
                        <>
                          {" · "}
                          {p.areas.length === 0
                            ? "sem áreas liberadas"
                            : p.areas.map((a) => AREAS_DISPONIVEIS.find((x) => x.id === a)?.label ?? a).join(", ")}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditando(p);
                      setShowConvite(true);
                    }}
                    className="t-colors rounded-lg px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-ink/5"
                  >
                    Editar
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {showConvite && (
        <ConvidarPessoaForm
          initial={editando}
          onCancel={() => {
            setShowConvite(false);
            setEditando(null);
          }}
          onSaved={() => {
            setShowConvite(false);
            setEditando(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function ConvidarPessoaForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Perfil | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState(initial?.email ?? "");
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [isAdmin, setIsAdmin] = useState(initial?.is_admin ?? false);
  const [areas, setAreas] = useState<string[]>(initial?.areas ?? []);
  const [ativo, setAtivo] = useState(initial?.ativo ?? true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function alternarArea(id: string) {
    setAreas((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const resp = await fetch("/api/gerenciar-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          nome: nome.trim(),
          is_admin: isAdmin,
          areas,
          ativo,
          convidar: !initial,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Falha ao salvar.");
      onSaved();
    } catch (e: any) {
      setErro(e?.message ?? "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-navy/60 p-4 backdrop-blur-sm" onClick={onCancel}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl glass-strong p-5 shadow-card sm:p-6"
      >
        <h3 className="font-display text-lg font-bold text-ink">
          {initial ? "Editar permissões" : "Convidar pessoa"}
        </h3>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
              E-mail {initial && "(não muda depois de convidado)"}
            </span>
            <input
              required
              type="email"
              disabled={!!initial}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${input} disabled:opacity-60`}
              placeholder="pessoa@exemplo.com"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">Nome</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={input} />
          </label>

          <label className="flex items-center gap-2.5">
            <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="h-4 w-4 accent-brand" />
            <span className="text-sm font-medium text-ink">É administrador (vê e edita tudo, sem restrição)</span>
          </label>

          {!isAdmin && (
            <div>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Áreas que essa pessoa pode ver
              </span>
              <div className="grid grid-cols-2 gap-2">
                {AREAS_DISPONIVEIS.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2">
                    <input
                      type="checkbox"
                      checked={areas.includes(a.id)}
                      onChange={() => alternarArea(a.id)}
                      className="h-4 w-4 accent-brand"
                    />
                    <span className="text-xs text-ink">{a.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {initial && (
            <label className="flex items-center gap-2.5">
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="h-4 w-4 accent-brand" />
              <span className="text-sm font-medium text-ink">Ativo (desmarcar bloqueia o acesso dela ao site)</span>
            </label>
          )}

          {initial?.criado_em && (
            <p className="text-[11px] text-ink-faint">Perfil criado em {formatDate(initial.criado_em.slice(0, 10))}</p>
          )}

          {erro && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{erro}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="t-colors rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark disabled:opacity-60"
          >
            {salvando ? "Salvando…" : initial ? "Salvar alterações" : "Enviar convite"}
          </button>
        </div>
      </form>
    </div>
  );
}
