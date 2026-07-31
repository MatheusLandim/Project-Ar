"use client";

import { useEffect } from "react";

export type OpcaoMenu = { label: string; onClick: () => void; tone?: "danger" };
export type MenuContextoState = { x: number; y: number; opcoes: OpcaoMenu[]; nota?: string };

export function useFecharMenuAoClicarFora(ativo: boolean, fechar: () => void) {
  useEffect(() => {
    if (!ativo) return;
    const f = () => fechar();
    document.addEventListener("click", f);
    document.addEventListener("scroll", f, true);
    return () => {
      document.removeEventListener("click", f);
      document.removeEventListener("scroll", f, true);
    };
  }, [ativo, fechar]);
}

export function BotaoMenu({
  onAbrir,
}: {
  onAbrir: (pos: { x: number; y: number }) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        const r = e.currentTarget.getBoundingClientRect();
        onAbrir({ x: Math.min(r.left, window.innerWidth - 190), y: r.bottom + 4 });
      }}
      aria-label="Mais opções"
      title="Mais opções"
      className="t-colors grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-ink/10 hover:text-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function ContextMenu({
  menu,
  onFechar,
}: {
  menu: MenuContextoState;
  onFechar: () => void;
}) {
  const largura = 192; // w-48
  const altura = 44 * (menu.opcoes.length + (menu.nota ? 1 : 0)) + 8;
  const left =
    typeof window === "undefined" ? menu.x : Math.min(Math.max(8, menu.x), window.innerWidth - largura - 8);
  const top =
    typeof window === "undefined" ? menu.y : Math.min(Math.max(8, menu.y), window.innerHeight - altura - 8);

  return (
    <div
      style={{ position: "fixed", left, top, zIndex: 90 }}
      className="w-48 overflow-hidden rounded-xl border border-line glass-strong shadow-card"
      onClick={(e) => e.stopPropagation()}
    >
      {menu.nota && (
        <p className="border-b border-line px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          {menu.nota}
        </p>
      )}
      {menu.opcoes.map((o, i) => (
        <button
          key={i}
          onClick={() => {
            o.onClick();
            onFechar();
          }}
          className={`t-colors block w-full px-3.5 py-2.5 text-left text-sm font-medium hover:bg-ink/5 ${
            o.tone === "danger" ? "text-rose-500 hover:bg-rose-500/10" : "text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
