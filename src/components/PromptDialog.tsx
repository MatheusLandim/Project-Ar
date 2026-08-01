"use client";

import { useState } from "react";

export type PromptState = {
  titulo: string;
  valorInicial?: string;
  placeholder?: string;
  onConfirmar: (valor: string) => void;
} | null;

export type ConfirmState = {
  titulo: string;
  mensagem?: string;
  textoConfirmar?: string;
  perigo?: boolean;
  onConfirmar: () => void;
} | null;

export function PromptModal({
  estado,
  onFechar,
}: {
  estado: NonNullable<PromptState>;
  onFechar: () => void;
}) {
  const [valor, setValor] = useState(estado.valorInicial ?? "");

  function confirmar() {
    const v = valor.trim();
    if (!v) return;
    estado.onConfirmar(v);
    onFechar();
  }

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-navy/60 p-4 backdrop-blur-sm"
      onClick={onFechar}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          confirmar();
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl glass-strong p-5 shadow-card"
      >
        <h3 className="font-display text-base font-bold text-ink">{estado.titulo}</h3>
        <input
          autoFocus
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={estado.placeholder}
          className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!valor.trim()}
            className="t-colors rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      </form>
    </div>
  );
}

export function ConfirmModal({
  estado,
  onFechar,
}: {
  estado: NonNullable<ConfirmState>;
  onFechar: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-navy/60 p-4 backdrop-blur-sm"
      onClick={onFechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl glass-strong p-5 shadow-card"
      >
        <h3 className="font-display text-base font-bold text-ink">{estado.titulo}</h3>
        {estado.mensagem && <p className="mt-1.5 text-sm text-ink-soft">{estado.mensagem}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onFechar}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              estado.onConfirmar();
              onFechar();
            }}
            className={`t-colors rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-glow ${
              estado.perigo ? "bg-rose-600 hover:bg-rose-700" : "bg-brand hover:bg-brand-dark"
            }`}
          >
            {estado.textoConfirmar ?? "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
