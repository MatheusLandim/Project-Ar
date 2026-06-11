"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Projeto, TIPOS_ANEXO } from "@/lib/types";
import { formatDate } from "@/lib/format";

function tamanhoLegivel(bytes: number | null) {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

const ICON: Record<string, string> = {
  nota_fiscal: "🧾",
  boleto: "📄",
  outro: "📎",
};

export function AnexosManager({
  projeto,
  onChanged,
}: {
  projeto: Projeto;
  onChanged: () => void;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState("nota_fiscal");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const anexos = [...(projeto.anexos ?? [])].sort((a, b) =>
    b.criado_em.localeCompare(a.criado_em)
  );

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
        tipo,
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

  async function abrir(path: string) {
    const { data, error } = await supabase.storage
      .from("anexos")
      .createSignedUrl(path, 120);
    if (!error && data) window.open(data.signedUrl, "_blank");
  }

  async function excluir(id: string, path: string) {
    await supabase.storage.from("anexos").remove([path]);
    await supabase.from("anexos").delete().eq("id", id);
    onChanged();
  }

  return (
    <div className="rounded-xl border border-line bg-canvas/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink">
          Documentos
          <span className="ml-1.5 text-ink-faint">({anexos.length})</span>
        </h4>
      </div>

      {anexos.length === 0 ? (
        <p className="mb-3 text-sm text-ink-soft">
          Nenhum arquivo ainda. Anexe as notas fiscais e os boletos já gerados.
        </p>
      ) : (
        <ul className="mb-3 space-y-1.5">
          {anexos.map((a) => (
            <li
              key={a.id}
              className="t-colors flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 hover:border-brand/40"
            >
              <span className="text-lg leading-none">
                {ICON[a.tipo] ?? "📎"}
              </span>
              <button
                onClick={() => abrir(a.path)}
                className="min-w-0 flex-1 text-left"
                title="Abrir / baixar"
              >
                <p className="truncate text-sm font-medium text-ink hover:text-brand">
                  {a.nome}
                </p>
                <p className="text-xs text-ink-faint">
                  {TIPOS_ANEXO[a.tipo] ?? "Arquivo"}
                  {a.tamanho ? ` · ${tamanhoLegivel(a.tamanho)}` : ""} ·{" "}
                  {formatDate(a.criado_em.slice(0, 10))}
                </p>
              </button>
              <button
                onClick={() => abrir(a.path)}
                className="rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand-soft"
              >
                Abrir
              </button>
              <button
                onClick={() => excluir(a.id, a.path)}
                className="rounded-md px-2 py-1 text-xs text-rose-500 hover:bg-rose-500/10"
              >
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}

      {erro && (
        <p className="mb-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-lg border border-line bg-surface px-2.5 py-2 text-sm text-ink"
        >
          <option value="nota_fiscal">Nota Fiscal</option>
          <option value="boleto">Boleto</option>
          <option value="outro">Outro</option>
        </select>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) enviar(f);
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="t-colors inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand/50 px-3 py-2 text-sm font-medium text-brand hover:bg-brand-soft disabled:opacity-60"
        >
          {busy ? "Enviando…" : "+ Anexar arquivo"}
        </button>
        <span className="text-xs text-ink-faint">PDF ou imagem · até 50 MB</span>
      </div>
    </div>
  );
}
