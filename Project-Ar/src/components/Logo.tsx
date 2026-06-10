export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-card">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 8h11a3 3 0 1 0-3-3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M3 12h15a3 3 0 1 1-3 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M3 16h8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block font-display text-[17px] font-bold tracking-tight text-ink">
          Project<span className="text-brand"> Ar</span>
        </span>
        <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          Controle Financeiro
        </span>
      </span>
    </span>
  );
}
