"use client";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export type View =
  | "overview"
  | "obras"
  | "pagamentos"
  | "rt"
  | "documentos";

const ITEMS: {
  id: View;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "overview", label: "Visão geral", icon: <IconGrid /> },
  { id: "obras", label: "Obras", icon: <IconBuilding /> },
  { id: "pagamentos", label: "Recebimentos", icon: <IconCash /> },
  { id: "rt", label: "RT / ART", icon: <IconBadge /> },
  { id: "documentos", label: "Documentos", icon: <IconDoc /> },
];

export function Sidebar({
  active,
  onSelect,
  counts,
  userEmail,
  onSignOut,
  onNew,
  open,
  onClose,
}: {
  active: View;
  onSelect: (v: View) => void;
  counts: Partial<Record<View, number>>;
  userEmail: string;
  onSignOut: () => void;
  onNew: () => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop no mobile */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`glass-strong fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo />
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint hover:bg-ink/5 lg:hidden"
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        <div className="px-4">
          <button
            onClick={onNew}
            className="t-colors flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-brand-dark"
          >
            <span className="text-base leading-none">+</span> Nova obra
          </button>
        </div>

        <nav className="mt-5 flex-1 space-y-1 px-3">
          {ITEMS.map((it) => {
            const isActive = active === it.id;
            const badge = counts[it.id];
            return (
              <button
                key={it.id}
                onClick={() => onSelect(it.id)}
                className={`t-colors group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                  isActive
                    ? "bg-brand/12 text-brand ring-1 ring-inset ring-brand/25"
                    : "text-ink-soft hover:bg-ink/5 hover:text-ink"
                }`}
              >
                <span
                  className={
                    isActive ? "text-brand" : "text-ink-faint group-hover:text-ink"
                  }
                >
                  {it.icon}
                </span>
                <span className="flex-1 text-left">{it.label}</span>
                {badge ? (
                  <span className="tnum inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[11px] font-bold text-rose-500">
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-line p-4">
          <div className="flex items-center justify-between">
            <span className="truncate text-xs text-ink-faint" title={userEmail}>
              {userEmail}
            </span>
            <ThemeToggle />
          </div>
          <button
            onClick={onSignOut}
            className="t-colors w-full rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 21h18M5 21V5l8-2v18M19 21V9l-6-2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 8h0M8 12h0M8 16h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconCash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function IconBadge() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2.9 2.1 3.5-.4 1.1 3.4 2.9 2-1.4 3.3 1.4 3.3-2.9 2-1.1 3.4-3.5-.4L12 22l-2.9-2.1-3.5.4-1.1-3.4-2.9-2L3 11.6 1.6 8.3l2.9-2 1.1-3.4 3.5.4L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 3v5h5M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
