"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type OpcaoMenu = { label: string; onClick: () => void; tone?: "danger" };
export type MenuContextoState = { x: number; y: number; opcoes: OpcaoMenu[]; nota?: string };

export function useFecharMenuAoClicarFora(ativo: boolean, fechar: () => void) {
  useEffect(() => {
    if (!ativo) return;
    const f = () => fechar();
    // Fecha ao rolar a página (o menu é posicionado a partir do botão)
    document.addEventListener("scroll", f, true);
    return () => {
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
        e.preventDefault();
        e.stopPropagation();
        const r = e.currentTarget.getBoundingClientRect();
        // Passa o canto do botão (coordenadas da tela). O menu se ajusta sozinho.
        onAbrir({ x: r.right, y: r.bottom + 4 });
      }}
      aria-label="Mais opções"
      title="Mais opções"
      className="t-colors grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-ink/10 hover:text-ink"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="5" cy="12" r="1.8" fill="currentColor" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" />
        <circle cx="19" cy="12" r="1.8" fill="currentColor" />
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
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  if (!montado || typeof document === "undefined") return null;

  const largura = 200;
  const linhas = menu.opcoes.length + (menu.nota ? 1 : 0);
  const altura = 46 * linhas + 12;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Alinha o menu pela DIREITA do botão (menu.x = r.right), abrindo pra esquerda,
  // e sobe se não couber embaixo. Sempre dentro da tela.
  let left = menu.x - largura;
  if (left < 8) left = 8;
  if (left + largura > vw - 8) left = vw - largura - 8;

  let top = menu.y;
  if (top + altura > vh - 8) top = menu.y - altura - 28; // abre pra cima
  if (top < 8) top = 8;

  return createPortal(
    <>
      {/* fundo invisível que fecha o menu ao clicar/tocar fora */}
      <div
        onClick={onFechar}
        onContextMenu={(e) => {
          e.preventDefault();
          onFechar();
        }}
        style={{ position: "fixed", inset: 0, zIndex: 2000 }}
      />
      <div
        style={{ position: "fixed", left, top, zIndex: 2001, width: largura }}
        className="overflow-hidden rounded-xl border border-line glass-strong shadow-card"
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
              onFechar();
              o.onClick();
            }}
            className={`t-colors block w-full px-3.5 py-3 text-left text-sm font-medium hover:bg-ink/5 ${
              o.tone === "danger" ? "text-rose-500 hover:bg-rose-500/10" : "text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </>,
    document.body
  );
}
