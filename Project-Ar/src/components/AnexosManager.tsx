"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Projeto, PASTAS_SUGERIDAS, pastaDeAnexo, iconePasta } from "@/lib/types";
import { formatDate } from "@/lib/format";

function tamanhoLegivel(bytes: number | null) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function AnexosManager({
  projeto,
  onChanged,
}: {
  projeto: Projeto;
  onChanged: () => void;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pasta, setPasta] = useState("Projeto executado");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fechadas, setFechadas] = useState<Record<string, boolean>>({});

  // Agrupa os arquivos por pasta
  const grupos = useMemo(() => {
    const map = new Map<string, typeof projeto.anexos>();
    for (const a of projeto.anexos ?? []) {
      const p = pastaDeAnexo(a);
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(a);
    }
    for (const arr of map.values())
      arr.sort((a, b) => b.criado_em.localeCompare(a.criado_em));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [projeto.anexos]);

  // Sugestões de pasta = padrão + as que já existem na obra
  const sugestoes = useMemo(() => {
    const set = new Set(PASTAS_SUGERIDAS);
    grupos.forEach(([p]) => set.add(p));
    return [...set];
  }, [grupos]);

  async function enviar(file: File) {
    setErro(null);
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada. Entre novamente.");

      const limpo = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${user.id}/${projeto.id}/${Date.now()}_${limpo}`;

      const up = await supabase.storage.from("anexos").upload(path, file);
      if (up.error) throw up.error;

      const ins = await supabase.from("anexos").insert({
        projeto_id: projeto.id,
        pasta: pasta.trim() || "Outros",
        tipo: "outro",
        nome: file.name,
        path,
        tamanho: file.size,
      });
      if (ins.error) throw ins.error;

      onChanged();
    } catch (e: any) {
      setErro(e?.message ?? "Falha ao enviar o arquivo.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function abrir(p: string) {
    const { data, error } = await supabase.storage
      .from("anexos")
      .createSignedUrl(p, 120);
    if (!error && data) window.open(data.signedUrl, "_blank");
  }

  async function excluir(id: string, p: string) {
    await supabase.storage.from("anexos").remove([p]);
    await supabase.from("anexos").delete().eq("id", id);
    onChanged();
  }

  const total = (projeto.anexos ?? []).length;

  return (
    <div className="rounded-xl border border-line bg-canvas/40 p-4">
      <h4 className="mb-3 text-sm font-semibold text-ink">
        Arquivos da obra
        <span className="ml-1.5 text-ink-faint">({total})</span>
      </h4>

      {total === 0 ? (
        <p className="mb-3 text-sm text-ink-soft">
          Nenhum arquivo ainda. Suba o projeto executado, revisões, notas
          fiscais e boletos — tudo organizado em pastas.
        </p>
      ) : (
        <div className="mb-3 space-y-2.5">
          {grupos.map(([nome, itens]) => {
            const aberta = !fechadas[nome];
            return (
              <div
                key={nome}
                className="overflow-hidden rounded-lg border border-line bg-surface"
              >
                <button
                  onClick={() =>
                    setFechadas((f) => ({ ...f, [nome]: !f[nome] }))
                  }
                  className="t-colors flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-ink/5"
                >
                  <span className="text-base leading-none">
                    {iconePasta(nome)}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-ink">
                    {nome}
                  </span>
                  <span className="tnum text-xs text-ink-faint">
                    {itens.length}
                  </span>
                  <span
                    className={`text-ink-faint transition-transform ${
                      aberta ? "rotate-90" : ""
                    }`}
                  >
                    ›
                  </span>
                </button>

                {aberta && (
                  <ul className="divide-y divide-line border-t border-line">
                    {itens.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <button
                          onClick={() => abrir(a.path)}
                          className="min-w-0 flex-1 text-left"
                          title="Abrir / baixar"
                        >
                          <p className="truncate text-sm font-medium text-ink hover:text-brand">
                            {a.nome}
                          </p>
                          <p className="text-xs text-ink-faint">
                            {a.tamanho ? `${tamanhoLegivel(a.tamanho)} · ` : ""}
                            {formatDate(a.criado_em.slice(0, 10))}
                          </p>
                        </button>
                        <button
                          onClick={() => abrir(a.path)}
                          className="t-colors rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand-soft"
                        >
                          Abrir
                        </button>
                        <button
                          onClick={() => excluir(a.id, a.path)}
                          className="t-colors rounded-md px-2 py-1 text-xs text-rose-500 hover:bg-rose-500/10"
                        >
                          Excluir
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {erro && (
        <p className="mb-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
          {erro}
        </p>
      )}

      <div className="rounded-lg border border-dashed border-brand/40 bg-brand/5 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Enviar novo arquivo
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            list="pastas-sugeridas"
            value={pasta}
            onChange={(e) => setPasta(e.target.value)}
            placeholder="Pasta (ex.: Revisão 02)"
            className="t-colors min-w-[160px] flex-1 rounded-lg border border-line bg-surface px-2.5 py-2 text-sm text-ink"
          />
          <datalist id="pastas-sugeridas">
            {sugestoes.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.xml,.dwg,.dxf,.zip,.rar,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) enviar(f);
            }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="t-colors inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? "Enviando…" : "+ Enviar para esta pasta"}
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          PDF, DWG, imagem, planilha, zip… até 50 MB por arquivo. Digite um nome
          de pasta novo para criar (ex.: "Revisão 03", "As Built").
        </p>
      </div>
    </div>
  );
}
